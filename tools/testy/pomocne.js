/* Společné pomocné funkce automatických testů (F0-17): statický server, prohlížeč, ovládání appky
   a sběr chyb. Testy a spouštěč: viz spust.js. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "..");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

/* statický server z kořene repa na volném portu (appka běží v kořeni, jako při lokálním vývoji);
   adresa /pr-N/… vede taky do kořene: appka tam běží jako testovací verze PR N na stejné doméně (F0-18) */
function startServer() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/pr-\d+\//, "/");
    const file = path.join(ROOT, rel.endsWith("/") ? rel + "index.html" : rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end("nenalezeno");
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        url: `http://127.0.0.1:${server.address().port}/`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

// spustí Chromium: CHROMIUM = cesta ke spustitelnému souboru, v CI nainstalovaný Chrome, jinak Playwright
function launch() {
  if (process.env.CHROMIUM) {
    return chromium.launch({ executablePath: process.env.CHROMIUM });
  }
  return chromium.launch(process.env.CI ? { channel: "chrome" } : {});
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

/* Otevře appku v čistém profilu (nový kontext = prázdné IndexedDB i localStorage).
   Vrací { page, context, errors, act, reload, close }: errors = chyby stránky, console.error a selhané
   požadavky na vlastní soubory; act(name, v, m) klepne na neviditelné tlačítko s data-act / data-v
   (stejná delegace kliknutí jako ve skutečných tlačítkách). */
async function openApp(browser, url, opts) {
  const o = Object.assign({ width: 412, height: 760, fontScale: null }, opts);
  const context = await browser.newContext({
    viewport: { width: o.width, height: o.height },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console.error: " + m.text());
  });
  page.on("requestfailed", (r) => {
    if (r.url().startsWith(url)) errors.push("požadavek selhal: " + r.url());
  });
  page.on("response", (r) => {
    if (r.url().startsWith(url) && r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  const app = { page, context, errors, url };
  app.act = (name, v, m) =>
    page.evaluate(
      ([name, v, m]) => {
        const btn = document.createElement("button");
        btn.dataset.act = name;
        if (v !== undefined && v !== null) btn.dataset.v = v;
        if (m !== undefined && m !== null) btn.dataset.m = m;
        document.getElementById("app").appendChild(btn);
        btn.click();
        btn.remove();
      },
      [name, v, m],
    );
  // počká, až appka doběhne (vykreslení + zápis do úložiště)
  app.settle = async (ms) => {
    await wait(ms || 400);
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
  };
  // to = jiná adresa na stejné doméně (testovací verze …/pr-N/, F0-18), jinak appka z url
  app.goto = async (to) => {
    await page.goto(to || url);
    await page.waitForSelector("#app .top, #app .sec, #app .tabs", { timeout: 15000 }).catch(() => {});
    await app.settle(800);
  };
  app.close = () => context.close();
  await app.goto();
  return app;
}

// jednoduchá kontrola s popisem; sbírá výsledky, aby test ukázal všechny chyby najednou
function checker(name) {
  const fails = [];
  const c = {
    name,
    fails,
    ok(cond, msg) {
      if (!cond) fails.push(msg);
      return !!cond;
    },
    eq(a, b, msg) {
      const sa = String(JSON.stringify(a)),
        sb = String(JSON.stringify(b));
      if (sa !== sb)
        fails.push(`${msg}\n      očekáváno: ${sb.slice(0, 300)}\n      je:        ${sa.slice(0, 300)}`);
      return sa === sb;
    },
  };
  return c;
}

// obrazovka Nastavení → podstránka (id ze SET_PAGES v js/app.js)
async function openSettings(app, id) {
  await app.act("tab", "set");
  await app.act("setOpen", id);
  await app.settle();
}

// zapíše a dokončí trénink s jedním cvikem (krokovačem jako při cvičení), vrací text souhrnu
async function recordWorkout(app, exId, reps, kg) {
  const { page } = app;
  await app.act("tab", "train");
  await app.act("startEmpty");
  await app.settle();
  await app.act("addEx");
  await app.act("pickToggle", exId);
  await app.act("pickDone");
  await app.settle();
  await page.click('#app [data-act="done"][data-i="0"][data-j="0"]');
  await app.settle();
  // bez předvyplnění z minula (cvik ještě není v historii) se otevře krokovač a hodnoty se zadají plusem;
  // jinak se série odškrtla rovnou s hodnotami z minula
  if (await page.$(".sheet .kk-b")) {
    for (let n = 0; n < reps; n++) {
      await page.click('.sheet .kk-b[data-kf="reps"][data-kk="1"]');
    }
    for (let n = 0; n < kg; n++) {
      await page.click('.sheet .kk-b[data-kf="kg"][data-kk="1"]');
    }
    await page.click('.sheet [data-act="kkDone"]');
    await app.settle();
  }
  await app.act("closeSheet");
  await app.settle();
  await page.click('#app [data-act="finish"]');
  await app.settle();
  await app.act("finishOk");
  await app.settle(800);
  return page.evaluate(() => document.getElementById("app").innerText);
}

// přidá měření hmotnosti (Tělo → Nové měření)
async function addMeasurement(app, date, weight) {
  await app.act("tab", "body");
  await app.act("addBody");
  await app.settle(200);
  await app.page.fill("#b-date", date);
  await app.page.fill("#b-weight", weight);
  await app.act("saveBody");
  await app.settle(300);
}

// přidá fotku (z vygenerovaného obrázku) ke cviku, vrací počet fotek, které appka drží
async function addPhoto(app, exId) {
  const { page } = app;
  await app.act("tab", "ex");
  await app.act("openEx", exId);
  await app.act("exPart", "info");
  await app.settle();
  const b64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 80, 60);
    grad.addColorStop(0, "#c33");
    grad.addColorStop(1, "#36c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 80, 60);
    const blob = await new Promise((done) => canvas.toBlob(done, "image/png"));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let text = "";
    for (const byte of bytes) {
      text += String.fromCharCode(byte);
    }
    return btoa(text);
  });
  await page.setInputFiles("#phPickIn", {
    name: "foto.png",
    mimeType: "image/png",
    buffer: Buffer.from(b64, "base64"),
  });
  await app.settle(1500);
  await app.act("phAddSave");
  await app.settle(1200);
}

// Nastavení → Data a záloha → Stáhnout: vrací text souboru a jeho zpracování
async function exportBackup(app) {
  await openSettings(app, "data");
  const [download] = await Promise.all([app.page.waitForEvent("download"), app.act("export")]);
  const text = fs.readFileSync(await download.path(), "utf8");
  await app.act("closeSheet");
  return { text, data: JSON.parse(text), name: download.suggestedFilename() };
}

/* Nastavení → Data a záloha → Obnovit ze souboru; mode = "merge" (Sloučit) / "replace" (Nahradit vše).
   Vrací hlášku appky po obnově (toast) nebo null, když se nabídka obnovy neukázala. */
async function importBackup(app, text, mode) {
  await openSettings(app, "data");
  await app.page.setInputFiles("#impFile", {
    name: "zaloha.json.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(text),
  });
  const shown = await app.page
    .waitForSelector('.sheet [data-act="importGo"]', { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!shown) return null;
  await app.act("importGo", mode);
  await app.settle(300);
  if (mode === "replace") {
    await app.act("importOk", "replace");
  }
  const done = /Data nahrazena|Doplněno|Nic nechybělo/;
  const toast = await app.page
    .waitForFunction(
      (src) => new RegExp(src).test(document.getElementById("toastRoot").innerText),
      done.source,
      { timeout: 15000 },
    )
    .then(() => app.page.evaluate(() => document.getElementById("toastRoot").innerText))
    .catch(() => "");
  await app.settle(600);
  return toast;
}

// záloha bez času vytvoření, aby šly dvě zálohy porovnat
function withoutTime(data) {
  const copy = JSON.parse(JSON.stringify(data));
  delete copy.exported;
  return copy;
}

/* Je očekávaný obsah celý ve skutečném? Objekty: každý klíč z očekávaného musí být i ve skutečném se stejnou
   hodnotou (navíc smí mít skutečný další klíče, např. výchozí hodnoty doplněné appkou); pole: stejná délka a prvky.
   Vrací seznam rozdílů „cesta: očekáváno … je …“ (prázdný = v pořádku). */
function missingIn(expected, actual, where) {
  where = where || "";
  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object" || Array.isArray(expected) !== Array.isArray(actual)) {
      return [`${where}: očekáváno ${JSON.stringify(expected).slice(0, 80)}, je ${JSON.stringify(actual)}`];
    }
    if (Array.isArray(expected) && expected.length !== actual.length) {
      return [`${where}: očekáváno ${expected.length} prvků, je ${actual.length}`];
    }
    const out = [];
    for (const key of Object.keys(expected)) {
      out.push(...missingIn(expected[key], actual[key], where + "." + key));
    }
    return out;
  }
  if (expected !== actual) {
    return [`${where}: očekáváno ${JSON.stringify(expected)}, je ${JSON.stringify(actual)}`];
  }
  return [];
}

// počet tréninků v zálohách (všechny měsíce)
function countWorkouts(data) {
  return Object.values(data.months).reduce((sum, month) => sum + Object.keys(month).length, 0);
}

module.exports = {
  ROOT,
  startServer,
  launch,
  openApp,
  checker,
  wait,
  openSettings,
  recordWorkout,
  addMeasurement,
  addPhoto,
  exportBackup,
  importBackup,
  withoutTime,
  countWorkouts,
  missingIn,
};
