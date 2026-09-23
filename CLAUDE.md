# Workout deník – kontext pro Claude

Osobní appka na zapisování tréninků ve fitku (inspirovaná Hevy). Běží jako PWA
na GitHub Pages, používá se na Androidu v Chromu, nainstalovaná na plochu.
Do září 2026 běžela jako Claude artefakt (jeden HTML soubor), viz `puvodni/`.

Plán vývoje a priority: `docs/plan-vyvoje.md`. Je to jediný zdroj pravdy o tom,
co je hotové a co je na řadě. Úlohy mají ID (např. F0-02).

## Pravidla

- Jen řešení zdarma, žádné placené služby, API ani knihovny.
- Čisté HTML/CSS/JavaScript bez build kroku a bez npm závislostí. Appka se
  nasazuje přímo z větve `main` (GitHub Pages, kořen repa).
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
  - `VERSION` v `sw.js` nastav vyšší než je v `main` (dnešní datum, další `.N`),
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
| `sw.js` | Service worker: offline cache, verze appky (`VERSION`), seznam souborů (`FILES`). |
| `manifest.webmanifest` | Název, ikony a barvy pro instalaci PWA. |
| `icons/` | Ikony appky (PNG 192/512, maskable 512, apple-touch, SVG). |
| `fonts/` | Písma Barlow a Barlow Condensed (OFL), lokálně kvůli offline. |
| `docs/plan-vyvoje.md` | Plán vývoje, otevřené otázky, log. |
| `puvodni/workout-denik.html` | Poslední verze artefaktu (verze 9). Jen pro referenci, needitovat. |
| `.nojekyll` | GitHub Pages servíruje soubory tak, jak jsou (bez Jekyllu). |

## Konvence

- **Verze a cache:** při KAŽDÉ změně kteréhokoli souboru appky zvyš `VERSION`
  v `sw.js` (formát `RRRR-MM-DD.N`). Bez toho se appka v telefonu neaktualizuje.
  Nový soubor přidej do `FILES` v `sw.js`, jinak nepojede offline.
- Všechny cesty relativní (`css/app.css`, ne `/css/app.css`), appka běží
  v podadresáři `https://<uživatel>.github.io/workout-denik/`.
- Žádné externí zdroje (CDN, Google Fonts…) – offline by nefungovaly.
- Styl kódu v `js/app.js`: kompaktní (často víc příkazů na řádku), HTML se skládá
  jako řetězce, texty escapovat přes `esc()`. Komentáře česky.
- Kliknutí se řeší delegací přes `data-act` / `data-v` (jeden velký `switch`).
- Vykreslení: `scheduleRender()`; změna dat vždy přes `put(path, data)`.

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
- Drobná nastavení zobrazení jsou v `localStorage` s prefixem `zd1:`.
- Cviky (F0-02): `S.exLib` = `EX_DB` + odchylky (`exLoad`), zápis vždy přes
  `putEx(items)`, který uloží jen rozdíly. Partie jsou klíče `MUSCLE_MAP.NAMES`,
  ramena jsou jedna partie `delts` (staré `delt_f/s/r` se převádějí). Záloha
  obsahuje celé cviky a značku `exDb:2`.
- Záložka Cviky (F0-05): route `ex` (`vExList`), filtry `S.exlM`/`S.exlEq`/`S.exlSort`
  v `localStorage`. Stránka cviku (route `exd`, `vExDetail`) má části Popis
  a Statistiky (`S.exPart`); `openEx` volí část podle toho, odkud se přišlo
  (`data-p` ji vynutí). Hledání přes `exMatch` ignoruje diakritiku.
- Hledání v online databázi (F0-03): `js/fedb.js` (`FEDB`) se načte až při prvním
  hledání (`fedbLoad`), není ve `FILES`; service worker ho uloží do cache při prvním
  stažení. Stav hledání `fs`, vykreslení `renderFs`/`refreshFs`. Vybraný záznam
  předvyplní `sheetExEdit(null, from, fx)` a vlastní cvik dostane `src:"fedb:<id>"`.
  Fotky jen jako náhled z GitHubu (`FEDB_IMG`), nic se neukládá. Změna českých názvů
  nebo shod: upravit TSV v `tools/fedb/` a spustit `python3 tools/fedb/build.py`.
- Záloha (F0-01): export/import JSON (formát v2), sloučit / nahradit vše,
  body obnovy (automaticky týdně, před obnovou, ručně; drží se 8).
  Stažení souboru přes `LocalDownloads` (odkaz s `download`).

## Testování

Žádné automatické testy. Lokálně stačí statický server z kořene repa, např.
`python3 -m http.server` a otevřít `http://localhost:8000/`. Service worker
funguje jen na `localhost` nebo přes HTTPS. Pro kontrolu v prohlížeči lze
použít Playwright s předinstalovaným Chromiem (bez instalace do repa).
