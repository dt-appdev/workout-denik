/* Test (F4-20): naplánovat trénink i na den s měřením. Dnešek s měřením otevře výběr dne s položkou
   Naplánovat trénink, ta otevře panel Naplánovat se šipkou ← zpět do výběru, výběr šablony plán uloží.
   Den s plánem už položku nemá, minulý den s měřením otevře měření rovnou jako dřív. */
const fs = require("fs");
const path = require("path");
const P = require("./pomocne.js");

// datum pro políčko měření (RRRR-MM-DD) a klíč dne appky (dayKey: bez nul na začátku)
const pad = (n) => String(n).padStart(2, "0");
const isoDay = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const appDay = (d) => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

module.exports = {
  name: "Naplánovat den s měřením",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page } = app;
    const has = (sel) => page.$(".sheet " + sel).then((el) => !!el);
    const full = fs.readFileSync(path.join(__dirname, "zaloha-v2-plna.json.txt"), "utf8");
    await P.importBackup(app, full, "replace");

    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const k = appDay(today);
    await P.addMeasurement(app, isoDay(today), "80");
    await P.addMeasurement(app, isoDay(yesterday), "81");
    await app.act("tab", "hist");
    await app.settle();

    // dnešek s měřením: výběr s měřením a Naplánovat trénink
    await app.act("calDay", k);
    await app.settle();
    check.ok(await has('[data-act="calBody"]'), "výběr dne nemá měření");
    check.ok(await has('[data-act="calPlanNew"]'), "výběr dne nemá Naplánovat trénink");

    // Naplánovat → panel se šablonami, ← zpět do výběru
    await page.click('.sheet [data-act="calPlanNew"]');
    await app.settle();
    check.ok(await has('[data-act="planPick"]'), "panel Naplánovat se neotevřel");
    check.ok(await has('[data-act="sheetBack"]'), "panel Naplánovat nemá šipku ←");
    await page.click('.sheet [data-act="sheetBack"]');
    await app.settle();
    check.ok(await has('[data-act="calPlanNew"]'), "← nevrátila do výběru dne");

    // výběr šablony plán uloží, pak už den nabízí plán, ne Naplánovat
    await page.click('.sheet [data-act="calPlanNew"]');
    await app.settle();
    await page.click('.sheet [data-act="planPick"][data-v="t-push"]');
    await app.settle(500);
    const plan = (await P.exportBackup(app)).data.plan || {};
    check.eq(plan[k] && plan[k].tplId, "t-push", "plán na dnešek se neuložil");
    await app.act("tab", "hist");
    await app.act("calDay", k);
    await app.settle();
    check.ok(await has('[data-act="calPlan"]'), "výběr dne nemá naplánovaný trénink");
    check.ok(!(await has('[data-act="calPlanNew"]')), "den s plánem nabízí Naplánovat");
    await app.act("closeSheet");

    // minulý den s měřením: měření rovnou, bez výběru
    await app.act("calDay", appDay(yesterday));
    await app.settle();
    check.ok(await has(".sheet-h"), "měření minulého dne se neotevřelo");
    check.ok(!(await has('[data-act="calBody"]')), "minulý den otevřel výběr místo měření");
    check.ok(!(await has('[data-act="calPlanNew"]')), "minulý den nabízí Naplánovat");

    check.eq(app.errors, [], "chyby v appce");
    await app.close();
  },
};
