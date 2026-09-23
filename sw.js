/* Service worker Workout deníku: offline běh a aktualizace.

   Verze appky (F0-04): údaje o nasazení jsou v js/verze.js, který při každém
   nasazení přepíše GitHub Actions (.github/sestav-web.sh). Chrome porovnává
   sw.js i soubory načtené přes importScripts, takže nové nasazení = nová
   verze, stáhne se a staré soubory se smažou. VERSION se už ručně nemění.
   Nový soubor appky přidej do FILES, jinak nebude fungovat offline.

   Vydaná verze (…/workout-denik/) a testovací verze PR (…/workout-denik-test/pr-12/)
   běží na stejné doméně a sdílejí úložiště cache. Každá proto maže jen své
   cache (předpona wd-main- / wd-pr12-). */
importScripts("js/verze.js");
const B = self.APP_BUILD || {};
const VERSION = B.commit ? B.commit + "-" + B.cas : "lokal";
const SCOPE = new URL(self.registration.scope).pathname;   // "/workout-denik/" nebo "/workout-denik-test/pr-12/"
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
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // otevření appky (i s ?parametry) = vždy index.html z cache, funguje i bez signálu
    if (req.mode === "navigate") {
      const page = await cache.match("index.html");
      if (page) return page;
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    // databáze cviků pro hledání (js/fedb.js, F0-03) není ve FILES, aby nezdržovala instalaci;
    // uloží se do cache až při prvním hledání a pak funguje i offline
    if (res.ok && new URL(req.url).pathname.endsWith("/js/fedb.js")) await cache.put(req, res.clone());
    return res;
  })());
});

/* Oznámení na konci pauzy (F1-04). Appka pošle zprávu {type:"rest", tag, end, title, body, vib, always};
   bez "end" = zrušit. Web neumí naplánovat oznámení do systému, proto worker čeká sám:
   waitUntil ho drží vzhůru, Chrome to dovolí nejvýš asi 5 minut (každá nová zpráva lhůtu obnoví).
   Když je appka zrovna na očích (viditelná a aktivní), oznámení se neukáže (pípne appka sama),
   kromě zkoušky (always). V testovací verzi PR (a lokálně) se průběh zapisuje
   do záznamu (cache "wdlog-…"), appka ho ukáže v Nastavení → Verze aplikace. */
const restTimers = new Map();   // tag → {t: časovač, done: ukončí waitUntil}
const LOG = "wdlog-" + (PR ? "pr" + PR : "main");
const DEV = !!PR || B.kanal === "lokal";   // záznam jen v testovací verzi PR a lokálně, ve vydané ne
async function restLog(txt) {
  if (!DEV) return;
  try {
    const c = await caches.open(LOG), r = await c.match("log");
    const a = r ? await r.json() : [];
    // opakované přeplánování (±15 s) za sebou = jen jeden řádek
    if (a[0] && txt.startsWith("naplánováno") && a[0].txt.startsWith("naplánováno") && Date.now() - a[0].at < 15000) a.shift();
    a.unshift({ at: Date.now(), txt });
    await c.put("log", new Response(JSON.stringify(a.slice(0, 12))));
  } catch (e) {}
}
self.addEventListener("message", event => {
  const m = event.data || {};
  if (m.type !== "rest" || !m.tag) return;
  const old = restTimers.get(m.tag);
  if (old) { clearTimeout(old.t); old.done(); restTimers.delete(m.tag); }
  if (!m.end) { if (old) restLog("zrušeno (konec byl " + new Date(old.end).toLocaleTimeString("cs-CZ") + ")"); return; }
  const plan = new Date(m.end).toLocaleTimeString("cs-CZ");
  event.waitUntil(new Promise(done => {
    const r = { done, end: m.end };
    r.t = setTimeout(async () => {
      try {
        const late = Math.round((Date.now() - m.end) / 1000);
        const wins = (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).filter(c => c.url.startsWith(self.registration.scope));
        const seen = wins.some(c => c.visibilityState === "visible" && c.focused);
        const st = wins.map(c => c.visibilityState + (c.focused ? "+aktivní" : "")).join(", ") || "zavřená";
        if (m.always || !seen) {
          const o = { body: m.body || "", tag: m.tag, renotify: true, icon: "icons/icon-192.png" };
          if (m.vib) o.vibrate = m.vib;
          await self.registration.showNotification(m.title || "Odpočinek skončil", o);
          await restLog("konec " + plan + ": oznámení zobrazeno" + (late > 1 ? ", zpoždění " + late + " s" : "") + " (appka: " + st + ")");
        } else await restLog("konec " + plan + ": appka na očích, bez oznámení (appka: " + st + ")");
      } catch (e) { await restLog("konec " + plan + ": chyba " + (e && e.message || e)); }
      if (restTimers.get(m.tag) === r) restTimers.delete(m.tag);
      done();
    }, Math.max(0, m.end - Date.now()));
    restTimers.set(m.tag, r);
    if (!old || old.end !== m.end) restLog("naplánováno na " + plan + (m.always ? " (zkouška)" : ""));
  }));
});

// klepnutí na oznámení = otevřít appku (už otevřenou jen přepnout do popředí)
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const w = wins.find(c => c.url.startsWith(self.registration.scope));
    if (w) return w.focus();
    return self.clients.openWindow(self.registration.scope);
  })());
});
