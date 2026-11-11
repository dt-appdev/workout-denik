/* Test (F3-53): stisk tlačítek. Dokud prst drží tlačítko Začít prázdný trénink (hlavní tlačítko), má
   tmavší odstín hlavní barvy (--accent-2) a je zmenšené; po puštění mimo tlačítko se vrátí a akce se nespustí.
   Záložka spodní lišty se při stisku zmenší. S „Odstranit animace“ (prefers-reduced-motion) se mění jen
   barva, ne velikost. Rychlé klepnutí drží stisk (.prs) aspoň PRESS_MIN (160 ms) a akci odloží, dlouhý stisk
   ji spustí hned po puštění. Zaškrtávátko: políčko se zaškrtne hned, řádek drží stisk. Nakonec projde
   tlačítka na hlavních obrazovkách se zkušebními daty a ohlásí každé, kterému stisk nezmění pozadí
   (vlastní barva tlačítka přebila stisk, jako dřív Přidat fotku). */
const P = require("./pomocne.js");

// prvky se stiskem jako PRESS_SEL v js/app.js (bez záložek spodní lišty, ty pozadí nemají)
const PRESS_SEL = [
  ".btn",
  ".iconbtn",
  ".okb",
  ".stype",
  ".chip",
  ".seg button",
  ".hw",
  ".exrow",
  ".pickrow .pick",
  ".tpl.tap",
  ".gym-c",
  ".setrow",
  ".exh-w",
  ".infob",
].join(", ");

// viditelné prvky se stiskem, kterým třída .prs nezmění pozadí (u řádku výběru cviků pozadí řádku)
const noPress = (page) =>
  page.$$eval(PRESS_SEL, (els) => {
    const bad = [];
    for (const el of els) {
      if (!el.getClientRects().length || el.closest("[inert]")) continue;
      const box = el.matches(".pick") ? el.parentElement : el;
      el.style.transition = box.style.transition = "none";
      const before = getComputedStyle(box).backgroundColor;
      el.classList.add("prs");
      const after = getComputedStyle(box).backgroundColor;
      el.classList.remove("prs");
      el.style.transition = box.style.transition = "";
      if (before === after) {
        bad.push(`${el.className} [${el.dataset.act || ""}]`);
      }
    }
    return [...new Set(bad)];
  });

// vzhled prvku: barva pozadí a transformace
const look = (page, sel) =>
  page.$eval(sel, (el) => {
    const st = getComputedStyle(el);
    return { bg: st.backgroundColor, tf: st.transform };
  });

// barva proměnné z :root převedená na rgb (stejný tvar jako getComputedStyle)
const varColor = (page, name) =>
  page.evaluate((name) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);

// stiskne prvek a vrátí jeho vzhled během stisku, pak prst pustí mimo něj
async function pressed(page, sel) {
  const box = await page.locator(sel).first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(250);
  const during = await look(page, sel);
  await page.mouse.move(2, 2);
  await page.mouse.up();
  await page.waitForTimeout(250);
  return during;
}

