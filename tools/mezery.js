/* Měření svislých mezer mezi bloky stránky (F3-43) a panelu (F3-44). Spouští se lokálně před PR se změnou
   vzhledu, v GitHubu ne (Playwright by byl npm závislost). Pravidlo: 10 px uvnitř skupiny, 22 px mezi
   skupinami, 8 px mezi kartami a řádky seznamu (--gap-in, --gap-out, --gap-list v css/app.css). V panelu
   stejně, popisek nad políčkem nebo čipy 4 px (--gap-lbl).

   Postup:
     python3 -m http.server 8000            (v kořeni repa, v jiném terminálu)
     NODE_PATH=$(npm root -g) node tools/mezery.js [adresa] [styl.css] [složka/předpona snímků] [light|dark]

   Skript otevře appku v čistém profilu (šířka 412 px), přidá zkušební data (Nastavení → O aplikaci), 4 měření
   a 3 šablony z tréninků, projde hlavní obrazovky a pro každou vypíše mezery mezi bloky shora dolů:
   „mezera v px  předchozí blok → další blok“. U čipů (.chips) měří k viditelnému čipu, ne k neviditelnému okraji
   dotykové plochy. styl.css = nepovinný styl přidaný do stránky (simulace změny pro náhled Dnes / Po změně),
   s předponou snímků uloží snímek každé obrazovky (PNG, 2× zvětšený). Nakonec stejně projde panely (PANELS),
   mezery měří uvnitř obsahu panelu (.sheet-b) od jeho horního okraje. */
const { chromium } = require("playwright");
const fs = require("fs");

const URL = process.argv[2] || "http://localhost:8000/";
const CSS = process.argv[3] ? fs.readFileSync(process.argv[3], "utf8") : "";
const SHOT = process.argv[4] || "";
const THEME = process.argv[5] || "light";

// bloky stránky, mezi kterými se měří (ostatní prvky se procházejí dovnitř)
const BLOCK = [
  ".seg",
  ".chips",
  ".kpis",
  ".card",
  ".tpl",
  ".btn.block",
  ".sec-h",
  ".banner",
  ".empty",
  ".hw",
  ".mhead",
  ".exrow",
  ".row",
  "p",
  ".inp",
].join(", ");

// bloky uvnitř panelu (F3-44): navíc popisky, nadpisy sekcí formuláře a řádky výběru
const PANEL_BLOCK = [
  BLOCK,
  ".lbl-f",
  "label.f",
  ".frow",
  ".switch",
  ".subh",
  ".hlp",
  ".pick-sec",
  ".pickrow",
  ".bzone",
  ".figs",
  ".mus",
  ".cpick",
  ".banner",
].join(", ");

// panely: název a akce (data-act, data-v), které ho otevřou
const PANELS = [
  ["Panel Nové měření", [["addBody"]]],
  ["Panel Nové fitko", [["addGym"]]],
  ["Panel Nápověda (Návrh progrese)", [["help", "prog"]]],
  ["Panel Přidat cviky", [["tab", "train"], ["startEmpty"], ["addEx"]]],
];

// obrazovky: název a akce (data-act, data-v), které na ni vedou
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
    "Cvik – Statistiky",
    [
      ["openEx", "bench-press-barbell"],
      ["exPart", "stats"],
    ],
  ],
  ["Cvik – Historie", [["exPart", "hist"]]],
];

