/* Test (F0-21): záznam událostí.
   (a) Po startu appky je v záznamu řádek o startu s verzí.
   (b) Chyba kódu se zapíše s místem v souboru; stejná chyba třikrát za sebou = jeden řádek s počtem 3.
   (c) Nastavení → O aplikaci → Záznam událostí: panel s řádky, Zkopírovat dá do schránky text s hlavičkou.
   (d) Záznam není v záloze.
   (e) Smazat záznam vyprázdní (i po restartu appky).
   (f) Testovací verze (/pr-99/) píše do vlastní databáze workout-denik-log-pr99. */
const P = require("./pomocne.js");

const MARK = "zkouska-zaznamu-f0-21";
const rows = (page) => page.evaluate(() => window.ZAZNAM.read());
// vyhodí chybu mimo appku (jako chyba v kódu), zachytí ji jen globální posluchač
const throwErr = (page) =>
  page.evaluate((mark) => {
    setTimeout(() => {
      throw new Error(mark);
    }, 0);
  }, MARK);

module.exports = {
  name: "Záznam událostí",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page } = app;
    await app.context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // (a)
    await app.settle(500);
    let r = await rows(page);
    check.ok(
      r.some((x) => x.txt.startsWith("start appky: lokální")),
      "(a) po startu je v záznamu řádek o startu appky",
    );

    // (b)
    await throwErr(page);
    await throwErr(page);
    await throwErr(page);
    await app.settle(300);
    r = await rows(page);
    const err = r.filter((x) => x.txt.includes(MARK));
    check.eq(err.length, 1, "(b) stejná chyba třikrát = jeden řádek");
    check.ok(err[0] && err[0].n === 3, "(b) řádek chyby má počet 3");
    check.ok(err[0] && err[0].txt.startsWith("chyba: "), "(b) řádek začíná „chyba:“");

    // (c)
    await P.openSettings(app, "about");
    check.ok(await page.$('#app [data-act="evLog"]'), "(c) v O aplikaci je tlačítko Záznam událostí");
    await app.act("evLog");
    await app.settle();
    const shown = await page.$$eval(".sheet .evlog > div", (d) => d.map((x) => x.textContent).join("\n"));
    check.ok(shown.includes(MARK), "(c) panel ukazuje zapsanou chybu");
    await app.act("evLogCopy");
    await app.settle(300);
    const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    check.ok(copied.startsWith("Workout deník – záznam událostí"), "(c) zkopírovaný text má hlavičku");
    check.ok(copied.includes("Zařízení: ") && copied.includes(MARK), "(c) text má zařízení a řádky záznamu");
    await app.act("closeSheet");

    // (d)
    const backup = await P.exportBackup(app);
    check.ok(!backup.text.includes(MARK) && !backup.text.includes("start appky"), "(d) záznam není v záloze");

    // (e)
    await P.openSettings(app, "about");
    await app.act("evLog");
    await app.settle();
    await app.act("evLogClear");
    await app.settle();
    check.ok(!(await page.$(".sheet .evlog")), "(e) po Smazat je panel prázdný");
    await app.goto();
    r = await rows(page);
    check.ok(!r.some((x) => x.txt.includes(MARK)), "(e) smazaný záznam se po restartu nevrátí");

    // (f)
    await app.goto(url + "pr-99/");
    await app.settle(500);
    await page.evaluate(() => window.ZAZNAM.flush());
    const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
    check.ok(dbs.includes("workout-denik-log-pr99"), "(f) testovací verze má vlastní záznam");

    await app.close();
  },
};
