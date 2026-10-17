/* Test 9 (F1-25): přepisování čísel ve formulářích mimo série. Klepnutí do číselného políčka (Nastavení →
   Trénink: hmotnost, výška, rozsah opakování návrhu progrese; formulář měření těla) ho zprázdní a starou
   hodnotu ukáže šedě, odchod bez psaní ji vrátí, napsané číslo ji nahradí a uloží se. Enter přejde
   na další číselné políčko v kartě nebo panelu, v posledním klávesnici schová (políčko ztratí kurzor).
   Data ze zaloha-v2-plna.json.txt (výška 182, rozsah 6–10, hmotnost v Nastavení nezadaná = 80). */
const fs = require("fs");
const path = require("path");
const P = require("./pomocne.js");

// id políčka s kurzorem
const focused = (page) => page.evaluate(() => (document.activeElement ? document.activeElement.id : ""));
// hodnota a šedá stará hodnota políčka
const state = (page, id) => page.$eval("#" + id, (el) => ({ value: el.value, placeholder: el.placeholder }));

module.exports = {
  name: "Čísla ve formulářích",
  async run({ browser, url, check }) {
    const text = fs.readFileSync(path.join(__dirname, "zaloha-v2-plna.json.txt"), "utf8");
    const app = await P.openApp(browser, url);
    const { page } = app;
    await P.importBackup(app, text, "replace");
    await app.goto();
    await P.openSettings(app, "train");

    // klepnutí zprázdní, odchod bez psaní vrátí
    await page.click("#bwInp");
    check.eq(await state(page, "bwInp"), { value: "", placeholder: "80" }, "klepnutí: hmotnost šedě");
    await page.evaluate(() => document.activeElement.blur());
    check.eq((await state(page, "bwInp")).value, "80", "odchod bez psaní vrátil hmotnost");

    // přepsání a Enter do dalšího políčka v kartě
    await page.click("#bwInp");
    await page.keyboard.type("85");
    await page.keyboard.press("Enter");
    check.eq(await focused(page), "heightInp", "Enter z hmotnosti přešel na výšku");
    await page.keyboard.type("180");
    await page.keyboard.press("Enter");
    check.ok((await focused(page)) !== "heightInp", "Enter na výšce (poslední v kartě) schoval klávesnici");
    await app.settle(1000);
    const shown = await page.evaluate(() => [
      document.getElementById("bwInp").value,
      document.getElementById("heightInp").value,
    ]);
    check.eq(shown, ["85", "180"], "přepsaná hmotnost a výška zůstaly");

    // rozsah opakování návrhu progrese: od → do
    await page.click("#progMin");
    check.eq((await state(page, "progMin")).value, "", "klepnutí: rozsah od prázdný");
    await page.keyboard.type("5");
    await page.keyboard.press("Enter");
    await app.settle(); // psaní uložilo rozsah a appka překreslí stránku (kurzor zůstane v políčku)
    check.eq(await focused(page), "progMax", "Enter z rozsahu od přešel na do");
    check.eq(await state(page, "progMax"), { value: "", placeholder: "10" }, "rozsah do po Enteru šedě");
    await page.keyboard.press("Enter");
    await app.settle();
    check.ok((await focused(page)) !== "progMax", "Enter na rozsahu do schoval klávesnici");
    check.eq((await state(page, "progMax")).value, "10", "rozsah do bez psaní vrácený");
    check.eq((await state(page, "progMin")).value, "5", "rozsah od přepsaný");

    // formulář měření: Enter přes všechna čísla, poznámka se přeskočí
    await app.act("tab", "body");
    await app.act("addBody");
    await app.settle(300);
    await page.click("#b-weight");
    await page.keyboard.type("80");
    await page.keyboard.press("Enter");
    check.eq(await focused(page), "b-fat", "Enter z hmotnosti měření přešel na tuk");
    const last = await page.$$eval(".sheet input[data-num]", (els) => els[els.length - 1].id);
    await page.focus("#" + last);
    check.eq(
      await page.$eval("#" + last, (el) => el.enterKeyHint),
      "done",
      "poslední číslo měření má na klávesnici Hotovo",
    );
    await page.keyboard.press("Enter");
    check.ok((await focused(page)) === "", "Enter na posledním čísle měření schoval klávesnici");
    await app.act("saveBody");
    await app.settle(300);
    const backup = await P.exportBackup(app);
    const saved = Object.values(backup.data.body).map((b) => b.weight);
    check.ok(saved.length === 3 && saved.includes(80), "měření s napsanou hmotností uložené");
    const cfg = backup.data.cfg;
    check.eq([cfg.bodyWeight, cfg.height, cfg.progMin, cfg.progMax], [85, 180, 5, 10], "nastavení uložené");

    check.eq(app.errors, [], "chyby v appce");
    await app.close();
  },
};
