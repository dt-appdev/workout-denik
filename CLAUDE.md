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
  - v `docs/release-notes.md` nech záznamy z obou větví a svůj záznam přečísluj
    na novou `VERSION` (nahoře nejvyšší verze),
  - v kódu zachovej funkce z `main` i z úlohy a po sloučení appku znovu ověř.
- V rámci PR úlohy zaškrtni úlohu v `docs/plan-vyvoje.md` a přidej řádek
  do logu na konci plánu (nejnovější nahoře).
- Každá změna appky, kterou uživatel uvidí, dostane záznam nahoru do
  `docs/release-notes.md`: nadpis `## <VERSION ze sw.js> – <krátký název>`,
  pak Nové / Změny / Opravy a řádek **Data:** (mění se uložená data nebo záloha?).
  Psát pro uživatele, ne pro programátora.
- Když se změní ovládání nebo vzhled, uprav návod `docs/navod/README.md`
  a přegeneruj obrázky (viz Testování). Zkontroluj, že čísla v rámečcích
  odpovídají textu pod obrázkem.
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
| `sw.js` | Service worker: offline cache, verze appky (`VERSION`), seznam souborů (`FILES`). |
| `manifest.webmanifest` | Název, ikony a barvy pro instalaci PWA. |
| `icons/` | Ikony appky (PNG 192/512, maskable 512, apple-touch, SVG). |
| `fonts/` | Písma Barlow a Barlow Condensed (OFL), lokálně kvůli offline. |
| `docs/plan-vyvoje.md` | Plán vývoje, otevřené otázky, log. |
| `docs/release-notes.md` | Co je nového: změny pro uživatele podle verzí (nejnovější nahoře). |
| `docs/navod/README.md` | Návod k appce s obrázky (odkaz z Nastavení → O aplikaci). |
| `docs/navod/img/` | Snímky obrazovky do návodu (generované, needitovat ručně). |
| `docs/navod/snimky/` | Skript na snímky (`snimky.js`) a ukázková data (`demo-data.js`). |
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
- Záloha (F0-01): export/import JSON (formát v2), sloučit / nahradit vše,
  body obnovy (automaticky týdně, před obnovou, ručně; drží se 8).
  Stažení souboru přes `LocalDownloads` (odkaz s `download`).

## Testování

Žádné automatické testy. Lokálně stačí statický server z kořene repa, např.
`python3 -m http.server` a otevřít `http://localhost:8000/`. Service worker
funguje jen na `localhost` nebo přes HTTPS. Pro kontrolu v prohlížeči lze
použít Playwright s předinstalovaným Chromiem (bez instalace do repa).

Obrázky do návodu: `NODE_PATH=$(npm root -g) node docs/navod/snimky/snimky.js`
(z kořene repa). Skript spustí appku s vymyšlenými daty z `demo-data.js`,
proklikne ji na mobilním rozlišení a uloží snímky s očíslovanými rámečky
do `docs/navod/img/`. Nový snímek = nový `shot(...)` ve skriptu. Pokud skript
spadne na chybějícím prvku, změnilo se ovládání – uprav skript i návod.
