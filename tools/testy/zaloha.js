/* Test 2 (F0-17): záloha tam a zpět. Appka s daty (zkušební tréninky, vlastní trénink, měření, fotka) se
   zazálohuje do souboru. Pak se (a) v téže appce přidá trénink navíc a obnoví se „Nahradit vše“, (b) záloha
   se obnoví do úplně čisté appky (nový telefon) včetně opětovného otevření appky. Po každém kroku se nová záloha
   musí rovnat původní (kromě času vytvoření), fotka také. Všechny druhy dat a Sloučit testuje zaloha-plna.js. */
const P = require("./pomocne.js");

module.exports = {
  name: "Záloha tam a zpět",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    await app.act("tab", "set");
    await app.act("setOpen", "about");
    await app.act("fakeAdd");
    await app.settle(1000);
    await P.recordWorkout(app, "bench-press-barbell", 8, 8);
    await P.addMeasurement(app, "2026-10-01", "81,4");
    await P.addPhoto(app, "bench-press-barbell");

    const first = await P.exportBackup(app);
    const original = P.withoutTime(first.data);
    const total = P.countWorkouts(first.data);
    check.ok(total >= 7, `záloha má mít aspoň 7 tréninků (6 zkušebních + vlastní), je jich ${total}`);
    check.eq(first.data.version, 2, "verze formátu zálohy");
    check.eq(Object.keys(first.data.body).length, 1, "počet měření v záloze");
    check.eq(Object.keys(first.data.photos).length, 1, "počet fotek v záloze");
    check.ok(first.name.endsWith(".json.txt"), "název souboru končí .json.txt, je " + first.name);

    // (a) změna dat a obnova v téže appce: trénink navíc musí zmizet
    await P.recordWorkout(app, "lateral-raise-dumbbell", 10, 4);
    const changed = await P.exportBackup(app);
    check.eq(P.countWorkouts(changed.data), total + 1, "po přidání tréninku je v záloze o jeden víc");
    const toastA = await P.importBackup(app, first.text, "replace");
    check.ok(toastA && /Data nahrazena/.test(toastA), "obnova v téže appce skončila hláškou: " + toastA);
    const restoredA = await P.exportBackup(app);
    check.eq(P.withoutTime(restoredA.data), original, "záloha po obnově v téže appce se rovná původní");
    app.errors.length && check.ok(false, "chyby v appce (a): " + app.errors.join(" | "));
    await app.close();

    // (b) čistá appka: obnova, zavření a znovu otevření appky, záloha
    const fresh = await P.openApp(browser, url);
    const toastB = await P.importBackup(fresh, first.text, "replace");
    check.ok(toastB && /Data nahrazena/.test(toastB), "obnova do čisté appky skončila hláškou: " + toastB);
    await fresh.goto();
    const restoredB = await P.exportBackup(fresh);
    check.eq(
      P.withoutTime(restoredB.data),
      original,
      "záloha po obnově do čisté appky a restartu se rovná původní",
    );

    fresh.errors.length && check.ok(false, "chyby v appce (b): " + fresh.errors.join(" | "));
    await fresh.close();
  },
};
