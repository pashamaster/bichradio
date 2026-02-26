// ── bichradio service worker ─────────────────────────────
// Two separate caches:
//   SHELL_CACHE  — app shell (index.html, manifest, fonts) — cache-first
//   AUDIO_CACHE  — SoundCloud audio streams — 3MB rolling buffer

const SHELL_CACHE = 'bichradio-shell-v2';
const AUDIO_CACHE = 'bichradio-audio-v2';
const AUDIO_MAX_BYTES = 3 * 1024 * 1024; // 3 MB hard cap

const SHELL_ASSETS = ['/', '/index.html', '/manifest.json'];

// ── Install: pre-cache shell assets ──────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ──────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== AUDIO_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Helpers ───────────────────────────────────────────────
function isAudioStream(url) {
  return (
    url.includes('cf-media.sndcdn.com') ||
    url.includes('cf3-media.sndcdn.com') ||
    url.includes('cf4-media.sndcdn.com') ||
    (url.includes('.sndcdn.com/') && (url.includes('.mp3') || url.includes('stream')))
  );
}

function isShellAsset(url) {
  return (
    url.includes('/index.html') ||
    url.includes('/manifest.json') ||
    url.includes('/sw.js') ||
    url.endsWith('/') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  );
}

// ── Enforce 3MB audio cache cap ───────────────────────────
async function enforceAudioCap() {
  try {
    const cache   = await caches.open(AUDIO_CACHE);
    const keys    = await cache.keys();
    let   total   = 0;
    const entries = [];

    for (const req of keys) {
      const res = await cache.match(req);
      if (!res) continue;
      const clone = res.clone();
      const buf   = await clone.arrayBuffer();
      entries.push({ req, size: buf.byteLength });
      total += buf.byteLength;
    }

    // Evict oldest entries first until under cap
    let i = 0;
    while (total > AUDIO_MAX_BYTES && i < entries.length) {
      await cache.delete(entries[i].req);
      total -= entries[i].size;
      i++;
    }
  } catch(e) {}
}

// ── Cache audio with 3MB cap ──────────────────────────────
async function cacheAudioResponse(request, networkResponse) {
  // Only cache full responses, not range requests
  if (networkResponse.status !== 200) return networkResponse;

  try {
    const cache  = await caches.open(AUDIO_CACHE);
    const clone  = networkResponse.clone();
    const reader = clone.body.getReader();
    const chunks = [];
    let   total  = 0;

    // Buffer up to AUDIO_MAX_BYTES
    while (total < AUDIO_MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    reader.cancel();

    // Stitch chunks into one buffer
    const buffer = new Uint8Array(total);
    let   offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }

    // Store the buffered portion
    const toCache = new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': networkResponse.headers.get('Content-Type') || 'audio/mpeg' }
    });
    await cache.put(request, toCache);

    // Enforce cap async (don't block the response)
    enforceAudioCap();

    // Always return the original network response so browser gets the full stream
    return networkResponse;

  } catch(e) {
    return networkResponse;
  }
}

// ── Fetch handler ─────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // App shell — cache first
  if (isShellAsset(url)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // SoundCloud audio streams — cache first, network fallback + background cache
  if (isAudioStream(url)) {
    e.respondWith(
      caches.open(AUDIO_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) {
          // Serve from cache, refresh in background
          fetch(e.request).then(res => {
            if (res && res.status === 200) cacheAudioResponse(e.request, res);
          }).catch(() => {});
          return cached;
        }
        // Not in cache — fetch and cache simultaneously
        const res = await fetch(e.request);
        cacheAudioResponse(e.request, res.clone());
        return res;
      }).catch(() => fetch(e.request))
    );
    return;
  }

  // SoundCloud widget/API — network only
  if (url.includes('soundcloud.com') || url.includes('sndcdn.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Everything else — network first
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// ── Message from page: clear audio cache on channel switch ─
self.addEventListener('message', e => {
  if (e.data === 'CLEAR_AUDIO_CACHE') {
    caches.delete(AUDIO_CACHE).then(() => {
      if (e.source) e.source.postMessage('AUDIO_CACHE_CLEARED');
    });
  }
});
