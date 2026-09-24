# Workout deník – kontext pro Claude

Osobní appka na zapisování tréninků ve fitku (inspirovaná Hevy). Běží jako PWA
na GitHub Pages, používá se na Androidu v Chromu, nainstalovaná na plochu.
Do září 2026 běžela jako Claude artefakt (jeden HTML soubor), viz `puvodni/`.

Plán vývoje a priority: `docs/plan-vyvoje.md`. Je to jediný zdroj pravdy o tom,
co je hotové a co je na řadě. Úlohy mají ID (např. F0-02).

## Pravidla

- Jen řešení zdarma, žádné placené služby, API ani knihovny.
- Čisté HTML/CSS/JavaScript bez build kroku a bez npm závislostí. Nasazuje
  GitHub Actions (`.github/workflows/nasazeni.yml`, F0-04): `main` = vydaná verze
  v kořeni webu, každý otevřený PR = testovací verze v `…/workout-denik-test/pr-N/`
  (web samostatného repa `workout-denik-test`, aby šla v Androidu nainstalovat
  vedle vydané appky; adresa pod `…/workout-denik/` patří nainstalované appce).
- Cílová platforma: Android, Chrome, instalace jako PWA. Musí fungovat offline.
- Uživatelské rozhraní česky.
- Data uživatele v repu nikdy nejsou, zůstávají jen v telefonu (IndexedDB).
  Nikdy necommituj zálohy (`*.json` je v `.gitignore`).
- Uživatel není profesionální programátor: změny vysvětluj srozumitelně
  a v PR popisuj, co si má na telefonu vyzkoušet (krok za krokem).
- Každá úloha = vlastní větev a pull request, do `main` nic přímo.
- Na víc úlohách se může pracovat souběžně (každá ve své větvi). Proto před
  dokončením PR (a vždy, když GitHub hlásí konflikt nebo uživatel řekne, že se
  sloučil jiný PR) stáhni aktuální `main` a slouč ho do své větve (`git merge`,
  ne rebase). Konflikty vyřeš tak, aby zůstaly změny z obou stran:
  - `VERSION` v `sw.js` se od F0-04 ručně nemění; když ji starší větev ještě
    zvyšuje, při konfliktu vezmi podobu `sw.js` z `main` (a doplň nové `FILES`),
  - v logu plánu nech řádky z obou větví (nejnovější nahoře),
  - v kódu zachovej funkce z `main` i z úlohy a po sloučení appku znovu ověř.
- V rámci PR úlohy zaškrtni úlohu v `docs/plan-vyvoje.md` a přidej řádek
  do logu na konci plánu (nejnovější nahoře).
- Stará data se nesmí ztratit: nová pole mají výchozí hodnoty a uložená data
  se při načtení automaticky doplní. Formát zálohy měň jen zpětně kompatibilně
  (`BK_VERSION`, `normBackup` v `js/app.js`).

## Struktura souborů

| Soubor | Co v něm je |
|---|---|
| `index.html` | Kostra stránky, načítá CSS a skripty. |
| `css/app.css` | Všechny styly (světlý i tmavý motiv přes proměnné v `:root`). |
| `js/app.js` | Celá appka: datová vrstva, stav, vykreslování, akce, záloha. |
| `js/atlas.js` | Anatomické SVG pro svalovou mapu (velké, needitovat ručně). |
| `js/cviky.js` | Výchozí databáze cviků (`EX_DB`) s partiemi, `EX_DB_OLD` pro převod starých dat. |
| `js/fedb.js` | Kopie free-exercise-db pro hledání cviků (F0-03). Needitovat ručně, vytváří ho `tools/fedb/build.py`. |
| `tools/fedb/` | Skript `build.py` a podklady: `cesky.tsv` (české názvy), `shody.tsv` (stejné cviky jako v `EX_DB`). Není součást appky. |
| `js/pwa.js` | Registrace service workeru a automatická aktualizace. |
| `js/verze.js` | Údaje o verzi (`APP_BUILD`): kanál, PR, větev, commit, čas nasazení. V repu jen „lokal", při nasazení ho přepíše `.github/sestav-web.sh`. Ručně needitovat. |
| `sw.js` | Service worker: offline cache (verze z `js/verze.js`), seznam souborů (`FILES`). |
| `.github/workflows/nasazeni.yml` | GitHub Actions: vydaná verze na Pages tohoto repa (při změně v `main`), testovací verze do repa `workout-denik-test` (token v secretu `TEST_REPO_TOKEN`), úloha „kontrola" v každém PR. |
| `.github/sestav-web.sh` | Sestaví web: `vydana` = `main`, `testovaci` = otevřené PR do `pr-N/` + rozcestník; zapíše `js/verze.js`. |
| `.github/komentare.sh` | Komentář s odkazem na testovací verzi v každém nasazeném PR. |
| `manifest.webmanifest` | Název, ikony a barvy pro instalaci PWA. |
| `icons/` | Ikony appky (PNG 192/512, maskable 512, apple-touch, SVG). `icons/test/` = oranžové ikony TEST pro testovací verze. |
| `fonts/` | Písma Barlow a Barlow Condensed (OFL), lokálně kvůli offline. |
| `docs/plan-vyvoje.md` | Plán vývoje, otevřené otázky, log. |
| `puvodni/workout-denik.html` | Poslední verze artefaktu (verze 9). Jen pro referenci, needitovat. |
| `.nojekyll` | GitHub Pages servíruje soubory tak, jak jsou (bez Jekyllu). |

