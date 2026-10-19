/* Test 16 (F1-26): poznámka k tréninku už během tréninku. V rozdělaném tréninku ⋯ karty tréninku (wMenu) →
   Přidat poznámku (wNote, panel s klávesnicí) → Uložit: řádek .wnote-l pod názvem, zůstane i po obnovení
   stránky. Klepnutí na řádek otevře panel bez klávesnice. Okno Dokončit má políčko poznámky předvyplněné
   (i bez funkce Pro coache), uložený text je v kartě na stránce tréninku za Procvičenými partiemi.
   Upravit trénink: řádek poznámky, Smazat → Uložit kartu odebere. S funkcí Pro coache: část Pro coache
   poznámku nemá a text pro coache ji obsahuje („Pozn.:“). Šablona ⋯ tréninku nemá. */
const P = require("./pomocne.js");

const NOTE = "Plné fitko\nbench obsazený";
const NOTE2 = "Plné fitko, začal jsem nohama";
const ROW = "#app .ed-head .wnote-l";

module.exports = {
  name: "Poznámka k tréninku",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page } = app;

    // rozdělaný trénink s jedním cvikem: ⋯ v kartě tréninku, zatím bez řádku poznámky
    await app.act("tab", "train");
    await app.act("startEmpty");
    await app.settle();
    await app.act("addEx");
    await app.act("pickToggle", "bench-press-barbell");
    await app.act("pickDone");
    await app.settle();
    check.ok(await page.$('#app .ed-head [data-act="wMenu"]'), "karta tréninku nemá ⋯");
    check.ok(!(await page.$(ROW)), "trénink bez poznámky má řádek poznámky");

    // ⋯ → Přidat poznámku: panel s klávesnicí, bez Smazat
    await page.click('#app [data-act="wMenu"]');
    await app.settle(300);
    await page.click('.sheet [data-act="wNote"]');
    await app.settle(300);
    check.ok(await page.$(".sheet #wnote-txt"), "Přidat poznámku neotevřelo panel");
    check.eq(await page.evaluate(() => document.activeElement.id), "wnote-txt", "kurzor v políčku");
    check.ok(!(await page.$('.sheet [data-act="wNoteDel"]')), "nová poznámka má Smazat");
    await page.fill("#wnote-txt", "  " + NOTE + "  ");
    await page.click('.sheet [data-act="wNoteSave"]');
    await app.settle();
    check.eq(await page.$eval(`${ROW} .t`, (el) => el.textContent), NOTE, "řádek poznámky pod názvem");

    // po obnovení stránky poznámka zůstává (rozdělaný trénink)
    await app.goto();
    await app.act("tab", "train");
    await app.settle();
    check.ok(await page.$(ROW), "po obnovení stránky zmizela poznámka");

    // klepnutí na řádek: panel s textem bez klávesnice, zavření bez Uložit nic nezmění
    await page.click(ROW);
    await app.settle(300);
    check.eq(await page.$eval("#wnote-txt", (el) => el.value), NOTE, "text v panelu");
    check.ok(
      (await page.evaluate(() => document.activeElement.id)) !== "wnote-txt",
      "klepnutí na řádek otevřelo klávesnici",
    );
    check.ok(await page.$('.sheet [data-act="wNoteDel"]'), "existující poznámka nemá Smazat");
    await page.fill("#wnote-txt", "jiný text");
    await app.act("closeSheet");
    await app.settle();
    check.eq(await page.$eval(`${ROW} .t`, (el) => el.textContent), NOTE, "zavření změnilo poznámku");

    // jedna hotová série (krokovač), Dokončit: políčko poznámky předvyplněné, bez funkce Pro coache
    await page.click('#app [data-act="done"][data-i="0"][data-j="0"]');
    await app.settle();
    if (await page.$(".sheet .kk-b")) {
      for (let n = 0; n < 8; n++) {
        await page.click('.sheet .kk-b[data-kf="reps"][data-kk="1"]');
      }
      await page.click('.sheet [data-act="kkDone"]');
      await app.settle();
    }
    await app.act("closeSheet");
    await app.settle();
    await page.click('#app [data-act="finish"]');
    await app.settle();
    const fin = '.sheet .card textarea[data-f="wNote"]';
    check.ok(!(await page.$(".sheet .coach")), "bez funkce Pro coache je v okně Dokončit část Pro coache");
    check.eq(await page.$eval(fin, (el) => el.value), NOTE, "Dokončit: předvyplněná poznámka");
    await page.fill(fin, NOTE2);
    await app.act("finishOk");
    await app.settle(800);

    // stránka tréninku: karta poznámky hned za Procvičenými partiemi
    const card = await page.evaluate(() => {
      const t = document.querySelector("#app .wnote-t");
      const c = t && t.closest(".card");
      const prev = c && c.previousElementSibling;
      return {
        text: t ? t.textContent : null,
        afterMuscles: !!(prev && prev.querySelector(".mbars")),
      };
    });
    check.eq(card, { text: NOTE2, afterMuscles: true }, "stránka tréninku: karta poznámky");

    // text pro coache obsahuje poznámku (funkce Pro coache zapnutá až teď)
    await P.openSettings(app, "about");
    for (let n = 0; n < 7; n++) {
      await app.act("verTap");
    }
    await app.settle();
    await P.openSettings(app, "data");
    await app.act("cxOpen");
    await app.settle(300);
    const txt = await page.$eval("#cx-txt", (el) => el.value);
    check.ok(txt.includes("Pozn.: " + NOTE2), "text pro coache bez poznámky: " + txt.slice(0, 200));
    await app.act("closeSheet");

    // Upravit trénink: řádek poznámky, Pro coache bez poznámky; Smazat → Uložit kartu odebere
    await app.act("tab", "hist");
    await app.act("histView", "list");
    await app.settle();
    await page.click("#app .hw");
    await app.settle(500);
    await page.click('#app [data-act="editW"]');
    await app.settle(500);
    check.eq(await page.$eval(`${ROW} .t`, (el) => el.textContent), NOTE2, "Upravit trénink: řádek poznámky");
    check.ok(await page.$("#app .coach"), "Upravit trénink se zapnutou funkcí nemá Pro coache");
    check.ok(!(await page.$('#app .coach [data-f="wNote"]')), "Pro coache má poznámku k tréninku");
    await page.click(ROW);
    await app.settle(300);
    await page.click('.sheet [data-act="wNoteDel"]');
    await app.settle();
    check.ok(!(await page.$(ROW)), "Smazat neodebralo řádek poznámky");
    await app.act("saveEdit");
    await app.settle(500);
    check.ok(!(await page.$("#app .wnote-t")), "po smazání poznámky má stránka tréninku její kartu");

    // šablona nemá ⋯ tréninku
    await app.act("tab", "train");
    await app.act("newTpl");
    await app.settle();
    check.ok(!(await page.$('#app [data-act="wMenu"]')), "šablona má ⋯ tréninku");

    check.eq(app.errors, [], "chyby v konzoli");
    await app.close();
  },
};
