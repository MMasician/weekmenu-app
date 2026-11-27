/* Service worker: cache-first app shell zodat de geinstalleerde app volledig offline werkt.
   Bij een nieuwe release CACHE_VERSION ophogen. */
const CACHE_VERSION = "weekmenu-app-v21"; // #59 productnormalisatie
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));
const APP_SHELL = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "src/app.js",
  "src/productNormalisatie.js",
  "vendor/react.min.js",
  "vendor/react-dom.min.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];

sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => sw.skipWaiting())
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});

sw.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // App-shell bijwerken op de achtergrond.
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      });
    }).catch(() => caches.match("./"))
  );
});
