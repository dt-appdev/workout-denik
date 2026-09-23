/* Service worker Workout deníku: offline běh a aktualizace.

   PRAVIDLO: při KAŽDÉ změně kteréhokoli souboru appky zvyš VERSION.
   Jen tak Chrome pozná, že je nová verze, stáhne ji a staré soubory smaže.
   Nový soubor appky přidej i do FILES, jinak nebude fungovat offline. */
const VERSION = "2026-09-23.1";
const CACHE = "workout-denik-" + VERSION;
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/app.js",
  "js/atlas.js",
  "js/pwa.js",
  "fonts/fonts.css",
  "fonts/barlow-400-latin.woff2",
  "fonts/barlow-400-latin-ext.woff2",
  "fonts/barlow-500-latin.woff2",
  "fonts/barlow-500-latin-ext.woff2",
  "fonts/barlow-600-latin.woff2",
  "fonts/barlow-600-latin-ext.woff2",
  "fonts/barlow-700-latin.woff2",
  "fonts/barlow-700-latin-ext.woff2",
  "fonts/barlow-condensed-500-latin.woff2",
  "fonts/barlow-condensed-500-latin-ext.woff2",
  "fonts/barlow-condensed-600-latin.woff2",
  "fonts/barlow-condensed-600-latin-ext.woff2",
  "fonts/barlow-condensed-700-latin.woff2",
  "fonts/barlow-condensed-700-latin-ext.woff2",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache:"reload" = vzít soubory přímo ze serveru, ne ze staré HTTP cache prohlížeče
    await cache.addAll(FILES.map(url => new Request(url, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("workout-denik-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // otevření appky (i s ?parametry) = vždy index.html z cache, funguje i bez signálu
    if (req.mode === "navigate") {
      const page = await cache.match("index.html");
      if (page) return page;
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    return hit || fetch(req);
  })());
});
