/* Test 3 (F0-17): starší formát zálohy (verze 1, název „zelezny-denik“, staré partie delt_f / delt_s,
   neúplná nastavení, bez databáze cviků) se načte a doplní: nová pole dostanou výchozí hodnoty, vlastní cvik
   dostane novou partii, nic se neztratí. A novější verze než umí appka se odmítne s hláškou. Soubor
   zaloha-v1.json.txt obsahuje vymyšlená data. */
const fs = require("fs");
const path = require("path");
const P = require("./pomocne.js");

module.exports = {
  name: "Starší formát zálohy",
  async run({ browser, url, check }) {
    const old = fs.readFileSync(path.join(__dirname, "zaloha-v1.json.txt"), "utf8");
    const app = await P.openApp(browser, url);
    const toast = await P.importBackup(app, old, "replace");
    check.ok(toast && /Data nahrazena/.test(toast), "stará záloha se obnovila, hláška: " + toast);

    const out = (await P.exportBackup(app)).data;
    check.eq(out.version, 2, "obnovená data se zapíšou ve formátu verze 2");
    check.eq(out.app, "workout-denik", "název aplikace v nové záloze");
    check.eq(P.countWorkouts(out), 2, "počet tréninků ze staré zálohy");
    check.eq(Object.keys(out.body).length, 2, "počet měření ze staré zálohy");
    check.eq(out.body["b-2"], { date: 1760254200000, weight: 81.6, note: "ráno" }, "měření se zachovalo");
    check.eq(out.months["2025-09"]["w-1"].ex[0].sets[1], { t: "n", kg: 60, reps: 8 }, "série tréninku");
    check.eq(
      out.cfg.gyms.map((g) => g.name),
      ["Staré fitko"],
      "fitko ze staré zálohy",
    );
    check.eq(out.cfg.restSec, 90, "uložená hodnota nastavení se zachovala");
    check.eq(out.cfg.restOn, true, "chybějící nastavení dostalo výchozí hodnotu (restOn)");
    check.eq(out.cfg.stepper, true, "chybějící nastavení dostalo výchozí hodnotu (stepper)");
    check.eq(Object.keys(out.templates), ["t-push"], "šablona ze staré zálohy");
    const custom = out.exercises["moje-ramena"];
    check.ok(!!custom, "vlastní cvik ze staré zálohy je v nové záloze");
    if (custom) {
      check.eq(custom.pri, ["delts"], "staré delt_f se převedlo na novou partii (pri)");
      check.eq(custom.sec, ["triceps"], "staré delt_s se sloučilo do ramen (sec)");
    }
    const bench = out.exercises["bench-press-barbell"];
    check.eq(bench.pri, ["chest"], "výchozí cvik drží partii z databáze");
    check.ok(!(bench.sec || []).includes("delt_f"), "staré partie delt_* ve výchozím cviku nezůstaly");

    // appka s obnovenými daty se dá používat: Historie, Statistiky a stránka vlastního cviku bez chyby
    await app.act("tab", "hist");
    await app.act("histView", "list");
    await app.settle();
    const hist = await app.page.evaluate(() => document.getElementById("app").innerText);
    check.ok(/Push/.test(hist), "Historie ukazuje trénink Push ze staré zálohy");
    await app.act("tab", "stats");
    await app.settle();
    await app.act("tab", "ex");
    await app.act("openEx", "moje-ramena");
    await app.settle();
    const detail = await app.page.evaluate(() => document.getElementById("app").innerText);
    check.ok(/MOJE RAMENA/i.test(detail), "stránka vlastního cviku se otevřela");

    // záloha z novější verze appky se odmítne a data zůstanou
    const newer = JSON.stringify(Object.assign(JSON.parse(old), { version: 99 }));
    const msg = await rejectedImport(app, newer);
    check.ok(/novější verze/.test(msg), "záloha z novější verze se odmítne hláškou: " + msg);
    // soubor, který není záloha, se odmítne
    const other = await rejectedImport(app, JSON.stringify({ app: "neco-jineho", version: 1 }));
    check.ok(/není záloha/.test(other), "cizí soubor se odmítne hláškou: " + other);
    check.eq(P.countWorkouts((await P.exportBackup(app)).data), 2, "po odmítnutých souborech data zůstala");
    check.eq(app.errors, [], "chyby v appce");
    await app.close();
  },
};

// vybere soubor v Obnovit ze souboru, který appka odmítne; vrací hlášku
async function rejectedImport(app, text) {
  await P.openSettings(app, "data");
  await app.page.setInputFiles("#impFile", {
    name: "x.json.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(text),
  });
  await app.settle(600);
  return app.page.evaluate(() => document.getElementById("toastRoot").innerText);
}
