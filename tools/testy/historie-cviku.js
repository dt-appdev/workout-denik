/* Test 7 (F3-49): z historie cviku na stránku tréninku a zpět. Data ze zaloha-v2-plna.json.txt (trénink
   w-push má bench press i vlastní cvik c-moje-tlaky). Klepnutí na kartu v Historii cviku otevře stránku
   tréninku; když se z ní otevře jiný cvik, Zpět vede přes trénink zpátky na původní cvik a jeho záložku
   Historie. Upravit → Uložit změny vrátí na stránku tréninku a Zpět na historii cviku. */
const fs = require("fs");
const path = require("path");
const P = require("./pomocne.js");

// název v horní liště (bez českého podnázvu)
const title = (page) =>
  page.$eval("#app header.top h1", (el) => (el.childNodes[0] ? el.childNodes[0].textContent.trim() : ""));
// stránka cviku na záložce Historie
const onExHist = (page) =>
  page
    .$eval('#app [data-act="exPart"][data-v="hist"]', (el) => el.getAttribute("aria-pressed") === "true")
    .catch(() => false);

module.exports = {
  name: "Historie cviku",
  async run({ browser, url, check }) {
    const text = fs.readFileSync(path.join(__dirname, "zaloha-v2-plna.json.txt"), "utf8");
    const app = await P.openApp(browser, url);
    const { page } = app;
    await P.importBackup(app, text, "replace");
    await app.goto();

    await app.act("tab", "ex");
    await app.act("openEx", "bench-press-barbell");
    await app.act("exPart", "hist");
    await app.settle();
    const benchName = await title(page);
    const cards = await page.$$eval("#app .exh-w", (els) =>
      els.map((el) => [el.tagName, el.dataset.act, el.dataset.v]),
    );
    check.eq(
      cards,
      [
        ["BUTTON", "openW", "w-push"],
        ["BUTTON", "openW", "w-znovu"],
      ],
      "karty historie cviku jsou tlačítka na stránku tréninku",
    );

    // karta → stránka tréninku → jiný cvik → Zpět → Zpět = původní cvik, záložka Historie
    await page.click('#app .exh-w[data-v="w-push"]');
    await app.settle();
    check.eq(await title(page), "Push A", "klepnutí na kartu otevřelo stránku tréninku");
    await page.click('#app .wsum [data-act="openEx"][data-v="c-moje-tlaky"]');
    await app.settle();
    check.ok((await title(page)) !== benchName, "ze stránky tréninku se otevřel jiný cvik");
    await app.act("exBack");
    await app.settle();
    check.eq(await title(page), "Push A", "Zpět z jiného cviku vede na stránku tréninku");
    await app.act("wBack");
    await app.settle();
    check.eq(await title(page), benchName, "Zpět ze stránky tréninku vede na původní cvik");
    check.ok(await onExHist(page), "původní cvik je na záložce Historie");

    // karta → Upravit → Uložit změny → stránka tréninku → Zpět = historie cviku
    await page.click('#app .exh-w[data-v="w-push"]');
    await app.settle();
    await page.click('#app [data-act="editW"]');
    await app.settle();
    check.ok(await page.$('#app [data-act="saveEdit"]'), "Upravit otevřelo úpravu tréninku");
    await app.act("saveEdit");
    await app.settle();
    check.eq(await title(page), "Push A", "po uložení úpravy zpět na stránce tréninku");
    await app.act("wBack");
    await app.settle();
    check.eq(await title(page), benchName, "Zpět po úpravě vede na historii cviku");
    check.ok(await onExHist(page), "po úpravě je cvik na záložce Historie");

    check.eq(app.errors, [], "chyby v appce");
    await app.close();
  },
};
