// ── bichradio service worker ─────────────────────────────
// App shell cache + push notifications.
// (SoundCloud audio is played inside a cross-origin iframe, so this worker
//  never sees those requests — there is nothing to cache or buffer there.)

const SHELL_CACHE = 'bichradio-shell-v4';

const SHELL_ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/silent.mp3', '/silent-bichradio.mp3',
  '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/favicon-32.png'
];
// version.json is intentionally excluded — always fetched fresh

// ── Install: pre-cache shell assets ──────────────────────
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

// ── Activate: remove old caches (including the retired audio cache) ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isShellAsset(url) {
  return (
    url.includes('/index.html') ||
    url.includes('/manifest.json') ||
    url.includes('/sw.js') ||
    url.endsWith('/')
  );
}

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = req.url;

  // version.json — always network, never cache
  if (url.includes('version.json')) {
    e.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // Other origins (SoundCloud, Mixcloud, fonts, the counter Worker) go straight to the network
  if (new URL(url).origin !== self.location.origin) return;

  // App shell — cache first
  if (isShellAsset(url)) {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
    return;
  }

  // Everything else on our domain — network first, cache as offline fallback
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});

// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'bichradio', body: 'tune your day with bichradio!' };
  try { data = e.data.json(); } catch(err) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      vibrate: [100, 50, 100],
      data:    { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Play now' }]
    })
  );
});

// ── Notification click: open/focus the app ───────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        // If app already open, focus it
        for (const client of list) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return clients.openWindow(url);
      })
  );
});
