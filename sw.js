/* Service worker Workout deníku: offline běh a aktualizace.

   Verze appky (F0-04): údaje o nasazení jsou v js/verze.js, který při každém
   nasazení přepíše GitHub Actions (.github/sestav-web.sh). Chrome porovnává
   sw.js i soubory načtené přes importScripts, takže nové nasazení = nová
   verze, stáhne se a staré soubory se smažou. VERSION se už ručně nemění.
   Nový soubor appky přidej do FILES, jinak nebude fungovat offline.

   Vydaná verze (…/workout-denik/) a testovací verze PR (…/workout-denik/pr-12/)
   běží na stejné doméně a sdílejí úložiště cache. Každá proto maže jen své
   cache (předpona wd-main- / wd-pr12-) a vydaná verze neobsluhuje adresy pr-N. */
importScripts("js/verze.js");
const B = self.APP_BUILD || {};
const VERSION = B.commit ? B.commit + "-" + B.cas : "lokal";
const SCOPE = new URL(self.registration.scope).pathname;   // "/workout-denik/" nebo "/workout-denik/pr-12/"
const PR = (SCOPE.match(/\/pr-(\d+)\/$/) || [])[1];
const PREFIX = "wd-" + (PR ? "pr" + PR : "main") + "-";
const CACHE = PREFIX + VERSION;
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/app.js",
  "js/atlas.js",
  "js/cviky.js",
  "js/pwa.js",
  "js/verze.js",
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
      // vlastní starší cache; vydaná verze smaže i cache z doby před F0-04 ("workout-denik-…")
      if ((key.startsWith(PREFIX) && key !== CACHE) || (!PR && key.startsWith("workout-denik-"))) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // testovací verze PR (pr-12/…) obsluhuje její vlastní service worker, ne vydaná verze
  if (!PR && url.pathname.startsWith(SCOPE) && /^pr-\d+(\/|$)/.test(url.pathname.slice(SCOPE.length))) return;
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
