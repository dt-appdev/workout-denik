/* ---------- ZÁZNAM UDÁLOSTÍ (F0-21) ----------
   Appka si v telefonu vede záznam událostí, aby šlo zjistit, co se stalo, i ve vydané verzi (start appky,
   chyby kódu, blokace CSP, selhání uložení, pauza a oznámení, povolení, návrat z pozadí, stav podle Androidu).
   Žádná tréninková data. Nikam se neposílá a do zálohy nepatří: uživatel ho v Nastavení → O aplikaci
   → Záznam událostí zkopíruje a vloží do chatu (panel sheetEvLog v js/app.js).
   Samostatný soubor načtený hned po js/verze.js, aby zachytil i chybu, kvůli které se js/app.js nenačte nebo
   spadne při startu. Načítá ho i service worker (importScripts v sw.js), oba zapisují do stejné databáze.
   - Úložiště: vlastní databáze IndexedDB "workout-denik-log" (testovací verze PR 12 "workout-denik-log-pr12"),
     jeden záznam "rows" = pole řádků {at, txt, n}, nejnovější první, nejvýš LOG_MAX. Ne v datové databázi
     (nové úložiště by zvýšilo Idb.VER a starší APK by data neotevřelo) a ne v Local (limit 5 MB sdílený
     s testovacími verzemi). Přístup jen přes logDb (schválené místo v .github/kontrola-uloziste.sh).
   - Zápis: ZAZNAM.add(text) dá řádek do paměti, na disk se zapíše sdruženě po LOG_DELAY, hned při chybě
     a při odchodu appky do pozadí. Service worker zapisuje hned (ZAZNAM.add(text, true) vrátí Promise),
     jinak by ho Chrome mohl uspat dřív. Stejný text hned po sobě do minuty = jeden řádek s počtem n (×N),
     aby smyčka chyb nevytlačila zbytek záznamu.
   - Čtení a mazání: ZAZNAM.read(), ZAZNAM.clear(). Chyby samotného záznamu se tiše ignorují.
   Pravidlo: nová funkce zapisuje své důležité události přes evLog (js/app.js) nebo ZAZNAM.add. */
