/* Test (F3-53): stisk tlačítek. Dokud prst drží tlačítko Začít prázdný trénink (hlavní tlačítko), má
   tmavší odstín hlavní barvy (--accent-2) a je zmenšené; po puštění mimo tlačítko se vrátí a akce se nespustí.
   Záložka spodní lišty se při stisku zmenší. S „Odstranit animace“ (prefers-reduced-motion) se mění jen
   barva, ne velikost. Rychlé klepnutí drží stisk (.prs) aspoň PRESS_MIN (160 ms) a akci odloží, dlouhý stisk
   ji spustí hned po puštění. */
const P = require("./pomocne.js");

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

    check.eq(app.errors, [], "bez chyb na stránce");
    await app.close();
  },
};
