/* Test 15 (F4-18): export WD-LOG v2 pro coache a čas u ručního měření.
   (a) Unit testy funkcí js/wdlog.js přímo v Node (bez prohlížeče) v časovém pásmu Europe/Prague: období
       a hranice dnů (i přechod na zimní čas 25. 10. 2026), převod časů, zápis sérií (všechny druhy a typy
       cviků), formát čísel, měření, bolest, výběr nových cviků, prázdné období, název souboru.
   (b) V appce: sekce Pro coache v Nastavení → Data a záloha, panel exportu (čipy období, ručně změněné datum
       čipy odznačí a pamatuje se), stránka tréninku bez Kopírovat pro coache, nové měření s vlastním časem
       a úprava měření, která zachová čas i shId z importu ze Samsung Health. */
const fs = require("fs");
const path = require("path");
const P = require("./pomocne.js");

const WDLOG_FILE = path.join(P.ROOT, "js", "wdlog.js");

// čas „RRRR-MM-DDTHH:MM“ v aktuálním pásmu procesu (ms)
const at = (s) => new Date(s).getTime();

const EX = {
  hack: {
    cz: "Hack dřep na stroji",
    name: "Hack Squat (Machine)",
    kind: "wr",
    equip: "machine",
    pri: ["quads"],
    sec: ["glutes"],
    gymDep: true,
  },
  pull: { cz: "Shyby", name: "Pull Up", kind: "bw", equip: "bodyweight", pri: ["lats"], sec: [] },
  dip: {
    cz: "Kliky na bradlech se zátěží",
    name: "Weighted Dip",
    kind: "bwplus",
    equip: "other",
    pri: ["triceps"],
    sec: ["chest"],
  },
  apull: {
    cz: "Shyby s dopomocí",
    name: "Assisted Pull Up",
    kind: "assist",
    equip: "machine",
    pri: ["lats"],
    sec: [],
  },
  plank: { cz: "Prkno", name: "Plank", kind: "time", equip: "bodyweight", pri: ["abs"], sec: [] },
  wplank: {
    cz: "Prkno se zátěží",
    name: "Weighted Plank",
    kind: "timew",
    equip: "other",
    pri: ["abs"],
    sec: [],
  },
  sled: { cz: "Tlačení saní", name: "Sled Push", kind: "distw", equip: "other", pri: ["quads"], sec: [] },
  same: { cz: "Crunch", name: "Crunch", kind: "wr", equip: "machine", pri: ["abs"], sec: [] },
};
const MUSCLES = {
  quads: "Kvadricepsy",
  glutes: "Hýždě",
  lats: "Široký sval zádový",
  triceps: "Triceps",
  chest: "Hrudník",
  abs: "Přímý sval břišní",
};
const EQUIP = { machine: "Stroj", bodyweight: "Vlastní váha", other: "Jiné" };

function data(o) {
  return Object.assign(
    {
      workouts: [],
      body: [],
      now: at("2026-10-25T21:10"),
      ex: (id) => EX[id] || null,
      gymName: (id) => ({ g1: "WinningGym" })[id] || "Smazané fitko",
      tplName: (id) => ({ t1: "S1 Lower" })[id] || "",
      muscle: (k) => MUSCLES[k] || k,
      equip: (k) => EQUIP[k] || "",
    },
    o,
  );
}

