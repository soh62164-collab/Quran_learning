const CACHE_NAME = 'quran-learn-v3';
const ASSETS_TO_CACHE = ['./','./index.html','./style.css','./app.js','./manifest.json',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.destination === 'audio' || req.destination === 'video' || /\.mp3$/i.test(url.pathname)) return;
  const cacheable = url.origin === location.origin || url.hostname === 'api.alquran.cloud' ||
    url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com');
  if (!cacheable) return;
  e.respondWith(caches.match(req).then((cached) => {
    const net = fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => cached || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    return cached || net;
  }));
});
