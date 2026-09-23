# Workout deník – plán vývoje

*Převedeno z dokumentu na claude.ai 23. 9. 2026 při přechodu na PWA + GitHub.*

## Jak s plánem pracovat

Jedna session v Claude Code = jedna úloha z plánu, označená ID (např. F1-01). Tento soubor je jediný zdroj pravdy o tom, co je hotové a co je na řadě.

1. V Claude Code otevři repo a napiš ID úlohy, např. „Udělej F0-02 z docs/plan-vyvoje.md".
2. Claude udělá změny ve vlastní větvi a otevře pull request.
3. Otestuješ v telefonu, dáš Merge.
4. Claude v rámci téhož PR zaškrtne úlohu a přidá řádek do logu na konci tohoto souboru.

Pravidla pro každou úpravu:

- Jedna úloha = jedna větev = jeden pull request.
- Stará data se nesmí ztratit: nová pole mají výchozí hodnoty, uložená data se při načtení automaticky doplní.
- Před větší změnou si v appce udělat zálohu dat.
- Jen zdarma: offline, bez serveru, bez placených API a knihoven. Kód na GitHubu, hosting na GitHub Pages, data jen v telefonu.

## Kontext appky

Workout deník je osobní HTML appka (PWA) pro zápis tréninků ve fitku na Androidu, inspirovaná Hevy. Historie je importovaná z CSV exportu Hevy.

Data jsou uložená v telefonu (IndexedDB). Záloha mimo telefon řeší F0-01 (export JSON, sdílení na Disk / e-mail).

Klíčové specifikum: cvičím ve **více fitkách** a stejný stroj má v každém jiný odpor. Statistiky, grafy a předvyplňování hodnot proto musí jít oddělit podle fitka.

Původní zadání:

- Progres cviků, rozlišení warm-up a pracovních sérií, statistiky s volbou období (týden, měsíc, 3/6 měsíců, rok, vše).
- Databáze cviků s popisem nebo obrázkem, doplněná z Hevy, česko-anglické názvy.
- Šablony tréninků, vytvoření šablony z odcvičeného tréninku.
- Odpočinkový časovač se zvukem a ±15 s.
- Tělesná měření (váha, % svalů, % tuku).

## Priority a pořadí

Pořadí: nejdřív ochrana dat, pak pohodlí při samotném tréninku, pak šablony, statistiky a nakonec chytré funkce. Úlohy uvnitř fáze jsou seřazené podle priority, dělají se shora dolů.

```mermaid
flowchart LR
  P[PWA<br/>Převod] --> F0[Fáze 0<br/>Data a základ]
  F0 --> F1[Fáze 1<br/>Ovládání při tréninku]
  F1 --> F2[Fáze 2<br/>Šablony a historie]
  F2 --> F3[Fáze 3<br/>Statistiky a vzhled]
  F3 --> F4[Fáze 4<br/>Chytré funkce]
```

### Převod na PWA

- [x] **PWA-01** Převod z artefaktu na PWA na GitHub Pages: IndexedDbBackend místo databáze artefaktu, stahování zálohy a body obnovy bez API artefaktu, manifest, service worker, ikony, CLAUDE.md.

### Fáze 0 – Data a základ

Bez zálohy hrozí ztráta celé historie a bez svalových partií u cviků nejdou udělat statistiky ve fázi 3.

