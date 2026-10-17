/* Test 11 (F3-50): přidání cviku z online databáze free-exercise-db. Šipka › u cviku, který už mám (záložka Cviky
   = stránka cviku, výběr cviků do tréninku = Informace o cviku, Zpět vrací do hledání), formulář Nový cvik
   s podnadpisem místo informačního rámečku, jedna hláška na jeden cvik, sekce Fotky z databáze a zvětšení
   fotky (Zpět v telefonu ji zavře a nechá formulář i výběr). Fotky z internetu nahrazuje malý obrázek. */
const P = require("./pomocne.js");

// 1 × 1 px JPEG místo fotek z raw.githubusercontent.com (test nepotřebuje internet)
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwS" +
    "ExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=",
  "base64",
);

const title = (page) =>
  page.$eval("#app header.top h1", (el) => (el.childNodes[0] ? el.childNodes[0].textContent.trim() : ""));
const subtitle = (page) =>
  page.$eval("#app header.top h1 small", (el) => el.textContent.trim()).catch(() => "");
const text = (page, sel) =>
  page.$eval(sel, (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "");

// otevře hledání v online databázi (odkud: list = záložka Cviky, picker = výběr cviků) a napíše dotaz
async function search(app, from, q) {
  await app.act("fedbOpen", from);
  await app.page.waitForSelector("#fsQ");
  await app.page.fill("#fsQ", q);
  await app.page.waitForSelector("#fsList .pickrow", { timeout: 20000 });
  await app.settle();
}

module.exports = {
  name: "Online databáze cviků",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page, context } = app;
    await context.route(/raw\.githubusercontent\.com/, (route) =>
      route.fulfill({
        status: 200,
        body: JPEG,
        headers: { "Content-Type": "image/jpeg", "Access-Control-Allow-Origin": "*" },
      }),
    );
    await app.act("tab", "ex");
    await app.settle();

    // výsledky: cvik, který už mám (Sled Push je ve výchozí databázi), má šipku ›, ne textové tlačítko
    await search(app, "list", "Sled Push");
    const row = '#fsList .pickrow:has([data-act="fsPick"][data-v="Sled_Push"])';
    check.ok(
      await page.$(`${row} .infob[data-act="fsHave"][data-v="sled-push"]`),
      "u cviku, který mám, je šipka ›",
    );
    check.eq(
      await page.$$eval("#fsList .pickrow .btn", (els) => els.length),
      0,
      "v řádcích není textové tlačítko",
    );
    await page.click(`${row} .infob`);
    await app.settle();
    check.eq(await title(page), "Sled Push", "šipka ze záložky Cviky otevřela stránku mého cviku");
    await page.goBack().catch(() => {});
    await app.settle();
    check.ok(await page.$("#fsQ"), "Zpět ze stránky cviku vrátil hledání");

    // stejný název: jen červená hláška u anglického názvu, u českého nic, žádný rámeček
    await page.click('[data-act="fsPick"][data-v="Sled_Push"]');
    await app.settle(800);
    check.eq(await title(page), "Nový cvik", "z výsledku se otevřel formulář Nový cvik");
    check.eq(await subtitle(page), "z online databáze", "podnadpis místo informačního rámečku");
    check.eq(await page.$$eval("#app .banner", (els) => els.length), 0, "ve formuláři není rámeček");
    check.ok(
      /^Cvik s tímto názvem už máš/.test(await text(page, "#x-name-msg")),
      "hláška u anglického názvu",
    );
    check.eq(await text(page, "#x-cz-msg"), "", "u českého názvu stejný cvik podruhé není");
    check.eq(
      await page.$$eval("#app section.sec h2", (els) => els.slice(0, 3).map((el) => el.textContent.trim())),
      ["Název", "Fotky z databáze", "Partie"],
      "fotky mají vlastní sekci hned pod Názvem",
    );
    await app.act("exEdBack");
    await app.settle();
    await app.act("exDiscard");
    await app.settle();

    // podobný cvik s jiným názvem: hláška pod anglickým názvem, uložit jde
    await search(app, "list", "alternate hammer curl");
    await page.click('[data-act="fsPick"][data-v="Alternate_Hammer_Curl"]');
    await app.settle(800);
    check.ok(/^Podobný cvik už máš/.test(await text(page, "#x-name-msg")), "hláška o podobném cviku u názvu");
    check.ok(!(await page.$("#ex-save.off")), "cvik s podobným cvikem jde uložit");

    // zvětšení fotky: klepnutí na fotku, výběr pod ní, Zpět v telefonu zavře jen fotku
    await page.click('.thumbs [data-act="fxView"][data-v="0"]');
    await app.settle();
    check.ok(await page.$("#sheetRoot .pv"), "klepnutí na fotku ji otevřelo přes celou obrazovku");
    check.eq(await text(page, "#pvCount"), "Fotka 1 / 2", "zvětšená je první fotka");
    await page.click('#pvFoot [data-act="fxSel"]');
    await app.settle(200);
    check.ok(/Zrušit výběr/.test(await text(page, "#pvFoot")), "pod fotkou jde výběr zrušit");
    await page.goBack().catch(() => {});
    await app.settle();
    check.ok(!(await page.$("#sheetRoot .pv")), "Zpět v telefonu zavřel zvětšenou fotku");
    check.eq(await title(page), "Nový cvik", "po zavření fotky zůstal formulář");
    check.ok(/^Podobný cvik/.test(await text(page, "#x-name-msg")), "formulář je pořád ten rozepsaný");
    check.eq(
      await page.$$eval(".thumbs .ck", (els) => els.map((el) => el.getAttribute("aria-pressed"))),
      ["true", "false"],
      "fotka vybraná ve zvětšení je vybraná i v náhledu",
    );
    await page.click('.thumbs .ck[data-v="1"]');
    await app.settle(200);
    check.eq(await page.$$eval(".thumbs .th.sel", (els) => els.length), 2, "kroužek vybírá rovnou");
    await app.act("exEdBack");
    await app.settle();
    await app.act("exDiscard");
    await app.settle();

    // výběr cviků do tréninku: šipka › otevře Informace o cviku, Zpět vrátí hledání
    await app.act("tab", "train");
    await app.act("startEmpty");
    await app.act("addEx");
    await app.settle();
    await search(app, "picker", "Sled Push");
    await page.click(`${row} .infob`);
    await app.settle();
    check.ok(
      await page.$('#sheetRoot [data-act="openEx"][data-v="sled-push"]'),
      "šipka z výběru cviků otevřela Informace o cviku",
    );
    await page.goBack().catch(() => {});
    await app.settle();
    check.ok(await page.$("#fsQ"), "Zpět z Informací o cviku vrátil hledání");
    check.eq(await page.$eval("#fsQ", (el) => el.value), "Sled Push", "hledání drží napsaný dotaz");

    check.eq(app.errors, [], "žádné chyby v konzoli");
    await app.close();
  },
};
