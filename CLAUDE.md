# Workout deník – kontext pro Claude

Osobní appka na zapisování tréninků ve fitku (inspirovaná Hevy). Běží jako PWA
na GitHub Pages, používá se na Androidu v Chromu, nainstalovaná na plochu.
Do září 2026 běžela jako Claude artefakt (jeden HTML soubor), viz `puvodni/`.

Plán vývoje a priority: `docs/plan-vyvoje.md`. Je to jediný zdroj pravdy o tom,
co je hotové a co je na řadě. Úlohy mají ID (např. F0-02).

## Pravidla

- **Před implementací nové úlohy nebo funkce vždy nejdřív:** popiš, jak bude funkce fungovat
  a co se změní oproti současnému stavu (ověřeno v kódu), jaké má výhody a nevýhody a možné
  konflikty s budoucím vývojem (úlohy z plánu), a polož doplňující a upřesňující otázky (u každé
  návrh výchozí volby). **Implementovat začni až po výslovném pokynu uživatele** („implementuj“,
  „pusť se do toho“…). Odpovědi na otázky samy o sobě pokyn nejsou. Uživatel to nechce pokaždé
  připomínat.
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
| `.github/workflows/nasazeni.yml` | GitHub Actions: vydaná verze na Pages tohoto repa (při změně v `main`), testovací verze do repa `workout-denik-test` (token v secretu `TEST_REPO_TOKEN`), úloha „kontrola" v každém PR (i hledání kódu přímo v HTML, F0-08). |
| `.github/sestav-web.sh` | Sestaví web: `vydana` = `main`, `testovaci` = otevřené PR do `pr-N/` + rozcestník; zapíše `js/verze.js`. |
| `.github/komentare.sh` | Komentář s odkazem na testovací verzi v každém nasazeném PR. |
| `manifest.webmanifest` | Název, ikony a barvy pro instalaci PWA. |
| `icons/` | Ikony appky (PNG 192/512, maskable 512, apple-touch, SVG). `icons/test/` = oranžové ikony TEST pro testovací verze. |
| `fonts/` | Písma Barlow a Barlow Condensed (OFL), lokálně kvůli offline. |
| `docs/plan-vyvoje.md` | Plán vývoje, otevřené otázky, log. |
| `docs/navrhy/` | Odložené návrhy: diskuse, rozhodnutí a náhledy úloh, ke kterým se možná vrátíme (např. `F3-07-heatmapa.md`). Při znovuotevření úlohy nejdřív přečíst. |
| `puvodni/workout-denik.html` | Poslední verze artefaktu (verze 9). Jen pro referenci, needitovat. |
| `.nojekyll` | GitHub Pages servíruje soubory tak, jak jsou (bez Jekyllu). |
| `.git-blame-ignore-revs` | Commity, které jen přeformátovaly kód (F0-10); GitHub je v historii řádků přeskočí. |

## Konvence

- **Verze a cache (F0-04):** verzi určuje `js/verze.js`, který se přepíše při
  každém nasazení (commit + čas), takže se appka v telefonu aktualizuje sama.
  `VERSION` v `sw.js` ručně neměnit. Nový soubor přidej do `FILES` v `sw.js`,
  jinak nepojede offline. Soubory `.github/`, `docs/`, `puvodni/`, `tools/`, `*.md`
  a `.git-blame-ignore-revs` se na web nekopírují.
- **Testovací verze PR:** běží na stejné doméně jako vydaná verze, proto má
  vlastní data (`localStorage` prefix `zd1-prN:`, IndexedDB `workout-denik-prN`,
  cache `wd-prN-…`). Data proto ukládej vždy jen přes `Local` / `Idb` / `Store`,
  nikdy přímo přes `localStorage` nebo pevný název databáze. PR se nasadí, jen
  když větev obsahuje `js/verze.js`. V popisu PR uveď, že odkaz na testovací
  verzi přidá GitHub do komentáře v PR (asi 1–3 minuty po pushi).