function unit(check) {
  const tz = process.env.TZ;
  process.env.TZ = "Europe/Prague";
  delete require.cache[WDLOG_FILE];
  const W = require(WDLOG_FILE);
  try {
    // období (neděle 18. 10. 2026 20:00 a pondělí 19. 10.)
    const sun = at("2026-10-18T20:00");
    check.eq(W.period("today", sun), { from: "2026-10-18", to: "2026-10-18" }, "období Dnes");
    check.eq(W.period("7d", sun), { from: "2026-10-12", to: "2026-10-18" }, "období 7 dní");
    check.eq(W.period("week", sun), { from: "2026-10-12", to: "2026-10-18" }, "Tento týden v neděli");
    check.eq(W.period("lastweek", sun), { from: "2026-10-05", to: "2026-10-11" }, "Minulý týden");
    const mon = at("2026-10-19T00:10");
    check.eq(W.period("week", mon), { from: "2026-10-19", to: "2026-10-25" }, "Tento týden v pondělí");
    check.eq(W.period("lastweek", mon), { from: "2026-10-12", to: "2026-10-18" }, "Minulý týden v pondělí");
    // hranice dne při přechodu na zimní čas: 25. 10. 2026 má 25 hodin
    const [a, b] = W.range("2026-10-25", "2026-10-25");
    check.eq((b - a) / 3600000, 25, "den změny času má 25 h");
    check.eq(new Date(a).toISOString(), "2026-10-24T22:00:00.000Z", "začátek dne 25. 10. (letní čas)");
    check.eq(new Date(b).toISOString(), "2026-10-25T23:00:00.000Z", "konec dne 25. 10. (zimní čas)");
    check.eq(W.range("2026-10-18", "2026-10-12")[0], at("2026-10-12T00:00"), "obrácené pořadí dat");
    check.eq(W.fileName("2026-10-19", "2026-10-25"), "wd-log-2026-10-19_2026-10-25.md", "název souboru");
    check.eq(W.fileName("2026-10-18", "2026-10-18"), "wd-log-2026-10-18.md", "název souboru jednoho dne");

    // čísla
    check.eq(
      [W.num(55), W.num(32.5), W.num(77.4), W.num("62.50"), W.num(0.1 + 0.2)],
      ["55", "32.5", "77.4", "62.5", "0.3"],
      "čísla bez zbytečných nul s tečkou",
    );
    check.eq([W.num1(44), W.num1(77.44), W.num1(60)], ["44.0", "77.4", "60.0"], "hodnoty měření");

    // série: druhy w, n, f, d a RIR = 10 − RPE
    const wr = [
      { t: "w", kg: 30, reps: 10 },
      { t: "w", kg: 45, reps: 5, rpe: 6 },
      { t: "n", kg: 55, reps: 10, rpe: 8 },
      { t: "n", kg: 55, reps: 9, rpe: 8.5 },
      { t: "n", kg: 55, reps: 8 },
      { t: "f", kg: 35, reps: 9, rpe: 10, rpeEst: 8 },
      { t: "d", kg: 25, reps: 6 },
      { t: "d", kg: 20, reps: 5, rpe: 9 },
    ];
    check.eq(
      W.sets("wr", wr),
      "W 10×30kg, 5×45kg | 10×55kg RIR 2, 9×55kg RIR 1.5, 8×55kg, " +
        "9×35kg F (odhad RIR 2) + D 6×25kg + D 5×20kg RIR 1",
      "série wr se všemi druhy",
    );
    check.eq(
      W.sets("wr", [{ t: "n", kg: 50, reps: 10, rpe: 8 }]),
      "10×50kg RIR 2",
      "bez rozcvičky bez W a |",
    );
    check.eq(W.sets("wr", [{ t: "f", kg: 50, reps: 8 }]), "8×50kg F", "F bez odhadu");
    check.eq(W.sets("wr", [{ t: "d", kg: 40, reps: 6 }]), "D 6×40kg", "drop set bez předchozí série");
    check.eq(W.sets("wr", [{ t: "w", kg: 20, reps: 12 }]), "W 12×20kg", "jen rozcvička");
    check.eq(W.sets("wr", []), "–", "cvik bez sérií");
    const one = (kind, s) => W.sets(kind, [Object.assign({ t: "n" }, s)]);
    check.eq(one("bw", { reps: 10, kg: 0 }), "10×BW", "kind bw");
    check.eq(one("bwplus", { reps: 8, kg: 10 }), "8×BW+10kg", "kind bwplus");
    check.eq(one("bwplus", { reps: 8, kg: 0 }), "8×BW", "kind bwplus bez zátěže");
    check.eq(one("assist", { reps: 6, kg: 20, rpe: 9 }), "6×A-20kg RIR 1", "kind assist");
    check.eq(one("time", { sec: 60 }), "60 s", "kind time");
    check.eq(one("timew", { sec: 45, kg: 20 }), "45 s×20kg", "kind timew");
    check.eq(one("distw", { m: 25, kg: 85 }), "25m×85kg", "kind distw");
    check.eq(one("dist", { km: 5, sec: 1500 }), "5 km 1500 s", "kind dist");

    // trénink a měření, převod času přes změnu času (02:30 letního a 02:30 zimního času)
    const old = {
      start: at("2026-10-10T18:00"),
      end: at("2026-10-10T19:00"),
      ex: [{ exId: "same", sets: [] }],
    };
    const w1 = {
      start: Date.parse("2026-10-25T00:30:00Z"), // 02:30 letního času
      end: Date.parse("2026-10-25T03:00:00Z"), // 04:00 zimního času = 150 min
      gymId: "g1",
      tplId: "t1",
      feel: 7,
      energy: 6,
      sleep: 7,
      pain: { where: "koleno P", level: 1, exId: "hack" },
      note: "fitko plné,\npořadí přeházené",
      ex: [
        { exId: "sled", sets: [{ t: "n", m: 20, kg: 40, at: Date.parse("2026-10-25T01:50:00Z") }] },
        {
          exId: "hack",
          note: "1. série s jinou opěrkou",
          sets: [
            { t: "w", kg: 30, reps: 10, at: Date.parse("2026-10-25T00:40:00Z") },
            { t: "n", kg: 55, reps: 10, rpe: 8, at: Date.parse("2026-10-25T00:45:00Z") },
          ],
        },
        { exId: "same", sets: [{ t: "n", kg: 30, reps: 15, at: Date.parse("2026-10-25T01:55:00Z") }] },
      ],
    };
    const w2 = {
      start: at("2026-10-21T19:05"),
      end: at("2026-10-21T20:35"),
      gymId: "g1",
      tplId: "smazana",
      pain: { level: 0 },
      ex: [{ exId: "pull", sets: [{ t: "n", reps: 8 }] }],
    };
    const w3 = {
      start: at("2026-10-22T18:40"),
      end: at("2026-10-22T19:40"),
      ex: [{ exId: "pull", sets: [] }],
    };
    const body = [
      { date: at("2026-10-25T07:50"), weight: 76.2, note: "nová váha" },
      {
        date: at("2026-10-21T18:55"),
        weight: 77.4,
        fat: 18.1,
        muscle: 44,
        fatMass: 14,
        muscleMass: 34,
        water: 45,
        bmi: 24.7,
        bmr: 1700,
      },
      { date: at("2026-10-24T08:05"), waist: 89.5, arm: 38.5, thigh: 60 },
      { date: at("2026-10-23T08:00"), bmi: 24 }, // jen neexportované hodnoty: nevypíše se
      { date: at("2026-10-18T08:00"), weight: 80 }, // mimo období
    ];
    const text = W.text(data({ workouts: [w1, old, w2, w3], body, from: "2026-10-19", to: "2026-10-25" }));
    const expected = [
      "WD-LOG v2 · období 2026-10-19 – 2026-10-25 · export 2026-10-25 21:10",
      "Tréninky: 3 · Měření: 3",
      "",
      "## 2026-10-21 st · 19:05–20:35 (90 min) · WinningGym",
      "Bolest: ne",
      "1. Shyby (Pull Up) [pull]",
      "   8×BW",
      "",
      "## 2026-10-22 čt · 18:40–19:40 (60 min)",
      "Bolest: –",
      "1. Shyby (Pull Up) [pull]",
      "   –",
      "",
      "## 2026-10-25 ne · 02:30–04:00 (150 min) · WinningGym · S1 Lower",
      "Pocit 7 · Energie 6 · Spánek 7 h",
      "Bolest: koleno P 1/10 – Hack dřep na stroji",
      "Pozn.: fitko plné, pořadí přeházené",
      "1. Hack dřep na stroji (Hack Squat (Machine)) [hack]",
      "   W 10×30kg | 10×55kg RIR 2",
      "2. Tlačení saní (Sled Push) [sled]",
      "   20m×40kg",
      "3. Crunch [same]",
      "   15×30kg",
      "",
      "## Měření",
      "2026-10-21 st 18:55 · 77.4 kg · tuk 18.1 % · svaly 44.0 %",
      "2026-10-24 so 08:05 · pas 89.5 · paže 38.5 · stehno 60.0 cm",
      "2026-10-25 ne 07:50 · 76.2 kg · Pozn.: nová váha",
      "",
      "## Nové cviky",
      "- Shyby (Pull Up) [pull] · vlastní váha · primární: široký sval zádový · sekundární: – · gymDep: ne",
      "- Hack dřep na stroji (Hack Squat (Machine)) [hack] · stroj · primární: kvadricepsy · " +
        "sekundární: hýždě · gymDep: ano",
      "- Tlačení saní (Sled Push) [sled] · jiné · primární: kvadricepsy · sekundární: – · gymDep: ne",
    ];
    const lines = text.split("\n");
    check.eq(lines.length, expected.length, "počet řádků týdenního textu");
    expected.forEach((line, i) => check.eq(lines[i], line, `řádek ${i + 1} týdenního textu`));
    check.eq(
      W.counts(data({ workouts: [w1, old, w2, w3], body, from: "2026-10-19", to: "2026-10-25" })),
      { w: 3, b: 3, fresh: 3 },
      "počty pro souhrn v panelu",
    );

    // jeden den: hlavička s jedním datem, trénink jen z toho dne
    const daily = W.text(data({ workouts: [w1, w2], body, from: "2026-10-21", to: "2026-10-21" })).split(
      "\n",
    );
    check.eq(daily[0], "WD-LOG v2 · období 2026-10-21 · export 2026-10-25 21:10", "hlavička jednoho dne");
    check.eq(daily[1], "Tréninky: 1 · Měření: 1", "počty jednoho dne");

    // bolest bez místa a bez cviku
    const pain = W.text(
      data({
        workouts: [Object.assign({}, w3, { pain: { level: 3 } })],
        from: "2026-10-22",
        to: "2026-10-22",
      }),
    );
    check.ok(pain.includes("\nBolest: 3/10\n"), "bolest jen s intenzitou: " + pain);

    // prázdné období
    check.eq(
      W.text(data({ workouts: [w1], body, from: "2026-11-01", to: "2026-11-07" })),
      "WD-LOG v2 · období 2026-11-01 – 2026-11-07 · export 2026-10-25 21:10\nTréninky: 0 · Měření: 0\n\n" +
        "Žádné tréninky ani měření.",
      "prázdné období",
    );
  } finally {
    if (tz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = tz;
    }
  }
}

