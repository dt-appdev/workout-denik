/* Test 13 (F3-52): poznámka ke cviku v kartě jen pro čtení, úprava v panelu. V tréninku i v šabloně:
   bez poznámky karta řádek nemá, nabídka ⋯ (exNote) otevře panel s klávesnicí, Uložit (noteSave) zapíše
   poznámku do řádku .exc-note (celý text, výška podle počtu řádků, žádné políčko v kartě). Klepnutí na řádek
   otevře panel bez klávesnice, zavření bez Uložit nic nezmění, Smazat (noteDel) řádek odebere. */
const P = require("./pomocne.js");

const NOTE = "Lopatky stažené\nPoslední série pomaleji dolů";
const ROW = "#app .exc-note";

// klepnutí na tlačítko s data-act a data-i (delegace kliknutí v appce)
const actI = (page, name, i) =>
  page.evaluate(
    ([name, i]) => {
      const btn = document.createElement("button");
      btn.dataset.act = name;
      btn.dataset.i = String(i);
      document.getElementById("app").appendChild(btn);
      btn.click();
      btn.remove();
    },
    [name, i],
  );

// přidá, zkontroluje, upraví a smaže poznámku u prvního cviku na otevřené stránce (where = trénink / šablona)
async function noteFlow(app, check, where) {
  const { page } = app;
  check.ok(!(await page.$(ROW)), `${where}: karta bez poznámky má řádek poznámky`);

  // nabídka ⋯ → Přidat poznámku: panel s klávesnicí
  await actI(page, "exMenu", 0);
  await app.settle(300);
  await page.click('.sheet [data-act="exNote"]');
  await app.settle(300);
  check.ok(await page.$(".sheet #note-txt"), `${where}: Přidat poznámku neotevřelo panel`);
  check.eq(await page.evaluate(() => document.activeElement.id), "note-txt", `${where}: kurzor v políčku`);
  check.ok(!(await page.$('.sheet [data-act="noteDel"]')), `${where}: nová poznámka má Smazat`);
  await page.fill("#note-txt", "  " + NOTE + "  ");
  await page.click('.sheet [data-act="noteSave"]');
  await app.settle();

  // řádek jen pro čtení s celým textem na dva řádky
  check.ok(!(await page.$('#app textarea[data-f="note"], #app textarea.exc-note')), `${where}: v kartě je políčko`);
  const row = await page.$eval(ROW, (el) => {
    const t = el.querySelector(".t");
    return {
      text: t.textContent,
      lines: Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)),
      icon: !!el.querySelector(".nt-ic svg"),
      go: !!el.querySelector(".exc-go"),
    };
  });
  check.eq(row, { text: NOTE, lines: 2, icon: true, go: true }, `${where}: řádek poznámky`);

  // klepnutí na řádek: panel s textem bez klávesnice; zavření bez Uložit nic nezmění
  await page.click(ROW);
  await app.settle(300);
  check.eq(await page.$eval("#note-txt", (el) => el.value), NOTE, `${where}: text v panelu`);
  check.ok(
    (await page.evaluate(() => document.activeElement.id)) !== "note-txt",
    `${where}: klepnutí na řádek otevřelo klávesnici`,
  );
  await page.fill("#note-txt", "jiný text");
  await app.act("closeSheet");
  await app.settle();
  check.eq(await page.$eval(`${ROW} .t`, (el) => el.textContent), NOTE, `${where}: zavření změnilo poznámku`);

  // Smazat
  await page.click(ROW);
  await app.settle(300);
  await page.click('.sheet [data-act="noteDel"]');
  await app.settle();
  check.ok(!(await page.$(ROW)), `${where}: Smazat neodebralo řádek poznámky`);
}

module.exports = {
  name: "Poznámka ke cviku v panelu",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);

    // rozdělaný trénink s jedním cvikem
    await app.act("tab", "train");
    await app.act("startEmpty");
    await app.settle();
    await app.act("addEx");
    await app.act("pickToggle", "bench-press-barbell");
    await app.act("pickDone");
    await app.settle();
    await noteFlow(app, check, "trénink");

    // šablona s jedním cvikem
    await app.act("discardOk");
    await app.settle();
    await app.act("tab", "train");
    await app.act("newTpl");
    await app.settle();
    await app.act("addEx");
    await app.act("pickToggle", "leg-press-machine");
    await app.act("pickDone");
    await app.settle();
    await noteFlow(app, check, "šablona");

    check.eq(app.errors, [], "chyby v konzoli");
    await app.close();
  },
};
