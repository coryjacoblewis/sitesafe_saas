

const STATIC_CACHE_NAME = 'sitesafe-static-v3'; // Incremented version
const DYNAMIC_CACHE_NAME = 'sitesafe-data-v1';

// Helper function to check if the request is for data.
const isDataRequest = (url) => {
    const path = new URL(url).pathname;
    return path.includes('/constants/crewMembers.ts') ||
           path.includes('/constants/safetyTopics.ts') ||
           path.includes('/constants/locations.ts') ||
           path.includes('/constants.ts'); // Added constants.ts
}

// INSTALL: A minimalist install event.
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Opened static cache. Caching core assets.');
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/vite.svg',
          '/index.tsx',
          '/App.tsx',
          '/constants.ts',
          'https://cdn.tailwindcss.com' // Cache external style script for offline use
        ]);
      })
  );
});

// ACTIVATE: Clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH: Intercept network requests and apply caching strategies.
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Ignore non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Data request strategy: Network-first, then cache.
  if (isDataRequest(request.url)) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return fetch(request).then(networkResponse => {
          console.log(`[SW] Caching data: ${request.url}`);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          console.log(`[SW] Serving data from cache: ${request.url}`);
          return cache.match(request);
        });
      })
    );
    return;
  }

  // App Shell request strategy: Cache-first, then network.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(
          networkResponse => {
            if (!networkResponse || !['basic', 'cors', 'opaque'].includes(networkResponse.type)) {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME)
              .then(cache => {
                 // We allow caching opaque responses (like CDNs)
                 cache.put(request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error(`[SW] Fetch failed for ${request.url}:`, error);
            throw error;
        });
      })
  );
});

// --- BACKGROUND SYNC ---

const DB_NAME = 'siteSafeDB';
const DB_VERSION = 3; // Must match the version in utils/db.ts
const PENDING_SUBMISSIONS_STORE = 'pendingSubmissions';
const TALK_RECORDS_STORE = 'talkRecords';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      console.error('[SW] DB Error:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function syncTalks() {
  console.log('[SW] Sync event triggered for "sync-talks".');
  const db = await openDb();
  const tx = db.transaction([PENDING_SUBMISSIONS_STORE, TALK_RECORDS_STORE], 'readwrite');
  const pendingStore = tx.objectStore(PENDING_SUBMISSIONS_STORE);
  const syncedStore = tx.objectStore(TALK_RECORDS_STORE);
  
  const pendingRecords = await promisifyRequest(pendingStore.getAll());

  if (!pendingRecords || pendingRecords.length === 0) {
    console.log('[SW] No pending records to sync.');
    return;
  }

  console.log(`[SW] Syncing ${pendingRecords.length} pending record(s).`);

  for (const record of pendingRecords) {
    try {
      console.log(`[SW] Submitting record: ${record.id}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
      
      record.syncStatus = 'synced';
      syncedStore.put(record);
      pendingStore.delete(record.id);

      console.log(`[SW] Record ${record.id} synced successfully.`);

    } catch (error) {
      console.error(`[SW] Failed to sync record ${record.id}.`, error);
      throw error; 
    }
  }
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-talks') {
    console.log('[SW] Received sync event for "sync-talks".');
    event.waitUntil(syncTalks());
  }
});
