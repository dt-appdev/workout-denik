# Workout deník – kontext pro Claude

Osobní appka na zapisování tréninků ve fitku (inspirovaná Hevy). Běží jako PWA
na GitHub Pages, používá se na Androidu v Chromu, nainstalovaná na plochu.
Do září 2026 běžela jako Claude artefakt (jeden HTML soubor, v gitu `d491407:puvodni/workout-denik.html`).

Plán vývoje a priority: `docs/plan-vyvoje.md` (jen otevřené úlohy). Je to jediný zdroj pravdy o tom,
co je hotové a co je na řadě. Úlohy mají ID (např. F0-02). Popisy hotových úloh a vyřešené otázky jsou
v `docs/hotovo.md`, log v `docs/log.md`.

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
  - v logu (`docs/log.md`) nech řádky z obou větví (nejnovější nahoře),
  - v kódu zachovej funkce z `main` i z úlohy a po sloučení appku znovu ověř.
- V rámci PR úlohy: v `docs/plan-vyvoje.md` úlohu zaškrtni a zkrať na jeden řádek (ID + krátký název),
  celý popis přesuň do `docs/hotovo.md` (vyřešené otázky taky), přidej řádek na začátek tabulky
  v `docs/log.md` (nemusíš číst celý soubor) a popis funkce napiš do úvodního komentáře její sekce
  v `js/app.js` s ID úlohy v nadpisu (ne sem). Sem jen pravidlo, které platí i mimo tu funkci.
- Stará data se nesmí ztratit: nová pole mají výchozí hodnoty a uložená data
  se při načtení automaticky doplní. Formát zálohy měň jen zpětně kompatibilně
  (`BK_VERSION`, `normBackup` v `js/app.js`).

## Jak hledat v kódu (šetří tokeny)

- `.ignore` vyřazuje z hledání velké a generované soubory (`js/atlas.js` má 6 řádků po desítkách KB,
  `js/fedb.js`, `tools/fedb/*.tsv`, písma, ikony, obrázky návrhů). Když je v nich hledat opravdu
  potřeba, zadej cestu k souboru přímo.
- `js/app.js` nečti celý. Sekce mají v nadpisu ID úlohy (`/* ---------- KROKOVAČ (F1-03) ----------`):
  obsah souboru = `grep -n '/\* ----------' js/app.js`, sekce úlohy = `grep -n '/\* ---.*F1-03' js/app.js`.
  Čti od začátku sekce: úvodní komentář popisuje, jak funkce funguje, hlavní názvy v kódu a pravidla.
  Nová funkce z plánu = nová sekce s ID v nadpisu.
- `docs/hotovo.md` a `docs/navrhy/` otevírej, jen když se úloha vrací k hotové nebo odložené věci.

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
| `docs/plan-vyvoje.md` | Plán vývoje: otevřené úlohy a otázky, hotové úlohy jen jedním řádkem. |
| `docs/hotovo.md` | Archiv: celé popisy hotových úloh a vyřešené otázky. |
| `docs/log.md` | Log hotových úloh (nejnovější nahoře). |
| `docs/navrhy/` | Odložené návrhy: diskuse, rozhodnutí a náhledy úloh, ke kterým se možná vrátíme (např. `F3-07-heatmapa.md`), a UX audit `ux-audit-2026-09-27.md` (u úloh z auditu číst jen sekci uvedenou v úloze). Při znovuotevření úlohy nejdřív přečíst. |
| `.ignore` | Soubory, které nástroje pro hledání přeskakují (F0-12). |
| `.nojekyll` | GitHub Pages servíruje soubory tak, jak jsou (bez Jekyllu). |
| `.git-blame-ignore-revs` | Commity, které jen přeformátovaly kód (F0-10); GitHub je v historii řádků přeskočí. |

Původní artefakt (verze 9, `puvodni/workout-denik.html`) je jen v historii gitu: `git show d491407:puvodni/workout-denik.html`.

## Konvence

- **Verze a cache (F0-04):** verzi určuje `js/verze.js`, který se přepíše při
  každém nasazení (commit + čas), takže se appka v telefonu aktualizuje sama.
  `VERSION` v `sw.js` ručně neměnit. Nový soubor přidej do `FILES` v `sw.js`,
  jinak nepojede offline. Soubory `.github/`, `docs/`, `tools/`, `*.md`, `.ignore`
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
  a service worker jen z vlastních souborů, obrázky navíc z `https://raw.githubusercontent.com` a `blob:`
  (fotky u cviků), styly i přímo u prvků (`style="…"`). Nikdy kód přímo v HTML (`onclick=`, `onerror=`,
  `javascript:`…), jen posluchače; úloha „kontrola" v GitHub Actions takový PR odmítne. Nový vnější zdroj
  nebo `data:` obrázky přidat do CSP v `index.html`. Co pravidla zablokují, ukáže testovací verze hláškou.
