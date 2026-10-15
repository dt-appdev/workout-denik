/* Test 6 (F2-14): pauza cviku v úpravě šablony. Řádek s pauzou ukazuje výchozí pauzu, po nastavení vlastní
   pauzy ve formuláři cviku (z panelu řádku) „vlastní u cviku“ a u cviků v supersérii „po supersérii“.
   V rozdělaném tréninku řádek není. Nabídka cviku v šabloně odebírá „ze šablony“. */
const P = require("./pomocne.js");

const LINES = "#app .exc-rest";
const lines = (page) =>
  page.$$eval(LINES, (els) => els.map((el) => el.textContent.trim().replace(/\s+/g, " ")));

async function run({ browser, url, check }) {
  const app = await P.openApp(browser, url);
  const { page } = app;

  // nová šablona se třemi cviky
  await app.act("tab", "train");
  await app.act("newTpl");
  await app.settle();
  await app.act("addEx");
  for (const id of ["bench-press-barbell", "leg-press-machine", "plank"]) await app.act("pickToggle", id);
  await app.act("pickDone");
  await app.settle();
  check.eq(
    await lines(page),
    ["Pauza 2:00 · výchozí", "Pauza 2:00 · výchozí", "Pauza 2:00 · výchozí"],
    "každý cvik má řádek s výchozí pauzou",
  );

  // klepnutí na řádek otevře panel, z něj formulář cviku; vlastní pauza 3:00
  await page.click(`${LINES}[data-i="0"]`);
  await app.settle();
  check.ok(await page.$('.sheet [data-act="restInfoEx"]'), "panel pauzy má tlačítko Upravit cvik");
  await page.click('.sheet [data-act="restInfoEx"]');
  await app.settle();
  check.ok(await page.$("#x-rest-on"), "otevřel se formulář cviku");
  await page.$eval("#x-rest-on", (el) => {
    el.checked = true;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await app.settle();
  await page.$eval("#x-rest", (el) => {
    el.value = 180;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await app.settle();
  await page.click("#ex-save");
  await app.settle();
  check.ok(
    await page.$eval(".sheet .sheet-b", (el) => /3:00, vlastní pauza cviku/.test(el.textContent)),
    "po uložení se vrátil panel pauzy s novou délkou",
  );
  await app.act("closeSheet");
  await app.settle();
  check.eq(
    (await lines(page))[0],
    "Pauza 3:00 · vlastní u cviku",
    "po uložení cviku se vrátila úprava šablony s vlastní pauzou",
  );

  // supersérie: pauza po kole supersérie
  await page.click('#app [data-act="exMenu"][data-i="1"]');
  await app.settle();
  check.ok(
    await page.$eval('.sheet [data-act="exRemove"]', (el) => /ze šablony/.test(el.textContent)),
    "v šabloně Odebrat cvik ze šablony",
  );
  await page.click('.sheet [data-act="ssOn"]');
  await app.settle();
  check.eq(
    (await lines(page)).slice(1),
    ["Pauza 3:00 · po supersérii", "Pauza 3:00 · po supersérii"],
    "cviky v supersérii mají pauzu po supersérii",
  );

  // uložit šablonu a začít podle ní trénink: v tréninku řádek s pauzou není
  await app.act("saveTpl");
  await app.settle();
  const tplId = await page.$eval('#app [data-act="tplMenu"]', (el) => el.dataset.v);
  await app.act("startTpl", tplId);
  await app.settle();
  check.ok(await page.$("#app .exc"), "trénink ze šablony běží");
  check.eq((await page.$$(LINES)).length, 0, "v rozdělaném tréninku řádek s pauzou není");
  check.eq(app.errors, [], "žádné chyby v konzoli");
  await app.close();
}

module.exports = { name: "pauza v úpravě šablony", run };
