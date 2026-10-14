/* Test 5 (F1-24): stopky u série na čas. Odpočet před startem se v Nastavení zkrátí na 1 s. Tlačítko stopek mají
   jen série na čas, Zrušit při odpočtu nic nezapíše, Stop za běhu zapíše naměřený čas (sérii neodškrtne) a při
   dalším tréninku se z něj stane cíl: stopky se v cíli samy zastaví a zapíšou cílový čas. Čas přepsaný
   v políčku má přednost před časem z minula. */
const P = require("./pomocne.js");

const ROW = '#app table.sets [data-act="stwGo"]';

// políčko Čas série j prvního cviku
const secValue = (page, j) => page.$eval(`#app input[data-f="sec"][data-i="0"][data-j="${j}"]`, (el) => el.value);

async function startWorkout(app, exIds) {
  await app.act("tab", "train");
  await app.act("startEmpty");
  await app.settle();
  await app.act("addEx");
  for (const id of exIds) await app.act("pickToggle", id);
  await app.act("pickDone");
  await app.settle();
}

async function run({ browser, url, check }) {
  const app = await P.openApp(browser, url);
  const { page } = app;

  // odpočet před startem 1 s (posuvník v Nastavení → Trénink)
  await P.openSettings(app, "train");
  await page.$eval("#stwPre", (el) => {
    el.value = 1;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await app.settle();
  check.eq(await page.$eval("#stwPreV", (el) => el.textContent), "0:01", "posuvník ukazuje odpočet 0:01");

  // tlačítko stopek mají jen série na čas
  await startWorkout(app, ["plank", "bench-press-barbell"]);
  const buttons = await page.$$eval(ROW, (els) => els.map((el) => el.dataset.i));
  check.eq(buttons, ["0", "0", "0"], "tlačítko stopek jen u tří sérií planku, ne u bench pressu");

  // Zrušit při odpočtu startu nic nezapíše
  await page.click(`${ROW}[data-j="0"]`);
  await app.settle(100);
  check.eq(await page.$eval("#restClock", (el) => el.nextElementSibling.textContent.trim()), "Start za", "pruh ukazuje odpočet startu");
  await page.click('#rest [data-act="stwStop"]');
  await app.settle(300);
  check.eq(await secValue(page, 0), "", "Zrušit nic nezapsalo");
  check.ok(await page.$eval("#rest", (el) => el.hidden), "po Zrušit pruh zmizel");

  // běh: odpočet 1 s, pak počítání nahoru, Stop zapíše naměřený čas
  await page.click(`${ROW}[data-j="0"]`);
  await app.settle(1700);
  const label = await page.$eval("#restClock", (el) => el.nextElementSibling.textContent.trim());
  check.eq(label, "Výdrž", "po odpočtu pruh ukazuje Výdrž (bez cíle, cvik nemá minulý trénink)");
  await app.settle(2500);
  await page.click('#rest [data-act="stwStop"]');
  await app.settle(300);
  const first = await secValue(page, 0);
  check.ok(/^0:0[2-4]$/.test(first), "Stop zapsal naměřený čas, je " + first);
  check.eq(
    await page.$eval('#app [data-act="done"][data-i="0"][data-j="0"]', (el) => el.getAttribute("aria-pressed")),
    "false",
    "Stop sérii neodškrtl",
  );
  const target = first;
  await page.click('#app [data-act="done"][data-i="0"][data-j="0"]');
  await app.settle();
  await app.act("closeSheet");
  await page.click('#app [data-act="finish"]');
  await app.settle();
  await app.act("finishOk");
  await app.settle(800);

  // další trénink: minulý čas je cíl, v cíli se stopky samy zastaví a zapíšou ho
  await startWorkout(app, ["plank"]);
  check.eq(await page.$eval('#app input[data-f="sec"][data-j="0"]', (el) => el.placeholder), target, "cíl z minula");
  await page.click(`${ROW}[data-j="0"]`);
  await app.settle(1500);
  const goalLabel = await page.$eval("#restClock", (el) => el.nextElementSibling.textContent.trim());
  check.eq(goalLabel, "Výdrž · cíl " + target, "pruh ukazuje cíl");
  check.ok(await page.$("#restBar"), "pásek roste k cíli");
  await app.settle(4500);
  check.eq(await secValue(page, 0), target, "v cíli se zapsal cílový čas");
  check.ok(await page.$eval("#rest", (el) => el.hidden), "v cíli stopky skončily a pruh zmizel");
  check.eq(
    await page.$eval('#app [data-act="done"][data-i="0"][data-j="0"]', (el) => el.getAttribute("aria-pressed")),
    "false",
    "ani cíl sérii neodškrtl",
  );
  await page.click('#app [data-act="addSet"][data-i="0"]');
  await app.settle(200);
  // přepsaná hodnota v políčku má před hodnotou z minula přednost: cíl 0:02 místo 0:03
  await page.$eval('#app input[data-f="sec"][data-j="1"]', (el) => {
    el.removeAttribute("readonly");
    el.value = "0:02";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await app.settle();
  await page.click(`${ROW}[data-j="1"]`);
  await app.settle(1500);
  const typedLabel = await page.$eval("#restClock", (el) => el.nextElementSibling.textContent.trim());
  check.eq(typedLabel, "Výdrž · cíl 0:02", "cíl je přepsaná hodnota, ne hodnota z minula");
  await app.settle(3000);
  check.eq(await secValue(page, 1), "0:02", "v přepsaném cíli se zapsal 0:02");
  check.ok(await page.$eval("#rest", (el) => el.hidden), "stopky v přepsaném cíli skončily");
  check.eq(await page.evaluate(() => localStorage.length > 0), true, "úložiště je v pořádku");
  check.eq(app.errors, [], "žádné chyby v konzoli");
  await app.close();
}

module.exports = { name: "stopky u série na čas", run };
