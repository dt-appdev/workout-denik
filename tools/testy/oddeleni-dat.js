/* Test 8 (F0-18): testovací verze PR nezmění data vydané verze. Obě běží na stejné doméně (jako na GitHub
   Pages …/workout-denik/ a …/workout-denik-test/pr-N/), tady kořen serveru a /pr-99/ v jednom profilu prohlížeče.
   (a) Vydaná verze dostane plnou zálohu (zaloha-v2-plna.json.txt, i s fotkou) a vlastní trénink. Otisk jejích
       dat (IndexedDB workout-denik: docs, points, photos; localStorage zd1:) se uloží.
   (b) Testovací verze: trénink, měření, obnova zálohy (Nahradit vše), Zkopírovat data z vydané verze, další
       trénink a záloha. Musí proběhnout bez chyby a bez zabrané pojistky; kopie musí mít trénink z vydané verze.
   (c) Pojistka: přímý zápis do localStorage zd1:, smazání databáze a zápisová transakce v databázi vydané verze
       se v testovací verzi odmítnou a ukáže se červený pruh .guard-stop.
   (d) Otisk dat vydané verze je pořád stejný. */
const fs = require("fs");
const path = require("path");
const P = require("./pomocne.js");

// otisk dat vydané verze: obsah IndexedDB (fotky jako typ a velikost) a klíče localStorage s prefixem zd1:
// (čte se z testovací verze: čtení pojistka dovolí; jiná stránka na doméně by přes service worker spustila appku)
async function mainData(app) {
  return app.page.evaluate(async () => {
    const out = { ls: {}, idb: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("zd1:")) {
        out.ls[key] = localStorage.getItem(key);
      }
    }
    const db = await new Promise((done, fail) => {
      const rq = indexedDB.open("workout-denik");
      rq.onsuccess = () => done(rq.result);
      rq.onerror = () => fail(rq.error);
    });
    for (const store of Array.from(db.objectStoreNames)) {
      out.idb[store] = await new Promise((done) => {
        const items = {};
        const cursor = db.transaction(store, "readonly").objectStore(store).openCursor();
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (!c) {
            done(items);
            return;
          }
          const value = c.value;
          items[c.key] = JSON.stringify(value, (k, v) =>
            v instanceof Blob ? `[blob ${v.type} ${v.size}]` : v,
          );
          c.continue();
        };
      });
    }
    db.close();
    return out;
  });
}

module.exports = {
  name: "Oddělení dat testovací verze",
  async run({ browser, url, check }) {
    const text = fs.readFileSync(path.join(__dirname, "zaloha-v2-plna.json.txt"), "utf8");
    const prUrl = url + "pr-99/";

    // (a) data vydané verze
    const app = await P.openApp(browser, url);
    const { page } = app;
    const toast = await P.importBackup(app, text, "replace");
    check.ok(toast && /Data nahrazena/.test(toast), "obnova zálohy ve vydané verzi: " + toast);
    await P.recordWorkout(app, "pull-up", 5, 0);
    check.eq(app.errors, [], "chyby ve vydané verzi");
    app.errors.length = 0;

    // (b) běžné používání testovací verze; otisk dat vydané verze hned po otevření (vydaná už neběží)
    await app.goto(prUrl);
    const before = await mainData(app);
    check.ok(Object.keys(before.idb.docs || {}).length > 3, "vydaná verze má data v IndexedDB");
    check.ok(Object.keys(before.idb.photos || {}).length > 0, "vydaná verze má fotku");
    check.ok(Object.keys(before.ls).length > 0, "vydaná verze má klíče zd1: v localStorage");
    await P.recordWorkout(app, "pull-up", 8, 0);
    await P.addMeasurement(app, "2026-10-10", "81,5");
    await P.importBackup(app, text, "replace");
    await P.openSettings(app, "about");
    const copyBtn = await page.$('#app [data-act="copyMain"]');
    check.ok(
      copyBtn,
      "na /pr-99/ běží testovací verze (Nastavení → O aplikaci: Zkopírovat data z vydané verze)",
    );
    // po kopii se appka sama znovu načte
    await Promise.all([page.waitForEvent("load", { timeout: 15000 }), app.act("copyMainOk")]);
    await app.settle(1500);
    const copied = await P.exportBackup(app);
    check.eq(
      P.countWorkouts(copied.data),
      P.countWorkouts(JSON.parse(text)) + 1,
      "kopie má tréninky vydané verze",
    );
    await P.recordWorkout(app, "pull-up", 9, 0);
    await P.exportBackup(app);
    check.ok(!(await page.$(".guard-stop")), "pojistka při běžném používání nezabrala");
    check.eq(app.errors, [], "chyby v testovací verzi");

    // (c) pojistka: přímé zápisy do dat vydané verze se odmítnou
    const refused = await page.evaluate(async () => {
      const tries = {};
      try {
        localStorage.setItem("zd1:pokus", "1");
        tries.setItem = false;
      } catch (e) {
        tries.setItem = true;
      }
      try {
        localStorage.removeItem("zd1:cache");
        tries.removeItem = false;
      } catch (e) {
        tries.removeItem = true;
      }
      try {
        localStorage.clear();
        tries.clear = false;
      } catch (e) {
        tries.clear = true;
      }
      try {
        indexedDB.deleteDatabase("workout-denik");
        tries.deleteDatabase = false;
      } catch (e) {
        tries.deleteDatabase = true;
      }
      const db = await new Promise((done) => {
        const rq = indexedDB.open("workout-denik");
        rq.onsuccess = () => done(rq.result);
      });
      try {
        db.transaction("docs", "readwrite").objectStore("docs").put({}, "config/main");
        tries.readwrite = false;
      } catch (e) {
        tries.readwrite = true;
      }
      db.close();
      return tries;
    });
    check.eq(
      refused,
      { setItem: true, removeItem: true, clear: true, deleteDatabase: true, readwrite: true },
      "pojistka odmítla zápisy do dat vydané verze",
    );
    check.ok(await page.$(".guard-stop"), "zabraná pojistka ukázala červený pruh");

    // (d) data vydané verze beze změny
    const after = await mainData(app);
    check.eq(Object.keys(after.ls).sort(), Object.keys(before.ls).sort(), "klíče zd1: vydané verze");
    for (const key of Object.keys(before.ls)) {
      check.ok(after.ls[key] === before.ls[key], "beze změny localStorage " + key);
    }
    check.eq(Object.keys(after.idb).sort(), Object.keys(before.idb).sort(), "úložiště databáze vydané verze");
    for (const store of Object.keys(before.idb)) {
      check.eq(after.idb[store], before.idb[store], "beze změny IndexedDB workout-denik / " + store);
    }
    await app.close();
  },
};
