import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SafetyTopic, ChangeLog } from '../types';
import { INITIAL_SAFETY_TOPICS } from '../constants/safetyTopics';
import { getAll, put } from '../utils/db';
import { useAuth } from './useAuth';

const TOPICS_STORE = 'safetyTopics';

interface SafetyTopicsContextType {
  safetyTopics: SafetyTopic[];
  addSafetyTopic: (name: string, content: string, pdfData?: { name: string; dataUrl: string; }) => void;
  updateSafetyTopic: (id: string, newName: string, newContent: string, pdfData?: { name: string; dataUrl: string; }) => void;
  toggleSafetyTopicStatus: (id: string) => void;
  loading: boolean;
}

const SafetyTopicsContext = createContext<SafetyTopicsContextType | undefined>(undefined);

export const SafetyTopicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [safetyTopics, setSafetyTopics] = useState<SafetyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let storedTopics = await getAll<SafetyTopic>(TOPICS_STORE);
        
        if (storedTopics.length === 0) {
          console.log('Seeding IndexedDB with initial safety topics.');
          await Promise.all(INITIAL_SAFETY_TOPICS.map(topic => put(TOPICS_STORE, topic)));
          storedTopics = INITIAL_SAFETY_TOPICS;
        }
        
        setSafetyTopics(storedTopics);
      } catch (error) {
        console.error("Failed to load topics from IndexedDB, falling back to initial data.", error);
        setSafetyTopics(INITIAL_SAFETY_TOPICS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const addSafetyTopic = useCallback(async (name: string, content: string, pdfData?: { name: string; dataUrl: string; }) => {
    if (name.trim() === '') return;
    
    const now = new Date().toISOString();
    const newTopic: SafetyTopic = {
      id: crypto.randomUUID(),
      name: name.trim(),
      content: content.trim(),
      pdfUrl: pdfData ? pdfData.dataUrl : '/mock-topic.pdf',
      status: 'active',
      dateAdded: now,
      lastModified: now,
      history: [
        {
            timestamp: now,
            action: 'CREATED',
            details: `Topic added with name "${name.trim()}".${pdfData ? ' PDF uploaded.' : ''}`,
            actor: user?.email
        }
      ]
    };
    await put(TOPICS_STORE, newTopic);
    setSafetyTopics(prev => [...prev, newTopic]);
  }, [user]);

  const updateSafetyTopic = useCallback(async (id: string, newName: string, newContent: string, pdfData?: { name: string; dataUrl: string; }) => {
    if (newName.trim() === '') return;
    const topicToUpdate = safetyTopics.find(t => t.id === id);
    if (topicToUpdate) {
        const now = new Date().toISOString();
        const historyEntries: ChangeLog[] = [];

        const nameChanged = topicToUpdate.name !== newName.trim();
        const contentChanged = topicToUpdate.content !== newContent.trim();
        const pdfChanged = pdfData && topicToUpdate.pdfUrl !== pdfData.dataUrl;

        if (!nameChanged && !contentChanged && !pdfChanged) return;

        if (nameChanged || contentChanged) {
            const details: string[] = [];
            if (nameChanged) details.push(`Name changed from "${topicToUpdate.name}" to "${newName.trim()}".`);
            if (contentChanged) details.push('Content was updated.');
            historyEntries.push({
                timestamp: now,
                action: 'UPDATED_CONTENT',
                details: details.join(' '),
                actor: user?.email
            });
        }
        
        if (pdfChanged) {
            historyEntries.push({
                timestamp: now,
                action: 'UPDATED_PDF',
                details: `PDF document updated to "${pdfData.name}".`,
                actor: user?.email
            });
        }

        const updatedTopic = { 
            ...topicToUpdate, 
            name: newName.trim(),
            content: newContent.trim(),
            pdfUrl: pdfData ? pdfData.dataUrl : topicToUpdate.pdfUrl,
            lastModified: now,
            history: [...topicToUpdate.history, ...historyEntries]
        };

        await put(TOPICS_STORE, updatedTopic);
        setSafetyTopics(prev => prev.map(t => t.id === id ? updatedTopic : t));
    }
  }, [safetyTopics, user]);
  
  const toggleSafetyTopicStatus = useCallback(async (id: string) => {
    const topicToUpdate = safetyTopics.find(t => t.id === id);
    if (topicToUpdate) {
        const now = new Date().toISOString();
        const newStatus: 'active' | 'inactive' = topicToUpdate.status === 'active' ? 'inactive' : 'active';
        const historyEntry: ChangeLog = {
            timestamp: now,
            action: newStatus === 'active' ? 'ACTIVATED' : 'DEACTIVATED',
            details: `Status changed to ${newStatus}.`,
            actor: user?.email
        }
        const updatedTopic = { 
            ...topicToUpdate, 
            status: newStatus,
            lastModified: now,
            history: [...topicToUpdate.history, historyEntry]
        };
        await put(TOPICS_STORE, updatedTopic);
        setSafetyTopics(prev => prev.map(t => t.id === id ? updatedTopic : t));
    }
  }, [safetyTopics, user]);

  const value = { safetyTopics, addSafetyTopic, updateSafetyTopic, toggleSafetyTopicStatus, loading };

  return React.createElement(SafetyTopicsContext.Provider, { value }, children);
};

export const useSafetyTopics = () => {
  const context = useContext(SafetyTopicsContext);
  if (context === undefined) {
    throw new Error('useSafetyTopics must be used within a SafetyTopicsProvider');
  }
  return context;
};