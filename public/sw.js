/**
 * Track 24 — Service Worker & Push Notification Engine
 * Handles offline caching, PWA installation, and Web Push notifications.
 */

const CACHE_NAME = 'track24-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg'
];

// ── 1. Installation ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Continue even if some optional assets are deferred
      });
    }).then(() => self.skipWaiting())
  );
});

// ── 2. Activation & Clean-up ──────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ── 3. Fetch Strategy ─────────────────────────────────────────
// Network first for live flight/weather APIs, stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Live APIs must always hit network (no stale flight radar cache)
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/weather') ||
    url.pathname.startsWith('/wiki') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/upload')
  ) {
    return;
  }

  // Static assets & navigation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to revalidate
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline navigation fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── 4. Web Push Notifications ─────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Track 24 Radar Alert', body: event.data.text() };
    }
  }

  const title = data.title || 'Track 24 Radar Alert';
  const options = {
    body: data.body || 'Live flight telemetry update received.',
    icon: data.icon || '/logo.svg',
    badge: data.badge || '/favicon.svg',
    vibrate: data.vibrate || [120, 60, 120],
    tag: data.tag || `flight-alert-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || '/',
      flightId: data.flightId,
      timestamp: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: 'Open Radar' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── 5. Notification Click Interaction ─────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (client.url !== targetUrl && 'navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
