/* Test (F3-53): stisk tlačítek. Dokud prst drží tlačítko Začít prázdný trénink (hlavní tlačítko), má
   tmavší odstín hlavní barvy (--accent-2) a je zmenšené; po puštění se vrátí. Záložka spodní lišty se při
   stisku zmenší. S „Odstranit animace“ (prefers-reduced-motion) se mění jen barva, ne velikost.
   Prst se pouští mimo tlačítko, aby se akce nespustila. */
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

    check.eq(app.errors, [], "bez chyb na stránce");
    await app.close();
  },
};