- Všechny cesty relativní (`css/app.css`, ne `/css/app.css`), appka běží
  v podadresáři `https://<uživatel>.github.io/workout-denik/`.
- Žádné externí zdroje (CDN, Google Fonts…) – offline by nefungovaly.
- Pravidla zabezpečení (F0-08): `index.html` má Content-Security-Policy. Skripty, písma, `fetch`, manifest
  a service worker jen z vlastních souborů, obrázky navíc z `https://raw.githubusercontent.com`, styly i přímo
  u prvků (`style="…"`). Nikdy kód přímo v HTML (`onclick=`, `onerror=`, `javascript:`…), jen posluchače
  (sekce „pravidla zabezpečení" v `js/app.js`); úloha „kontrola" v GitHub Actions takový PR odmítne.
  Obrázky `blob:` jsou povolené (fotky u cviků, F2-05). Nový vnější zdroj nebo `data:` obrázky (F4-08)
  přidat do CSP v `index.html`. Co pravidla
  zablokují, ukáže testovací verze hláškou (`securitypolicyviolation`).
- Odkaz u cviku (F0-09, sekce „odkaz u cviku" v `js/app.js`): jen `http(s)` s doménou, `URL_MAX` znaků.
  `urlNormalize` (doplní `https://`), `urlProblem` (text hlášky, `""` = v pořádku), `urlSafe` (otevírat jen tohle),
  `exLink` / `exLinkLabel` pro odkaz a popisek, `exUrlsClean` při obnově zálohy (`normBackup`).
- Styl kódu (čitelnost pro člověka má přednost před stručností):
  - jeden příkaz na řádek, odsazení 2 mezery, řádky nejvýš cca 110 znaků,
  - `if`/`for` s tělem na víc řádků ve složených závorkách (jednořádkový `if` jen pro
    krátký návrat, např. `if (!x) return;`),
  - delší HTML skládat přes šablonové řetězce (`` `…${esc(x)}…` ``) rozložené na víc
    řádků podle struktury HTML, texty vždy escapovat přes `esc()`,
  - srozumitelné názvy proměnných a funkcí (ne jednopísmenné, kromě krátkých smyček),
  - krátký český komentář nad každou funkcí, která není zřejmá z názvu, a nad každou
    sekcí souboru,
  - formát odpovídá Prettieru (`--print-width 110 --quote-props preserve`, jen při vývoji,
    do repa se nepřidává); zlom řádku uvnitř HTML šablony jen tam, kde přidaná mezera
    nemůže změnit vzhled (mezi atributy, vedle blokového prvku, mezi prvky flex/grid),
    jinak šablonu rozdělit na dvě spojené přes `+` (F0-10).
- Kliknutí se řeší delegací přes `data-act` / `data-v` (jeden velký `switch`).
- Tlačítka (F2-07): akce v nadpisu sekce (`.sec-h`) jen jako ikona v rámečku malého tlačítka `icoBtn(act, ikona,
  popis, v)` (ikony v `IC`, popis pro čtečku). Text zůstává u velkých tlačítek přes celou šířku a u tlačítek v kartách
  a panelech. Krátký formulář (pár políček, např. fitko) = panel `openSheet`, dlouhý formulář nebo skládání seznamu
  cviků (trénink, šablona) = stránka se šipkou ← a dotazem „Zahodit změny?“ (Nový / Upravit cvik přejde na stránku
  v F3-14).
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
  - úložiště `points` – body obnovy (celá záloha jako JSON text),
  - úložiště `photos` – fotky u cviků (F2-05, databáze verze 2; `Idb.VER`), mimo `Store`.
- Při startu se volá `navigator.storage.persist()`, aby Chrome data nemazal.
- Verze (F0-04): `BUILD` (z `js/verze.js`), `TEST_PR` (číslo PR z adresy, jinak
  `""`). Nastavení → O aplikaci → Verze aplikace: `versionSettings`, kontrola aktualizace
  (`window.PWA.check()` z `js/pwa.js`), v testu `copyFromMain`, ve vydané verzi
  `scanTestData` / `deleteTestData`. Pruh `testBar()` je součástí `topbar()`.
- Drobná nastavení zobrazení jsou v `localStorage` s prefixem `zd1:`.
- Nastavení (F3-09, sekce „NASTAVENÍ“): rozcestník `vSettingsHub` se skupinami `SET_PAGES` (Fitka, Trénink, Rekordy,
  Vzhled, Data a záloha, O aplikaci), každá na vlastní podstránce `S.setPage` (`""` = rozcestník, `Local` `setPage`,
  po reloadu se vrátí; otevření jen přes `setPageOpen`). Záložka Nastavení vždy otevře rozcestník, Zpět z podstránky
  vede na rozcestník (`navBack`, `navDepth`). Na rozcestníku jen názvy skupin, výjimka: oranžový řádek Data a záloha
  s textem, když `backupDue()` (stejné pravidlo jako připomínka na úvodní obrazovce). Nová volba patří do existující
  skupiny (funkce `…Settings()` v `body` skupiny), novou skupinu přidávat jen výjimečně.
- Cviky (F0-02): `S.exLib` = `EX_DB` + odchylky (`exLoad`), zápis vždy přes
  `putEx(items)`, který uloží jen rozdíly. Partie jsou klíče `MUSCLE_MAP.NAMES`,
  ramena jsou jedna partie `delts` (staré `delt_f/s/r` se převádějí). Záloha
  obsahuje celé cviky a značku `exDb:2`.
- Záložka Cviky (F0-05): route `ex` (`vExList`), filtry `S.exlM`/`S.exlEq`/`S.exlSort`
  v `localStorage`. Stránka cviku (route `exd`, `vExDetail`) má části Popis
  a Statistiky (`S.exPart`); `openEx` volí část podle toho, odkud se přišlo
  (`data-p` ji vynutí). Hledání přes `exMatch` ignoruje diakritiku.
- Fitka (F0-07): pořadí = pořadí v `S.cfg.gyms` (přetažením v Nastavení, F2-07).
  Barva je uložená v `g.col` (1–`GYM_COLORS` = 12, CSS proměnná `--sN`), doplňuje ji
  `cfgNorm` při načtení; nová barva přes `freeGymCol`. Barvu nikdy nepočítat z pořadí.
  Výběr barvy v `sheetGym` (F3-01, akce `gymCol`). Grafy, které nepatří fitku, mají `var(--chart)`, ne `--s1`.
- Písmo (F3-11): velikost písma jen přes stupnici v `:root` v `css/app.css` (`--fs-2xs` 11, `--fs-xs` 12, `--fs-sm` 13,
  `--fs-md` 14, `--fs-base` 15, `--fs-lg` 17, `--fs-xl` 20, `--fs-2xl` 22, `--fs-3xl` 26, `--fs-4xl` 30, `--fs-clock` 88 px),
  nikdy `font-size` v px (ani v `style=` v JS). Nastavení → Vzhled → Velikost písma (`Local` `fontScale`, `setFontScale`,
  `data-fs` na `<html>`) násobí celou stupnici přes `--fs-k` (1 / 1,15 / 1,3). Nová obrazovka se musí vejít i při
  „Největší“ na šířku 360 px: rozměry podle textu v `em`, ne pevné px; přepínač `.seg` s víc volbami pod nadpis
  (`.seg-wide`), ne vedle popisku; pevné lišty přes `min(…, vw)` (`--fs-tabs`); rozměry počítané v JS násobit
  `fontK()` (okraje grafů).
- Barvy (F3-01): šedý text `--ink-2`/`--ink-3` je zesílený kvůli čitelnosti, drobný text nedělat světlejší.
  Skupiny partií `MGRP` / `MGRP_OF` (6 skupin, i pro radar F3-04), barva `mgCol(k)` = `--g-<skupina>`.
  `musFigs(m, small, grp)`: `grp` = postava v barvách skupin (Statistiky, souhrn), jinak červená; `mgStack` = pruh
  s poměrem skupin. Stránka cviku (`exFigures`, `exTags`) zůstává červená.
- Grafy (F3-08, sekce „grafy (SVG)“): `chartPh(spec, výška)`, kreslí `drawCharts`. Jednotka je u každého čísla na ose Y
  (`spec.yUnit`, opakování „10×“ bez mezery přes `withUnit`), v bublině přípona `spec.unit`. Čas a objem přes `spec.fmt`
  (`CH_FMT`: `min` = minuty jako „2:00 h“, `sec` = sekundy jako „1:30 min“, `vol` = kg, od 10 000 tuny jako `fmtVol`),
  počty (opakování, tréninky, série) `spec.whole` = na ose jen celá čísla.
  Graf je přes celou šířku karty: levý okraj = změřená šířka nejdelšího popisku (`chartTextWidth`), vpravo bez okraje.
  Popisky pod sloupci se při nedostatku místa pravidelně vynechají (poslední zůstane). Nový graf s jednotkou jen přes tato pole.
- Statistiky (F3-13): route `stats`, `vStats` vykreslí přepínač částí `STATS_PARTS` nad filtrem fitek a jednu část:
  `statsOver` (Přehled), `statsMus` (Partie, sem radar F3-04), `statsEx` (Cviky). Otevřená část `S.statsPart`
  (`Local` `statsPart`, výchozí `over`, akce `statsPart` posune nahoru). Fitko `S.statsGym` a období `S.statsRange`
  jsou společné pro všechny části. Nová sekce Statistik patří do jedné z částí, ne pod ně.
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
- Šablony podle fitka (F2-02, sekce „ŠABLONY PODLE FITKA“): šablona `{name, order, gyms, items}`, `gyms` = fitka
  (`[]` = všechna, i starší šablony; doplňuje `tplNorm` při načtení a v `normBackup`), jen existující fitka
  přes `tplGyms`, `tplHere(t, gymId)`. Úvodní obrazovka `vHomeTpls`: šablony `curGym()`, ostatní až po tlačítku
  „Ostatní šablony“ (jako „Zobrazit další“ v Historii, pak na jeho místě nadpis sekce; `tplOther`, neukládá se,
  změna fitka ho vynuluje), karta `tplCard`. Výběr fitek v editoru `tplGymPick` (akce `tplGym`, `d.gyms`).
  Zápis šablony vždy přes `Object.assign` s původní šablonou (zachová pole, která editor nezná). `delGym`
  odebere fitko i ze šablon.
- Jedinečné názvy šablon (F2-08, sekce „JEDINEČNÉ NÁZVY ŠABLON“): stejný název (`tplKey`: bez velkých písmen, diakritiky
  a mezer) nesmí mít šablony, které se ukazují ve stejném fitku (`tplMeet`, `[]` = všechna fitka); shody `tplClash`,
  volný název `tplFreeName` („Nohy 2“), uložený název přes `tplClean`. Editor: `tplNameProblem` / `tplNameMark` (červený
  název a text `#ed-title-msg` hned při psaní, `saveTpl` nepustí; tlačítko `#tpl-save` je šedé přes `tplSaveOff` (třída
  `.btn.off`, klepnout jde, ukáže hlášku); stará šablona s duplikátem projde bez změny názvu
  a fitek). Uložit jako šablonu (`wToTpl`) při shodě `sheetTplClash` (stav `tplAsk`: `tplAskNew` / `tplAskOver` /
  `tplAskBack`). Každé nové místo, které vytváří šablonu, má volný název hlídat stejně; stávající duplikáty zůstávají.
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
  konec přes `restStop()`. Nastavení v `config/main`: `restOn` (hlavní vypínač, vypnuto = po ✓ žádná pauza, F4-05), `restSec`,
  `restSs` (po pracovní supersérii, F4-05), `restAlert`
  (`both`/`sound`/`vib`), `restOver` (přečas), `restNotify`. Oznámení na pozadí ukazuje
  service worker (`sw.js`, zpráva `{type:"rest"}` z `restPost()`), jen když appka není
  na očích (viditelná a aktivní); drží se vzhůru přes `waitUntil`, Chrome to dovolí asi 5 min.
  Záznam událostí oznámení (cache `wdlog-prN`, píše `sw.js` i appka) je vývojový nástroj:
  vede se jen v testovací verzi a lokálně (`DEV`), tlačítko v Nastavení → O aplikaci
  (`sheetRestLog`). Ve vydané verzi nic takového být nemá (přání uživatele).
  Se zamčeným displejem Android uspí procesor a oznámení se může zpozdit; udržování
  vzhůru neslyšitelným tónem uživatel odmítl, znovu nenavrhovat.
- Supersérie (F4-05, sekce „SUPERSÉRIE“): cviky se stejnou značkou `e.ss` hned za sebou (rozdělaný i uložený trénink,
  šablona; `ssRun` = rozsah, aspoň 2 cviky), osamělou nebo rozdělenou značku uklidí `ssNorm` (po odebrání, přetažení
  `ssMoved`, v `draftToWorkout`, při uložení šablony). Menu cviku `ssOn` (`ssLink`) / `ssOff` (`ssUnlink`), karty jedné supersérie
  obaluje `ssWrap` (`.ssg` = menší mezera), karta má třídu `ss-on` (proužek vlevo přes `::before`, rozměry karty
  beze změny) a štítek `ssPill` / `ssLabel` („supersérie 1/2“; editor, souhrn, panel Pořadí cviků). Každé nové místo, které kopíruje cviky (šablona ↔ trénink), přenáší
  značku přes `ssOf(e)`. Pauza po ✓ (`toggleSetDone`) podle `ssRest`: série se párují podle `setGrp` a pořadí,
  nehotová dvojice = bez pauzy a hláška `restNext()`, hotové pracovní kolo = `restStart(S.cfg.restSs)`, jinak výchozí
  `S.cfg.restSec`. `restNext` v supersérii vybírá další kolo.
- Displej během pauzy (F1-02, sekce „displej během pauzy“): `S.cfg.screenOn` (výchozí vypnuto) = Screen Wake Lock jen
  během pauzy (`S.restEnd`, i přečas) v rozdělaném tréninku, appka na očích. Vše řídí `wakeSync()` (volá ho `restSave`,
  `visibilitychange`, baterie a interval s `restTick`). Pojistka `WAKE_IDLE` 10 min bez dotyku (`wakeTouch`), baterie pod
  `WAKE_BATT` bez nabíječky (`batteryLow`, `navigator.getBattery`) = dočasně vypnuto s upozorněním v `wakeSettings`.
  `S.cfg.screenDim`: po `WAKE_DIM` 30 s černá vrstva `.dim` s odpočtem (`dimEl`, jas měnit nejde), klepnutí ji jen schová.
- Oslava rekordu (F3-02, sekce „OSLAVA REKORDU“): `celebrate(R, podtitul, auto)` = medaile přes celou obrazovku
  (element `.cel` v `body`, stav `celEl`; `navBack`/`navDepth` s ní počítají). V rozdělaném tréninku ji spouští
  `celExercise` po odškrtnutí, když jsou hotové všechny pracovní série cviku (`exDone`) a `liveRecords` hlásí rekord
  ještě neoslavený (`e.cel` = {typ: hodnota} v rozdělaném tréninku, `draftToWorkout` ho neukládá); po uložení tréninku
  `wRecs`. Zlatá, když je v seznamu velký rekord (`REC_BIG`). Nastavení v `config/main`: `recCelEx` (po cviku; vypnuto =
  hláška po sérii jako dřív), `recCelW` (po tréninku), `recSnd` (id z `CEL_SOUNDS`, `"off"`). Medaile se zavírá jen
  klepnutím (Pokračovat, mimo kartu) nebo Zpět, sama nezmizí. Zvuky se skládají přes Web Audio (`celTone`), žádné soubory.
- Kontrola čísel (F1-10, sekce „KONTROLA ČÍSEL“ a „UPOZORNĚNÍ NA VELKÝ SKOK“): každé číselné políčko má
  `data-num="<pravidlo>"` (`NUM_RULES`: `kg`, `reps`, `sec`, `km`, `min`, `body`, `pct`, `kcal`, `bw`), při vykreslení
  třídu `numCls(pravidlo, hodnota)`. Znaky filtruje `numInput` (globální posluchač `input`; číslici navíc podle
  `numFits` nepřijme, „,5“ → „0,5“), platnost `numCheck`, jednotnou podobu po opuštění políčka a při ✓ `numNormalize`
  (čas „85“ → „1:25“, „1:5“ → „1:05“, „82.5“ → „82,5“).
  Před uložením `setProblem` / `draftProblem` (série) a `inputProblem(id)` (políčka ve formulářích). Nové číselné pole
  (např. F1-03, F1-08, F4-04) vždy přes stejná pravidla. Uložené číslo do políčka přes `numStr` (nejvýš 2 desetinná
  místa). ✓ série = `toggleSetDone`; velký nárůst proti minulé sérii (`JUMP`, `setJump`) se ptá přes `sheetJump`,
  potvrzení `s.jumpOk` platí do změny hodnoty a neukládá se.
- Krokovač (F1-03, sekce „KROKOVAČ“): v rozdělaném tréninku se zapnutým `S.cfg.stepper` (výchozí zapnuto) jsou
  políčka série `readonly` s `data-act="kk"` a klepnutí otevře `sheetStepper(i, j, f)` (panel s třídou `kk` přes
  `openSheet(…, nav.cls)`, stav `kk`, řádek `tr.kk-on`). − / + (`data-kk`, `kkPress`, podržení opakuje) počítá od hodnoty,
  jinak od šedého předvyplnění (`kkBase`), meze z `NUM_RULES`. Kroky `STEPS` (kg, sec, km; opakování 1) se pamatují
  v `Local` `kkStep` pro cvik (vázaný i pro fitko). „Napsat“ = `kkKeyboard` (políčko `kkKbd` bez readonly do opuštění),
  „Série hotová“ = `toggleSetDone`. `focusInput` u políčka s krokovačem otevře panel místo klávesnice.
- Návrat do tréninku (F1-11, sekce „NÁVRAT DO TRÉNINKU“): `edMark(d, e)` zapíše klíč `e.k` naposledy změněného cviku
  rozdělaného tréninku (`Local` `edLast`; volá se z posluchačů `click`/`input` pro prvky s `data-i` a po přidání cviku),
  `go("train")` z jiné záložky a start appky nastaví `render.toEx` a `render` posune na kartu přes `edScroll`
  (`render.restoreY` má přednost). Nový způsob změny cviku mimo `data-i` má volat `edMark` (tlačítko Smazat v řádku série i Vrátit ho volají).
  Enter v jednořádkovém textovém poli (ne `data-num`) schová klávesnici (globální `keydown`).
- Zahřívací série z minula (F1-08, sekce „ZAHŘÍVACÍ SÉRIE Z MINULA“): v krokovači u zahřívací série cviku `wr` tlačítko
  `kk-warm` (akce `kkWarm`, `warmInfo`): `S.cfg.warmPct` % (`WARM_PCT`, posuvník `#warmPct` v `stepperSettings`) nejtěžší
  série z minula bez zahřívacích (`warmMax`, přes `draftLast`), zaokrouhleno na krok `kkStep` (`warmKg`). Zápis přes
  `kkSet` (stejně jako − / +), bez záznamu z minula se tlačítko neukáže.
- Přetažení (F2-07, sekce „PŘETAŽENÍ“): pořadí se mění jen tažením za úchyt `dndGrip(popisek)`, žádné šipky.
  Seznam má `data-dnd="<druh>"`, položky třídu `dnd-it` (přímé děti seznamu). Po puštění `dndDrop(druh, odkud, kam)`
  uloží pořadí (`gyms`, `ex` = `curDraft().ex`, `tpl` = pole `order` u šablon, `tplSorted`, nová šablona
  `tplNextOrder`). Vysoké položky (karty cviků) se netahají na stránce, ale v panelu s krátkým seznamem
  (`sheetExOrder`, `sheetTplOrder`). V panelu se posouvá `.sheet-b`, jinak stránka (`dndView` bez lišt).
- Mazání série a Vrátit (F2-03, sekce „SMAZÁNÍ SÉRIE TAHEM“ a „VRÁTIT CVIK“): řádek série `tr.sw` se tahem doleva
  odsune (`sw`, `swOpen`, jen jeden řádek) a odkryje `.sw-del` (akce `delSet`, leží v poslední buňce `.sw-cell` za
  okrajem tabulky, karta `.exc` ho ořízne); buňky mají `touch-action: pan-y`, po tahu se klepnutí zahodí
  (`swEatUntil`). Tah doprava, klepnutí jinam nebo scroll řádek vrátí. Tlačítko × ani swipe na ✓ nejsou (tah od
  levého okraje je v Chromu Zpět). `toast(msg, cls, undo)` s funkcí `undo` ukáže tlačítko „Vrátit“ (akce `undo`,
  `UNDO_MS`); `exUndoOffer` po `exRemove` a nahrazení cviku (`pickDone`) vrátí původní cvik, jen když je otevřená
  stejná úprava (`curDraft()`). Smazání série „Vrátit“ nemá (přání uživatele).
- Záloha (F0-01): export/import JSON (formát v2), sloučit / nahradit vše,
  body obnovy (automaticky týdně, před obnovou, ručně; drží se 8).
  Stažení souboru přes `LocalDownloads` (odkaz s `download`).
- Fotky u cviku (F2-05, sekce „FOTKY U CVIKU“): záznamy v IndexedDB `photos` zapisuje jen `photoSave` / `photoDel` /
  `photoUpdate` (ne přes `put`, fronta v `localStorage` by je neunesla). `S.photos` = popisy bez obrázku
  (`{id, exId, gymId, at, first, w, h, mime, size, src}`), obrázky `phBlob`, zobrazení přes `photoUrl` (blob:).
  Fotka se zmenší `photoShrink` (`PH_MAX` 1280 px, JPEG). Galerie `photoGallery` (postava = první snímek, pak
  `photosOf`: `first` → fitko `photoGym` → bez fitka → jiná fitka), pozice `galPos` (`galRestore` po vykreslení,
  `galReset` při otevření stránky cviku). Celá obrazovka `openViewer` / `pv` (panel v `sheetRoot`, Zpět přes `sheetNav`) má stejné snímky jako galerie
  (`pvIds`: `PV_FIG` = postava, pak fotky), tah dolů zavře (`pvDrag`, `PV_CLOSE_DY`).
  „První“ může mít jen jedna fotka cviku (`photoUpdate`). Z online databáze `fedbPhotos` / `fp` (shoda `fedbMatch`,
  jinak hledání), ve formuláři Nový cvik `exEd.fxPh`; stahuje se přes `<img crossorigin>` a canvas (`fedbImg`), ne
  fetch. Záloha: fotky jen do souboru (`photosExport`, přepínač `Local` `bkPhotos`), body obnovy je nemají, obnova
  `photosImport` fotky nikdy nemaže (Nahradit vše přepíše jen stejné id). `copyFromMain` kopíruje i `photos`.

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
