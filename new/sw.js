// Офлайн-кэш версии для других людей. Свои кэши — только с префиксом rezhim-new-.
const CACHE = "rezhim-new-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "../icon-180.png", "../icon-512.png"];
const OWN = name => name.startsWith("rezhim-new-");

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => OWN(k) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(r => {
      if (r.ok) cache.put(e.request, r.clone());
      return r;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