module.exports = {
  name: "Export pro coache",
  async run({ browser, url, check }) {
    unit(check);

    // zkušební data se zapnutou funkcí Pro coache a jedním měřením z importu ze Samsung Health
    const source = JSON.parse(fs.readFileSync(path.join(__dirname, "zaloha-v2-plna.json.txt"), "utf8"));
    source.cfg.coach = true;
    source.body["b-sh"] = { date: Date.parse("2026-09-30T16:13:44Z"), weight: 80.2, shId: "sh-uuid-1" };
    const app = await P.openApp(browser, url);
    const { page } = app;
    await P.importBackup(app, JSON.stringify(source), "replace");

    // Nastavení → Data a záloha → Pro coache → panel exportu
    await P.openSettings(app, "data");
    check.ok(await page.$('#app [data-act="cxOpen"]'), "v Data a záloha chybí Exportovat pro coache");
    await app.act("cxOpen");
    await app.settle(300);
    const state = () =>
      page.evaluate(() => ({
        on: [...document.querySelectorAll('.sheet [data-act="cxPer"][aria-pressed="true"]')].map(
          (b) => b.dataset.v,
        ),
        from: document.getElementById("cx-from").value,
        to: document.getElementById("cx-to").value,
        text: document.getElementById("cx-txt").value,
      }));
    let s = await state();
    check.eq(s.on, ["7d"], "výchozí období 7 dní");
    check.ok(s.text.startsWith("WD-LOG v2 · období "), "náhled textu: " + s.text.slice(0, 60));
    // vlastní období přes Push A (září 2026): čipy se odznačí, text obsahuje trénink
    await page.fill("#cx-from", "2026-08-01");
    await page.dispatchEvent("#cx-from", "change");
    await page.fill("#cx-to", "2026-09-30");
    await page.dispatchEvent("#cx-to", "change");
    await app.settle(200);
    s = await state();
    check.eq(s.on, [], "ručně změněné datum odznačí čipy");
    check.ok(/\n## 2026-09-\d\d .* Push A/.test(s.text), "text vlastního období bez tréninku Push A");
    check.ok(/\n## Měření\n/.test(s.text), "text vlastního období bez měření");
    await app.act("closeSheet");
    await app.act("cxOpen");
    await app.settle(300);
    s = await state();
    check.eq([s.on, s.from, s.to], [[], "2026-08-01", "2026-09-30"], "ručně zvolené období se pamatuje");
    await app.act("cxPer", "lastweek");
    await app.settle(200);
    s = await state();
    check.eq(s.on, ["lastweek"], "čip Minulý týden");
    await app.act("closeSheet");

    // stránka tréninku bez Kopírovat pro coache
    await app.act("tab", "hist");
    await app.act("histView", "list");
    await app.settle();
    await page.click("#app .hw");
    await app.settle(500);
    check.ok(!(await page.$('#app [data-act="coachCopy"]')), "stránka tréninku má Kopírovat pro coache");

    // nové měření s vlastním časem
    await app.act("tab", "body");
    await app.act("addBody");
    await app.settle(200);
    const time = await page.$eval("#b-time", (el) => {
      const hm = (t) => new Date(t).toTimeString().slice(0, 5);
      return { value: el.value, now: [hm(Date.now()), hm(Date.now() - 60000)] };
    });
    check.ok(time.now.includes(time.value), "nové měření nemá předvyplněný aktuální čas: " + time.value);
    await page.fill("#b-date", "2026-10-10");
    await page.fill("#b-time", "18:37");
    await page.fill("#b-weight", "79.1");
    await page.fill("#b-note", "váha InBody");
    await page.click('.sheet [data-act="saveBody"]');
    await app.settle(300);
    // úprava měření z importu: čas a shId zůstanou, změní se jen hmotnost
    await app.act("editBody", "b-sh");
    await app.settle(200);
    await page.fill("#b-weight", "80.4");
    await page.click('.sheet [data-act="saveBody"]');
    await app.settle(300);
    const listed = await page.evaluate(() => document.getElementById("app").innerText);
    const backup = await P.exportBackup(app);
    const items = Object.values(backup.data.body);
    const added = items.find((b) => b.weight === 79.1);
    const expectAt = await page.evaluate(() => new Date("2026-10-10T18:37").getTime());
    check.eq(added && [added.date, added.note], [expectAt, "váha InBody"], "nové měření s časem a poznámkou");
    const edited = backup.data.body["b-sh"] || {};
    check.eq(
      [edited.date, edited.weight, edited.shId],
      [Date.parse("2026-09-30T16:13:44Z"), 80.4, "sh-uuid-1"],
      "úprava měření zachová čas a shId",
    );
    check.ok(/10\. 10\. 2026 · 18:37/.test(listed), "seznam měření bez času");

    check.eq(app.errors, [], "chyby stránky");
    await app.close();
  },
};
