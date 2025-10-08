import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PendingCrewMember } from '../types';
import { getAll, deleteItem } from '../utils/db';
import { useAuth } from './useAuth';
import { useCrewMembers } from './useCrewMembers';

const PENDING_CREW_STORE = 'pendingCrewMembers';

interface PendingCrewContextType {
  pendingCrew: PendingCrewMember[];
  approveMember: (member: PendingCrewMember) => void;
  rejectMember: (member: PendingCrewMember) => void;
  loading: boolean;
}

const PendingCrewContext = createContext<PendingCrewContextType | undefined>(undefined);

export const PendingCrewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingCrew, setPendingCrew] = useState<PendingCrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addCrewMember } = useCrewMembers();

  const loadPendingCrew = useCallback(async () => {
    setLoading(true);
    try {
      const pending = await getAll<PendingCrewMember>(PENDING_CREW_STORE);
      setPendingCrew(pending);
    } catch (error) {
      console.error("Failed to load pending crew members from IndexedDB.", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingCrew();
  }, [loadPendingCrew]);

  // This effect listens for changes in the talk records, which might add new pending members
  // A more robust solution might use a broadcast channel or events, but polling on visibility change is a good compromise.
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            loadPendingCrew();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadPendingCrew]);

  const approveMember = useCallback(async (member: PendingCrewMember) => {
    if (!user) return;
    addCrewMember(member.name, user.email); // Pass current manager as actor
    await deleteItem(PENDING_CREW_STORE, member.id);
    setPendingCrew(prev => prev.filter(p => p.id !== member.id));
  }, [user, addCrewMember]);

  const rejectMember = useCallback(async (member: PendingCrewMember) => {
    await deleteItem(PENDING_CREW_STORE, member.id);
    setPendingCrew(prev => prev.filter(p => p.id !== member.id));
  }, []);

  const value = { pendingCrew, approveMember, rejectMember, loading };

  return React.createElement(PendingCrewContext.Provider, { value }, children);
};

export const usePendingCrew = () => {
  const context = useContext(PendingCrewContext);
  if (context === undefined) {
    throw new Error('usePendingCrew must be used within a PendingCrewProvider');
  }
  return context;
};