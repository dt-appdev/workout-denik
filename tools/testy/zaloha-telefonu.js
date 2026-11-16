/* Test (F6-03): záloha se zálohou telefonu v napodobené nativní appce.
   Falešný window.Capacitor s doplňkem Filesystem, který drží soubory v paměti (window.__files, klíč
   „adresář:cesta“); počáteční obsah dává window.__pbStart (napodobení souboru, který Android vrátil při
   instalaci appky na novém telefonu).
   (a) Prázdná appka soubor nezapíše; po uloženém tréninku a odchodu appky do pozadí vznikne
       DATA:zaloha-telefonu/zaloha.json se zálohou (tréninky, bez fotek), dočasný soubor nezůstane.
       Nastavení → Data a záloha ukazuje sekci Záloha telefonu s tlačítkem Obnovit ze zálohy telefonu.
   (b) „Nový telefon“: prázdná appka se souborem z (a) po startu sama nabídne obnovu; před obnovou soubor
       nepřepíše ani při odchodu do pozadí; Nahradit vše vrátí trénink.
   (c) Webová appka (bez Capacitoru) sekci Záloha telefonu nemá. Skutečnou zálohu Androidu test nevidí. */
const P = require("./pomocne.js");

const PB = "DATA:zaloha-telefonu/zaloha.json";

// falešný Capacitor s Filesystem v paměti (běží před appkou)
function fakeCapacitor() {
  window.__files = Object.assign({}, window.__pbStart || {});
  const key = (o) => o.directory + ":" + o.path;
  const missing = () => Promise.reject(new Error("File does not exist"));
  const ok = (v) => Promise.resolve(v || {});
  const plugins = {
    Filesystem: {
      writeFile: (o) => {
        window.__files[key(o)] = o.data;
        return ok({ uri: "file:///x/" + o.path });
      },
      readFile: (o) => (key(o) in window.__files ? ok({ data: window.__files[key(o)] }) : missing()),
      deleteFile: (o) => {
        if (!(key(o) in window.__files)) return missing();
        delete window.__files[key(o)];
        return ok();
      },
      rename: (o) => {
        const from = o.directory + ":" + o.from;
        if (!(from in window.__files)) return missing();
        window.__files[o.toDirectory + ":" + o.to] = window.__files[from];
        delete window.__files[from];
        return ok();
      },
      stat: (o) =>
        key(o) in window.__files ? ok({ mtime: Date.now(), size: window.__files[key(o)].length }) : missing(),
    },
    Share: { share: () => ok() },
    SystemBars: { setStyle: () => ok() },
    LocalNotifications: {
      createChannel: () => ok(),
      schedule: () => ok(),
      cancel: () => ok(),
      removeAllDeliveredNotifications: () => ok(),
      checkPermissions: () => ok({ display: "granted" }),
      requestPermissions: () => ok({ display: "granted" }),
      checkExactNotificationSetting: () => ok({ exact_alarm: "granted" }),
      changeExactNotificationSetting: () => ok({ exact_alarm: "granted" }),
    },
    App: {
      minimizeApp: () => ok(),
      addListener: () => ok({ remove() {} }),
    },
  };
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: plugins,
    registerPlugin: (name) => plugins[name],
  };
}

// odchod appky do pozadí (visibilitychange se skrytou stránkou), pak zase zpátky
async function toBackground(app) {
  await app.page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
  });
  await app.settle(600);
}

const files = (app) => app.page.evaluate(() => Object.assign({}, window.__files));

module.exports = {
  name: "Záloha telefonu",
  async run({ browser, url, check }) {
    // (a) zápis po uloženém tréninku
    const app = await P.openApp(browser, url, { init: fakeCapacitor });
    await toBackground(app);
    check.eq(Object.keys(await files(app)), [], "prázdná appka zapsala soubor");
    await P.recordWorkout(app, "bench-press-barbell", 8, 4);
    await toBackground(app);
    const written = await files(app);
    check.eq(Object.keys(written), [PB], "soubory po uloženém tréninku");
    let backup = null;
    try {
      backup = JSON.parse(written[PB]);
    } catch (e) {
      check.ok(false, "soubor zálohy není JSON");
    }
    check.ok(backup && backup.app === "workout-denik", "soubor není záloha appky");
    check.eq(backup && P.countWorkouts(backup), 1, "tréninky v souboru");
    check.eq(backup && backup.includes, { photos: false }, "soubor obsahuje fotky");
    await P.openSettings(app, "data");
    check.ok(await app.page.$('#app [data-act="pbRestore"]'), "Nastavení: chybí Obnovit ze zálohy telefonu");
    check.ok(await app.page.$('#app [data-act="help"][data-v="phonebk"]'), "Nastavení: chybí nápověda");
    check.eq(app.errors, [], "(a) chyby stránky");
    await app.close();

    // (b) nový telefon: prázdná appka se souborem nabídne obnovu
    const fresh = await P.openApp(browser, url, {
      init: `window.__pbStart = ${JSON.stringify({ [PB]: written[PB] })};(${fakeCapacitor})();`,
    });
    const offered = await fresh.page
      .waitForSelector('.sheet [data-act="importGo"]', { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    check.ok(offered, "prázdná appka nenabídla obnovu ze zálohy telefonu");
    await toBackground(fresh);
    check.eq((await files(fresh))[PB], written[PB], "prázdná appka přepsala soubor zálohy");
    if (offered) {
      await fresh.act("importGo", "replace");
      await fresh.settle(300);
      await fresh.act("importOk", "replace");
      await fresh.settle(1500);
    }
    const restored = await fresh.page.evaluate(() => document.getElementById("toastRoot").innerText);
    check.ok(/Data nahrazena/.test(restored), "obnova neskončila hláškou: " + restored);
    // Stáhnout zálohu: v nativní appce jde přes Filesystem do Download
    await P.openSettings(fresh, "data");
    await fresh.act("export");
    await fresh.settle(800);
    const down = Object.entries(await files(fresh)).find(([k]) => k.startsWith("EXTERNAL_STORAGE:"));
    check.eq(down && P.countWorkouts(JSON.parse(down[1])), 1, "tréninky po obnově");
    check.eq(fresh.errors, [], "(b) chyby stránky");
    await fresh.close();

    // (c) webová appka sekci nemá
    const web = await P.openApp(browser, url);
    await P.openSettings(web, "data");
    check.ok(!(await web.page.$('#app [data-act="help"][data-v="phonebk"]')), "web: ukazuje Zálohu telefonu");
    check.eq(web.errors, [], "(c) chyby stránky");
    await web.close();
  },
};
