/* Snímky obrazovky do návodu (docs/navod/img/*.png).

   Appka se spustí v Chromiu s vymyšlenými ukázkovými daty (demo-data.js),
   proklikne se jako na telefonu a vyfotí obrazovky s očíslovanými rámečky.
   Skutečná data uživatele se nikde nepoužívají.

   Spuštění z kořene repa (Playwright je v prostředí Claude Code předinstalovaný,
   do repa se nic neinstaluje):
     NODE_PATH=$(npm root -g) node docs/navod/snimky/snimky.js

   Po změně vzhledu nebo textů appky snímky znovu vygeneruj a zkontroluj,
   že rámečky sedí (pořadí čísel odpovídá popiskům v docs/navod/README.md). */
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { build } = require("./demo-data.js");

const REPO = path.resolve(__dirname, "../../..");
const OUT = process.env.OUT || path.resolve(__dirname, "../img");
const PORT = 8765;
fs.mkdirSync(OUT, { recursive: true });

const T0 = new Date("2026-09-23T18:05:00+02:00").getTime();
const MIN = 60000;

(async () => {
  const srv = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: REPO, stdio: "ignore" });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ["--lang=cs-CZ"], env: Object.assign({}, process.env, { LANG: "cs_CZ.UTF-8", LANGUAGE: "cs" }) });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: "cs-CZ", timezoneId: "Europe/Prague", colorScheme: "dark", acceptDownloads: true, serviceWorkers: "block"
  });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.error("PAGEERROR", e.message));
  await page.clock.setFixedTime(T0);
  const url = "http://localhost:" + PORT + "/";
  await page.goto(url);

  // ukázková data do IndexedDB
  const docs = build(T0);
  async function seed(extra) {
    await page.evaluate(async ({ docs, extra }) => {
      localStorage.clear();
      localStorage.setItem("zd1:theme", JSON.stringify("dark"));
      const db = await new Promise((res, rej) => { const r = indexedDB.open("workout-denik", 1); r.onupgradeneeded = () => { r.result.createObjectStore("docs"); r.result.createObjectStore("points"); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      await new Promise((res, rej) => {
        const tx = db.transaction(["docs", "points"], "readwrite"); const s = tx.objectStore("docs");
        s.clear(); tx.objectStore("points").clear();
        for (const p in docs) s.put(docs[p], p);
        for (const p in extra) s.put(extra[p], p);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
      db.close();
    }, { docs, extra });
    await page.reload();
    await calm();
  }
  async function calm() {
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} #toastRoot{display:none!important}" });
    await page.waitForTimeout(400);
  }
  const act = async (a, v, nth) => {
    const sel = '[data-act="' + a + '"]' + (v != null ? '[data-v="' + v + '"]' : "");
    await page.locator(sel).nth(nth || 0).click();
    await page.waitForTimeout(250);
  };
  const tab = t => act("tab", t);
  const top = () => page.evaluate(() => window.scrollTo(0, 0));

  // zvýraznění: [{sel, text, n, nth, pad, in}] – rámeček a číslo
  async function mark(marks) {
    await page.evaluate(marks => {
      document.querySelectorAll(".__mk").forEach(e => e.remove());
      for (const m of marks) {
        const root = m.in ? document.querySelector(m.in) : document;
        let els = [...root.querySelectorAll(m.sel)];
        if (m.text) els = els.filter(e => e.textContent.includes(m.text));
        const el = els[m.nth || 0];
        if (!el) { console.log("MARK NOT FOUND " + m.sel + " " + (m.text || "")); continue; }
        const r = el.getBoundingClientRect(), p = m.pad == null ? 4 : m.pad;
        if (r.bottom < 0 || r.top > innerHeight) { console.log("MARK OFFSCREEN " + m.sel); continue; }
        const box = document.createElement("div");
        box.className = "__mk";
        box.style.cssText = "position:fixed;z-index:9999;pointer-events:none;border:3px solid #22d3ee;border-radius:10px;box-shadow:0 0 0 2px rgba(0,0,0,.55);" +
          "left:" + (r.left - p) + "px;top:" + (r.top - p) + "px;width:" + (r.width + 2 * p) + "px;height:" + (r.height + 2 * p) + "px";
        document.body.appendChild(box);
        if (m.n != null) {
          const b = document.createElement("div");
          b.className = "__mk";
          const sd = m.side || "", bx = sd.includes("r") ? r.right + p - 12 : r.left - p - 12, by = sd.includes("b") ? r.bottom + p - 14 : r.top - p - 12;
          b.style.cssText = "position:fixed;z-index:10000;pointer-events:none;width:26px;height:26px;border-radius:50%;background:#22d3ee;color:#04161a;" +
            "font:700 15px/26px Barlow,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.6);" +
            "left:" + Math.max(2, Math.min(innerWidth - 28, bx)) + "px;top:" + Math.max(2, by) + "px";
          b.textContent = m.n;
          document.body.appendChild(b);
        }
      }
    }, marks);
  }
  async function shot(name, marks) {
    await page.waitForTimeout(150);
    if (marks) await mark(marks);
    await page.screenshot({ path: path.join(OUT, name + ".png") });
    await page.evaluate(() => document.querySelectorAll(".__mk").forEach(e => e.remove()));
    console.log("ok", name);
  }
  const scrollTo = async (sel, text, off) => {
    await page.evaluate(({ sel, text, off }) => {
      let els = [...document.querySelectorAll(sel)]; if (text) els = els.filter(e => e.textContent.includes(text));
      const el = els[0]; if (!el) return;
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - (off || 70));
    }, { sel, text, off });
    await page.waitForTimeout(200);
  };
  const sheetScroll = async (sel, text, off) => {
    await page.evaluate(({ sel, text, off }) => {
      const sb = document.querySelector(".sheet-b"); let els = [...sb.querySelectorAll(sel)]; if (text) els = els.filter(e => e.textContent.includes(text));
      const el = els[0]; if (!el) return;
      sb.scrollTop += el.getBoundingClientRect().top - sb.getBoundingClientRect().top - (off || 10);
    }, { sel, text, off });
    await page.waitForTimeout(150);
  };

  /* ---------- 1. připomínka zálohy a stažení ---------- */
  await seed({ "config/backup": { last: T0 - 12 * 86400000, points: [] } });
  await shot("zaloha-pripominka", [{ sel: ".banner.act", n: 1, pad: 3 }]);
  await act("export");
  await shot("zaloha-stazena");
  await act("closeSheet");

  /* ---------- 2. úvodní obrazovka Trénink ---------- */
  await shot("trenink-domu", [
    { sel: ".kpis", n: 1 },
    { sel: ".chips", n: 2 },
    { sel: '[data-act="startEmpty"]', n: 3 },
    { sel: ".card.tpl", n: 4 }
  ]);

  /* ---------- 3. Nastavení: fitka ---------- */
  await tab("set");
  await shot("nastaveni", [
    { sel: '[data-act="addGym"]', n: 1 },
    { sel: '[data-act="editGym"]', n: 2 },
    { sel: ".seg", n: 3, nth: 0 },
    { sel: "#bwInp", n: 4, side: "b" },
    { sel: ".seg", n: 5, nth: 1 }
  ]);
  await act("addGym");
  await page.fill("#g-name", "Fitko U Parku");
  await shot("fitko-nove", [{ sel: "#g-name", n: 1 }, { sel: ".switch", n: 2 }, { sel: '[data-act="saveGym"]', n: 3 }]);
  await act("closeSheet");

  /* ---------- 4. trénink podle šablony ---------- */
  await tab("train");
  await act("startTpl", "tPull");
  await calm();
  await page.clock.setFixedTime(T0 + 4 * MIN);
  await page.waitForTimeout(700);
  await shot("trenink-probiha", [
    { sel: "#ed-gym", n: 1, side: "b" },
    { sel: ".exc-prev", n: 2 },
    { sel: ".stype", n: 3, nth: 0 },
    { sel: "tbody tr td.c-in", n: 4, nth: 0, pad: 2 },
    { sel: ".okb", n: 5, nth: 0, side: "r" },
    { sel: '[data-act="exMenu"]', n: 6, nth: 0, side: "r" }
  ]);
  // první dvě série hotové, běží odpočinek
  await page.clock.setFixedTime(T0 + 7 * MIN);
  await act("done", null, 0);
  await page.clock.setFixedTime(T0 + 10 * MIN);
  // druhou sérii o 2,5 kg víc
  const kg2 = page.locator('input[data-i="0"][data-j="1"][data-f="kg"]');
  const v = await kg2.inputValue();
  await kg2.fill(String(parseFloat(v.replace(",", ".")) + 2.5).replace(".", ","));
  await act("done", null, 1);
  await page.clock.setFixedTime(T0 + 10 * MIN + 33000);
  await page.waitForTimeout(700);
  await shot("trenink-odpocinek", [
    { sel: "tr.done", n: 1, nth: 1, pad: 2 },
    { sel: ".rest-in", n: 2, pad: 3 },
    { sel: ".exmedal", n: 3 }
  ]);
  await act("exMenu", null, 0);
  await shot("trenink-menu-cviku");
  await act("closeSheet");

  /* ---------- 5. přidání cviku ---------- */
  await act("addEx");
  await page.fill("#pickQ", "kladiv");
  await page.waitForTimeout(300);
  await act("pickToggle", "hammer-curl-dumbbell");
  await page.evaluate(() => { document.querySelector(".sheet-b").scrollTop = 0; });
  await shot("pridat-cviky", [
    { sel: "#pickQ", n: 1 },
    { sel: '[data-ck="pickM"]', n: 2, pad: 2 },
    { sel: ".pick[aria-pressed=true]", n: 3, pad: 2 },
    { sel: ".infob", n: 4, nth: 0, side: "r" },
    { sel: '[data-act="pickDone"]', n: 5 }
  ]);
  await act("exInfo", "hammer-curl-dumbbell");
  await shot("cvik-info");
  await act("backPicker");
  await act("pickDone");
  await page.waitForTimeout(300);

  /* ---------- 6. dokončení ---------- */
  // doplnit nový cvik a odcvičit zbytek
  const hc = [["14", "10"], ["14", "10"], ["14", "9"]];
  for (let j = 0; j < 3; j++) {
    await page.locator('input[data-i="4"][data-j="' + j + '"][data-f="kg"]').fill(hc[j][0]);
    await page.locator('input[data-i="4"][data-j="' + j + '"][data-f="reps"]').fill(hc[j][1]);
  }
  for (let i = 0; i < 16; i++) {
    const b = page.locator('.okb[aria-pressed="false"]').first();
    if (!(await b.count())) break;
    await page.clock.setFixedTime(T0 + (14 + i * 3) * MIN);
    await b.click(); await page.waitForTimeout(80);
  }
  await page.clock.setFixedTime(T0 + 58 * MIN);
  await act("restSkip").catch(() => {});
  await scrollTo('[data-act="addEx"]', null, 300);
  await shot("trenink-konec", [{ sel: '[data-act="addEx"]', n: 1 }, { sel: '[data-act="finish"]', n: 2 }, { sel: '[data-act="discard"]', n: 3 }]);
  await act("finish");
  await shot("trenink-dokoncit", [{ sel: "#fin-end", n: 1, side: "b" }, { sel: "#updTpl", n: 2, pad: 6 }, { sel: '[data-act="finishOk"]', n: 3 }]);
  await act("finishOk");
  await page.waitForTimeout(400);
  await shot("trenink-souhrn", [{ sel: ".recbox", n: 1, pad: 3 }]);
  await act("closeSheet");

  /* ---------- 7. historie ---------- */
  await top();
  await shot("historie", [{ sel: ".chips", n: 1 }, { sel: "button.hw", n: 2, nth: 0, pad: 3 }]);
  await act("openW", null, 1);
  await shot("historie-detail", [{ sel: '[data-act="wToTpl"]', n: 1 }, { sel: '[data-act="editW"]', n: 2 }]);
  await act("editW");
  await calm();
  await shot("historie-uprava", [{ sel: "#ed-gym", n: 1, side: "b" }, { sel: "#ed-date", n: 2, side: "b" }, { sel: "#ed-time", n: 3, side: "b" }, { sel: "#ed-dur", n: 4, side: "b" }]);
  await act("edCancel");

  /* ---------- 8. šablona ---------- */
  await tab("train");
  await top();
  await act("editTpl", "tPush");
  await calm();
  await shot("sablona-uprava", [{ sel: "#ed-title", n: 1 }, { sel: '[data-act="exMenu"]', n: 2, nth: 0, side: "r" }, { sel: '[data-act="addSet"]', n: 3, nth: 0 }]);
  await act("edCancel");

  /* ---------- 9. záložka Cviky ---------- */
  await tab("ex");
  await shot("cviky-seznam", [
    { sel: "#exlQ", n: 1 },
    { sel: '[data-ck="exlM"]', n: 2, pad: 2 },
    { sel: '[data-ck="exlEq"]', n: 3, pad: 2 },
    { sel: ".seg", n: 4 },
    { sel: '[data-act="exlNew"]', n: 5, side: "r" }
  ]);
  await act("openEx", "bench-press-barbell");
  await calm();
  await shot("cvik-popis", [{ sel: ".seg", n: 1 }, { sel: ".figs", n: 2 }, { sel: '[data-act="editExDetail"]', n: 3 }, { sel: ".switch", n: 4 }]);
  await act("exPart", "stats");
  await shot("cvik-statistiky", [{ sel: ".chips", n: 1 }, { sel: ".seg-wide", n: 2, nth: 1 }, { sel: ".chart", n: 3 }]);
  await scrollTo("h2", "Osobní rekordy");
  await shot("cvik-rekordy");
  await top();
  await act("exPart", "info");
  await act("editExDetail");
  await sheetScroll(".mpick", null, 60);
  await shot("cvik-upravit", [{ sel: ".mpick", n: 1 }, { sel: "#x-kind", n: 2, side: "b" }]);
  await act("closeSheet");

  /* ---------- 10. statistiky ---------- */
  await tab("stats");
  await top();
  await shot("statistiky", [{ sel: ".chips", n: 1 }, { sel: ".seg-wide", n: 2 }, { sel: ".kpis", n: 3 }, { sel: ".sec-h .seg", n: 4 }]);
  await scrollTo("h2", "Pracovní série podle partie");
  await shot("statistiky-partie");

  /* ---------- 11. tělo ---------- */
  await tab("body");
  await top();
  await shot("telo", [{ sel: '[data-act="addBody"]', n: 1 }, { sel: '[data-ck="bodyMetric"]', n: 2 }, { sel: ".chart", n: 3 }]);
  await act("addBody");
  await page.fill("#b-weight", "80,4");
  await page.fill("#b-fat", "17,1");
  await shot("telo-mereni");
  await act("closeSheet");

  /* ---------- 12. záloha a obnova ---------- */
  await tab("set");
  await scrollTo("h2", "O aplikaci", 120);
  await shot("nastaveni-o-aplikaci", [{ sel: 'a.btn[href*="navod"]', n: 1 }, { sel: 'a.btn[href*="release-notes"]', n: 2 }]);
  await act("bkNow");
  await page.waitForTimeout(600);
  await scrollTo("h2", "Záloha", 60);
  await shot("nastaveni-zaloha", [
    { sel: '[data-act="export"]', n: 1 },
    { sel: 'label[for="impFile"]', n: 2 },
    { sel: '[data-act="bkNow"]', n: 3, side: "r" },
    { sel: '[data-act="bkRestore"]', n: 4, side: "r" }
  ]);
  const [dl] = await Promise.all([page.waitForEvent("download"), act("export")]);
  const bkFile = path.join(os.tmpdir(), "workout-denik-demo-zaloha.json");
  await dl.saveAs(bkFile);
  await act("closeSheet");
  await page.setInputFiles("#impFile", bkFile);
  await page.waitForTimeout(400);
  await shot("obnova", [{ sel: '[data-act="importGo"][data-v="merge"]', n: 1 }, { sel: '[data-act="importGo"][data-v="replace"]', n: 2 }]);
  await act("closeSheet");

  /* ---------- 13. světlý motiv ---------- */
  await top();
  await act("theme", "light");
  await tab("train");
  await top();
  await shot("svetly-motiv");
  await act("tab", "set");
  await act("theme", "dark");

  await browser.close();
  srv.kill();
})().catch(e => { console.error(e); process.exit(1); });