module.exports = {
  name: "Stisk tlačítek",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page } = app;
    await app.act("tab", "train");
    await app.settle();
    const btn = '.btn.primary[data-act="startEmpty"]';
    check.ok(await page.$(btn), "na záložce Trénink je Začít prázdný trénink");

    const rest = await look(page, btn);
    const during = await pressed(page, btn);
    const after = await look(page, btn);
    check.eq(during.bg, await varColor(page, "--accent-2"), "stisk: hlavní tlačítko má odstín --accent-2");
    check.ok(during.tf !== "none", "stisk: hlavní tlačítko je zmenšené");
    check.eq(after, rest, "po puštění: hlavní tlačítko vypadá jako před stiskem");
    check.ok(await page.$(btn), "puštění mimo tlačítko trénink nespustilo");

    const tab = '.tabs button[data-act="tab"][data-v="hist"]';
    check.ok((await pressed(page, tab)).tf !== "none", "stisk: záložka spodní lišty je zmenšená");

    await page.emulateMedia({ reducedMotion: "reduce" });
    const calm = await pressed(page, btn);
    check.eq(calm.tf, "none", "Odstranit animace: bez zmenšení");
    check.eq(calm.bg, await varColor(page, "--accent-2"), "Odstranit animace: barva stisku zůstává");

    await page.emulateMedia({ reducedMotion: "no-preference" });

    // rychlé klepnutí: stisk zůstane vidět a trénink začne až po PRESS_MIN
    const box = await page.locator(btn).boundingBox();
    const mid = [box.x + box.width / 2, box.y + box.height / 2];
    await page.mouse.move(...mid);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(60);
    const quick = await page.$eval(btn, (el) => el.classList.contains("prs")).catch(() => "tlačítko zmizelo");
    check.eq(quick, true, "rychlé klepnutí: po 60 ms je tlačítko pořád stisknuté a trénink nezačal");
    await page.waitForTimeout(400);
    check.ok(!(await page.$(btn)), "rychlé klepnutí: po odkladu trénink začal");

    // dlouhý stisk: akce hned po puštění (Zahodit trénink otevře potvrzení)
    const discard = '.btn.danger[data-act="discard"]';
    await page.$eval(discard, (el) => el.scrollIntoView({ block: "center" }));
    const dbox = await page.locator(discard).boundingBox();
    await page.mouse.move(dbox.x + dbox.width / 2, dbox.y + dbox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(250);
    await page.mouse.up();
    await page.waitForTimeout(30);
    check.ok(await page.$("#sheetRoot .sheet"), "dlouhý stisk: potvrzení Zahodit hned po puštění");
    check.eq(await page.$$eval(".prs", (els) => els.length), 0, "po akci nezůstal žádný stisk");
    await page.goBack();
    await app.settle();
    check.ok(!(await page.$("#sheetRoot .sheet")), "Zpět zavře potvrzení");

    // rychlé klepnutí na Zahodit: panel se otevře až po odkladu a Zpět ho zavře (odložená akce volá navEnsure)
    await page.mouse.move(dbox.x + dbox.width / 2, dbox.y + dbox.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(400);
    check.ok(await page.$("#sheetRoot .sheet"), "rychlé klepnutí: potvrzení Zahodit po odkladu");
    await page.goBack();
    await app.settle();
    check.ok(!(await page.$("#sheetRoot .sheet")), "rychlé klepnutí: Zpět zavře potvrzení");
    check.ok(await page.$(discard), "Zpět neopustil rozdělaný trénink");

    // zaškrtávátko Tlačítka +/− v Nastavení → Trénink: rychlé klepnutí na text
    await app.act("discardOk");
    await P.openSettings(app, "train");
    const sw = '.switch:has(input[data-act="stepper"])';
    const was = await page.$eval(`${sw} input`, (el) => el.checked);
    const sbox = await page.locator(`${sw} span`).boundingBox();
    await page.mouse.move(sbox.x + sbox.width / 2, sbox.y + sbox.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(60);
    const quickSw = await page.$eval(sw, (el) => [el.classList.contains("prs"), el.querySelector("input").checked]);
    check.eq(quickSw, [true, !was], "zaškrtávátko: hned zaškrtnuté a řádek drží stisk");
    await page.waitForTimeout(400);
    check.eq(await page.$eval(`${sw} input`, (el) => el.checked), !was, "zaškrtávátko: změna zůstala");
    check.eq(await page.$$eval(".prs", (els) => els.length), 0, "zaškrtávátko: stisk zmizel");
    check.eq(app.errors, [], "bez chyb na stránce");
    await app.close();

    // všechna tlačítka na hlavních obrazovkách se zkušebními daty: stisk musí změnit pozadí
    const full = await P.openApp(browser, url);
    await full.act("fakeAdd");
    await full.settle(800);
    const screens = [
      ["Trénink", [["tab", "train"]]],
      ["Historie", [["tab", "hist"], ["histView", "list"]]],
      ["Statistiky", [["tab", "stats"], ["statsPart", "over"]]],
      ["Statistiky – cviky", [["statsPart", "ex"]]],
      ["Tělo", [["tab", "body"]]],
      ["Cviky", [["tab", "ex"]]],
      ["Cvik", [["openEx", "bench-press-barbell"], ["exPart", "info"]]],
      ["Nastavení", [["tab", "set"]]],
      ["Nastavení – Trénink", [["setOpen", "train"]]],
      ["Rozdělaný trénink", [["tab", "train"], ["startEmpty"]]],
      ["Výběr cviků", [["addEx"]]],
    ];
    for (const [name, steps] of screens) {
      for (const [a, v] of steps) {
        await full.act(a, v);
        await full.settle(300);
      }
      check.eq(await noPress(full.page), [], `${name}: stisk mění pozadí všech tlačítek`);
    }
    check.eq(full.errors, [], "bez chyb na stránce (zkušební data)");
    await full.close();
  },
};