// mezery mezi bloky na aktuální obrazovce jako text (jeden řádek = jedna mezera)
function measure(page, panel) {
  return page.evaluate(
    ([blockSel, panel]) => {
      const blocks = [];
      // viditelný rozsah bloku; u čipů jen samotné čipy (řádek má okraj navíc kvůli dotykové ploše)
      function visible(el) {
        if (el.classList.contains("chips")) {
          const rects = [...el.children].map((c) => c.getBoundingClientRect()).filter((r) => r.height);
          if (!rects.length) return null;
          return {
            top: Math.min(...rects.map((r) => r.top)),
            bottom: Math.max(...rects.map((r) => r.bottom)),
          };
        }
        const r = el.getBoundingClientRect();
        return r.height ? r : null;
      }
      function label(el) {
        const text = el.textContent.trim().replace(/\s+/g, " ").slice(0, 18);
        const name = (el.tagName.toLowerCase() + "." + [...el.classList].join(".")).slice(0, 34);
        return text ? `${name} «${text}»` : name;
      }
      function walk(el) {
        for (const child of el.children) {
          if (child.classList.contains("top") || child.hidden) continue;
          if (getComputedStyle(child).display === "none") continue;
          if (child.matches(blockSel) && !child.matches("section")) {
            const r = visible(child);
            if (r) {
              blocks.push({ name: label(child), top: r.top + scrollY, bottom: r.bottom + scrollY });
            }
          } else {
            walk(child);
          }
        }
      }
      const root = panel ? document.querySelector(".sheet-b") : document.getElementById("app");
      if (!root) return "  (panel se neotevřel)";
      walk(root);
      const top = panel ? null : document.querySelector("#app .top");
      let prevBottom = panel
        ? root.getBoundingClientRect().top + scrollY
        : top
          ? top.getBoundingClientRect().bottom + scrollY
          : 0;
      let prevName = panel ? "OKRAJ PANELU" : "ZÁHLAVÍ";
      const lines = [];
      for (const b of blocks.slice(0, 16)) {
        const gap = String(Math.round(b.top - prevBottom)).padStart(4);
        lines.push(`${gap}  ${prevName.padEnd(42)} → ${b.name}`);
        prevBottom = b.bottom;
        prevName = b.name;
      }
      return lines.join("\n");
    },
    [panel ? PANEL_BLOCK : BLOCK, panel],
  );
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const context = await browser.newContext({ viewport: { width: 412, height: 760 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("CHYBA", e.message));
  await page.goto(URL);
  await page.waitForTimeout(1200);
  // klepnutí na neviditelné tlačítko s data-act / data-v (delegace kliknutí v appce)
  const act = (name, v, m) =>
    page.evaluate(
      ([name, v, m]) => {
        const btn = document.createElement("button");
        btn.dataset.act = name;
        if (v) btn.dataset.v = v;
        if (m) btn.dataset.m = m;
        document.getElementById("app").appendChild(btn);
        btn.click();
        btn.remove();
      },
      [name, v, m],
    );
  // zkušební data, měření a šablony
  await act("fakeAdd");
  await page.waitForTimeout(800);
  for (const [daysAgo, kg] of [
    [30, "82,4"],
    [20, "81,9"],
    [10, "81,2"],
    [2, "80,8"],
  ]) {
    await act("addBody");
    await page.waitForTimeout(200);
    await page.fill("#b-date", new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 10));
    await page.fill("#b-weight", kg);
    await act("saveBody");
    await page.waitForTimeout(200);
  }
  await act("tab", "hist");
  await act("histView", "list");
  await page.waitForTimeout(300);
  const workouts = await page.evaluate(() =>
    [...document.querySelectorAll(".hw")].slice(0, 3).map((b) => [b.dataset.v, b.dataset.m]),
  );
  for (const [v, m] of workouts) {
    await act("wToTpl", v, m);
    await page.waitForTimeout(300);
  }
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), THEME);
  await page.addStyleTag({ content: "#toastRoot { display: none !important; }" });
  if (CSS) await page.addStyleTag({ content: CSS });
  for (const [name, steps] of SCREENS) {
    for (const [a, v] of steps) {
      await act(a, v);
      await page.waitForTimeout(300);
    }
    console.log(`\n## ${name}\n${await measure(page)}`);
    if (SHOT) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${SHOT}-${name.replace(/[^\p{L}\d]+/gu, "_")}.png` });
    }
  }
  for (const [name, steps] of PANELS) {
    for (const [a, v] of steps) {
      await act(a, v);
      await page.waitForTimeout(300);
    }
    console.log(`\n## ${name}\n${await measure(page, true)}`);
    const sheet = await page.$(".sheet");
    if (SHOT && sheet) {
      await sheet.screenshot({ path: `${SHOT}-${name.replace(/[^\p{L}\d]+/gu, "_")}.png` });
    }
    await act("closeSheet");
    await page.waitForTimeout(300);
  }
  await browser.close();
})();
