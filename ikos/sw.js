// IKOS service worker — offline shell + runtime caching.
//
// The app is one self-contained bundle (index.html: template + gzipped assets,
// React included), so offline needs only: the shell, the manifest/icons, and the
// self-hosted three.js modules the Orbit view imports on demand from ./vendor/.
// Nothing is fetched from a CDN. Navigations are network-first so new deploys
// land the moment you're online; everything cacheable falls back to the cache
// offline.
//
// Paths are relative to this file, so the same worker serves a site root and a
// subfolder deploy (aureliusdynamic.com/ikos/). v2 drops the v1 cache, which held
// copies of the old CDN modules.

const CACHE = 'ikos-v2';
const SHELL = './';
const PRECACHE = [SHELL, './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // navigations: network-first (fresh deploys), cached shell when offline
  // (every route serves the same bundle, so the shell stands in for them all)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(SHELL, copy)); return res; })
        .catch(() => caches.match(SHELL))
    );
    return;
  }

  // same-origin static (including ./vendor/): stale-while-revalidate
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req)
          .then((res) => {
            if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
  }
  // everything else (a video host the visitor chose to load) passes through untouched and is never cached
});
