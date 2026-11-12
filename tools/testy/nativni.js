/* Test 20 (F6-01): nativní appka a přesun dat do ní.
   Webová appka: Nastavení → Data a záloha → Přesunout data do nativní appky (natMove, natMoveOk) stáhne zálohu
   a zapne pruh .movedbar na všech obrazovkách, Zrušit přesun (natBack) ho vypne.
   Nativní appka: napodobená falešným window.Capacitor (doplňky Filesystem, Share, SystemBars zapisují volání
   do window.__nat). Kontroluje, že js/nativni.js nastaví window.NATIVNI, appka nezaregistruje service worker,
   Stáhnout zálohu zapíše soubor do Download přes Filesystem, Sdílet předá soubor z cache doplňku Share a zavření
   nabídky Sdílet (Share canceled) appka bere jako AbortError (záloha se nepočítá). Zpět (F0-20): doplněk App
   s posluchačem backButton, window.__natBack() = stisk systémového Zpět: panel zavře, podstránka Nastavení →
   rozcestník → Trénink, tam hláška a podruhé App.minimizeApp; dotyk po hlášce pojistku obnoví; historie
   prohlížeče se nepoužívá. Konec pauzy (F6-02): doplněk LocalNotifications, window.__natPerm = stav povolení
   (display, exact_alarm). Odškrtnutí série naplánuje oznámení id 1 na konec pauzy do kanálu podle volby
   Na konci pauzy, +15 ho přeplánuje, Přeskočit zruší; bez povolení přesného času se plánuje nepřesně
   a Nastavení nabízí Povolit (exactAsk); Vyzkoušet naplánuje oznámení id 2. Panel Přesný čas oznámení
   (sheetExact) se bez povolení přesného času ukáže při zapnutí Oznámení na pozadí a jednou při první pauze.
   Záznam událostí (F0-21): window.__natFail = název volání, které selže; selhání se zapíše do záznamu, zavření
   nabídky Sdílet ne. Skutečné APK test nevidí, to se zkouší ručně v telefonu. */
const P = require("./pomocne.js");

// falešný Capacitor (běží před appkou); window.__nat = záznam volání doplňků, __natCancel = zavřít Sdílet
function fakeCapacitor() {
  window.__nat = [];
  window.__natCancel = false;
  window.__natPerm = { display: "granted", exact_alarm: "granted" };
  const rec = (name) => (args) => {
    window.__nat.push({ name, args });
    if (name === "Share.share" && window.__natCancel) return Promise.reject(new Error("Share canceled"));
    if (name === window.__natFail) return Promise.reject(new Error("zkouska selhani"));
    if (name === "Filesystem.writeFile") return Promise.resolve({ uri: "file:///x/" + args.path });
    return Promise.resolve({});
  };
  const plugins = {
    Filesystem: { writeFile: rec("Filesystem.writeFile") },
    Share: { share: rec("Share.share") },
    SystemBars: { setStyle: rec("SystemBars.setStyle") },
    LocalNotifications: {
      createChannel: rec("Notif.createChannel"),
      schedule: rec("Notif.schedule"),
      cancel: rec("Notif.cancel"),
      removeAllDeliveredNotifications: rec("Notif.clear"),
      checkPermissions: () => Promise.resolve({ display: window.__natPerm.display }),
      requestPermissions: () => Promise.resolve({ display: window.__natPerm.display }),
      checkExactNotificationSetting: () => Promise.resolve({ exact_alarm: window.__natPerm.exact_alarm }),
      changeExactNotificationSetting: () => {
        window.__natPerm.exact_alarm = "granted";
        return Promise.resolve({ exact_alarm: "granted" });
      },
    },
    App: {
      minimizeApp: rec("App.minimizeApp"),
      addListener: (event, fn) => {
        if (event === "backButton") window.__natBack = () => fn({ canGoBack: false });
        return Promise.resolve({ remove() {} });
      },
    },
  };
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: plugins,
    registerPlugin: (name) => plugins[name],
  };
}

