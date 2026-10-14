/* Automatické testy (F0-17). Spuštění z kořene repa:
     NODE_PATH=$(npm root -g) node tools/testy/spust.js [část názvu testu]
   (v GitHub Actions si Playwright nainstaluje úloha „testy“, viz .github/workflows/nasazeni.yml).
   Prohlížeč: proměnná CHROMIUM = cesta ke spustitelnému Chromiu, v CI (proměnná CI) nainstalovaný Chrome,
   jinak Chromium od Playwrightu. Server si skript spustí sám, appka běží z kořene repa (lokální verze, DEV).
   Testy: kourovy.js (kouřový test), zaloha.js (záloha tam a zpět z dat zadaných v appce), zaloha-plna.js
   (plná záloha: všechny druhy dat, druhé kolo, Sloučit), stara-zaloha.js (starší formáty zálohy),
   stopky.js (stopky u série na čas, F1-24).
   Každý test dostane čistý profil prohlížeče a dá se spustit i samostatně (část názvu v argumentu).
   Skončí kódem 1, když některá kontrola selže. Žádný z testů nezapisuje do repa. */
const P = require("./pomocne.js");

const TESTS = [
  require("./kourovy.js"),
  require("./zaloha.js"),
  require("./zaloha-plna.js"),
  require("./stara-zaloha.js"),
  require("./stopky.js"),
];

(async () => {
  const only = (process.argv[2] || "").toLowerCase();
  const server = await P.startServer();
  const browser = await P.launch();
  let failed = 0;
  for (const test of TESTS) {
    if (only && !test.name.toLowerCase().includes(only)) continue;
    const check = P.checker(test.name);
    const started = Date.now();
    try {
      await test.run({ browser, url: server.url, check });
    } catch (e) {
      check.fails.push("test spadl: " + (e && e.stack ? e.stack : e));
    }
    const sec = ((Date.now() - started) / 1000).toFixed(1);
    if (check.fails.length) {
      failed++;
      console.log(`CHYBA ${test.name} (${sec} s)`);
      for (const msg of check.fails) console.log("    - " + msg);
    } else {
      console.log(`OK    ${test.name} (${sec} s)`);
    }
  }
  await browser.close();
  await server.close();
  console.log(failed ? `\nSelhalo testů: ${failed}` : "\nVšechny testy prošly.");
  process.exit(failed ? 1 : 0);
})();
