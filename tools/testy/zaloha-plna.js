/* Test 4 (F0-17): plná záloha. Soubor zaloha-v2-plna.json.txt (vymyšlená data) obsahuje všechno, co appka
   ukládá: nastavení mimo výchozí hodnoty, archivované fitko, šablonu s poznámkou a supersérií, skrytou šablonu,
   plán, tréninky se zahřívací, drop a do selhání sérií, RIR/RPE, odhadem před selháním, časy sérií, údaji pro
   coache a Cvičit znovu, měření, vlastní cvik (stroj, pauza, rozsah opakování, odkaz), úpravy výchozích cviků
   (stroj, pauza, popis, skrytý cvik) a fotku.
   (a) Obnova „Nahradit vše“ do čisté appky a restart: každá hodnota ze souboru musí být v nové záloze (appka
       smí jen doplnit výchozí hodnoty), obrazovky s těmito daty se vykreslí bez chyby.
   (b) Ta nová záloha obnovená do další čisté appky dá stejnou zálohu (nic se neztrácí ani při druhém kole).
   (c) „Sloučit“ do appky s vlastním tréninkem a měřením: vlastní data i nastavení zůstanou, ze souboru přibude
       vše, co chybělo. Druhé sloučení souboru se stejnými id, ale jiným obsahem nesmí nic přepsat. */
const fs = require("fs");
const path = require("path");
const P = require("./pomocne.js");

// rozdíly očekávaného obsahu jedné části zálohy jako chyby testu
function expectIn(check, expected, actual, label) {
  for (const diff of P.missingIn(expected, actual, label)) {
    check.ok(false, "chybí nebo se změnilo " + diff);
  }
}

module.exports = {
  name: "Plná záloha",
  async run({ browser, url, check }) {
    const text = fs.readFileSync(path.join(__dirname, "zaloha-v2-plna.json.txt"), "utf8");
    const source = JSON.parse(text);

    // (a) obnova do čisté appky, restart, nová záloha obsahuje vše ze souboru
    const app = await P.openApp(browser, url);
    const toastA = await P.importBackup(app, text, "replace");
    check.ok(toastA && /Data nahrazena/.test(toastA), "obnova plné zálohy skončila hláškou: " + toastA);
    // restart až po zápisu cache (0,8 s): start z cache se všemi druhy dat (pád při startu kvůli pauze
    // v šabloně odhalil test F0-18)
    await app.settle(1500);
    await app.goto();
    const first = await P.exportBackup(app);
    for (const part of ["cfg", "templates", "plan", "months", "body", "photos"]) {
      expectIn(check, source[part], first.data[part], part);
    }
    // cviky: záloha má celou databázi, ze souboru musí sedět vlastní cvik a úpravy výchozích
    expectIn(check, source.exercises, first.data.exercises, "exercises");
    check.eq(first.data.exDb, 2, "značka databáze cviků");
    // obrazovky s plnými daty
    for (const [act, v] of [
      ["tab", "train"],
      ["tab", "hist"],
      ["histView", "list"],
      ["openW", null],
      ["tab", "stats"],
      ["tab", "ex"],
      ["openEx", "c-moje-tlaky"],
      ["exPart", "hist"],
      ["openEx", "bench-press-barbell"],
      ["exPart", "info"],
      ["tab", "set"],
      ["setOpen", "gyms"],
    ]) {
      if (act === "openW") {
        await app.page.click("#app .hw");
      } else {
        await app.act(act, v);
      }
      await app.settle(250);
    }
    check.eq(app.errors, [], "chyby v appce s plnými daty");
    await app.close();

    // (b) druhé kolo: obnova nové zálohy do další čisté appky
    const second = await P.openApp(browser, url);
    await P.importBackup(second, first.text, "replace");
    const again = await P.exportBackup(second);
    check.eq(P.withoutTime(again.data), P.withoutTime(first.data), "druhé kolo obnovy dá stejnou zálohu");
    check.eq(second.errors, [], "chyby v appce (druhé kolo)");
    await second.close();

    // (c) Sloučit do appky s vlastními daty
    const own = await P.openApp(browser, url);
    await P.recordWorkout(own, "pull-up", 6, 0);
    await P.addMeasurement(own, "2026-10-05", "80,9");
    const before = (await P.exportBackup(own)).data;
    check.eq(P.countWorkouts(before), 1, "vlastní appka má před sloučením 1 trénink");
    const toastC = await P.importBackup(own, text, "merge");
    check.ok(toastC && /Doplněno: 3 tréninky/.test(toastC), "sloučení hlásí 3 doplněné tréninky: " + toastC);
    const merged = (await P.exportBackup(own)).data;
    check.eq(P.countWorkouts(merged), 4, "po sloučení jsou 4 tréninky (1 vlastní + 3 ze souboru)");
    expectIn(check, before.months, merged.months, "vlastní trénink");
    expectIn(check, before.body, merged.body, "vlastní měření");
    expectIn(check, source.months, merged.months, "tréninky ze souboru");
    expectIn(check, source.body, merged.body, "měření ze souboru");
    expectIn(check, source.templates, merged.templates, "šablony ze souboru");
    expectIn(check, source.plan, merged.plan, "plán ze souboru");
    expectIn(check, source.photos, merged.photos, "fotka ze souboru");
    expectIn(
      check,
      source.exercises["c-moje-tlaky"],
      merged.exercises["c-moje-tlaky"],
      "vlastní cvik ze souboru",
    );
    check.eq(merged.cfg.gyms.map((g) => g.id).sort(), ["g-domov", "g-stare"], "fitka ze souboru přibyla");
    // Sloučit nic nepřepíše: vlastní nastavení zůstane
    // (soubor má restSec 150 a effort "rir", vlastní appka výchozí 120 a "off")
    check.eq(merged.cfg.restSec, 120, "sloučení nezměnilo vlastní nastavení (restSec)");
    check.eq(merged.cfg.effort || "off", "off", "sloučení nezměnilo vlastní nastavení (effort)");
    // Sloučit nic nepřepíše ani u stejných záznamů: soubor se stejnými id, ale jiným obsahem nezmění nic
    const changed = JSON.parse(text);
    changed.months["2026-09"]["w-push"].title = "Přepsaný trénink";
    changed.body["b-1"].weight = 99;
    changed.templates["t-push"].name = "Přepsaná šablona";
    changed.plan["2099-01-15"].gymId = "g-stare";
    changed.exercises["c-moje-tlaky"].name = "Přepsaný cvik";
    const toastD = await P.importBackup(own, JSON.stringify(changed), "merge");
    check.ok(toastD && /Nic nechybělo/.test(toastD), "sloučení se stejnými záznamy nic nedoplní: " + toastD);
    const kept = (await P.exportBackup(own)).data;
    check.eq(P.withoutTime(kept), P.withoutTime(merged), "sloučení nepřepsalo žádný existující záznam");
    check.eq(own.errors, [], "chyby v appce (sloučení)");
    await own.close();
  },
};
