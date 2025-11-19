import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CrewMember, ChangeLog } from '../types';
import { INITIAL_CREW_MEMBERS } from '../constants/crewMembers';
import { getAll, put } from '../utils/db';
import { useAuth } from './useAuth';

const CREW_STORE = 'crewMembers';

interface CrewMembersContextType {
  crewMembers: CrewMember[];
  addCrewMember: (name: string, actor?: string) => void;
  updateCrewMember: (id: string, newName: string) => void;
  toggleCrewMemberStatus: (id: string) => void;
  bulkAddOrUpdateCrew: (members: { name: string; status: 'active' | 'inactive' }[]) => Promise<{ added: number; updated: number }>;
  loading: boolean;
}

const CrewMembersContext = createContext<CrewMembersContextType | undefined>(undefined);

export const CrewMembersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadCrewMembers = useCallback(async () => {
    setLoading(true);
    try {
      let storedCrew = await getAll<CrewMember>(CREW_STORE);
      
      if (storedCrew.length === 0) {
        console.log('Seeding IndexedDB with initial crew members.');
        await Promise.all(INITIAL_CREW_MEMBERS.map(member => put(CREW_STORE, member)));
        storedCrew = INITIAL_CREW_MEMBERS;
      }
      
      setCrewMembers(storedCrew);
    } catch (error) {
      console.error("Failed to load crew members from IndexedDB, falling back to initial data.", error);
      setCrewMembers(INITIAL_CREW_MEMBERS);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadCrewMembers();
  }, [loadCrewMembers]);

  const addCrewMember = useCallback(async (name: string, actor?: string) => {
    if (name.trim() === '') return;
    
    const now = new Date().toISOString();
    const newMember: CrewMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      status: 'active',
      dateAdded: now,
      lastModified: now,
      history: [
        {
            timestamp: now,
            action: 'CREATED',
            details: `Crew member added with name "${name.trim()}".`,
            actor: actor || user?.email
        }
      ]
    };
    await put(CREW_STORE, newMember);
    setCrewMembers(prev => [...prev, newMember]);
  }, [user]);

  const updateCrewMember = useCallback(async (id: string, newName: string) => {
    if (newName.trim() === '') return;
    const memberToUpdate = crewMembers.find(m => m.id === id);
    if (memberToUpdate && memberToUpdate.name !== newName.trim()) {
        const now = new Date().toISOString();
        const historyEntry: ChangeLog = {
            timestamp: now,
            action: 'UPDATED_NAME',
            details: `Name changed from "${memberToUpdate.name}" to "${newName.trim()}".`,
            actor: user?.email
        };
        const updatedMember = { 
            ...memberToUpdate, 
            name: newName.trim(),
            lastModified: now,
            history: [...memberToUpdate.history, historyEntry]
        };
        await put(CREW_STORE, updatedMember);
        setCrewMembers(prev => prev.map(m => m.id === id ? updatedMember : m));
    }
  }, [crewMembers, user]);
  
  const toggleCrewMemberStatus = useCallback(async (id: string) => {
    const memberToUpdate = crewMembers.find(m => m.id === id);
    if (memberToUpdate) {
        const now = new Date().toISOString();
        const newStatus: 'active' | 'inactive' = memberToUpdate.status === 'active' ? 'inactive' : 'active';
        const historyEntry: ChangeLog = {
            timestamp: now,
            action: newStatus === 'active' ? 'ACTIVATED' : 'DEACTIVATED',
            details: `Status changed to ${newStatus}.`,
            actor: user?.email
        }
        const updatedMember = { 
            ...memberToUpdate, 
            status: newStatus,
            lastModified: now,
            history: [...memberToUpdate.history, historyEntry]
        };
        await put(CREW_STORE, updatedMember);
        setCrewMembers(prev => prev.map(m => m.id === id ? updatedMember : m));
    }
  }, [crewMembers, user]);

  const bulkAddOrUpdateCrew = useCallback(async (members: { name: string; status: 'active' | 'inactive' }[]): Promise<{ added: number; updated: number }> => {
    const now = new Date().toISOString();
    let addedCount = 0;
    let updatedCount = 0;

    const currentMembersMap = new Map<string, CrewMember>(crewMembers.map(m => [m.name.toLowerCase(), m]));
    const membersToUpsert: CrewMember[] = [];
    const updatedCrew = [...crewMembers];

    for (const member of members) {
        const existingMember = currentMembersMap.get(member.name.toLowerCase());

        if (existingMember) {
            // Update existing member if status is different
            if (existingMember.status !== member.status) {
                const historyEntry: ChangeLog = {
                    timestamp: now,
                    action: member.status === 'active' ? 'ACTIVATED' : 'DEACTIVATED',
                    details: `Status changed to ${member.status} via CSV import.`,
                    actor: user?.email
                };
                const updatedMember = {
                    ...existingMember,
                    status: member.status,
                    lastModified: now,
                    history: [...existingMember.history, historyEntry]
                };
                membersToUpsert.push(updatedMember);
                const index = updatedCrew.findIndex(m => m.id === existingMember.id);
                if (index > -1) {
                  updatedCrew[index] = updatedMember;
                }
                updatedCount++;
            }
        } else {
            // Add new member
            const newMember: CrewMember = {
                id: crypto.randomUUID(),
                name: member.name,
                status: member.status,
                dateAdded: now,
                lastModified: now,
                history: [{
                    timestamp: now,
                    action: 'CREATED',
                    details: `Crew member added with name "${member.name}" via CSV import.`,
                    actor: user?.email
                }]
            };
            membersToUpsert.push(newMember);
            updatedCrew.push(newMember);
            addedCount++;
        }
    }
    
    if (membersToUpsert.length > 0) {
        await Promise.all(membersToUpsert.map(m => put(CREW_STORE, m)));
        setCrewMembers(updatedCrew);
    }
    
    return { added: addedCount, updated: updatedCount };

  }, [crewMembers, user]);

  const value = { crewMembers, addCrewMember, updateCrewMember, toggleCrewMemberStatus, bulkAddOrUpdateCrew, loading };

  return React.createElement(CrewMembersContext.Provider, { value }, children);
};

export const useCrewMembers = () => {
  const context = useContext(CrewMembersContext);
  if (context === undefined) {
    throw new Error('useCrewMembers must be used within a CrewMembersProvider');
  }
  return context;
};