async function webMove(browser, url, check) {
  const app = await P.openApp(browser, url);
  const { page } = app;
  check.ok(!(await page.$(".movedbar")), "web: pruh přesunu je vidět bez přesunu");
  await P.openSettings(app, "data");
  check.ok(await page.$('#app [data-act="natMove"]'), "web: chybí Přesunout data do nativní appky");
  await app.act("natMove");
  await app.settle(300);
  const download = page.waitForEvent("download", { timeout: 10000 });
  await page.click('.sheet [data-act="natMoveOk"]');
  const file = await download;
  check.ok(
    /\.json\.txt$/.test(file.suggestedFilename()),
    "web: přesun nestáhl zálohu " + file.suggestedFilename(),
  );
  await app.settle();
  await page.click(".sheet [data-act=closeSheet]").catch(() => {}); // okno s návodem po stažení
  await app.act("tab", "train");
  await app.settle();
  check.ok(await page.$("#app .movedbar"), "web: po přesunu chybí pruh na obrazovce Trénink");
  await P.openSettings(app, "data");
  check.ok(await page.$('#app [data-act="natBack"]'), "web: po přesunu chybí Zrušit přesun");
  await app.act("natBack");
  await app.settle();
  check.ok(!(await page.$("#app .movedbar")), "web: pruh zůstal po Zrušit přesun");
  check.eq(app.errors, [], "web: chyby stránky");
  await app.close();
}

