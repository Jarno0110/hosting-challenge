const CACHE_NAME = "leaderboard-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/manifest/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  // weitere statische Dateien bei Bedarf
];

// Installieren und direkt cachen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Alte Caches löschen, wenn Version wechselt
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

// Netzwerk-Fallback-Strategie: Versuche zuerst Cache, dann Netzwerk
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});