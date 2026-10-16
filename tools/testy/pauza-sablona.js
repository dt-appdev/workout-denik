/* Test 6 (F2-14, F1-21): pauza cviku v úpravě šablony. Řádek s pauzou ukazuje výchozí pauzu, po nastavení vlastní
   pauzy ve formuláři cviku (z panelu řádku) „vlastní“ a u cviků v supersérii „po supersérii“.
   V rozdělaném tréninku řádek není. Nabídka cviku v šabloně odebírá „ze šablony“.
   F1-21: vypínač a posuvník v panelu nastaví pauzu v šabloně („v šabloně“), po ✓ pracovní série v tréninku
   ze šablony běží tato pauza a Aktualizovat šablonu ji zachová. */
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
    ["2:00 · výchozí", "2:00 · výchozí", "2:00 · výchozí"],
    "každý cvik má řádek s výchozí pauzou",
  );

  // klepnutí na řádek otevře panel, z něj formulář cviku; vlastní pauza 3:00
  await page.click(`${LINES}[data-i="0"]`);
  await app.settle();
  check.ok(await page.$('.sheet [data-act="restInfoEx"]'), "panel pauzy má tlačítko Upravit cvik");
  await page.click('.sheet [data-act="restInfoEx"]');
  await app.settle();
  check.ok(await page.$("#x-rest-on"), "otevřel se formulář cviku");
  check.ok(
    await page.$eval("#x-rest-on", (el) => {
      const r = el.closest("section").getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0 && scrollY > 0;
    }),
    "formulář je posunutý na sekci s pauzou",
  );
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
    await page.$eval(".sheet .sheet-b", (el) =>
      /Pauza po pracovní sérii: 3:00\s*vlastní pauza cviku/.test(el.textContent),
    ),
    "po uložení se vrátil panel pauzy s novou délkou",
  );
  await app.act("closeSheet");
  await app.settle();
  check.eq(
    (await lines(page))[0],
    "3:00 · vlastní",
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
    ["3:00 · po supersérii", "3:00 · po supersérii"],
    "cviky v supersérii mají pauzu po supersérii",
  );

  // F1-21: pauza v šabloně – zapnutí převezme platnou pauzu (vlastní 3:00), posuvník ji změní na 4:00
  const setInput = (sel, prop, val) =>
    page.$eval(
      sel,
      (el, [prop, val]) => {
        el[prop] = val;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      [prop, val],
    );
  await page.click(`${LINES}[data-i="0"]`);
  await app.settle();
  check.ok(
    await page.$eval("#t-rest-on", (el) => !el.checked && !!el.closest(".sheet").querySelector(".rest-sl.off")),
    "panel má vypnutý vypínač pauzy v šabloně a zešedlý posuvník",
  );
  await setInput("#t-rest-on", "checked", true);
  await app.settle();
  check.eq((await lines(page))[0], "3:00 · v šabloně", "zapnutá pauza v šabloně převzala platnou pauzu");
  await setInput("#t-rest", "value", 240);
  await app.settle();
  check.eq((await lines(page))[0], "4:00 · v šabloně", "posuvník změnil pauzu v šabloně");
  check.ok(
    await page.$eval(".sheet .sheet-b", (el) => /4:00\s*vlastní pauza v této šabloně/.test(el.textContent)),
    "panel ukazuje pauzu v šabloně",
  );
  await app.act("closeSheet");
  await app.settle();
  await page.click(`${LINES}[data-i="1"]`);
  await app.settle();
  check.ok(!(await page.$("#t-rest-on")), "u cviku v supersérii panel vypínač nemá");
  await app.act("closeSheet");
  await app.settle();

  // uložit šablonu a začít podle ní trénink: v tréninku řádek s pauzou není
  await app.act("saveTpl");
  await app.settle();
  const tplId = await page.$eval('#app [data-act="tplMenu"]', (el) => el.dataset.v);
  await app.act("startTpl", tplId);
  await app.settle();
  check.ok(await page.$("#app .exc"), "trénink ze šablony běží");
  check.eq((await page.$$(LINES)).length, 0, "v rozdělaném tréninku řádek s pauzou není");

  // ✓ pracovní série prvního cviku: pauza ze šablony (4:00), ne vlastní pauza cviku (3:00)
  await page.click('#app [data-act="done"][data-i="0"][data-j="0"]');
  await app.settle();
  if (await page.$(".sheet .kk-b")) {
    for (let n = 0; n < 5; n++) await page.click('.sheet .kk-b[data-kf="reps"][data-kk="1"]');
    for (let n = 0; n < 3; n++) await page.click('.sheet .kk-b[data-kf="kg"][data-kk="1"]');
    await page.click('.sheet [data-act="kkDone"]');
    await app.settle();
  }
  await app.act("closeSheet");
  await app.settle();
  check.ok(
    /^(4:00|3:5\d)$/.test(await page.$eval("#restClock", (el) => el.textContent.trim()).catch(() => "")),
    "po ✓ běží pauza ze šablony 4:00",
  );

  // dokončit s Aktualizovat šablonu: pauza v šabloně zůstane
  await page.click('#app [data-act="finish"]');
  await app.settle();
  await page.$eval("#updTpl", (el) => (el.checked = true));
  await app.act("finishOk");
  await app.settle(800);
  await app.act("tab", "train");
  await app.act("editTpl", tplId);
  await app.settle();
  check.eq((await lines(page))[0], "4:00 · v šabloně", "Aktualizovat šablonu pauzu v šabloně zachovalo");
  check.eq(app.errors, [], "žádné chyby v konzoli");
  await app.close();
}

module.exports = { name: "pauza v úpravě šablony", run };
