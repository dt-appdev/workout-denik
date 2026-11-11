/* Test (F1-27): klávesnice nezakryje řádek série. Otevření klávesnice se simuluje zmenšením okna (stejně jako
   s interactive-widget=resizes-content v telefonu). Po Napsat u poslední série posledního cviku: body má třídu kb,
   lišta se záložkami je schovaná a políčko je celé ve viditelné části pod horní lištou. Panel poznámky s klávesnicí
   je nad ní celý i s tlačítkem Uložit. Po zavření klávesnice (původní výška) třída kb zmizí a lišta je zpět. */
const P = require("./pomocne.js");

const FULL = 915;
const WITH_KB = 625; // výška okna s otevřenou klávesnicí (asi 290 px klávesnice)

// klepnutí na tlačítko s data-act a data-i (delegace kliknutí v appce)
const actI = (page, name, i) =>
  page.evaluate(
    ([name, i]) => {
      const btn = document.createElement("button");
      btn.dataset.act = name;
      btn.dataset.i = String(i);
      document.getElementById("app").appendChild(btn);
      btn.click();
      btn.remove();
    },
    [name, i],
  );

// stav stránky: třída kb, viditelnost lišty, poloha políčka s fokusem vůči horní liště a spodnímu okraji okna
const pageState = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    const r = el ? el.getBoundingClientRect() : null;
    const top = document.querySelector("#app .top");
    const tabs = document.querySelector(".tabs");
    return {
      kb: document.body.classList.contains("kb"),
      tabs: !!(tabs && tabs.offsetHeight),
      tag: el ? el.tagName : "",
      inSheet: !!(el && el.closest(".sheet")),
      top: r ? r.top : -1,
      bottom: r ? r.bottom : -1,
      barBottom: top ? top.getBoundingClientRect().bottom : 0,
      height: window.innerHeight,
    };
  });

module.exports = {
  name: "Klávesnice nezakryje řádek série",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url, { height: FULL });
    const { page } = app;

    // rozdělaný trénink se třemi cviky, aby byl poslední cvik dole na stránce
    await app.act("tab", "train");
    await app.act("startEmpty");
    await app.settle();
    await app.act("addEx");
    for (const id of ["bench-press-barbell", "leg-press-machine", "lateral-raise-dumbbell"]) {
      await app.act("pickToggle", id);
    }
    await app.act("pickDone");
    await app.settle();
    let s = await pageState(page);
    check.ok(!s.kb && s.tabs, "bez klávesnice: lišta se záložkami je vidět a body nemá třídu kb");

    // poslední série posledního cviku: krokovač → Napsat
    const inputs = await page.$$('#app input[data-act="kk"]');
    const last = inputs[inputs.length - 2];
    await last.scrollIntoViewIfNeeded();
    await last.click();
    await app.settle();
    check.ok(await page.$('.sheet [data-act="kkKbd"]'), "krokovač má tlačítko Napsat");
    await page.click('.sheet [data-act="kkKbd"]');
    await app.settle();
    // klávesnice se otevře: okno se zmenší
    await page.setViewportSize({ width: 412, height: WITH_KB });
    await app.settle(500);
    s = await pageState(page);
    check.ok(s.tag === "INPUT" && !s.inSheet, "po Napsat je fokus v políčku série: " + s.tag);
    check.ok(s.kb, "s klávesnicí má body třídu kb");
    check.ok(!s.tabs, "s klávesnicí je lišta se záložkami schovaná");
    check.ok(
      s.top >= s.barBottom && s.bottom <= s.height,
      `políčko série je celé vidět nad klávesnicí (${Math.round(s.top)}–${Math.round(s.bottom)}, ` +
        `horní lišta do ${Math.round(s.barBottom)}, okno ${s.height})`,
    );

    // klávesnice se zavře
    await page.setViewportSize({ width: 412, height: FULL });
    await app.settle(500);
    s = await pageState(page);
    check.ok(!s.kb && s.tabs, "po zavření klávesnice lišta zpět a třída kb pryč");

    // panel poznámky s klávesnicí: celý nad klávesnicí i s tlačítkem Uložit
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await app.settle();
    await actI(page, "exNote", 2);
    await app.settle(500);
    await page.setViewportSize({ width: 412, height: WITH_KB });
    await app.settle(500);
    s = await pageState(page);
    check.ok(s.tag === "TEXTAREA" && s.inSheet && s.kb, "panel poznámky: fokus v políčku a třída kb");
    const save = await page.evaluate(() => {
      const btn = document.querySelector('.sheet [data-act="noteSave"]');
      const r = btn ? btn.getBoundingClientRect() : null;
      return r ? { top: r.top, bottom: r.bottom } : null;
    });
    check.ok(
      save && save.top >= 0 && save.bottom <= WITH_KB,
      "panel poznámky: tlačítko Uložit je nad klávesnicí " + JSON.stringify(save),
    );

    check.eq(app.errors, [], "chyby v konzoli");
    await app.close();
  },
};
