/* Test 12 (F3-51): přidání fotky ikonou v rohu karty Popis na stránce cviku. Místo řádku tří tlačítek je
   ikona (akce phAddMenu), panel Přidat fotku má Fotoaparát / Galerie (popisky políček phCamIn / phPickIn)
   a Online databáze. Galerie otevře výběr souboru a zavře panel, uložená fotka „První“ má štítek vlevo
   nahoře, Online databáze otevře panel Fotky z online databáze. */
const P = require("./pomocne.js");

const EX = "hip-thrust-machine";

// malý obrázek PNG z plátna (stejně jako P.addPhoto)
async function pngBuffer(page) {
  const b64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#36c";
    ctx.fillRect(0, 0, 80, 60);
    const blob = await new Promise((done) => canvas.toBlob(done, "image/png"));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let text = "";
    for (const byte of bytes) {
      text += String.fromCharCode(byte);
    }
    return btoa(text);
  });
  return Buffer.from(b64, "base64");
}

async function openExercise(app) {
  await app.act("tab", "ex");
  await app.act("openEx", EX);
  await app.act("exPart", "info");
  await app.settle();
}

module.exports = {
  name: "Přidat fotku ikonou",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page } = app;
    await openExercise(app);

    check.ok(!(await page.$("#app .gal-add")), "na stránce cviku zůstal řádek tlačítek pro fotky");
    const btn = await page.$('#app .card.exinfo > .gal-addb[data-act="phAddMenu"]');
    check.ok(btn, "v kartě Popis chybí ikona Přidat fotku");
    if (!btn) {
      await app.close();
      return;
    }
    // ikona je vpravo nahoře v kartě
    const pos = await page.evaluate(() => {
      const card = document.querySelector("#app .card.exinfo").getBoundingClientRect();
      const b = document.querySelector("#app .gal-addb").getBoundingClientRect();
      return { right: card.right - b.right, top: b.top - card.top };
    });
    check.ok(
      pos.right >= 0 && pos.right < 20 && pos.top >= 0 && pos.top < 20,
      "ikona není vpravo nahoře v kartě",
    );

    // panel Přidat fotku: tři volby
    await btn.click();
    await app.settle(300);
    const opts = await page.$$eval(".sheet .sheet-b .btn", (els) =>
      els.map((el) => [el.textContent.trim(), el.getAttribute("for") || el.dataset.act]),
    );
    check.eq(
      opts,
      [
        ["Fotoaparát", "phCamIn"],
        ["Galerie", "phPickIn"],
        ["Online databáze", "phFedb"],
      ],
      "volby v panelu Přidat fotku",
    );

    // Galerie: výběr souboru, panel se zavře, pak okno s volbou fitka a uložení
    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 5000 }),
      page.click('.sheet label[for="phPickIn"]'),
    ]);
    await app.settle(300);
    check.ok(!(await page.$(".sheet")), "panel Přidat fotku zůstal po klepnutí na Galerie otevřený");
    await chooser.setFiles({ name: "foto.png", mimeType: "image/png", buffer: await pngBuffer(page) });
    await page.waitForSelector('.sheet [data-act="phAddSave"]', { timeout: 8000 });
    await page.click('.sheet label.switch:has([data-act="phAddFirst"])');
    await app.act("phAddSave");
    await app.settle(1200);
    await openExercise(app);
    check.ok(await page.$("#app .gal-s img"), "uložená fotka není v galerii");
    // štítek První vlevo nahoře (vpravo je ikona)
    const pin = await page.evaluate(() => {
      const el = document.querySelector("#app .gal-pin");
      if (!el) return null;
      const s = el.parentElement.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { left: r.left - s.left, right: s.right - r.right };
    });
    check.ok(pin && pin.left < pin.right, "štítek První není vlevo");
    check.ok(await page.$("#app .card.exinfo > .gal-addb"), "s fotkou chybí ikona Přidat fotku");

    // Online databáze z panelu otevře panel Fotky z online databáze
    await page.click("#app .gal-addb");
    await app.settle(300);
    await page.click('.sheet [data-act="phFedb"]');
    await app.settle(500);
    const head = await page.$eval(".sheet .sheet-h h2", (el) => el.textContent.trim()).catch(() => "");
    check.eq(head, "Fotky z online databáze", "Online databáze z panelu Přidat fotku");
    await app.act("closeSheet");

    check.eq(app.errors, [], "chyby v konzoli");
    await app.close();
  },
};
