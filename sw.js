// Офлайн-кэш: приложение открывается без интернета, обновления подтягиваются в фоне.
const CACHE = "rezhim-v8";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];
// версия для других людей лежит в папке new/ и кэшируется своим service worker
const OWN = name => name.startsWith("rezhim-v");

self.addEventListener("install", e => {
  // cache: "reload" — мимо HTTP-кэша, чтобы новая версия не взяла старые файлы
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
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/new/")) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(r => {
      if (r.ok) cache.put(e.request, r.clone());
      return r;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
