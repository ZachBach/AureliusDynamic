// echoGalaxy service worker (MB-10) — minimal by decision: no build
// coupling, no dependency. Navigations go network-first (deploys land
// immediately; cache is the offline fallback); everything else is
// cache-first with background refill (hashed assets are immutable, so
// cache-first is exactly right for them).
const CACHE = 'echogalaxy-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(['./']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin) return

  if (e.request.mode === 'navigate') {
    // network-first: fresh deploys win; offline falls back to cache
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('./', copy))
          return res
        })
        .catch(() => caches.match('./')),
    )
    return
  }

  // cache-first with background refill
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const refill = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, copy))
          }
          return res
        })
        .catch(() => hit)
      return hit || refill
    }),
  )
})
