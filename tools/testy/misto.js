/* Test (F0-19): místo v rychlé schránce (localStorage) a rozdělaný trénink.
   (a) Sekce Místo v zařízení se běžně neukazuje (žádná testovací verze, schránka skoro prázdná).
   (b) Novější kopie rozdělaného tréninku vyhrává: do zd1:active se vrátí starší kopie (jako po selhaném zápisu
       do plné schránky) a po restartu appka načte novější kopii z databáze.
   (c) Plná schránka: cizí klíč ji zaplní, další změna tréninku se do schránky nevejde, ukáže se hláška a sekce
       Místo v zařízení s varováním. Po restartu je trénink pořád ten novější (z databáze).
   (d) Zahozený trénink se po restartu nevrátí, ani když se appka zavře hned (databáze se zapisuje okamžitě).
   (e) Data testovací verze (/pr-77/): řádek se Smazat je v Data a záloha, ne v O aplikaci, a smazání funguje. */
const P = require("./pomocne.js");

// počet cviků v rozdělaném tréninku podle kopie ve schránce
const lsExCount = (page) =>
  page.evaluate(() => {
    const a = JSON.parse(localStorage.getItem("zd1:active") || "null");
    return a ? a.ex.length : 0;
  });

// přidá do rozdělaného tréninku cvik
async function addEx(app, id) {
  await app.act("addEx");
  await app.act("pickToggle", id);
  await app.act("pickDone");
  await app.settle();
}

// zaplní schránku cizím klíčem až po okraj (vrací počet znaků výplně)
const fillStorage = (page) =>
  page.evaluate(() => {
    let text = "";
    for (let step = 1 << 22; step >= 1; step >>= 1) {
      const chunk = "x".repeat(step);
      try {
        localStorage.setItem("jina-appka:vypln", text + chunk);
        text += chunk;
      } catch (e) {}
    }
    return text.length;
  });

module.exports = {
  name: "Místo v zařízení",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page } = app;

    // (a)
    await P.openSettings(app, "data");
    await app.settle(600);
    check.ok(!(await page.$("#app .lsbar")), "(a) bez testovacích verzí a plné schránky sekce není");

    // (b)
    await app.act("tab", "train");
    await app.act("startEmpty");
    await app.settle();
    await addEx(app, "bench-press-barbell");
    const older = await page.evaluate(() => localStorage.getItem("zd1:active"));
    await addEx(app, "leg-press-machine");
    await app.settle(3000); // databáze se zapisuje se zpožděním 2,5 s
    await page.evaluate((text) => localStorage.setItem("zd1:active", text), older);
    await app.goto();
    check.eq(await lsExCount(page), 2, "(b) po restartu je načtená novější kopie tréninku z databáze");

    // (c)
    await page.evaluate(() => localStorage.removeItem("zd1:cache"));
    const filled = await fillStorage(page);
    check.ok(filled > 0, "(c) schránka jde zaplnit");
    await addEx(app, "lateral-raise-dumbbell");
    check.eq(await lsExCount(page), 2, "(c) třetí cvik se do plné schránky nevešel");
    check.ok(await page.$("#toastRoot .toast"), "(c) při plné schránce se ukáže hláška");
    await P.openSettings(app, "data");
    check.ok(await page.$("#app .lsbar"), "(c) při plné schránce je v Data a záloha sekce Místo v zařízení");
    check.ok(await page.$("#app .lsbar ~ .fmsg"), "(c) sekce má varování o plné schránce");
    await app.settle(3000);
    await app.goto();
    check.eq(await lsExCount(page), 2, "(c) schránka má pořád starší kopii");
    await app.act("tab", "train");
    await app.settle();
    const cards = await page.evaluate(
      () =>
        new Set([...document.querySelectorAll('#app [data-act="done"][data-i]')].map((b) => b.dataset.i))
          .size,
    );
    check.eq(cards, 3, "(c) po restartu má trénink všechny 3 cviky (novější kopie z databáze)");
    await page.evaluate(() => localStorage.removeItem("jina-appka:vypln"));

    // (d)
    await app.act("discard");
    await app.act("discardOk");
    await app.settle(300);
    await app.goto();
    check.ok(
      !(await page.$('#app [data-act="discard"]')),
      "(d) zahozený trénink se po rychlém restartu nevrátil",
    );
    check.eq(await lsExCount(page), 0, "(d) ve schránce není rozdělaný trénink");

    // (e)
    await app.goto(url + "pr-77/");
    await app.act("fakeAdd");
    await app.settle(800);
    await app.goto();
    await P.openSettings(app, "about");
    await app.settle(600);
    check.ok(
      !(await page.$('#app [data-act="testDel"]')),
      "(e) v O aplikaci už mazání testovacích verzí není",
    );
    await P.openSettings(app, "data");
    await app.settle(800);
    await app.act("setOpen", "data");
    await app.settle();
    check.ok(
      await page.$('#app [data-act="testDel"]'),
      "(e) v Data a záloha je Smazat data testovacích verzí",
    );
    await page.click('#app [data-act="testDel"]');
    await app.settle();
    check.ok(await page.$('.sheet [data-act="testDelOk"]'), "(e) smazání se ptá");
    await page.click('.sheet [data-act="testDelOk"]');
    await app.settle(1500);
    await app.act("setOpen", "data");
    await app.settle(800);
    check.ok(
      !(await page.$('#app [data-act="testDel"]')),
      "(e) po smazání řádek s testovacími verzemi zmizí",
    );
    const left = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith("zd1-pr77:")),
    );
    check.eq(left, [], "(e) data testovací verze ze schránky zmizela");

    check.eq(app.errors, [], "bez chyb v konzoli");
    await app.close();
  },
};
