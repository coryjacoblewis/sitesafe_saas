const DB_NAME = 'siteSafeDB';
const DB_VERSION = 3; // Incremented version

export const STORES = {
  crewMembers: 'crewMembers',
  safetyTopics: 'safetyTopics',
  locations: 'locations',
  talkRecords: 'talkRecords',
  pendingSubmissions: 'pendingSubmissions',
  pendingCrewMembers: 'pendingCrewMembers', // New store
};

// A promise that resolves with the db instance.
// This allows us to only call indexedDB.open() once.
let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Database error: ' + request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORES.crewMembers)) {
        dbInstance.createObjectStore(STORES.crewMembers, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(STORES.safetyTopics)) {
        dbInstance.createObjectStore(STORES.safetyTopics, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(STORES.locations)) {
        dbInstance.createObjectStore(STORES.locations, { keyPath: 'id' });
      }
       if (!dbInstance.objectStoreNames.contains(STORES.talkRecords)) {
        dbInstance.createObjectStore(STORES.talkRecords, { keyPath: 'id' });
      }
       if (!dbInstance.objectStoreNames.contains(STORES.pendingSubmissions)) {
        dbInstance.createObjectStore(STORES.pendingSubmissions, { keyPath: 'id' });
      }
      // Add the new store for pending crew members
      if (!dbInstance.objectStoreNames.contains(STORES.pendingCrewMembers)) {
        dbInstance.createObjectStore(STORES.pendingCrewMembers, { keyPath: 'id' });
      }
    };
  });

  return dbPromise;
};

export const get = <T>(storeName: string, key: string): Promise<T | undefined> => {
  return new Promise(async (resolve, reject) => {
    try {
        const db = await getDb();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    } catch (error) {
        reject(error);
    }
  });
};

export const getAll = <T>(storeName: string): Promise<T[]> => {
  return new Promise(async (resolve, reject) => {
    try {
        const db = await getDb();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    } catch (error) {
        reject(error);
    }
  });
};

export const put = <T>(storeName: string, item: T): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
        const db = await getDb();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(item);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    } catch (error) {
        reject(error);
    }
  });
};

export const deleteItem = (storeName: string, key: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.delete(key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    } catch (error) {
      reject(error);
    }
  });
};