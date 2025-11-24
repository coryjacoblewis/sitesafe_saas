
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

export interface DbSnapshot {
  meta: {
    version: number;
    timestamp: string;
    app: string;
  };
  data: Record<string, unknown[]>;
}

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

export const resetDb = async (): Promise<void> => {
  try {
    const db = await getDb();
    db.close();

    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => console.warn("DB Delete Blocked: Please close other tabs.");
    });
  } catch (e) {
    console.error("Error resetting DB", e);
  }
};

export const getDbSnapshot = async () => {
  const db = await getDb();
  const storeNames = Array.from(db.objectStoreNames);
  const snapshot: Record<string, unknown[]> = {};

  // Use a transaction to ensure consistency
  const tx = db.transaction(storeNames, 'readonly');

  const promises = storeNames.map(storeName => {
    return new Promise<void>((resolve, reject) => {
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        snapshot[storeName] = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });

  await Promise.all(promises);

  return {
    meta: {
      version: 1,
      timestamp: new Date().toISOString(),
      app: 'SiteSafe'
    },
    data: snapshot
  };
};

export const restoreDbSnapshot = async (snapshotData: DbSnapshot) => {
  const db = await getDb();
  const storeNames = Array.from(db.objectStoreNames);

  // Basic format validation
  if (!snapshotData || !snapshotData.data) {
    throw new Error("Invalid backup file format.");
  }

  const tx = db.transaction(storeNames, 'readwrite');
  const validStores = Object.keys(snapshotData.data).filter(name => storeNames.includes(name));

  // Upsert strategy: overwrite existing items, add new ones.
  for (const storeName of validStores) {
    const store = tx.objectStore(storeName);
    const items = snapshotData.data[storeName];
    if (Array.isArray(items)) {
      for (const item of items) {
        store.put(item);
      }
    }
  }

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
