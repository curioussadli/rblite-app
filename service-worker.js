const CACHE_NAME = "rbleon-v3";

// =====================================================
// 📦 FILE CACHE (STATIC FILE ONLY)
// =====================================================
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/main.css",
  "./js/main.js",
  "./js/dashboard.js",
  "./assets/icons/icon-192.png"
];

// =====================================================
// 📥 INSTALL EVENT
// =====================================================
self.addEventListener("install", (event) => {

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// =====================================================
// ♻️ ACTIVATE EVENT
// =====================================================
self.addEventListener("activate", (event) => {

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// =====================================================
// 🌐 FETCH EVENT (ANTI POST CACHE ERROR)
// =====================================================
self.addEventListener("fetch", (event) => {

  const req = event.request;

  // ❗ PENTING: hanya GET yang boleh di-cache
  if (req.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {

        // jangan cache response jelek
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }

        const resClone = res.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, resClone);
        });

        return res;
      })
      .catch(() => {
        return caches.match(req);
      })
  );
});