- [x] **F0-01** Záloha jedním klepnutím: export a import JSON, sdílení přes Android (Drive, e-mail), připomínka po X dnech bez zálohy.
- [x] **F0-02** Databáze cviků: ke každému cviku primární a sekundární svalové partie.
- [ ] **F0-03** Přidání cviku vyhledáním v otevřené databázi (free-exercise-db, případně wger): napíšu název, appka nabídne cviky a předvyplní partie, vybavení, popis a návrh českého názvu. Stačí online.
- [ ] **F0-04** Verze appky v Nastavení: zobrazit, jakou verzi právě používám – vydaná verze (z `main`), nebo testovací verze před merge (s názvem větve / PR) – a datum a čas verze. Pomůže při testování PR na telefonu poznat, že se appka opravdu aktualizovala.
- [x] **F0-05** Záložka Cviky: nová záložka ve spodní liště vedle Trénink, Historie, Statistiky, Tělo a Nastavení s databází cviků. Procházení, hledání a filtr podle partie, otevření detailu cviku a úprava (název CZ/EN, partie, popis…) bez nutnosti chodit přes přidání cviku do tréninku nebo přes statistiky. Nahradí tlačítko „Spravovat" v Nastavení → Databáze cviků.
- [ ] **F0-06** Systémové tlačítko Zpět (Android): vrátí o krok zpět v appce místo zavření. Pořadí: zavřít otevřený panel (sheet) → ze stránky cviku nebo úpravy tréninku zpět, odkud se přišlo → z jiné záložky na Trénink. Na hlavní obrazovce Tréninku se appka zavře až po druhém stisku (hláška „Stiskni Zpět ještě jednou pro zavření"). Rozdělaný trénink se tlačítkem Zpět nikdy neukončí ani nesmaže. Technicky přes historii prohlížeče (`history.pushState` + `popstate`), zdarma a offline.
- [x] **F0-07** Měnitelné pořadí fitek v Nastavení (šipky ↑/↓ u fitka). Pořadí se promítne všude, kde se fitka vybírají (začátek tréninku, filtry v Historii a Statistikách). Barva fitka se dnes počítá z jeho pořadí, takže se při přesunu nesmí změnit: každé fitko dostane uloženou barvu (výchozí = barva podle dnešního pořadí, doplní se automaticky při načtení).

### Fáze 1 – Ovládání při tréninku

Největší přínos při každém tréninku, většinou malé úpravy.

- [ ] **F1-01** „Minule" u každé série: hodnoty z posledního tréninku v tomtéž fitku, předvyplněné.
- [ ] **F1-02** Displej nezhasne během tréninku (Wake Lock).
- [ ] **F1-03** Velká tlačítka +/− pro váhu a opakování, ovládání jednou rukou.
- [ ] **F1-04** Časovač počítaný z času startu (nevypadne na pozadí) a vibrace na konci pauzy.
- [ ] **F1-05** Pokračování rozdělaného tréninku po zavření prohlížeče.
- [ ] **F1-06** Přidávání cviku: naposledy cvičené nahoře, sekce „cvičil jsi v tomto fitku", hledání bez diakritiky v CZ i EN názvu (hledání bez diakritiky hotové už v F0-05).
- [ ] **F1-07** Poznámky ke stroji podle fitka (nastavení sedačky, opěrky).

### Fáze 2 – Šablony a historie

- [ ] **F2-01** „Cvičit znovu" z historie: spustí trénink bez nutnosti vytvářet šablonu.
- [ ] **F2-02** Šablony podle fitka: přiřazení k fitkům, šablony pro aktuální fitko nahoře, ostatní sbalené.
- [ ] **F2-03** Swipe pro dokončení série, tlačítko Zpět po smazání.
- [ ] **F2-04** Rotace programu: appka ukáže, která šablona je na řadě.
- [ ] **F2-05** Vlastní fotky u cviku: přidání z galerie nebo fotoaparátu, více fotek na cvik, volitelně přiřazené k fitku (fotka stroje). Na stránce cviku galerie v místě schématu postavy, swipe doprava na další fotku, tečky ukazují pozici. Fotky zmenšené a uložené v IndexedDB, fotka stroje z aktuálního fitka se ukáže jako první.

### Fáze 3 – Statistiky a vzhled

Předpoklad: F0-02 (svalové partie).

- [ ] **F3-01** Barva a ikona fitka, tmavý režim, barvy svalových partií. Víc barev pro fitka než dnešních 6 (rozhodnuto u F0-07: 6 je málo); barva je už uložená u fitka jako číslo barvy z palety (`g.col`), stačí paletu rozšířit a přidat výběr v okně Upravit fitko.
- [ ] **F3-02** Osobní rekordy (max váha, max opakování, odhad 1RM podle Epleyho) s oznámením při překonání.
- [ ] **F3-03** Souhrn po tréninku: čas, objem, série, rekordy, rozdíl proti minulému běhu stejné šablony.
- [ ] **F3-04** Radar svalových partií ve statistikách: aktuální vs předchozí období, filtr fitka, karty s rozdíly (tréninky, čas, objem, série), klepnutí na osu ukáže cviky.
- [ ] **F3-05** Radar v souhrnu po tréninku.
- [ ] **F3-06** Kalendář (měsíc): kolečko v barvě fitka, pod ním název šablony, týdenní streak, počet volných dnů, klepnutí otevře detail, ikona u dne s měřením.
- [ ] **F3-07** Roční heatmapa tréninků (barva podle počtu sérií).

### Fáze 4 – Chytré funkce

- [ ] **F4-01** Návrh progrese (double progression): po splnění horní hranice opakování navrhne +2,5 kg.
- [ ] **F4-02** Generátor rozcvičkových sérií z pracovní váhy.
- [ ] **F4-03** Kalkulačka kotoučů na osu.
- [ ] **F4-04** RIR/RPE u série (volitelné).
- [ ] **F4-05** Supersérie se společnou pauzou.
- [ ] **F4-06** Upozornění na stagnaci (3–4 tréninky bez zlepšení).
- [ ] **F4-07** Plánované tréninky v kalendáři.
- [ ] **F4-08** Sdílení souhrnu tréninku jako obrázek.
- [ ] **F4-09** Export do CSV pro Excel.

## Co neděláme

| Nápad | Proč ne |
|---|---|
| Spálené kalorie při tréninku | Odhad přes MET má u posilování chybu ±30–50 %, bez tepu nemá vypovídací hodnotu a svádí k „dojídání". Náhrada: trend tělesné váhy. |
| Sledování jídla a příjmu kalorií | Samostatná velká aplikace, na to existují specializované appky. |
| Napojení na hodinky / Health Connect | Z webové appky nedostupné, jen z nativní aplikace. |
| Cloud, server, synchronizace dat | Jen offline a zdarma, data zůstávají v telefonu, zálohu řeší F0-01. (GitHub slouží jen pro kód a hosting.) |

Odloženo (vrátit se, až bude fáze 3 hotová):

- Automatická volba fitka podle GPS: ruční volba stačí, GPS vyžaduje oprávnění a baterii.
- Silueta postavy obarvená podle zatížení: radar (F3-04) pokryje totéž jednodušeji.
- Jemnější dělení partií (biceps/triceps, kvadricepsy/hamstringy/hýždě): podle odpovědi na otevřenou otázku.

## Otevřené otázky

Rozhodnout nejpozději v session dané úlohy. U každé je návrh výchozí volby.

| Úloha | Otázka | Návrh |
|---|---|---|
| F0-02 | Obsahuje databáze cviků už svalové partie, nebo je doplníme? | Vyřešeno 23. 9.: partie všech 388 cviků zkontrolované a schválené, výchozí databáze je součástí appky. |
| F0-04 | Jak dostat testovací verzi (před merge) do telefonu? GitHub Pages teď nasazuje jen `main`. | Zdarma přes GitHub Actions: nasadit i větve PR do podsložky (např. `…/workout-denik/pr-12/`) s vlastními daty, verzi a čas doplnit automaticky při nasazení |
| F0-05 | Bude spodní lišta se 6 záložkami na telefonu ještě pohodlná? | Vyřešeno 23. 9.: 6 záložek s popisky, menší písmo; Cviky mají ikonu otevřené knihy (činka zůstává Tréninku). |
| F0-06 | Co má Zpět udělat na hlavní obrazovce Tréninku? | Zavřít appku až po druhém stisku do 2 s, první stisk ukáže hlášku |
| F0-07 | Ruční pořadí, nebo automaticky podle počtu návštěv? | Vyřešeno 23. 9.: ruční, šipky ↑/↓ přímo v řádku fitka; výchozí fitko zůstává zvlášť; nové fitko dostane první volnou barvu; „Podle fitek“ ve Statistikách dál podle počtu tréninků; 6 barev je málo, řeší F3-01. |
| F2-01 | „Cvičit znovu" z tréninku v jiném fitku: spustit v aktuálním, nebo původním fitku? | Aktuální fitko |
| F2-02 | Mají mít šablony různé výchozí váhy pro každé fitko? | Ne, stačí F1-01 |
| F2-05 | Zahrnout fotky do zálohy (F0-01)? Záloha tím naroste o jednotky až desítky MB. | Přepínač „s fotkami / bez fotek" (formát zálohy v2 už má připravené pole pro fotky) |
| F3-04 | Osy radaru podle sérií, nebo přepínač série ↔ objem? | Pracovní série, sekundární partie × 0,5 |
| F3-04 | 6 hlavních partií, nebo jemnější dělení? | 6 partií |
| vše | Co z původního zadání už appka umí (tmavý režim, časovač, měření)? | Ověřeno 23. 9.: tmavý režim, časovač se zvukem a ±15 s i tělesná měření appka už umí |

## Log

Nejnovější nahoře. Po každé otestované úloze přidat řádek.

| Datum | Úloha | Poznámka |
|---|---|---|
| 23. 9. 2026 | F0-07 | Pořadí fitek se mění šipkami ↑/↓ v Nastavení → Fitka a platí všude (začátek tréninku, úprava tréninku, filtry v Historii a Statistikách, přepínač a graf na stránce cviku). Každé fitko má uloženou barvu (`col`, 1–6), při prvním načtení se doplní podle dosavadního pořadí, takže se nic nepřebarví; barva se nemění ani přesunem, ani smazáním jiného fitka. Nové fitko dostane první volnou barvu, při sloučení zálohy se kolize barvy vyřeší stejně. Formát zálohy beze změny. |
| 23. 9. 2026 | – | Do CLAUDE.md přidáno pravidlo pro souběžnou práci na víc úlohách: před dokončením PR sloučit aktuální `main` do větve a vyřešit konflikty (vyšší `VERSION`, v logu nechat řádky z obou větví). |
| 23. 9. 2026 | – | Do plánu přidány úlohy F0-06 (systémové tlačítko Zpět) a F0-07 (měnitelné pořadí fitek). |
| 23. 9. 2026 | F0-05 | Nová záložka Cviky (6. ve spodní liště, ikona kniha): všechny cviky, nahoře cvičené; řazení Naposledy / A–Z; filtr partie a vybavení (pamatuje se), filtr Skryté; + Nový cvik. Hledání všude bez ohledu na diakritiku. Stránka cviku rozdělená na Popis a Statistiky: ze záložky Cviky a z výběru cviku se otevře Popis, ze Statistik, Historie a tréninku Statistiky. „Spravovat“ z Nastavení odstraněno. Data ani formát zálohy beze změny. |
| 23. 9. 2026 | – | Do plánu přidány úlohy F0-04 (verze appky v Nastavení) a F0-05 (záložka Cviky). |
| 23. 9. 2026 | F0-02 | Výchozí databáze 388 cviků je součástí appky (`js/cviky.js`), v telefonu se ukládají jen vlastní úpravy, skryté a vlastní cviky. Partie zkontrolované podle free-exercise-db a wger a schválené: ramena jako jedna partie, nejvýš 3 pomocné partie, jen svaly, které opravdu pracují (32 úprav, 120× jen sloučení ramen). Převod dat v telefonu jednou automaticky, předtím bod obnovy. V úpravě cviku tlačítko „Výchozí". Vyhledávání v otevřených databázích přesunuto do nové úlohy F0-03. |
| 23. 9. 2026 | PWA-01 | Appka převedena na PWA (GitHub Pages): data v IndexedDB, body obnovy v IndexedDB, stahování zálohy přes Chrome, písma a ikony v repu, service worker s verzovanou cache a automatickou aktualizací, CLAUDE.md a README. Vzhled a funkce beze změny. Zbývá: převést data z artefaktu (záloha → obnova) a otestovat na telefonu. |
| 23. 9. 2026 | – | Rozhodnuto o přechodu z artefaktu na PWA hostovanou na GitHub Pages. Plán převeden do repa. Další na řadě: PWA-01, pak F0-02. |
| 23. 9. 2026 | F0-01 | Záloha hotová (verze 9 artefaktu): pruh s připomínkou po 7 dnech bez zálohy, po stažení návod na Disk, obnova „sloučit" nebo „nahradit vše", body obnovy v appce (týdně, před obnovou, ručně; drží se 8), formát zálohy v2 s místem pro fotky. Otestováno na simulovaných datech, zbývá ověřit v Chromu na telefonu. |
| 23. 9. 2026 | – | Brainstorming dokončen, plán a priority sepsány. |
