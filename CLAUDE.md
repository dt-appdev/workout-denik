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
  v kořeni webu, každý otevřený PR = testovací verze v `…/workout-denik/pr-N/`.
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
| `js/pwa.js` | Registrace service workeru a automatická aktualizace. |
| `js/verze.js` | Údaje o verzi (`APP_BUILD`): kanál, PR, větev, commit, čas nasazení. V repu jen „lokal", při nasazení ho přepíše `.github/sestav-web.sh`. Ručně needitovat. |
| `sw.js` | Service worker: offline cache (verze z `js/verze.js`), seznam souborů (`FILES`). |
| `.github/workflows/nasazeni.yml` | GitHub Actions: nasazení na Pages při změně v `main` a v PR, komentář s odkazem na testovací verzi v PR. |
| `.github/sestav-web.sh` | Sestaví celý web: `main` do kořene, otevřené PR do `pr-N/`, zapíše `js/verze.js`. |
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
  jinak nepojede offline. Soubory `.github/`, `docs/`, `puvodni/` a `*.md`
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
ručně), např. do složky `/tmp/www/workout-denik` a pak servírovat `/tmp/www`:

```
PR_JSON='[{"number":99,"title":"Zkouška","headRefName":"vetev","isCrossRepository":false}]' \
  bash .github/sestav-web.sh /tmp/www/workout-denik
```

Skript bere větve z `origin` (`main` a `refs/pull/N/head`). Workflow při každém
PR skript spustí na zkoušku (úloha „kontrola", nic nenasazuje).