## Konvence

- **Verze a cache (F0-04):** verzi určuje `js/verze.js`, který se přepíše při
  každém nasazení (commit + čas), takže se appka v telefonu aktualizuje sama.
  `VERSION` v `sw.js` ručně neměnit. Nový soubor přidej do `FILES` v `sw.js`,
  jinak nepojede offline. Soubory `.github/`, `docs/`, `puvodni/`, `tools/` a `*.md`
  se na web nekopírují.
- **Testovací verze PR:** běží na stejné doméně jako vydaná verze, proto má
  vlastní data (`localStorage` prefix `zd1-prN:`, IndexedDB `workout-denik-prN`,
  cache `wd-prN-…`). Data proto ukládej vždy jen přes `Local` / `Idb` / `Store`,
  nikdy přímo přes `localStorage` nebo pevný název databáze. PR se nasadí, jen
  když větev obsahuje `js/verze.js`. V popisu PR uveď, že odkaz na testovací
  verzi přidá GitHub do komentáře v PR (asi 1–3 minuty po pushi).
- Všechny cesty relativní (`css/app.css`, ne `/css/app.css`), appka běží
  v podadresáři `https://<uživatel>.github.io/workout-denik/`.
- Žádné externí zdroje (CDN, Google Fonts…) – offline by nefungovaly.
- Styl kódu v `js/app.js`: kompaktní (často víc příkazů na řádku), HTML se skládá
  jako řetězce, texty escapovat přes `esc()`. Komentáře česky.
