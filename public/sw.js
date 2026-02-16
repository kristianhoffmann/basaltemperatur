// ============================================================================
// SERVICE WORKER
// PWA Offline-Support und Caching
// ============================================================================

const CACHE_NAME = 'saas-app-v2';
const OFFLINE_URL = '/offline.html';

// Dateien die beim Install gecacht werden (App Shell)
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Dateien/Pfade die NICHT gecacht werden sollen
const CACHE_BLACKLIST = [
  '/api/',
  '/auth/',
  'supabase',
  'stripe',
  '/login',
  '/registrieren',
  '/dashboard',
  '/_next/',
];

// ============================================================================
// INSTALL EVENT - App Shell cachen
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Sofort aktivieren (nicht auf andere Tabs warten)
        return self.skipWaiting();
      })
  );
});

// ============================================================================
// ACTIVATE EVENT - Alte Caches löschen
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[ServiceWorker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Kontrolle über alle Clients übernehmen
        return self.clients.claim();
      })
  );
});

// ============================================================================
// FETCH EVENT - Network-First mit Cache-Fallback
// ============================================================================

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nur GET-Requests cachen
  if (event.request.method !== 'GET') {
    return;
  }

  // Blacklist prüfen
  if (CACHE_BLACKLIST.some((pattern) => url.pathname.includes(pattern) || url.href.includes(pattern))) {
    return;
  }

  // Nur same-origin Requests cachen
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    // Network First Strategie
    fetch(event.request)
      .then((response) => {
        // Erfolgreiche Response cachen
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Bei Netzwerkfehler: Cache verwenden
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // Für Navigation: Offline-Seite zeigen
        if (event.request.mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
        }

        // Fallback-Response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      })
  );
});

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  let data = {
    title: 'Neue Benachrichtigung',
    body: 'Sie haben eine neue Nachricht.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'Öffnen',
      },
      {
        action: 'close',
        title: 'Schließen',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ============================================================================
// NOTIFICATION CLICK
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Existierendes Fenster fokussieren
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Neues Fenster öffnen
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Hier können offline gespeicherte Daten synchronisiert werden
  console.log('[ServiceWorker] Syncing data...');

  // Beispiel: IndexedDB Daten an Server senden
  // const pendingRequests = await getFromIndexedDB('pending-requests');
  // for (const request of pendingRequests) {
  //   await fetch(request.url, request.options);
  //   await removeFromIndexedDB('pending-requests', request.id);
  // }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
