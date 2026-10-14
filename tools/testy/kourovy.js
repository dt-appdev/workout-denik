/* Test 1 (F0-17): kouřový test. Čistá appka se spustí bez chyby v konzoli, přidají se zkušební data, projdou
   se všechny záložky, podstránky Nastavení, stránky cviku a hlavní panely, zapíše a dokončí se trénink
   (objeví se v Historii a přežije restart appky). Pak totéž ještě jednou na úzkém displeji 360 px s písmem
   Největší: na žádné obrazovce nesmí být vodorovné posouvání stránky. Chyba = výjimka stránky, console.error
   nebo selhaný požadavek na vlastní soubor (app.errors v pomocne.js). */
const P = require("./pomocne.js");

// záložky a jejich obrazovky: [název, [akce data-act, data-v], …] jedna za druhou
const SCREENS = [
  ["Trénink", [["tab", "train"]]],
  [
    "Historie – kalendář",
    [
      ["tab", "hist"],
      ["histView", "cal"],
    ],
  ],
  ["Historie – seznam", [["histView", "list"]]],
  [
    "Statistiky – Přehled",
    [
      ["tab", "stats"],
      ["statsPart", "over"],
    ],
  ],
  ["Statistiky – Partie", [["statsPart", "mus"]]],
  ["Statistiky – Cviky", [["statsPart", "ex"]]],
  ["Tělo", [["tab", "body"]]],
  ["Cviky", [["tab", "ex"]]],
  [
    "Cvik – Popis",
    [
      ["openEx", "bench-press-barbell"],
      ["exPart", "info"],
    ],
  ],
  ["Cvik – Statistiky", [["exPart", "stats"]]],
  ["Cvik – Historie", [["exPart", "hist"]]],
  ["Nastavení", [["tab", "set"], ["setBack"]]],
  ["Nastavení – Fitka", [["setOpen", "gyms"]]],
  ["Nastavení – Trénink", [["setOpen", "train"]]],
  ["Nastavení – Rekordy a pokrok", [["setOpen", "rec"]]],
  ["Nastavení – Vzhled", [["setOpen", "look"]]],
  ["Nastavení – Data a záloha", [["setOpen", "data"]]],
  ["Nastavení – O aplikaci", [["setOpen", "about"]]],
];

// panely: název a akce, které ho otevřou (zavře se closeSheet)
const PANELS = [
  ["Nové měření", [["tab", "body"], ["addBody"]]],
  ["Nové fitko", [["tab", "set"], ["setOpen", "gyms"], ["addGym"]]],
  [
    "Nápověda",
    [
      ["tab", "set"],
      ["setOpen", "train"],
      ["help", "prog"],
    ],
  ],
  ["Výběr cviků", [["tab", "train"], ["startEmpty"], ["addEx"]]],
];

// stav stránky: text obrazovky a šířka obsahu proti šířce okna
function pageState(page) {
  return page.evaluate(() => ({
    text: document.getElementById("app").innerText.trim(),
    wide: document.documentElement.scrollWidth - window.innerWidth,
  }));
}

// projde všechny obrazovky a panely; overflow = hlídat i vodorovné posouvání
async function walk(app, check, label, overflow) {
  for (const [name, steps] of SCREENS) {
    for (const [act, v] of steps) {
      await app.act(act, v);
      await app.settle(250);
    }
    const state = await pageState(app.page);
    check.ok(state.text.length > 20, `${label}: obrazovka „${name}“ je prázdná`);
    if (overflow) {
      check.ok(state.wide <= 0, `${label}: obrazovka „${name}“ je o ${state.wide} px širší než okno`);
    }
  }
  for (const [name, steps] of PANELS) {
    for (const [act, v] of steps) {
      await app.act(act, v);
      await app.settle(250);
    }
    const sheet = await app.page.$(".sheet");
    check.ok(!!sheet, `${label}: panel „${name}“ se neotevřel`);
    if (overflow && sheet) {
      const wide = await app.page.evaluate(() => {
        const box = document.querySelector(".sheet");
        return box.scrollWidth - box.clientWidth;
      });
      check.ok(wide <= 0, `${label}: panel „${name}“ je o ${wide} px širší než okno`);
    }
    await app.act("closeSheet");
    await app.settle(250);
    // panel Výběr cviků běží v rozdělaném tréninku: zahodit, ať nezůstane
    if (await app.page.$('#app [data-act="discard"]')) {
      await app.act("discard");
      await app.settle(250);
      await app.act("discardOk");
      await app.settle(250);
    }
  }
}

module.exports = {
  name: "Kouřový test",
  async run({ browser, url, check }) {
    // 1) běžný displej
    const app = await P.openApp(browser, url);
    check.ok(await app.page.$("#app .tabs, #app .top"), "appka po startu nic nevykreslila");
    await app.act("tab", "set");
    await app.act("setOpen", "about");
    await app.act("fakeAdd");
    await app.settle(1000);
    await walk(app, check, "412 px", false);

    const text = await P.recordWorkout(app, "bench-press-barbell", 8, 8);
    check.ok(
      /HOTOVO/.test(text) && /\d+×[\d,]+kg/.test(text),
      "souhrn nového tréninku: " + text.slice(0, 120),
    );
    await app.act("tab", "hist");
    await app.act("histView", "list");
    await app.settle();
    const rows = await app.page.$$eval(".hw", (list) => list.length);
    check.eq(rows, 7, "Historie ukazuje 6 zkušebních a 1 vlastní trénink");
    await app.goto();
    await app.act("tab", "hist");
    await app.act("histView", "list");
    await app.settle();
    check.eq(await app.page.$$eval(".hw", (list) => list.length), 7, "po restartu appky je tréninků pořád 7");
    check.eq(app.errors, [], "chyby v appce (412 px)");
    await app.close();

    // 2) úzký displej s největším písmem
    const narrow = await P.openApp(browser, url, { width: 360, height: 700 });
    await narrow.act("tab", "set");
    await narrow.act("setOpen", "look");
    await narrow.act("fontScale", "xl");
    await narrow.settle();
    await narrow.act("setOpen", "about");
    await narrow.act("fakeAdd");
    await narrow.settle(1000);
    await walk(narrow, check, "360 px, písmo Největší", true);
    check.eq(narrow.errors, [], "chyby v appce (360 px)");
    await narrow.close();
  },
};
