import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TalkRecord, PendingCrewMember } from '../types';
import { MOCK_TALK_RECORDS } from '../constants';
import { getAll, put, deleteItem, get } from '../utils/db';

const TALK_RECORDS_STORE = 'talkRecords';
const PENDING_SUBMISSIONS_STORE = 'pendingSubmissions';
const PENDING_CREW_STORE = 'pendingCrewMembers';

interface TalkRecordsContextType {
  records: TalkRecord[];
  loading: boolean;
  addRecord: (record: Omit<TalkRecord, 'id' | 'syncStatus'>) => void;
}

const TalkRecordsContext = createContext<TalkRecordsContextType | undefined>(undefined);

export const TalkRecordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<TalkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let syncedRecords = await getAll<TalkRecord>(TALK_RECORDS_STORE);
      
      if (syncedRecords.length === 0) {
        console.log('Seeding IndexedDB with initial talk records.');
        const recordsToSeed = MOCK_TALK_RECORDS.filter(r => r.syncStatus === 'synced');
        await Promise.all(recordsToSeed.map(record => put(TALK_RECORDS_STORE, record)));
        syncedRecords = recordsToSeed;
      }

      const pendingRecords = await getAll<TalkRecord>(PENDING_SUBMISSIONS_STORE);
      
      setRecords([...pendingRecords, ...syncedRecords]);

    } catch (error) {
      console.error("Failed to load records from IndexedDB, falling back to initial data.", error);
      setRecords(MOCK_TALK_RECORDS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Manual sync fallback for browsers without Background Sync (e.g., Safari)
  // and eager sync for all browsers when app is opened or comes online.
  useEffect(() => {
    const triggerManualSync = async () => {
      if (!navigator.onLine) {
        console.log("Offline, skipping manual sync check.");
        return;
      }

      const pendingRecords = await getAll<TalkRecord>(PENDING_SUBMISSIONS_STORE);
      if (pendingRecords.length === 0) {
        return;
      }

      console.log(`[Manual Sync] Found ${pendingRecords.length} pending records. Starting sync.`);

      for (const record of pendingRecords) {
        try {
          // Simulate network upload
          await new Promise(resolve => setTimeout(resolve, 300));
          const syncedRecord = { ...record, syncStatus: 'synced' as const };
          
          await put(TALK_RECORDS_STORE, syncedRecord);
          await deleteItem(PENDING_SUBMISSIONS_STORE, record.id);

          console.log(`[Manual Sync] Synced record ${record.id}`);
        } catch (error) {
          console.error(`[Manual Sync] Failed to sync record ${record.id}. Will retry on next app load/online event.`, error);
          // Stop on first error to avoid hammering a potentially broken API
          return; 
        }
      }

      console.log("[Manual Sync] Sync complete. Reloading records for UI update.");
      await loadData();
    };

    triggerManualSync(); // Run on initial load
    window.addEventListener('online', triggerManualSync);
    return () => {
      window.removeEventListener('online', triggerManualSync);
    };
  }, [loadData]);


  const addRecord = useCallback(async (recordData: Omit<TalkRecord, 'id' | 'syncStatus'>) => {
    const newRecordId = crypto.randomUUID();
    const newRecord: TalkRecord = {
      ...recordData,
      id: newRecordId,
      syncStatus: 'pending',
    };
    
    // Save to the pending queue
    await put(PENDING_SUBMISSIONS_STORE, newRecord);

    // Update state for immediate UI feedback
    setRecords(prevRecords => [newRecord, ...prevRecords]);

    // Check for any "guest" crew members and add them to the pending approval queue
    const guestSignatures = recordData.crewSignatures.filter(sig => sig.isGuest);
    for (const guest of guestSignatures) {
      const normalizedName = guest.name.trim().toLowerCase();
      const existingPending = await get<PendingCrewMember>(PENDING_CREW_STORE, normalizedName);
      if (!existingPending) {
        const pending: PendingCrewMember = {
          id: normalizedName,
          name: guest.name.trim(),
          source: {
            talkId: newRecordId,
            foremanEmail: recordData.foremanName,
            dateAdded: recordData.dateTime,
          }
        };
        await put(PENDING_CREW_STORE, pending);
        console.log(`Added "${guest.name}" to pending approvals.`);
      }
    }


    // Register for a background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // FIX: Cast registration to `any` to access the `sync` property, which may not be present in the default ServiceWorkerRegistration type definition.
        await (registration as any).sync.register('sync-talks');
        console.log('Background sync task registered: sync-talks');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    } else {
      console.log('Background Sync not supported by this browser.');
    }
  }, []);

  const value = { records, loading, addRecord };

  return React.createElement(TalkRecordsContext.Provider, { value }, children);
};

export const useTalkRecords = () => {
  const context = useContext(TalkRecordsContext);
  if (context === undefined) {
    throw new Error('useTalkRecords must be used within a TalkRecordsProvider');
  }
  return context;
};