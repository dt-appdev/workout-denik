/* Test 20 (F6-01): nativní appka a přesun dat do ní.
   Webová appka: Nastavení → Data a záloha → Přesunout data do nativní appky (natMove, natMoveOk) stáhne zálohu
   a zapne pruh .movedbar na všech obrazovkách, Zrušit přesun (natBack) ho vypne.
   Nativní appka: napodobená falešným window.Capacitor (doplňky Filesystem, Share, SystemBars zapisují volání
   do window.__nat). Kontroluje, že js/nativni.js nastaví window.NATIVNI, appka nezaregistruje service worker,
   Stáhnout zálohu zapíše soubor do Download přes Filesystem, Sdílet předá soubor z cache doplňku Share a zavření
   nabídky Sdílet (Share canceled) appka bere jako AbortError (záloha se nepočítá). Skutečné APK test nevidí,
   to se zkouší ručně v telefonu. */
const P = require("./pomocne.js");

// falešný Capacitor (běží před appkou); window.__nat = záznam volání doplňků, __natCancel = zavřít Sdílet
function fakeCapacitor() {
  window.__nat = [];
  window.__natCancel = false;
  const rec = (name) => (args) => {
    window.__nat.push({ name, args });
    if (name === "Share.share" && window.__natCancel) return Promise.reject(new Error("Share canceled"));
    if (name === "Filesystem.writeFile") return Promise.resolve({ uri: "file:///x/" + args.path });
    return Promise.resolve({});
  };
  const plugins = {
    Filesystem: { writeFile: rec("Filesystem.writeFile") },
    Share: { share: rec("Share.share") },
    SystemBars: { setStyle: rec("SystemBars.setStyle") },
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
  check.ok(/\.json\.txt$/.test(file.suggestedFilename()), "web: přesun nestáhl zálohu " + file.suggestedFilename());
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
  const shared = await page.evaluate(() => window.__nat.map((c) => [c.name, c.args.directory || c.args.files]));
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

  // verze appky: bez Zkontrolovat aktualizaci (nativní appka se aktualizuje novým APK)
  await P.openSettings(app, "about");
  check.ok(!(await page.$('#app [data-act="updCheck"]')), "nativní: nabízí Zkontrolovat aktualizaci");
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
