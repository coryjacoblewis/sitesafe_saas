import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Location, ChangeLog } from '../types';
import { INITIAL_LOCATIONS } from '../constants/locations';
import { getAll, put } from '../utils/db';
import { useAuth } from './useAuth';

const LOCATIONS_STORE = 'locations';

interface LocationsContextType {
  locations: Location[];
  addLocation: (name: string) => void;
  updateLocation: (id: string, newName: string) => void;
  toggleLocationStatus: (id: string) => void;
  loading: boolean;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export const LocationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let storedLocations = await getAll<Location>(LOCATIONS_STORE);
        
        if (storedLocations.length === 0) {
          console.log('Seeding IndexedDB with initial locations.');
          await Promise.all(INITIAL_LOCATIONS.map(loc => put(LOCATIONS_STORE, loc)));
          storedLocations = INITIAL_LOCATIONS;
        }
        
        setLocations(storedLocations);
      } catch (error) {
        console.error("Failed to load locations from IndexedDB, falling back to initial data.", error);
        setLocations(INITIAL_LOCATIONS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const addLocation = useCallback(async (name: string) => {
    if (name.trim() === '') return;
    
    const now = new Date().toISOString();
    const newLocation: Location = {
      id: crypto.randomUUID(),
      name: name.trim(),
      status: 'active',
      dateAdded: now,
      lastModified: now,
      history: [
        {
            timestamp: now,
            action: 'CREATED',
            details: `Location added with name "${name.trim()}".`,
            actor: user?.email
        }
      ]
    };
    await put(LOCATIONS_STORE, newLocation);
    setLocations(prev => [...prev, newLocation]);
  }, [user]);

  const updateLocation = useCallback(async (id: string, newName: string) => {
    if (newName.trim() === '') return;
    const locationToUpdate = locations.find(l => l.id === id);
    if (locationToUpdate && locationToUpdate.name !== newName.trim()) {
        const now = new Date().toISOString();
        const historyEntry: ChangeLog = {
            timestamp: now,
            action: 'UPDATED_NAME',
            details: `Name changed from "${locationToUpdate.name}" to "${newName.trim()}".`,
            actor: user?.email
        };
        const updatedLocation = { 
            ...locationToUpdate, 
            name: newName.trim(),
            lastModified: now,
            history: [...locationToUpdate.history, historyEntry]
        };
        await put(LOCATIONS_STORE, updatedLocation);
        setLocations(prev => prev.map(l => l.id === id ? updatedLocation : l));
    }
  }, [locations, user]);
  
  const toggleLocationStatus = useCallback(async (id: string) => {
    const locationToUpdate = locations.find(l => l.id === id);
    if (locationToUpdate) {
        const now = new Date().toISOString();
        const newStatus: 'active' | 'inactive' = locationToUpdate.status === 'active' ? 'inactive' : 'active';
        const historyEntry: ChangeLog = {
            timestamp: now,
            action: newStatus === 'active' ? 'ACTIVATED' : 'DEACTIVATED',
            details: `Status changed to ${newStatus}.`,
            actor: user?.email
        }
        const updatedLocation = { 
            ...locationToUpdate, 
            status: newStatus,
            lastModified: now,
            history: [...locationToUpdate.history, historyEntry]
        };
        await put(LOCATIONS_STORE, updatedLocation);
        setLocations(prev => prev.map(l => l.id === id ? updatedLocation : l));
    }
  }, [locations, user]);

  const value = { locations, addLocation, updateLocation, toggleLocationStatus, loading };

  return React.createElement(LocationsContext.Provider, { value }, children);
};

export const useLocations = () => {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationsProvider');
  }
  return context;
};
