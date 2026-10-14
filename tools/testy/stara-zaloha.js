/* Test 3 (F0-17): starší formáty zálohy.
   (1) Záloha z doby artefaktu (do září 2026, původní appka verze 9): app „workout-denik“, version 2, bez značky
       exDb, cviky = celá knihovna ve starém tvaru (partie delt_f / delt_s / delt_r, pole muscle), bez plánu.
       Takovou zálohu má uživatel nejspíš v telefonu nebo na Disku. Sestaví se v testu z js/cviky.js (EX_DB_OLD =
       partie tehdejší knihovny), ne ze skutečných dat. Po obnově: knihovna převedená na novou databázi (výchozí
       cviky bez úprav = přesně EX_DB, žádné staré partie), úpravy uživatele (skrytý cvik, vázání na fitko) zůstanou,
       vlastní cvik dostane novou partii.
   (2) Ještě starší soubor zaloha-v1.json.txt (version 1, název „zelezny-denik“, neúplné nastavení, vymyšlená
       data) se načte a doplní výchozími hodnotami. Záloha z novější verze a cizí soubor se odmítnou. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const P = require("./pomocne.js");

// EX_DB a EX_DB_OLD z js/cviky.js
function loadExDb() {
  const code = fs.readFileSync(path.join(P.ROOT, "js", "cviky.js"), "utf8");
  return vm.runInNewContext(code + ";({ EX_DB, EX_DB_OLD })");
}

// záloha ve tvaru, který ukládal artefakt (snapshotAll v d491407:puvodni/workout-denik.html)
function artifactBackup(db) {
  const exercises = {};
  for (const id of Object.keys(db.EX_DB_OLD)) {
    const cur = db.EX_DB[id];
    const [pri, sec] = db.EX_DB_OLD[id];
    exercises[id] = Object.assign({}, cur, { pri, sec, muscle: "legacy" });
  }
  // úpravy uživatele: skrytý cvik a opačné vázání na fitko
  exercises["ab-wheel"].archived = true;
  exercises["bench-press-barbell"].gymDep = !db.EX_DB["bench-press-barbell"].gymDep;
  exercises["c-moje-ramena-ab12"] = {
    custom: true,
    name: "Moje ramena",
    pri: ["delt_f"],
    sec: ["delt_s", "triceps"],
    muscle: "shoulders",
    equip: "dumbbell",
    kind: "wr",
    gymDep: false,
  };
  return {
    app: "workout-denik",
    version: 2,
    exported: "2026-08-30T19:00:00.000Z",
    includes: { photos: false },
    cfg: { gyms: [{ id: "g-a", name: "Fitko z artefaktu", col: 1 }], defaultGymId: "g-a", restSec: 120 },
    exercises,
    templates: {
      "t-a": {
        name: "Ramena",
        items: [
          { exId: "c-moje-ramena-ab12", note: "", sets: [{ t: "n", kg: 10, reps: 12, sec: 0, km: 0 }] },
        ],
      },
    },
    months: {
      "2026-08": {
        "w-a": {
          title: "Ramena",
          start: Date.parse("2026-08-20T16:00:00Z"),
          end: Date.parse("2026-08-20T17:00:00Z"),
          gymId: "g-a",
          ex: [
            { exId: "c-moje-ramena-ab12", sets: [{ t: "n", kg: 10, reps: 12 }] },
            { exId: "bench-press-barbell", sets: [{ t: "n", kg: 70, reps: 8 }] },
          ],
        },
      },
    },
    body: {},
    photos: {},
  };
}

// (1) záloha z doby artefaktu
async function artifactCase(browser, url, check) {
  const db = loadExDb();
  const app = await P.openApp(browser, url);
  const toast = await P.importBackup(app, JSON.stringify(artifactBackup(db)), "replace");
  check.ok(toast && /Data nahrazena/.test(toast), "záloha z artefaktu se obnovila, hláška: " + toast);
  await app.goto();
  const out = (await P.exportBackup(app)).data;
  check.eq(out.exDb, 2, "artefakt: cviky převedené na novou databázi (exDb 2)");
  const stale = Object.entries(out.exercises)
    .filter(([, e]) => [...(e.pri || []), ...(e.sec || [])].some((k) => /^delt_/.test(k)))
    .map(([id]) => id);
  check.eq(stale, [], "artefakt: žádný cvik nemá staré partie delt_*");
  // výchozí cviky, které uživatel neupravil, mají přesně partie z EX_DB (nepočítají se jako úprava)
  const changed = Object.keys(db.EX_DB_OLD).filter((id) => {
    if (id === "ab-wheel" || id === "bench-press-barbell") return false;
    const ref = db.EX_DB[id];
    const refSec = (ref.sec || []).filter((k) => !(ref.pri || []).includes(k));
    const e = out.exercises[id];
    return JSON.stringify([e.pri, e.sec]) !== JSON.stringify([ref.pri, refSec]);
  });
  check.eq(changed, [], "artefakt: neupravené výchozí cviky mají partie z databáze");
  check.eq(out.exercises["ab-wheel"].archived, true, "artefakt: skrytý cvik zůstal skrytý");
  check.eq(
    out.exercises["bench-press-barbell"].gymDep,
    !db.EX_DB["bench-press-barbell"].gymDep,
    "artefakt: změněné vázání na fitko zůstalo",
  );
  const custom = out.exercises["c-moje-ramena-ab12"] || {};
  check.eq(
    [custom.name, custom.pri, custom.sec],
    ["Moje ramena", ["delts"], ["triceps"]],
    "artefakt: vlastní cvik",
  );
  check.eq(P.countWorkouts(out), 1, "artefakt: trénink");
  check.eq(Object.keys(out.templates), ["t-a"], "artefakt: šablona");
  check.eq(out.plan, {}, "artefakt: bez plánu (pole tehdy neexistovalo)");
  await app.act("tab", "hist");
  await app.act("histView", "list");
  await app.settle();
  await app.act("tab", "ex");
  await app.act("openEx", "c-moje-ramena-ab12");
  await app.settle();
  check.eq(app.errors, [], "artefakt: chyby v appce");
  await app.close();
}

module.exports = {
  name: "Starší formát zálohy",
  async run({ browser, url, check }) {
    await artifactCase(browser, url, check);

    // (2) verze 1
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