- Styl kódu (čitelnost pro člověka má přednost před stručností):
  - jeden příkaz na řádek, odsazení 2 mezery, řádky nejvýš cca 110 znaků,
  - `if`/`for` s tělem na víc řádků ve složených závorkách (jednořádkový `if` jen pro
    krátký návrat, např. `if (!x) return;`),
  - delší HTML skládat přes šablonové řetězce (`` `…${esc(x)}…` ``) rozložené na víc
    řádků podle struktury HTML, texty vždy escapovat přes `esc()`,
  - srozumitelné názvy proměnných a funkcí (ne jednopísmenné, kromě krátkých smyček),
  - krátký český komentář nad každou funkcí, která není zřejmá z názvu, a nad každou
    sekcí souboru (u funkce z plánu popis funkce, názvy hlavních funkcí a pravidla),
  - formát odpovídá Prettieru (`--print-width 110 --quote-props preserve`, jen při vývoji,
    do repa se nepřidává); zlom řádku uvnitř HTML šablony jen tam, kde přidaná mezera
    nemůže změnit vzhled (mezi atributy, vedle blokového prvku, mezi prvky flex/grid),
    jinak šablonu rozdělit na dvě spojené přes `+` (F0-10).
- Kliknutí se řeší delegací přes `data-act` / `data-v` (jeden velký `switch`).
- Vykreslení: `scheduleRender()`; změna dat vždy přes `put(path, data)`.
- Tlačítka (F2-07): akce v nadpisu sekce (`.sec-h`) jen jako ikona v rámečku malého tlačítka `icoBtn(act, ikona,
  popis, v)`. Text zůstává u velkých tlačítek přes celou šířku a u tlačítek v kartách a panelech. Krátký formulář
  (pár políček, např. fitko) = panel `openSheet`, dlouhý formulář nebo skládání seznamu cviků (trénink, šablona,
  Nový / Upravit cvik) = stránka se šipkou ← a dotazem „Zahodit změny?“. Zobrazení jedné věci (cvik, uložený
  trénink) = stránka se šipkou ←. Stejné akce vypadají všude stejně. Pořadí se mění jen tažením za úchyt
  (`dndGrip`, sekce PŘETAŽENÍ), žádné šipky.
- Ikony (přání uživatele, F3-20, sekce „ikony“): nikdy emoji ani znaky písma jako ikona (🏅, 🔥, ✓, ▶, ★, ↗, ‹ ›…),
  ani na obrázku ke sdílení a v návrzích. Vždy vlastní SVG v sadě `IC` ve stejném stylu (popis v sekci). Stejný
  význam = stejná ikona všude, jedna kresba = jeden význam. Novou nebo překreslenou ikonu nejdřív ukázat v náhledu
  (dnes / návrh, světlý i tmavý motiv) a nechat odsouhlasit. Šipka → ve větě („Nastavení → Fitka“) a znaky × · –
  jsou typografie, zůstávají.
- Karta cviku (F3-22, `vExCard`): v hlavičce žádné textové štítky, stav cviku jen ikona za názvem
  (`nameWithIcons`, `gdIcon`). Nový údaj o cviku do karty jako ikonu nebo do tabulky.
- Nápovědy (F3-21, sekce „NÁPOVĚDY V NADPISU SEKCE“): pod volbou žádný vysvětlující text, jen stav nebo varování.
  Vysvětlení do panelu sekce (`helpBtn(klíč)` v nadpisu, texty v `HELP`). Nová volba = nová položka v `HELP`.
  V krátkých panelech (`openSheet`) tlačítko není, text nejvýš jedna věta. Texty, které říkají, co se stane teď,
  zůstávají u ovládání.