- Kliknutí se řeší delegací přes `data-act` / `data-v` (jeden velký `switch`).
- Vykreslení: `scheduleRender()`; změna dat vždy přes `put(path, data)`.
- Tlačítko Zpět (F0-06, sekce „tlačítko Zpět" v `js/app.js`): každý stisk = jeden
  krok `navBack()`. Nový panel přes `openSheet(…, noanim, nav)`: panel v panelu
  dostane `nav.lv` (hloubka) a `nav.back` (krok o úroveň), dynamický panel `nav.re`
  (znovu otevření). Nová podstránka (jako `exd`, `edit`) uloží místo návratu
  `S.nav.push(navFrame())` a musí se doplnit do `navBack` a `navDepth`. Šipky ←
  v appce volají `navBack()`. Záznamy historie se přidávají jen po klepnutí (`navEnsure`).

## Datová vrstva (js/app.js, sekce „DATOVÁ VRSTVA")

- Appka mluví jen se `Store`. Ten drží frontu zápisů (`localStorage`
  `zd1:queue`), cache všech dat (`zd1:cache`, rychlý start) a rozdělaný trénink
  (`zd1:active`). Zápis se nejdřív uloží do fronty, pak do backendu.
- Backend: `IndexedDbBackend`, databáze IndexedDB `workout-denik`:
  - úložiště `docs` – dokumenty podle cesty: `config/main` (fitka, nastavení),
    `config/exercises` (`{v:2, items}`: jen odchylky od `EX_DB` a vlastní cviky),
    `config/templates`, `config/backup` (datum zálohy,
    seznam bodů obnovy), `workouts/RRRR-MM` (tréninky po měsících),
    `body/all` (měření), `state/active` (rozdělaný trénink),
  - úložiště `points` – body obnovy (celá záloha jako JSON text).
- Při startu se volá `navigator.storage.persist()`, aby Chrome data nemazal.
- Verze (F0-04): `BUILD` (z `js/verze.js`), `TEST_PR` (číslo PR z adresy, jinak
  `""`). Nastavení → Verze aplikace: `versionSettings`, kontrola aktualizace
  (`window.PWA.check()` z `js/pwa.js`), v testu `copyFromMain`, ve vydané verzi
  `scanTestData` / `deleteTestData`. Pruh `testBar()` je součástí `topbar()`.
- Drobná nastavení zobrazení jsou v `localStorage` s prefixem `zd1:`.
- Cviky (F0-02): `S.exLib` = `EX_DB` + odchylky (`exLoad`), zápis vždy přes
  `putEx(items)`, který uloží jen rozdíly. Partie jsou klíče `MUSCLE_MAP.NAMES`,
  ramena jsou jedna partie `delts` (staré `delt_f/s/r` se převádějí). Záloha
  obsahuje celé cviky a značku `exDb:2`.
- Záložka Cviky (F0-05): route `ex` (`vExList`), filtry `S.exlM`/`S.exlEq`/`S.exlSort`
  v `localStorage`. Stránka cviku (route `exd`, `vExDetail`) má části Popis
  a Statistiky (`S.exPart`); `openEx` volí část podle toho, odkud se přišlo
  (`data-p` ji vynutí). Hledání přes `exMatch` ignoruje diakritiku.
- Fitka (F0-07): pořadí = pořadí v `S.cfg.gyms` (šipky v Nastavení, akce `gymMove`).
  Barva je uložená v `g.col` (1–`GYM_COLORS` = 12, CSS proměnná `--sN`), doplňuje ji
  `cfgNorm` při načtení; nová barva přes `freeGymCol`. Barvu nikdy nepočítat z pořadí.
  Výběr barvy v `sheetGym` (F3-01, akce `gymCol`). Grafy, které nepatří fitku, mají `var(--chart)`, ne `--s1`.
- Barvy (F3-01): šedý text `--ink-2`/`--ink-3` je zesílený kvůli čitelnosti, drobný text nedělat světlejší.
  Skupiny partií `MGRP` / `MGRP_OF` (6 skupin, i pro radar F3-04), barva `mgCol(k)` = `--g-<skupina>`.
  `musFigs(m, small, grp)`: `grp` = postava v barvách skupin (Statistiky, souhrn), jinak červená; `mgStack` = pruh
  s poměrem skupin. Stránka cviku (`exFigures`, `exTags`) zůstává červená.
- Hledání v online databázi (F0-03): `js/fedb.js` (`FEDB`) se načte až při prvním
  hledání (`fedbLoad`), není ve `FILES`; service worker ho uloží do cache při prvním
  stažení. Stav hledání `fs`, vykreslení `renderFs`/`refreshFs`. Vybraný záznam
  předvyplní `sheetExEdit(null, from, fx)` a vlastní cvik dostane `src:"fedb:<id>"`.
  Fotky jen jako náhled z GitHubu (`FEDB_IMG`), nic se neukládá. Změna českých názvů
  nebo shod: upravit TSV v `tools/fedb/` a spustit `python3 tools/fedb/build.py`.
- Minule a předvyplnění (F1-01, sekce „MINULE A PŘEDVYPLNĚNÍ“): „minule“ = `lastSession`
  (vázaný cvik jen v tomtéž fitku, při úpravě jen tréninky před ní, `draftLast`). Série se párují
  podle druhu (`setGrp`: zahřívací zvlášť), `exHints` vrátí pro každou sérii minulou sérii
  (sloupec Minule) a šedé předvyplnění (placeholder), ✓ ho převezme. Nový cvik v tréninku má
  prázdné hodnoty; `s.ph` = hodnoty ze šablony jen u nikdy necvičeného cviku (jen v rozdělaném tréninku).
- Cvičit znovu (F2-01, sekce „CVIČIT ZNOVU“): tlačítko `wAgain` v `sheetWorkout` otevře `sheetAgain`
  (volba fitka, stav `again`), `startAgain` založí trénink přes `exEntryFor` se sériemi vybraného
  tréninku (jako šablona). Rozdělaný trénink má `again` = id původního tréninku (kvůli nezaškrtnutému
  „Aktualizovat šablonu“), uložený trénink ho má jako `againOf` (porovnání v souhrnu, F3-03; starší
  rozdělaný trénink může mít `again:true`). Série do šablony z tréninku vždy přes `tplSet` (i `sec`, `km`).
- Souhrn tréninku (F3-03, sekce „SOUHRN TRÉNINKU“): panel `sheetWorkout(w, justSaved, nav)` po uložení
  i z Historie. Minulý běh stejného tréninku `prevRun` (pravidlo `sameRun`: šablona, jinak název bez
  automatických `DEF_TITLES`, nebo `againOf`; přednostně stejné fitko), u cviku poslední výskyt `prevEx`
  (vázaný cvik jen ve stejném fitku). Klepnutí na „Porovnáno s…“ = panel v panelu (`prevW`, `wOpen`,
  `wBack`). Procvičené partie `wMuscles` (pomocná partie = půl série), postava přes `musFigs`
  (sdílí ji i Statistiky). Nic se neukládá, vše se počítá z tréninků.
- Kalendář (F3-06, sekce „KALENDÁŘ“): Historie má přepínač `S.histView` (`cal` výchozí / `list`, `Local` `histView`),
  `vCal` vykreslí měsíc `S.calM` (0 = aktuální, `goTab("hist")` ho vynuluje; `calShift`, swipe na `[data-cal]`).
  Tréninky podle dne přes `wByDay` (klíč `dayKey`, použít i pro heatmapu F3-07), měření `bodyByDay`.
  Pod kolečkem název tréninku, streak `calStreak` a volné dny `calRest` vždy ze všech fitek. Klepnutí `sheetCalDay`:
  jedna věc rovnou, víc = výběr, z něj `sheetWorkout`/`sheetBody` s `nav` zpět do výběru. Budoucí dny jsou neaktivní
  (místo pro F4-07).
- Odpočinek (F1-04, sekce „odpočinek mezi sériemi" v `js/app.js`): konec pauzy
  `S.restEnd`, uložený v `Local` `rest` (přežije reload), start jen přes `restStart()`,
  konec přes `restStop()`. Nastavení v `config/main`: `restSec`, `restAlert`
  (`both`/`sound`/`vib`), `restOver` (přečas), `restNotify`. Oznámení na pozadí ukazuje
  service worker (`sw.js`, zpráva `{type:"rest"}` z `restPost()`), jen když appka není
  na očích (viditelná a aktivní); drží se vzhůru přes `waitUntil`, Chrome to dovolí asi 5 min.
  Záznam událostí oznámení (cache `wdlog-prN`, píše `sw.js` i appka) je vývojový nástroj:
  vede se jen v testovací verzi a lokálně (`DEV`), tlačítko v Nastavení → Verze aplikace
  (`sheetRestLog`). Ve vydané verzi nic takového být nemá (přání uživatele).
  Se zamčeným displejem Android uspí procesor a oznámení se může zpozdit; udržování
  vzhůru neslyšitelným tónem uživatel odmítl, znovu nenavrhovat.
- Oslava rekordu (F3-02, sekce „OSLAVA REKORDU“): `celebrate(R, podtitul, auto)` = medaile přes celou obrazovku
  (element `.cel` v `body`, stav `celEl`; `navBack`/`navDepth` s ní počítají). V rozdělaném tréninku ji spouští
  `celExercise` po odškrtnutí, když jsou hotové všechny pracovní série cviku (`exDone`) a `liveRecords` hlásí rekord
  ještě neoslavený (`e.cel` = {typ: hodnota} v rozdělaném tréninku, `draftToWorkout` ho neukládá); po uložení tréninku
  `wRecs`. Zlatá, když je v seznamu velký rekord (`REC_BIG`). Nastavení v `config/main`: `recCelEx` (po cviku; vypnuto =
  hláška po sérii jako dřív), `recCelW` (po tréninku), `recSnd` (id z `CEL_SOUNDS`, `"off"`). Medaile se zavírá jen
  klepnutím (Pokračovat, mimo kartu) nebo Zpět, sama nezmizí. Zvuky se skládají přes Web Audio (`celTone`), žádné soubory.
- Záloha (F0-01): export/import JSON (formát v2), sloučit / nahradit vše,
  body obnovy (automaticky týdně, před obnovou, ručně; drží se 8).
  Stažení souboru přes `LocalDownloads` (odkaz s `download`).

## Testování

Žádné automatické testy. Lokálně stačí statický server z kořene repa, např.
`python3 -m http.server` a otevřít `http://localhost:8000/`. Service worker
funguje jen na `localhost` nebo přes HTTPS. Pro kontrolu v prohlížeči lze
použít Playwright s předinstalovaným Chromiem (bez instalace do repa).

Lokálně má `js/verze.js` verzi „lokal", která se nemění, takže service worker
po úpravě kódu drží staré soubory. Používej čistý profil prohlížeče (nový
kontext v Playwrightu) nebo v DevTools „Update on reload".

Celý web včetně testovací verze jde sestavit i lokálně (bez `gh`, PR se zadají
ručně), do složek `/tmp/www/workout-denik` a `/tmp/www/workout-denik-test`
a pak servírovat `/tmp/www`:

```
PR_JSON='[{"number":99,"title":"Zkouška","headRefName":"vetev","isCrossRepository":false}]' \
  VYDANA_URL=http://localhost:8000/workout-denik/ \
  bash .github/sestav-web.sh testovaci /tmp/www/workout-denik-test
bash .github/sestav-web.sh vydana /tmp/www/workout-denik
```

Skript bere větve z `origin` (`main` a `refs/pull/N/head`). Workflow při každém
PR skript spustí na zkoušku (úloha „kontrola", nic nenasazuje).
