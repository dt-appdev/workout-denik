/* Test 10 (F4-15): hlavní vypínač návrhu progrese. Data ze zaloha-v2-plna.json.txt (návrh u všech cviků
   zapnutý, cvik c-moje-tlaky má vlastní rozsah 10–15). Vypnutí Navrhovat progresi v Nastavení → Trénink
   zešedne zbytek karty (inert) a v Upravit cvik volbu u cviku; vypnuté U všech cviků zešedne jen výchozí
   rozsah. Nastavení se uloží do zálohy (progOn) a nastavení cviku zůstane. */
const fs = require("fs");
const path = require("path");
const P = require("./pomocne.js");

// klepnutí na zaškrtávátko (přes click, horní lišta ho může překrývat)
const tick = (page, act) => page.$eval(`[data-act="${act}"]`, (el) => el.click());

// je políčko uvnitř zešedlé volby (.dep.off s atributem inert)?
const grey = (page, sel) =>
  page.$eval(sel, (el) => !!el.closest(".dep.off[inert]")).catch(() => "chybí " + sel);

module.exports = {
  name: "Vypínač návrhu progrese",
  async run({ browser, url, check }) {
    const text = fs.readFileSync(path.join(__dirname, "zaloha-v2-plna.json.txt"), "utf8");
    const app = await P.openApp(browser, url);
    const { page } = app;
    await P.importBackup(app, text, "replace");
    await app.goto();
    await P.openSettings(app, "train");

    check.eq(await grey(page, '[data-act="progAll"]'), false, "zapnuto: U všech cviků jde ovládat");
    check.eq(await grey(page, "#progMin"), false, "zapnuto: výchozí rozsah jde ovládat");

    // U všech cviků vypnuto: šedý jen rozsah
    await tick(page, "progAll");
    await app.settle();
    check.eq(await grey(page, "#progMin"), true, "U všech cviků vypnuto: rozsah šedý");
    check.eq(
      await grey(page, '[data-act="progSets"]'),
      false,
      "U všech cviků vypnuto: Přidat váhu jde ovládat",
    );
    await tick(page, "progAll");
    await app.settle();

    // hlavní vypínač vypnut: šedá celá karta kromě něj
    await tick(page, "progOn");
    await app.settle();
    check.eq(await grey(page, '[data-act="progOn"]'), false, "hlavní vypínač zůstává ovladatelný");
    check.eq(await grey(page, '[data-act="progAll"]'), true, "vypnuto: U všech cviků šedé");
    check.eq(await grey(page, '[data-act="progSets"]'), true, "vypnuto: Přidat váhu šedé");

    // Upravit cvik s vlastním rozsahem: volba šedá, hodnota zůstává
    await app.act("tab", "ex");
    await app.act("openEx", "c-moje-tlaky");
    await app.act("editExDetail", "c-moje-tlaky");
    await app.settle();
    check.eq(await grey(page, "#x-prog"), true, "Upravit cvik: volba návrhu šedá");
    check.eq(await page.$eval("#x-prog", (el) => el.value), "on", "Upravit cvik: vlastní rozsah zůstal");
    await app.act("exEdBack");
    await app.settle();

    const backup = await P.exportBackup(app);
    check.eq(backup.data.cfg.progOn, false, "vypnutý návrh v záloze");
    check.eq(backup.data.exercises["c-moje-tlaky"].prog, [10, 15], "rozsah u cviku v záloze zůstal");
    check.eq(app.errors, [], "chyby v appce");
    await app.close();
  },
};
