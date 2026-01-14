/* service-worker.js */
const CACHE_NAME = "rel01_noleggio_v2026_01_14"; // <-- cambia questa per forzare update
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./libs/jspdf.umd.min.js",
  "./icons/icons_crm-192x192.png",
  "./icons/icons_crm-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // 🔥 attiva subito il nuovo SW
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim(); // 🔥 prende controllo subito delle pagine
});

// Helpers
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req);
}

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    return cached || caches.match("./index.html");
  }
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req).then(async (fresh) => {
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  }).catch(() => null);

  return cached || fetchPromise || caches.match("./index.html");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Solo stesso origin
  if (url.origin !== self.location.origin) return;

  // HTML: network-first (aggiorna bene)
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // JS/CSS: stale-while-revalidate (veloce + si aggiorna)
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Asset statici: cache-first
  event.respondWith(cacheFirst(req));
});