(function () {
  const LOG_MAX = 200,
    LOG_DELAY = 3000,
    LOG_SAME = 60000;
  // testovací verze PR má vlastní záznam (stránka: adresa, service worker: jeho rozsah)
  const scopePath = self.registration ? new URL(self.registration.scope).pathname : location.pathname;
  const pr = (scopePath.match(/\/pr-(\d+)\//) || [])[1];
  const LOG_DB = "workout-denik-log" + (pr ? "-pr" + pr : "");
  let buf = [],
    timer = null,
    chain = Promise.resolve(),
    dbPromise = null;

  // otevře (poprvé založí) databázi záznamu
  function logDb() {
    if (!dbPromise) {
      dbPromise = new Promise((res, rej) => {
        const rq = indexedDB.open(LOG_DB, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore("log");
        rq.onsuccess = () => {
          const db = rq.result;
          db.onversionchange = () => {
            db.close();
            dbPromise = null;
          };
          res(db);
        };
        rq.onerror = () => rej(rq.error);
        rq.onblocked = () => rej(new Error("blocked"));
      }).catch((e) => {
        dbPromise = null;
        throw e;
      });
    }
    return dbPromise;
  }
  // jedna transakce nad řádky: fn(pole) vrátí nové pole (null = nic nezapisovat)
  async function logTx(fn) {
    const db = await logDb();
    return new Promise((res, rej) => {
      const tx = db.transaction("log", "readwrite"),
        st = tx.objectStore("log"),
        rq = st.get("rows");
      let out = [];
      rq.onsuccess = () => {
        const rows = Array.isArray(rq.result) ? rq.result : [];
        const next = fn(rows);
        out = next || rows;
        if (next) {
          st.put(next, "rows");
        }
      };
      tx.oncomplete = () => res(out);
      tx.onerror = tx.onabort = () => rej(tx.error);
    });
  }
  // přidá řádky z paměti na začátek záznamu (stejný text hned po sobě = jeden řádek s počtem)
  function merge(rows, fresh) {
    for (const r of fresh) {
      const top = rows[0];
      if (top && top.txt === r.txt && r.at - top.at < LOG_SAME) {
        top.n = (top.n || 1) + r.n;
        top.at = r.at;
      } else {
        rows.unshift(r);
      }
    }
    // stránka zapisuje sdruženě, worker hned: seřadit podle času (nejnovější první)
    rows.sort((a, b) => b.at - a.at);
    return rows.slice(0, LOG_MAX);
  }
  // zapíše řádky z paměti na disk; zápisy jdou za sebou
  function flush() {
    clearTimeout(timer);
    timer = null;
    if (!buf.length) return chain;
    const fresh = buf;
    buf = [];
    chain = chain.then(() => logTx((rows) => merge(rows, fresh))).catch(() => {});
    return chain;
  }
  // nový řádek; now = zapsat hned (vrátí Promise)
  function add(txt, now) {
    if (!self.indexedDB) return Promise.resolve();
    const at = Date.now(),
      text = String(txt).slice(0, 300);
    const last = buf[buf.length - 1];
    if (last && last.txt === text && at - last.at < LOG_SAME) {
      last.n++;
      last.at = at;
    } else {
      buf.push({ at, txt: text, n: 1 });
    }
    if (now) return flush();
    if (!timer) {
      timer = setTimeout(flush, LOG_DELAY);
    }
    return chain;
  }
  // všechny řádky, nejnovější první (nejdřív zapíše, co čeká v paměti)
  async function read() {
    await flush();
    try {
      return await logTx(() => null);
    } catch (e) {
      return [];
    }
  }
  async function clear() {
    buf = [];
    await flush();
    try {
      await logTx(() => []);
    } catch (e) {}
  }
  // krátký popis místa v kódu: "app.js:123"
  const where = (file, line) =>
    file ? String(file).split("/").pop().split("?")[0] + ":" + (line || "?") : "";
  // první řádek zásobníku s místem v souboru appky
  function stackAt(e) {
    const m = e && e.stack && String(e.stack).match(/([\w.-]+\.js)(?:\?[^:]*)?:(\d+)/);
    return m ? m[1] + ":" + m[2] : "";
  }

  self.ZAZNAM = { add, read, clear, flush, LOG_MAX };

  // chyby kódu; s capture i nenačtený skript nebo styl appky (obrázky ne, fotky offline by záznam zahltily)
  self.addEventListener(
    "error",
    (ev) => {
      const t = ev.target;
      if (t && t !== self && t.tagName) {
        if (t.tagName === "SCRIPT" || t.tagName === "LINK") {
          add("nenačteno: " + (t.src || t.href || t.tagName), true);
        }
        return;
      }
      const at = where(ev.filename, ev.lineno) || stackAt(ev.error);
      add("chyba: " + (ev.message || "neznámá") + (at ? " (" + at + ")" : ""), true);
    },
    true,
  );
  self.addEventListener("unhandledrejection", (ev) => {
    const r = ev.reason;
    const msg = r && r.message ? (r.name && r.name !== "Error" ? r.name + ": " : "") + r.message : String(r);
    const at = stackAt(r);
    add("chyba (Promise): " + msg + (at ? " (" + at + ")" : ""), true);
  });
  if (self.document) {
    // co zablokovala pravidla zabezpečení (CSP)
    document.addEventListener("securitypolicyviolation", (ev) => {
      const what = !ev.blockedURI || ev.blockedURI === "inline" ? "kód přímo v HTML" : ev.blockedURI;
      add("zabezpečení zablokovalo: " + ev.effectiveDirective + " " + what, true);
    });
    // před odchodem do pozadí zapsat, co čeká (appku pak může Android zavřít)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        flush();
      }
    });
    self.addEventListener("pagehide", () => flush());
  }
})();
