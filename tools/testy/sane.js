/* Test 10 (F4-16): cvik Vzdálenost se zátěží (tlačení saní). Série se zapíše krokovačem (metry a kg), uloží se
   do tréninku jako m a kg, text série je „20m×50kg“ a do objemu tréninku se nepočítá. Další trénink předvyplní
   metry i váhu z minula; po zkrácené sérii má souhrn porovnání Nejlepší a Práce v kg·m a stránka cviku
   dlaždici Práce a grafy pro saně, bez odhadu 1RM. */
const P = require("./pomocne.js");

const EX = "sled-push";

async function startWorkout(app) {
  await app.act("tab", "train");
  await app.act("startEmpty");
  await app.settle();
  await app.act("addEx");
  await app.act("pickToggle", EX);
  await app.act("pickDone");
  await app.settle();
}

async function finish(app) {
  await app.page.click('#app [data-act="finish"]');
  await app.settle();
  await app.act("finishOk");
  await app.settle(800);
  return app.page.evaluate(() => document.getElementById("app").innerText);
}

// dlaždice souhrnu tréninku jako {popisek: hodnota}
const kpis = (page) =>
  page.$$eval("#app .kpi", (els) => {
    const out = {};
    for (const el of els) {
      const b = el.querySelector("b");
      const label = el.querySelector("span");
      if (b && label) out[label.textContent.trim()] = b.textContent.trim();
    }
    return out;
  });

module.exports = {
  name: "Saně",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page } = app;

    // první trénink: série krokovačem 20 m (4 × 5 m) a 50 kg (20 × 2,5 kg)
    await startWorkout(app);
    const heads = await page.$$eval("#app table.sets thead th", (els) =>
      els.map((el) => el.textContent.trim()),
    );
    check.ok(
      heads.includes("m") && !heads.includes("Opak."),
      "sloupce série m a kg bez Opak., jsou " + heads,
    );
    await page.click('#app [data-act="done"][data-i="0"][data-j="0"]');
    await app.settle();
    check.ok(await page.$('.sheet .kk-b[data-kf="m"]'), "krokovač má tlačítka pro metry");
    for (let n = 0; n < 4; n++) await page.click('.sheet .kk-b[data-kf="m"][data-kk="1"]');
    for (let n = 0; n < 20; n++) await page.click('.sheet .kk-b[data-kf="kg"][data-kk="1"]');
    await page.click('.sheet [data-act="kkDone"]');
    await app.settle();
    await app.act("closeSheet");
    await app.settle();
    const first = await finish(app);
    check.ok(first.includes("20m×50kg"), "souhrn ukazuje sérii 20m×50kg");
    check.eq((await kpis(page)).Objem, "0 kg", "saně se do objemu tréninku nepočítají");

    // druhý trénink: předvyplnění z minula, druhá série nedotlačená (14 m)
    await startWorkout(app);
    const hint = await page.$$eval('#app table.sets input[data-j="0"]', (els) =>
      els.map((el) => [el.dataset.f, el.placeholder]),
    );
    check.eq(
      hint,
      [
        ["m", "20"],
        ["kg", "50"],
      ],
      "předvyplnění metrů a kg z minula",
    );
    await page.click('#app [data-act="done"][data-i="0"][data-j="0"]');
    await app.settle();
    await app.act("closeSheet");
    await page.click('#app [data-act="addSet"][data-i="0"]');
    await app.settle();
    // druhá série: krokovač začíná na 20 m ze série nad, jeden krok dolů (5 m) = 15 m, Série hotová ji odškrtne
    await page.click('#app input[data-f="m"][data-i="0"][data-j="1"]');
    await app.settle();
    await page.click('.sheet .kk-b[data-kf="m"][data-kk="-1"]');
    await page.click('.sheet [data-act="kkDone"]');
    await app.settle();
    await app.act("closeSheet");
    await app.settle();
    const second = await finish(app);
    check.ok(second.includes("20m×50kg") && second.includes("15m×50kg"), "souhrn: 20m×50kg a 15m×50kg");
    check.ok(/Práce\s*1\s*750 kg·m/.test(second), "souhrn cviku ukazuje práci 1 750 kg·m");
    check.ok(!/1RM/.test(second), "souhrn saní bez odhadu 1RM");

    // stránka cviku: dlaždice Práce, rekordy bez odhadu 1RM
    await app.act("tab", "ex");
    await app.act("openEx", EX);
    await app.act("exPart", "stats");
    await app.settle();
    const stats = await page.evaluate(() => document.getElementById("app").innerText);
    check.ok(/Práce kg·m/i.test(stats), "dlaždice Práce kg·m");
    const charts = await page.$$eval('#app [data-act="detailMetric"]', (els) =>
      els.map((el) => el.dataset.v),
    );
    check.eq(charts, ["max", "swork", "work", "m"], "grafy Max zátěž, Práce série, Práce tréninku, Nejdelší");
    check.ok(!stats.includes("Odh. 1RM"), "bez odhadu 1RM");

    check.eq(app.errors, [], "chyby v appce");
    await app.close();
  },
};