- Tlačítko Zpět (F0-06, sekce „tlačítko Zpět"): každý stisk = jeden krok `navBack()`, šipky ← v appce ho volají.
  Nový panel přes `openSheet(…, noanim, nav)`, nová podstránka (route) se musí doplnit do `navBack`, `navDepth`
  a `go`; postup v úvodním komentáři sekce.
- Písmo (F3-11): velikost jen přes proměnné `--fs-*` ze stupnice v `:root` v `css/app.css`, nikdy `font-size`
  v px (ani v `style=` v JS). Nová obrazovka se musí vejít i při Velikost písma „Největší“ (`--fs-k` 1,3) na šířku
  360 px: rozměry podle textu v `em`, ne pevné px; přepínač `.seg` s víc volbami pod nadpis (`.seg-wide`), ne vedle
  popisku; pevné lišty přes `min(…, vw)` (`--fs-tabs`); rozměry počítané v JS násobit `fontK()`.
- Barvy (F3-01): šedý text `--ink-2`/`--ink-3` je zesílený kvůli čitelnosti, drobný text nedělat světlejší.
  Skupiny partií `MGRP` / `MGRP_OF` (6 skupin), barva `mgCol(k)` = `--g-<skupina>`. `musFigs(m, small, grp)`: `grp` =
  postava v barvách skupin (Statistiky, souhrn), jinak červená (stránka cviku). Barva fitka jen z `g.col` (`--sN`),
  nikdy z pořadí; grafy, které nepatří fitku, `var(--chart)`.
- Grafy (F3-08, sekce „grafy (SVG, F3-08)“): `chartPh(spec, výška)`, jednotky a formát jen přes `spec.yUnit`, `spec.unit`,
  `spec.fmt` (`CH_FMT`) a `spec.whole`.
- Čísla (F1-10, sekce „KONTROLA ČÍSEL“): každé číselné políčko má `data-num="<pravidlo z NUM_RULES>"`, před uložením
  kontrola, uložené číslo do políčka přes `numStr`. Nové číselné pole vždy přes stejná pravidla.

## Pravidla napříč funkcemi

Platí i při práci na jiné funkci. Podrobnosti v úvodním komentáři uvedené sekce `js/app.js`.

- Kopírování cviků (šablona ↔ trénink) přenáší supersérii přes `ssOf(e)`, série do šablony vždy přes `tplSet`.
- Zápis šablony vždy přes `Object.assign` s původní šablonou. Každé místo, které vytváří šablonu, hlídá volný
  název (`tplClash`, `tplFreeName`); každé místo, které vytváří nebo přejmenovává cvik, hlídá název (`exClash`).
- Předvyplnění sérií v rozdělaném tréninku vždy přes `draftHints(d, e)`, ne rovnou `exHints`. Změna hodnoty série
  bez překreslení volá `hintsRefresh(d, i)` (série pod ní berou předvyplnění ze série nad, F1-13).
- Změna cviku mimo prvky s `data-i` volá `edMark` (návrat do tréninku). Konec tréninku vždy přes `activeEnd()`.
- Hotová série rozdělaného tréninku má čas odškrtnutí `s.at`; série označená v okně Dokončit trénink má místo něj
  `s.atEnd` a čas dostane až při uložení (F1-14). Každé odškrtnutí nebo zrušení ✓ `atEnd` maže.
- Akce, které mění pracovní série bez hodnot (+ Série, smazání, změna druhu), volají `progTouch`.
- Fotky jen přes `photoSave` / `photoDel` / `photoUpdate` (ne `put`). Stažení souboru přes `LocalDownloads`.
- Nová volba nastavení patří do existující skupiny (`SET_PAGES`), nová sekce Statistik do jedné z částí
  (`STATS_PARTS`), nový údaj na obrázek ke sdílení do `shrData` a oba jazyky do `SHR_TXT`.
- Nová obrazovka (route) se neukládá do `Local` `route`, pokud po restartu nedává smysl (jako `exed`).
- Vývojové nástroje (záznam oznámení, zkušební data `FAKE_PLAN`) jen v `DEV` (testovací verze a lokálně), ve vydané
  verzi nikdy. Nová úloha může do `FAKE_PLAN` přidat své scénáře.
- Odmítnuté nápady, znovu nenavrhovat: udržování telefonu vzhůru neslyšitelným tónem (F1-04), swipe na ✓ série
  (tah od levého okraje je v Chromu Zpět), tlačítko Vrátit u smazané série (F2-03).

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
- Drobná nastavení zobrazení jsou v `localStorage` s prefixem `zd1:` (přes `Local`).
- Cviky (F0-02): `S.exLib` = `EX_DB` + odchylky (`exLoad`), zápis vždy přes `putEx(items)`. Partie jsou klíče
  `MUSCLE_MAP.NAMES`. Záloha obsahuje celé cviky a značku `exDb:2`.
- Nastavení je v `S.cfg` (`config/main`), výchozí hodnoty doplňuje `cfgNorm`.

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