// systémové Zpět v nativní appce (F0-20): kroky zpět, hláška a schování appky
async function nativeBackTest(app, check) {
  const { page } = app;
  const back = async () => {
    await page.evaluate(() => window.__natBack());
    await app.settle(300);
  };
  // dotyk do appky bez klepnutí na konkrétní prvek
  const touch = () =>
    page.evaluate(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
  const minimized = () =>
    page.evaluate(() => window.__nat.filter((c) => c.name === "App.minimizeApp").length);
  check.ok(
    await page.evaluate(() => typeof window.__natBack === "function"),
    "zpět: chybí posluchač backButton",
  );
  const histLen = await page.evaluate(() => history.length);

  // podstránka Nastavení s otevřeným panelem: panel → rozcestník → Trénink
  await P.openSettings(app, "data");
  await app.act("export");
  await app.settle(800);
  check.ok(await page.$(".sheet"), "zpět: po Stáhnout není otevřený panel");
  await back();
  check.ok(!(await page.$(".sheet")), "zpět: první Zpět nezavřel panel");
  check.ok(await page.$('#app [data-act="export"]'), "zpět: zavření panelu opustilo stránku Data a záloha");
  await back();
  check.ok(!(await page.$('#app [data-act="export"]')), "zpět: druhé Zpět nevrátilo na rozcestník Nastavení");
  await back();
  check.ok(!(await page.$(".toast.exit")), "zpět: hláška o zavření už při návratu na Trénink");

  // úvodní obrazovka Tréninku: hláška, dotyk pojistku obnoví, dvakrát po sobě appku schová
  await back();
  check.ok(await page.$(".toast.exit"), "zpět: na úvodní obrazovce chybí hláška");
  check.eq(await minimized(), 0, "zpět: appka se schovala už prvním Zpět");
  await touch();
  await app.settle(200);
  check.ok(!(await page.$(".toast.exit")), "zpět: dotyk hlášku neschoval");
  await back();
  check.eq(await minimized(), 0, "zpět: po dotyku se appka schovala bez nové hlášky");
  await back();
  check.eq(await minimized(), 1, "zpět: druhé Zpět appku neschovalo");
  check.ok(!(await page.$(".toast.exit")), "zpět: hláška zůstala po schování");
  await back();
  check.eq(await minimized(), 1, "zpět: po návratu do appky chybí znovu hláška");
  check.eq(
    await page.evaluate(() => history.length),
    histLen,
    "zpět: nativní appka přidala záznamy historie",
  );
  await touch();
  await app.settle(200);
}

// konec pauzy v nativní appce (F6-02): plánování oznámení přes doplněk LocalNotifications
async function nativeRestTest(app, check) {
  const { page } = app;
  // volání doplňku od posledního vyprázdnění: [název, id, čas v ms, kanál, přesně]
  const calls = async () => {
    const list = await page.evaluate(() =>
      window.__nat
        .filter((c) => c.name === "Notif.schedule" || c.name === "Notif.cancel")
        .map((c) => {
          const n = c.args.notifications[0];
          const at = n.schedule ? new Date(n.schedule.at).getTime() : 0;
          return [c.name, n.id, at, n.channelId || "", n.isExactNotification];
        }),
    );
    await page.evaluate(() => (window.__nat.length = 0));
    return list;
  };

  // Nastavení: oznámení povolená, přesný čas ne → nabídka Povolit, po povolení zmizí
  await page.evaluate(() => {
    window.__natPerm.exact_alarm = "denied";
    return window.NATIVNI.notif.refresh();
  });
  await P.openSettings(app, "train");
  check.ok(!(await page.$('#app [data-act="restNotify"][disabled]')), "pauza: vypínač oznámení je zešedlý");
  check.ok(await page.$('#app [data-act="exactAsk"]'), "pauza: chybí Povolit přesný čas");
  await calls();
  await app.act("notifTest");
  await app.settle(300);
  const test = await calls();
  check.eq(
    test.map((c) => [c[0], c[1], c[4]]),
    [
      ["Notif.cancel", 2, undefined],
      ["Notif.schedule", 2, false],
    ],
    "pauza: Vyzkoušet bez přesného času",
  );

  // trénink: ✓ první série spustí pauzu a naplánuje oznámení na její konec
  await app.act("tab", "train");
  await app.act("startEmpty");
  await app.settle();
  await app.act("addEx");
  await app.act("pickToggle", "bench-press-barbell");
  await app.act("pickDone");
  await app.settle();
  // druhá série, aby ✓ první nebyla poslední sérií tréninku (po té se pauza nespouští)
  await page.click('#app [data-act="addSet"][data-i="0"]');
  await app.settle();
  await calls();
  await page.click('#app [data-act="done"][data-i="0"][data-j="0"]');
  await app.settle();
  if (await page.$(".sheet .kk-b")) {
    await page.click('.sheet .kk-b[data-kf="reps"][data-kk="1"]');
    await page.click('.sheet [data-act="kkDone"]');
    await app.settle();
  }
  // první pauza bez přesného času: jednou panel, Povolit otevře nastavení Androidu a oznámení přeplánuje přesně
  check.ok(await page.$('.sheet [data-act="exactAsk"]'), "pauza: první pauza nenabídla přesný čas");
  await page.click('.sheet [data-act="exactAsk"]');
  await app.settle(300);
  check.ok(!(await page.$(".sheet")), "pauza: panel přesného času zůstal po Povolit");
  const end = () => page.evaluate(() => JSON.parse(localStorage.getItem("zd1:rest") || "null"));
  const rest = await end();
  check.ok(rest && rest.end > Date.now(), "pauza: po ✓ neběží pauza");
  const started = await calls();
  check.eq(
    started.slice(-2),
    [
      ["Notif.cancel", 1, 0, "", undefined],
      ["Notif.schedule", 1, rest && rest.end, "pauza-zvuk-vibrace", true],
    ],
    "pauza: naplánované oznámení",
  );

  // +15 přeplánuje na nový konec, Přeskočit zruší
  await page.click('#rest [data-act="restAdj"][data-v="15"]');
  await app.settle(300);
  const moved = await calls();
  check.eq(
    moved.slice(-1).map((c) => [c[0], c[1], c[2] - rest.end]),
    [["Notif.schedule", 1, 15000]],
    "pauza: +15 oznámení nepřeplánovalo",
  );
  await page.click('#rest [data-act="restSkip"]');
  await app.settle(300);
  check.eq(
    (await calls()).map((c) => [c[0], c[1]]),
    [["Notif.cancel", 1]],
    "pauza: Přeskočit oznámení nezrušilo",
  );

  // další pauza už panel nenabízí (jen jednou), ani když přesný čas zase chybí
  await page.evaluate(() => {
    window.__natPerm.exact_alarm = "denied";
    return window.NATIVNI.notif.refresh();
  });
  // zrušit ✓ a odškrtnout znovu (klepnutí skriptem, tlačítko může být pod spodní lištou)
  const tick = () => page.$eval('#app [data-act="done"][data-i="0"][data-j="0"]', (el) => el.click());
  await tick();
  await app.settle(400);
  await tick();
  await app.settle(400);
  check.ok((await end()) !== null, "pauza: druhá pauza se nespustila");
  check.ok(!(await page.$('.sheet [data-act="exactAsk"]')), "pauza: panel přesného času podruhé");
  await page.click('#rest [data-act="restSkip"]').catch(() => {});
  await P.openSettings(app, "train");
  // vypnutí a zapnutí Oznámení na pozadí bez přesného času nabídne panel, Teď ne ho jen zavře
  await page.$eval('#app [data-act="restNotify"]', (el) => el.click());
  await app.settle(200);
  check.ok(!(await page.$(".sheet")), "pauza: panel přesného času při vypnutí oznámení");
  await page.$eval('#app [data-act="restNotify"]', (el) => el.click());
  await app.settle(300);
  check.ok(await page.$('.sheet [data-act="exactAsk"]'), "pauza: zapnutí oznámení nenabídlo přesný čas");
  await page.click('.sheet [data-act="closeSheet"]');
  await app.settle(200);
  check.ok(await page.$('#app [data-act="exactAsk"]'), "pauza: po Teď ne zmizel záložní řádek");
  await app.act("exactAsk");
  await app.settle(300);
  check.ok(!(await page.$('#app [data-act="exactAsk"]')), "pauza: Povolit zůstalo po povolení přesného času");
  check.ok(await page.$('#app [data-act="notifTest"]'), "pauza: chybí Vyzkoušet");
}

async function native(browser, url, check) {
  const app = await P.openApp(browser, url, { init: fakeCapacitor });
  const { page } = app;
  check.ok(await page.evaluate(() => !!window.NATIVNI), "nativní: chybí window.NATIVNI");
  await P.wait(500);
  check.eq(
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
    0,
    "nativní: zaregistroval se service worker",
  );
  check.ok(
    await page.evaluate(() => window.__nat.some((c) => c.name === "SystemBars.setStyle")),
    "nativní: barva stavového řádku se nenastavila",
  );
  // kanály oznámení o konci pauzy (F6-02) vznikají hned při startu
  check.eq(
    await page.evaluate(() =>
      window.__nat
        .filter((c) => c.name === "Notif.createChannel")
        .map((c) => c.args.id + (c.args.vibration ? "+v" : "") + (c.args.sound ? "+" + c.args.sound : "")),
    ),
    ["pauza-zvuk-vibrace+v", "pauza-zvuk", "pauza-vibrace+v+ticho.wav"],
    "pauza: kanály oznámení",
  );

  // Data a záloha: bez přesunu do nativní appky, Stáhnout přes Filesystem do Download
  await P.openSettings(app, "data");
  check.ok(!(await page.$('#app [data-act="natMove"]')), "nativní: nabízí přesun do nativní appky");
  await app.act("export");
  await app.settle(800);
  const saved = await page.evaluate(() => window.__nat.filter((c) => c.name === "Filesystem.writeFile"));
  check.eq(
    saved.map((c) => [c.args.directory, c.args.path.replace(/\d{4}-\d\d-\d\d/, "D"), c.args.encoding]),
    [["EXTERNAL_STORAGE", "Download/workout-denik-D.json.txt", "utf8"]],
    "nativní: Stáhnout",
  );
  check.ok(saved[0] && /"app": "workout-denik"/.test(saved[0].args.data), "nativní: obsah stažené zálohy");
  await page.click(".sheet [data-act=closeSheet]").catch(() => {});

  // Sdílet: soubor do cache, pak nabídka Share se souborem
  await page.evaluate(() => (window.__nat.length = 0));
  await app.act("bkShare");
  await app.settle(800);
  const shared = await page.evaluate(() =>
    window.__nat.map((c) => [c.name, c.args.directory || c.args.files]),
  );
  check.eq(
    shared.map(([n, a]) => [n, JSON.stringify(a).replace(/\d{4}-\d\d-\d\d/, "D")]),
    [
      ["Filesystem.writeFile", '"CACHE"'],
      ["Share.share", '["file:///x/sdileni/workout-denik-D.json.txt"]'],
    ],
    "nativní: Sdílet",
  );

  // zavření nabídky Sdílet = AbortError, appka neukáže chybu
  const err = await page.evaluate(async () => {
    window.__natCancel = true;
    try {
      await navigator.share({ files: [new File(["x"], "a.txt", { type: "text/plain" })] });
      return "bez chyby";
    } catch (e) {
      return e.name;
    }
  });
  check.eq(err, "AbortError", "nativní: zavření nabídky Sdílet");

  await nativeBackTest(app, check);
  await nativeRestTest(app, check);

  // verze appky: bez Zkontrolovat aktualizaci (nativní appka se aktualizuje novým APK)
  await P.openSettings(app, "about");
  check.ok(!(await page.$('#app [data-act="updCheck"]')), "nativní: nabízí Zkontrolovat aktualizaci");
  // záznam událostí (F0-21): selhání doplňku se zapíše, zavření nabídky Sdílet ne
  const failRows = await page.evaluate(async () => {
    window.__natFail = "Notif.schedule";
    await window.NATIVNI.notif.schedule({
      id: 9,
      at: Date.now() + 60000,
      title: "x",
      body: "",
      mode: "both",
    });
    window.__natFail = "";
    return (await window.ZAZNAM.read()).map((r) => r.txt);
  });
  check.ok(
    failRows.includes("Android: naplánování oznámení selhalo (zkouska selhani)"),
    "nativní: selhání doplňku není v záznamu událostí",
  );
  check.ok(
    !failRows.some((t) => t.startsWith("Android: sdílení")),
    "nativní: zavření nabídky Sdílet je v záznamu jako chyba",
  );
  check.eq(app.errors, [], "nativní: chyby stránky");
  await app.close();
}

module.exports = {
  name: "nativni",
  async run({ browser, url, check }) {
    await webMove(browser, url, check);
    await native(browser, url, check);
  },
};
