/* Test 17 (F4-19): zdroj měření z importu ze Samsung Health. Vymyšlené soubory ve tvaru skutečného exportu
   (vážení a profil zařízení). Ruční měření z deníku má zdroj „app“. Import jen souboru vážení: panel ukáže
   neznámá zařízení a Vybrat profil zařízení, po výběru profilu se souhrn přepočítá. Po importu: hodinky
   (i přepsané ruční měření ze stejného dne), ručně v Samsung Health (telefon), Hevy (jiná aplikace, deviceuuid
   telefonu), neznámé zařízení bez zdroje. Opakovaný import se dvěma soubory najednou doplní zdroj už
   importovanému měření. Zařízení se do zálohy nedostanou. */
const P = require("./pomocne.js");

const SH = "com.sec.android.app.shealth";
const HEAD = "start_time,weight,body_fat,skeletal_muscle,deviceuuid,pkg_name,datauuid";
// řádek vážení: čas UTC, hmotnost, tuk, sval, zařízení, aplikace, ID
const row = (...cells) => cells.join(",");
const WEIGHT = [
  "com.samsung.health.weight,7006011,13",
  HEAD,
  row("2026-10-11 13:14:45.569", "77.3", "22.3", "41.9", "b00hgJ3az9", SH, "uuid-watch"),
  row("2026-09-25 17:55:08.119", "77.5", "", "", "UJG3YkIRiD", SH, "uuid-phone"),
  row("2026-10-05 17:13:00.000", "76.3", "", "", "FzBrhCz2Jk", "com.hevy", "uuid-hevy"),
  row("2026-10-07 06:00:00.000", "78.0", "19.0", "", "VahaXYZ123", SH, "uuid-scale"),
  "",
].join("\n");
const PROFILE_HEAD = "manufacturer,device_group,name,model,deviceuuid,pkg_name,fixed_name,datauuid";
const profile = (rows) =>
  ["com.samsung.health.device_profile,7006011,9", PROFILE_HEAD, ...rows, ""].join("\n");
const PROFILE = profile([
  row("Samsung", "360001", "My Device", "SM-G985F", "UJG3YkIRiD", SH, "Telefon uživatele", "d1"),
  row("Samsung", "360001", "My Device", "SM-S921B", "FzBrhCz2Jk", SH, "Telefon uživatele", "d2"),
  row("Samsung Electronics", "360003", "Galaxy Watch9", "SM-L350", "b00hgJ3az9", SH, "", "d3"),
]);
const PROFILE2 = profile([row("Výrobce", "360002", "Body Scale", "BS-1", "VahaXYZ123", SH, "", "d4")]);
const file = (name, text) => ({ name, mimeType: "text/csv", buffer: Buffer.from(text) });
const WEIGHT_FILE = file("com.samsung.health.weight.20261018193889.csv", WEIGHT);

module.exports = {
  name: "Zdroj měření ze Samsung Health",
  async run({ browser, url, check }) {
    const app = await P.openApp(browser, url);
    const { page } = app;
    const summary = () =>
      page.$$eval(".sheet .frow", (rows) =>
        Object.fromEntries(
          rows.map((r) => [r.querySelector(".grow").textContent.trim(), r.querySelector("b").textContent]),
        ),
      );

    // ruční měření v deníku ze stejného dne jako hodinky: zdroj „app“, import ho přepíše
    await P.addMeasurement(app, "2026-10-11", "77.3");

    // jen soubor vážení: Hevy zapnout, neznámá zařízení (hodinky, telefon, váha) a Vybrat profil zařízení
    await P.openSettings(app, "data");
    await page.setInputFiles("#shFileIn", WEIGHT_FILE);
    await page.waitForSelector('.sheet [data-act="shGo"]', { timeout: 8000 });
    await page.click('.sheet [data-act="shSrc"][data-v="com.hevy"]', { force: true });
    await app.settle(300);
    let sum = await summary();
    check.eq(sum["Neznámé zařízení"], "3", "neznámá zařízení bez profilu");
    check.ok(await page.$('.sheet label[for="shDevIn"]'), "panel nemá Vybrat profil zařízení");

    // profil zařízení: zůstane neznámá jen váha
    await page.setInputFiles(
      "#shDevIn",
      file("com.samsung.health.device_profile.20261018193889.csv", PROFILE),
    );
    await app.settle(500);
    sum = await summary();
    check.eq(
      [sum["Nová měření"], sum["Přepíše ruční měření"], sum["Neznámé zařízení"]],
      ["3", "1", "1"],
      "souhrn po výběru profilu",
    );
    await app.act("shGo");
    await app.settle(1500);

    let body = Object.values((await P.exportBackup(app)).data.body);
    const by = (w) => body.find((b) => b.weight === w) || {};
    check.eq(
      [by(77.3).src, by(77.3).srcName, by(77.3).shId],
      ["watch", "Galaxy Watch9", "uuid-watch"],
      "hodinky",
    );
    check.eq(body.length, 4, "počet měření (ruční přepsané hodinkami)");
    check.eq([by(77.5).src, by(77.5).srcName], ["sh", undefined], "ručně v Samsung Health");
    check.eq([by(76.3).src, by(76.3).srcName], ["ext", "Hevy"], "Hevy");
    check.eq([by(78).shId, by(78).src], ["uuid-scale", undefined], "neznámé zařízení bez zdroje");

    // opakovaný import, oba soubory najednou: váha dostane zdroj, nic dalšího se nepřidá
    await P.openSettings(app, "data");
    await page.setInputFiles("#shFileIn", [
      WEIGHT_FILE,
      file("com.samsung.health.device_profile.20261019120000.csv", PROFILE2),
    ]);
    await page.waitForSelector('.sheet [data-act="shGo"]', { timeout: 8000 });
    sum = await summary();
    check.eq(
      [sum["Nová měření"], sum["Doplní zdroj měření"], sum["Už v appce"], sum["Neznámé zařízení"]],
      ["0", "1", "3", undefined],
      "souhrn opakovaného importu",
    );
    await app.act("shGo");
    await app.settle(1500);

    const backup = await P.exportBackup(app);
    body = Object.values(backup.data.body);
    check.eq(body.length, 4, "opakovaný import nic nepřidal");
    check.eq([by(78).src, by(78).srcName], ["dev", "Body Scale"], "doplněný zdroj váhy");
    check.ok(!/b00hgJ3az9|SM-L350/.test(backup.text), "zařízení jsou v záloze");

    // zdroj ve formuláři měření
    const id = Object.keys(backup.data.body).find((k) => backup.data.body[k].weight === 77.3);
    await app.act("tab", "body");
    await app.act("editBody", id);
    await app.settle(300);
    const form = await page.$eval(".sheet", (el) => el.innerText);
    check.ok(/Zdroj\s+Galaxy Watch9 \(hmotnost zadaná ručně\)/.test(form), "formulář bez zdroje: " + form);
    await app.act("closeSheet");

    check.eq(app.errors, [], "chyby stránky");
    await app.close();
  },
};
