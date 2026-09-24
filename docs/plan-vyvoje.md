# Workout deník – plán vývoje

*Převedeno z dokumentu na claude.ai 23. 9. 2026 při přechodu na PWA + GitHub.*

## Jak s plánem pracovat

Jedna session v Claude Code = jedna úloha z plánu, označená ID (např. F1-01). Tento soubor je jediný zdroj pravdy o tom, co je hotové a co je na řadě.

1. V Claude Code otevři repo a napiš ID úlohy, např. „Udělej F0-02 z docs/plan-vyvoje.md".
2. Claude nejdřív popíše, jak bude funkce fungovat a co se změní, výhody, nevýhody a dopady na další vývoj, a položí doplňující otázky. Implementovat začne až na výslovný pokyn.
3. Claude udělá změny ve vlastní větvi a otevře pull request.
4. Otestuješ v telefonu, dáš Merge.
5. Claude v rámci téhož PR zaškrtne úlohu a přidá řádek do logu na konci tohoto souboru.

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

Aktuální pořadí dalších úloh (zhodnoceno 24. 9. 2026, má přednost před pořadím ve fázích):

1. **F1-10** Políčka pro čísla – do historie se dnes ukládají přepočtené nesmysly, které pak kazí rekordy, statistiky i „Minule“.
2. **F1-02** Displej nezhasne – pár řádků, pomůže při každém tréninku a obchází zpožděné oznámení pauzy se zamčeným displejem (F1-04). Vypínatelné kvůli baterii.
3. **F0-10** Čitelný kód – čím později, tím víc konfliktů; dělat, když není otevřený jiný PR.
4. **F1-03** Velká tlačítka +/− – nejužitečnější zbylá úloha fáze 1 (ovládání jednou rukou).
5. **F0-08, F0-09** Zabezpečení – pojistky, nejpozději před F2-05 (vlastní fotky).
6. **F3-09** Uklidit Nastavení – před fází 5, která přidá další volby.
7. Dál podle fází: zbytek fáze 1 (F1-06, F1-07, F1-08), pak fáze 2, 3, 4 a 5.

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
- [x] **F0-03** Přidání cviku vyhledáním v otevřené databázi (free-exercise-db, případně wger): napíšu název, appka nabídne cviky a předvyplní partie, vybavení, popis a návrh českého názvu. Stačí online.
- [x] **F0-04** Verze appky v Nastavení: zobrazit, jakou verzi právě používám – vydaná verze (z `main`), nebo testovací verze před merge (s názvem větve / PR) – a datum a čas verze. Pomůže při testování PR na telefonu poznat, že se appka opravdu aktualizovala.
- [x] **F0-05** Záložka Cviky: nová záložka ve spodní liště vedle Trénink, Historie, Statistiky, Tělo a Nastavení s databází cviků. Procházení, hledání a filtr podle partie, otevření detailu cviku a úprava (název CZ/EN, partie, popis…) bez nutnosti chodit přes přidání cviku do tréninku nebo přes statistiky. Nahradí tlačítko „Spravovat" v Nastavení → Databáze cviků.
- [x] **F0-06** Systémové tlačítko Zpět (Android): vrátí o krok zpět v appce místo zavření. Pořadí: zavřít otevřený panel (sheet) → ze stránky cviku nebo úpravy tréninku zpět, odkud se přišlo → z jiné záložky na Trénink. Na hlavní obrazovce Tréninku se appka zavře až po druhém stisku (hláška „Stiskni Zpět ještě jednou pro zavření"). Rozdělaný trénink se tlačítkem Zpět nikdy neukončí ani nesmaže. Technicky přes historii prohlížeče (`history.pushState` + `popstate`), zdarma a offline.
- [x] **F0-07** Měnitelné pořadí fitek v Nastavení (šipky ↑/↓ u fitka). Pořadí se promítne všude, kde se fitka vybírají (začátek tréninku, filtry v Historii a Statistikách). Barva fitka se dnes počítá z jeho pořadí, takže se při přesunu nesmí změnit: každé fitko dostane uloženou barvu (výchozí = barva podle dnešního pořadí, doplní se automaticky při načtení).
- [ ] **F0-08** Pravidla zabezpečení stránky (Content-Security-Policy v `index.html`): stránka smí načítat a odesílat jen vlastní soubory, obrázky navíc jen z GitHubu (náhledy free-exercise-db). Kdyby se v kódu objevila chyba, přes kterou by šel spustit cizí kód, data by nešlo odeslat jinam. Vyžaduje odstranit kód zapsaný přímo v HTML (`onerror` u náhledu fotky v hledání cviků). Ověřit v telefonu hledání cviků s fotkami, oznámení pauzy, zálohu a obnovu, testovací verzi PR i kopírování dat z vydané verze.
- [ ] **F0-09** Odkaz u cviku jen ve tvaru `https://…` (nebo `http://…`): jinak ho appka neuloží a upozorní. Stejná kontrola při obnově zálohy (neplatný odkaz se zahodí, cvik zůstane). Dnes to v praxi nevadí (odkaz se otvírá v nové záložce a nic se nespustí), jde o pojistku.
- [ ] **F0-10** Čitelný kód: přeformátovat `js/app.js`, `css/app.css`, `sw.js` a `js/pwa.js` podle pravidel stylu v CLAUDE.md (jeden příkaz na řádek, odsazení, delší HTML šablony na víc řádků, kratší řádky). Jen formát, žádná změna chování: ověřit, že se kód po převodu liší jen mezerami a zalomením řádků (porovnat „zhuštěnou“ podobu před a po), a appku projít v prohlížeči. Dělat, když není otevřený žádný jiný PR (změna se dotkne skoro každého řádku, souběžné větve by měly konflikty). Názvy proměnných měnit jen tam, kde je to bezpečné a výrazně to pomůže, jinak postupně při dalších úlohách.
- [ ] **F0-11** Rozdělit `js/app.js` do víc souborů podle částí (např. datová vrstva a záloha, rozdělaný trénink a pauza, historie s kalendářem a souhrnem, statistiky, záložka Cviky, nastavení; v `app.js` zůstane start, vykreslení a akce). Databáze `js/cviky.js` zůstane, soubor záložky Cviky dostane jiný název (např. `seznam-cviku.js`), aby se nepletly. Bez build kroku: víc `<script>` v `index.html` ve správném pořadí a všechny soubory do `FILES` v `sw.js`. Předpoklad: F0-10. Dělat, až `app.js` naroste nebo se v něm začne špatně orientovat, taky jen bez otevřených PR.

### Fáze 1 – Ovládání při tréninku

Největší přínos při každém tréninku, většinou malé úpravy.

- [x] **F1-01** „Minule" u každé série: hodnoty z posledního tréninku v tomtéž fitku, předvyplněné.
- [x] **F1-02** Displej nezhasne během tréninku (Wake Lock).
- [ ] **F1-03** Velká tlačítka +/− pro váhu a opakování, ovládání jednou rukou.
- [x] **F1-04** Časovač počítaný z času startu (nevypadne na pozadí) a vibrace na konci pauzy.
- [x] **F1-05** Pokračování rozdělaného tréninku po zavření prohlížeče.
- [ ] **F1-06** Přidávání cviku: naposledy cvičené nahoře, sekce „cvičil jsi v tomto fitku", hledání bez diakritiky v CZ i EN názvu (hledání bez diakritiky hotové už v F0-05).
- [ ] **F1-07** Poznámky ke stroji podle fitka (nastavení sedačky, opěrky).
- [ ] **F1-08** U warm-up série tlačitko "60%", které přednastaví váhu v sérii na 60% maxima z minula, následna editace je zachována
- [ ] **F1-09** Délka pauzy podle cviku (jako v Hevy, např. dřep 3 min, biceps 1 min), jinak výchozí časovač z Nastavení. Zatím odloženo, rozhodnout později (vzniklo u F1-04).
- [x] **F1-10** Políčka pro čísla přijmou jen čísla (priorita: brzy). Dnes jde do kg, opakování, času, km i měření zapsat cokoli (např. „**5;8-;“) a ✓ sérii přijme. Povolit jen číslice a desetinnou čárku/tečku (u času i dvojtečku), nesmysl nepřijmout a políčko zvýraznit. Ověřit i uložení a starší data. Navíc upozornění na podezřele velký skok proti minulé sérii (překlep 150 místo 50).

### Fáze 2 – Šablony a historie

- [x] **F2-01** „Cvičit znovu" z historie: spustí trénink bez nutnosti vytvářet šablonu.
- [ ] **F2-02** Šablony podle fitka: přiřazení k fitkům, šablony pro aktuální fitko nahoře, ostatní sbalené.
- [ ] **F2-03** Swipe pro dokončení série, tlačítko Zpět po smazání.
- [ ] **F2-04** Rotace programu: appka ukáže, která šablona je na řadě.
- [ ] **F2-05** Vlastní fotky u cviku: přidání z galerie nebo fotoaparátu, více fotek na cvik, volitelně přiřazené k fitku (fotka stroje). Na stránce cviku galerie v místě schématu postavy, swipe doprava na další fotku, tečky ukazují pozici. Fotky zmenšené a uložené v IndexedDB, fotka stroje z aktuálního fitka se ukáže jako první.
- [ ] **F2-06** Archivace starých fitek a tréninků (vzniklo u F3-01, rozhodnout později): fitko, kam už se nechodí, zmizí z výběru a filtrů, tréninky a statistiky zůstanou.

### Fáze 3 – Statistiky a vzhled

Předpoklad: F0-02 (svalové partie).

- [x] **F3-01** Barva a ikona fitka, tmavý režim, barvy svalových partií. Víc barev pro fitka než dnešních 6 (rozhodnuto u F0-07: 6 je málo); barva je už uložená u fitka jako číslo barvy z palety (`g.col`), stačí paletu rozšířit a přidat výběr v okně Upravit fitko.
- [x] **F3-02** Osobní rekordy (max váha, max opakování, odhad 1RM podle Epleyho) s oznámením při překonání. Rekordy appka počítala už dřív, doplněná oslava: medaile přes celou obrazovku po dokončení cviku a po uložení tréninku, výběr zvuku, vypínatelné v Nastavení.
- [x] **F3-03** Souhrn po tréninku: čas, objem, série, rekordy, rozdíl proti minulému běhu stejné šablony.
- [ ] **F3-04** Radar svalových partií ve statistikách: aktuální vs předchozí období, filtr fitka, karty s rozdíly (tréninky, čas, objem, série), klepnutí na osu ukáže cviky.
- [ ] **F3-05** Radar v souhrnu po tréninku: volitelné, přepínatelné doplnění ke schématu postavy (F3-03), ne jeho náhrada.
- [x] **F3-06** Kalendář (měsíc): kolečko v barvě fitka, pod ním název šablony, týdenní streak, počet volných dnů, klepnutí otevře detail, ikona u dne s měřením.
- [ ] **F3-07** Roční heatmapa tréninků (barva podle počtu sérií).
- [ ] **F3-08** Jednotky v grafech statistik na Y-ose, čas v hodinách (0:00), objem v kg. 
- [ ] **F3-09** Uklidit Nastavení: voleb přibývá a stránka je dlouhá. Navrhnout přehlednější uspořádání (např. rozcestník se skupinami Fitka, Trénink, Vzhled, Data a záloha, O aplikaci, každá skupina na vlastní podstránce, nebo sbalitelné sekce).


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


### Fáze 5 – Motivace

Předpoklad: F3-02 (oslava rekordu). Vše se počítá z uložených tréninků, nic nového se neukládá (kromě nastavení). Každá funkce jde vypnout, volby patří do jedné sekce Nastavení „Motivace“ (viz F3-09). Žádná oznámení na pozadí a žádné výčitky („ztratíš streak“).

- [ ] **F5-01** Kolik chybí na rekord: u série v rozdělaném tréninku drobná nápověda, co je potřeba na nový rekord (např. „🏅 8 opak. = nový 1RM“, „85 kg = max. zátěž“). Navazuje na F4-01.
- [ ] **F5-02** Týdenní cíl: v Nastavení počet tréninků za týden (např. 3), na obrazovce Trénink kolečko „2 / 3 tento týden“, streak počítá týdny se splněným cílem (dnes `calStreak` = týdny aspoň s 1 tréninkem).
- [ ] **F5-03** Milníky (odznaky): 10./50./100. trénink, N týdnů v řadě, celkem zvednuto 10/100 t, první trénink v novém fitku… Při dosažení oslava jako u rekordu (odznak místo medaile), ve Statistikách nástěnka se získanými i zamčenými odznaky.
- [ ] **F5-04** Pokrok v čase: karta „Před rokem jsi na bench dal 60 kg, dnes 85 kg (+42 %)“ u nejčastějších cviků (Statistiky, případně stránka cviku).
- [ ] **F5-05** Měsíční shrnutí: na začátku měsíce karta za minulý měsíc (tréninky, rekordy, nejlepší cvik, porovnání s předchozím měsícem), na konci roku „Rok v posilovně“.
- [ ] **F5-06** Kluby síly: odznaky „Klub 100 kg bench“, „bench = tělesná hmotnost“ apod. (tělesnou hmotnost appka zná).
- [ ] **F5-07** Objem obrazně: „Tento měsíc jsi zvedl 42 t, to jsou 3 autobusy.“
- [ ] **F5-08** Osobní výzvy: appka navrhne výzvu podle průměru (např. „12 tréninků v říjnu“, „+10 % objemu nohou“), průběh na obrazovce Trénink.
- [ ] **F5-09** Zanedbaná partie: nenápadná informace na obrazovce Trénink („Nohy naposledy před 10 dny“), jen v appce, bez oznámení. Navazuje na skupiny partií (F3-01) a radar (F3-04).


## Co neděláme

| Nápad | Proč ne |
|---|---|
| Spálené kalorie při tréninku | Odhad přes MET má u posilování chybu ±30–50 %, bez tepu nemá vypovídací hodnotu a svádí k „dojídání". Náhrada: trend tělesné váhy. |
| Sledování jídla a příjmu kalorií | Samostatná velká aplikace, na to existují specializované appky. |
| Napojení na hodinky / Health Connect | Z webové appky nedostupné, jen z nativní aplikace. |
| Cloud, server, synchronizace dat | Jen offline a zdarma, data zůstávají v telefonu, zálohu řeší F0-01. (GitHub slouží jen pro kód a hosting.) |
| XP body a levely | Působí uměle a neříkají nic o skutečném pokroku; motivaci řeší rekordy, milníky a týdenní cíl (fáze 5). |

Odloženo (vrátit se, až bude fáze 3 hotová):

- Automatická volba fitka podle GPS: ruční volba stačí, GPS vyžaduje oprávnění a baterii.
- Silueta postavy obarvená podle zatížení ve Statistikách: radar (F3-04) pokryje totéž jednodušeji. (V souhrnu po tréninku je postava od F3-03.)
- Jemnější dělení partií (biceps/triceps, kvadricepsy/hamstringy/hýždě): podle odpovědi na otevřenou otázku.

## Otevřené otázky

Rozhodnout nejpozději v session dané úlohy. U každé je návrh výchozí volby.

| Úloha | Otázka | Návrh |
|---|---|---|
| F0-02 | Obsahuje databáze cviků už svalové partie, nebo je doplníme? | Vyřešeno 23. 9.: partie všech 388 cviků zkontrolované a schválené, výchozí databáze je součástí appky. |
| F0-03 | Zdroj, český název, popis, fotky? | Vyřešeno 23. 9.: jen free-exercise-db (kopie v repu, volné dílo), wger odloženo. Hotové české názvy všech 876 cviků, popis anglicky, hledání česky i anglicky, u stejného cviku upozornění „už máš“, fotky jen náhled (ukládání až F2-05). |
| F0-04 | Jak dostat testovací verzi (před merge) do telefonu? GitHub Pages teď nasazuje jen `main`. | Vyřešeno 23. 9.: GitHub Actions nasadí každý otevřený PR do `…/workout-denik-test/pr-N/` (samostatné repo, aby šla testovací verze nainstalovat) s vlastními daty (kopie z vydané verze tlačítkem), oranžovým pruhem a ikonou TEST; verze a čas se doplní automaticky. |
| F0-05 | Bude spodní lišta se 6 záložkami na telefonu ještě pohodlná? | Vyřešeno 23. 9.: 6 záložek s popisky, menší písmo; Cviky mají ikonu otevřené knihy (činka zůstává Tréninku). |
| F0-06 | Co má Zpět udělat na hlavní obrazovce Tréninku? | Vyřešeno 23. 9.: první stisk ukáže hlášku, druhý appku zavře, dokud se mezitím nedotkneš displeje (klepnutí i swipe) (limit 2 s Chrome neumožní spolehlivě hlídat) |
| F0-07 | Ruční pořadí, nebo automaticky podle počtu návštěv? | Vyřešeno 23. 9.: ruční, šipky ↑/↓ přímo v řádku fitka; výchozí fitko zůstává zvlášť; nové fitko dostane první volnou barvu; „Podle fitek“ ve Statistikách dál podle počtu tréninků; 6 barev je málo, řeší F3-01. |
| F0-10 | Přeformátovat ručně, nebo nástrojem? Jak dlouhé řádky? | Jednorázově nástrojem (formátovač spuštěný jen při vývoji, do repa se nic nepřidá), pak ruční úprava HTML šablon; řádky do cca 110 znaků. |
| F0-11 | Podle čeho dělit soubory a jak si budou předávat data (dnes je vše v jedné funkci)? | Podle záložek a datové vrstvy; společný stav přes jeden sdílený objekt (např. `window.WD`), pořadí skriptů pevně v `index.html`. |
| F1-01 | Šedé, nebo černé předvyplnění? Co v novém fitku? Hodnoty ze šablony? Víc sérií než minule? | Vyřešeno 23. 9.: šedé (✓ převezme); cvik vázaný na fitko bez záznamu v tomto fitku = prázdné, jen info „V jiném fitku (…)“; hodnoty ze šablony jen u nikdy necvičeného cviku; série bez záznamu z minula = „–“ ve sloupci Minule i v políčkách; „minule“ = poslední trénink s cvikem (ne běh šablony); sloupec Minule jen informace; univerzální cviky dál z kteréhokoli fitka. |
| F1-02 | Kdy má displej svítit, jde ztlumit jas, co s baterií? | Vyřešeno 24. 9.: jen během odpočinkové pauzy (i přečasu) v rozdělaném tréninku, vypínač v Nastavení → Odpočinek, výchozí vypnuto; pojistka: po 10 min bez dotyku zámek pustí; baterie pod 15 % bez nabíječky = dočasně vypnuto s upozorněním v Nastavení; v tréninku žádný ukazatel. Jas webová appka měnit neumí: místo toho po 30 s bez dotyku černá obrazovka jen s odpočtem (vypínatelné, výchozí zapnuto), po konci pauzy světlejší. |
| F1-10 | Jak přísně hlídat čísla? Hranice, desetinná místa, co s překlepem? | Vyřešeno 24. 9.: nepovolený znak se do políčka nedostane, nesmysl má červený rámeček a nejde uložit; hranice kg a km 999, opakování 999 (jen celá), čas 23:59:59, procenta 100, desetinná místa nejvýš 2 (další číslice ani číslice nad hranici nejdou napsat, „,5“ → „0,5“, čas „85“ → „1:25“ a „1:5“ → „1:05“ po opuštění políčka); 0 kg projde, 0 opakování ne; u podezřele velkého nárůstu proti minulé sérii (kg 1,5× a +20, opakování 2× a +10, čas a km 2×) dotaz „Opravdu…?“, jen při ✓ v rozdělaném tréninku; pokles se nehlídá. |
| F1-04 | Jak upozornit na konec pauzy, když je appka na pozadí nebo displej zhasnutý? | Vyřešeno 23. 9.: systémové oznámení ze service workeru („Další: cvik · N. série“), vypínatelné v Nastavení; v appce na konci 2 dlouhé vibrace a pípnutí (volba zvuk / vibrace / obojí); přečas „+0:25“ vypínatelný; pauza po zahřívací sérii stejná; oznámení při startu pauzy ne; délka pauzy podle cviku odložena jako F1-09. Se zamčeným displejem může oznámení přijít pozdě (Android uspí procesor); udržování telefonu vzhůru neslyšitelným tónem zamítnuto. |
| F2-01 | „Cvičit znovu" z tréninku v jiném fitku: spustit v aktuálním, nebo původním fitku? | Vyřešeno 23. 9.: před startem okno s volbou fitka (předvybrané aktuální); počet a druh sérií z vybraného tréninku, hodnoty šedě z minula ve zvoleném fitku (F1-01); vazba na šablonu zůstává, „Aktualizovat šablonu“ nezaškrtnuté; poznámky ke cvikům jen ve stejném fitku; tlačítko jen v detailu tréninku. |
| F2-02 | Mají mít šablony různé výchozí váhy pro každé fitko? | Ne, stačí F1-01 |
| F3-06 | Kde kalendář, co pod kolečkem, streak, volné dny, filtr fitek, klepnutí na den? | Vyřešeno 23. 9.: Historie s přepínačem Kalendář / Seznam, kalendář na prvním místě a výchozí (volba se pamatuje), otevře se vždy aktuální měsíc; pod kolečkem název tréninku (ne šablony), zalomený na 2 řádky; víc tréninků v jednom dni = kolečko rozdělené na barvy fitek a „2×“; streak = týdny po sobě aspoň s 1 tréninkem; volné dny = dny od posledního tréninku (nahoře) i počet v měsíci (dole); filtr fitek skryje tréninky jiných fitek, streak a volné dny vždy ze všech fitek; měření = tečka; den s jednou věcí se otevře rovnou, s víc věcmi (i trénink + měření) výběr; rozdělaný trénink čárkovaně. |
| F2-05 | Zahrnout fotky do zálohy (F0-01)? Záloha tím naroste o jednotky až desítky MB. | Přepínač „s fotkami / bez fotek" (formát zálohy v2 už má připravené pole pro fotky) |
| F3-03 | Porovnat s minulým během šablony v jakémkoli fitku, nebo ve stejném? Rozdíl u cviku proti čemu? | Vyřešeno 23. 9.: minulý běh šablony přednostně ve stejném fitku (jinak odjinud s poznámkou „jiné fitko“), shoda podle šablony, jinak podle názvu (ne automatického) nebo zdroje „Cvičit znovu“; u cviku poslední výskyt cviku i z jiné šablony (vázaný cvik jen ve stejném fitku); postava s procvičenými partiemi bez čísel a legendy; souhrn i u starších tréninků v Historii. |
| F3-01 | Kolik barev fitek, ikona fitka, co s tmavým režimem, jaké barvy partií? | Vyřešeno 24. 9.: 12 barev (1–6 beze změny), výběr v okně fitka, stejnou barvu smí mít víc fitek (pod barvou název fitka, které ji má); ikony fitek zatím ne; tmavý režim už hotový, jen čitelnější šedý text v obou motivech (výraznější varianta); 6 skupin partií (Hrudník, Záda vč. krku, Ramena, Paže, Nohy, Břicho) s vlastní barvou jen ve Statistikách a v souhrnu, stránka cviku zůstává červená; obecné grafy neutrální šedomodrou; archivace fitek později (F2-06). |
| F3-02 | Kdy a jak oslavit rekord, jaký zvuk, jde to vypnout? | Vyřešeno 24. 9.: medaile přes celou obrazovku po dokončení cviku (všechny pracovní série odškrtnuté, zahřívací se nepočítají; bez dokončení cviku nic, kvůli prokládání cviků) a znovu po uložení tréninku; zlatá za velký rekord (max. zátěž, 1RM, opakování, výdrž, vzdálenost, tempo), stříbrná jen za malý (objem, nejlepší série, celkový čas/vzdálenost), v seznamu vždy všechny; uprostřed činka z ikony appky, nadpis „Nový rekord!“; medaile zmizí až klepnutím (tlačítko Pokračovat nebo mimo kartu, i Zpět), 5 s nestačilo na přečtení; oslavený rekord se znovu slaví jen při dalším zlepšení; zvuk bez vibrace, výběr ze 6 zvuků vytvořených v appce (vlastní soubor z Pixabay zamítnutý); při zapnuté oslavě se nezobrazuje hláška po sérii; oslava po cviku a po tréninku jde v Nastavení → Rekordy vypnout zvlášť. |
| F3-04 | Osy radaru podle sérií, nebo přepínač série ↔ objem? | Pracovní série, sekundární partie × 0,5 |
| F3-04 | 6 hlavních partií, nebo jemnější dělení? | 6 partií |
| vše | Co z původního zadání už appka umí (tmavý režim, časovač, měření)? | Ověřeno 23. 9.: tmavý režim, časovač se zvukem a ±15 s i tělesná měření appka už umí |
| F5-02 | Počítat do týdenního cíle všechna fitka? Co když cíl změním v průběhu? | Všechna fitka; změna cíle platí od aktuálního týdne, starší týdny se hodnotí podle cíle, který tehdy platil (nebo zjednodušeně podle aktuálního). |
| F5-03 | Které milníky a kolik jich? Ukazovat zamčené odznaky? | Začít s 10–15 odznaky; zamčené ukazovat šedě i s tím, kolik zbývá. |
| F5-09 | Po kolika dnech je partie „zanedbaná“? | 7 dní u hlavních skupin, jde vypnout. |

## Log

Nejnovější nahoře. Po každé otestované úloze přidat řádek.

| Datum | Úloha | Poznámka |
|---|---|---|
| 24. 9. 2026 | F1-02 | Displej nezhasne během pauzy: nový vypínač v Nastavení → Odpočinek mezi sériemi (výchozí vypnuto). Během odpočinku a přečasu v rozdělaném tréninku drží appka displej zapnutý (Wake Lock, jen když je appka na očích; po návratu z jiné aplikace se obnoví sám). Po 10 min bez dotyku displej zhasne jako obvykle. Pod 15 % baterie bez nabíječky se funkce dočasně vypne a Nastavení to ukáže. Druhý vypínač „Po 30 s ztmavit obrazovku“ (výchozí zapnuto): černá obrazovka jen s odpočtem a dalším cvikem, po konci pauzy červený přečas; klepnutí ji schová a nic pod ní nezmáčkne. V testovací verzi se události zámku zapisují do Záznamu oznámení. Formát zálohy beze změny, v nastavení přibyly `screenOn` a `screenDim` s výchozí hodnotou. |
| 24. 9. 2026 | F1-10 | Po připomínkách: třetí desetinné místo ani číslici navíc (4. číslice u hranice 999) nejde napsat, políčko ji nepřijme (dřív zčervenalo); „,5“ se hned změní na „0,5“. Po opuštění políčka a při ✓ se hodnota sjednotí: čas „85“ → „1:25“, „1:5“ → „1:05“, váha „5,“ → „5“, „082“ → „82“, „82.5“ → „82,5“. Samotné číslo v čase dál znamená sekundy. |
| 24. 9. 2026 | F1-10 | Políčka pro čísla (série, délka tréninku, měření, tělesná hmotnost v Nastavení) přijmou jen číslice, desetinnou čárku/tečku a u času dvojtečku (čárka a tečka se v čase mění na dvojtečku, klávesnice s čísly dvojtečku nemá). Nesmysl (moc desetinných míst, nad hranicí, 1:75) má červený rámeček, po opuštění políčka krátká nápověda a ✓, Dokončit, Uložit ani Uložit šablonu / měření ho nepustí (skočí do políčka). Při ✓ v rozdělaném tréninku dotaz „Opravdu 150 kg? Minule: 80 kg“ u velkého nárůstu (jen nárůst; Opravit / Ano, je to správně; potvrzení platí, dokud se hodnota nezmění). Starší data s víc desetinnými místy (např. převod z liber) se v políčku zaokrouhlí na 2. Formát dat ani zálohy beze změny. F1-05 (rozdělaný trénink po zavření prohlížeče) ověřeno na telefonu, fungovalo už dřív. Do plánu zapsané aktuální pořadí úloh a opravený začátek souboru. |
| 24. 9. 2026 | – | Nová pravidla stylu kódu v CLAUDE.md (čitelnost pro člověka má přednost před stručností: jeden příkaz na řádek, víceřádkové HTML šablony, srozumitelné názvy, komentáře). Do plánu přidány úlohy F0-10 (přeformátovat stávající kód) a F0-11 (rozdělit `js/app.js` do víc souborů). |
| 24. 9. 2026 | F3-02 | Po testu na telefonu: medaile po cviku už nezmizí sama po 5 s (nestačilo to na přečtení), zavře ji tlačítko Pokračovat, klepnutí mimo kartu nebo Zpět. Nastavení → Rekordy má dva vypínače: oslava po dokončení cviku a po uložení tréninku (`recCelEx`, `recCelW`). Dlouhý seznam rekordů na konci neposkočí (řádek „Posuň pro další“ drží místo) a nemá posuvník přes hodnoty; rozmazaný okraj je dole i nahoře, podle toho, kam se dá posunout. Nová úloha F1-10: políčka pro čísla přijímají i text. |
| 24. 9. 2026 | F3-02 | Oslava rekordu: po odškrtnutí poslední pracovní série cviku s novým rekordem vyskočí medaile (zlatá za velký rekord, stříbrná jen za malý) s paprsky, jiskrami a odleskem, pod ní „Nový rekord!“, název cviku a všechny rekordy s hodnotou „dříve“. Zmizí po 5 s nebo klepnutím či Zpět, časovač pauzy běží dál. Po uložení tréninku medaile nad souhrnem se všemi rekordy po cvicích (tlačítko Pokračovat, dlouhý seznam se posouvá uvnitř karty). Nastavení → Rekordy: vypínač oslavy, výběr zvuku (Vypnuto, Fanfára, Ta-dá, Zvonkohra, Level up, Mince, Harfa) s přehráním, Vyzkoušet. S „Odstranit animace“ v Androidu bez pohybu. Nová úloha F3-09 (uklidit Nastavení). Formát zálohy beze změny, v nastavení přibyly `recCel` a `recSnd` s výchozí hodnotou. |
| 24. 9. 2026 | F3-01 | 12 barev fitek místo 6 (barvy 1–6 beze změny), v okně Upravit fitko / Nové fitko nová část Barva: 12 koleček, pod obsazenou barvou název fitka, nové fitko má předvybranou první volnou. Ikony fitek podle přání vynechány. Svalové partie sloučené do 6 skupin (Hrudník, Záda vč. krku, Ramena, Paže, Nohy, Břicho, připravené i pro radar F3-04): ve Statistikách a v souhrnu tréninku je postava obarvená podle skupin (sytost = počet sérií), pod ní pruh s poměrem skupin v procentech a pruhy partií v barvě skupiny; stránka cviku zůstává červená. Čitelnější šedý text v tmavém i světlém motivu. Obecné grafy (Průběh, váha, Nejčastější cviky, cvik nevázaný na fitko) neutrální šedomodrou, aby se nepletly s modrým fitkem. Do plánu přidána F2-06 (archivace starých fitek). Formát zálohy beze změny. |
| 24. 9. 2026 | F3-06 | Po testu na telefonu: kalendář je v Historii na prvním místě (přepínač Kalendář / Seznam) a otevře se jako výchozí; kdo si přepne na Seznam, tomu se to pamatuje. |
| 23. 9. 2026 | F3-06 | Kalendář v Historii (přepínač Seznam / Kalendář, pamatuje se): měsíc po–ne, kolečko v barvě fitka, pod ním název tréninku na 2 řádky, víc tréninků v jednom dni = kolečko rozdělené na barvy a „2×“, tečka = měření, dnešek orámovaný, rozdělaný trénink čárkovaně. Nahoře týdenní streak (týdny po sobě aspoň s 1 tréninkem, rozběhnutý týden řadu nepřeruší) a dny od posledního tréninku, dole souhrn měsíce (tréninky, volné dny, dny s měřením). Filtr fitek skryje tréninky jiných fitek, streak a volné dny vždy ze všech fitek. Klepnutí na den otevře trénink nebo měření, při víc věcech výběr (Zpět se do něj vrátí). Měsíce šipkami nebo swipem, klepnutí na název měsíce vrátí aktuální měsíc; při příchodu do Historie vždy aktuální měsíc. Budoucí dny zatím neaktivní (F4-07). Data ani formát zálohy beze změny. |
| 23. 9. 2026 | F3-03 | Souhrn po tréninku v panelu tréninku (po uložení „Hotovo · …“ i z Historie): karty Čas, Objem, Série, Rekordy s rozdílem proti minulému běhu stejné šablony (přednostně ve stejném fitku), řádek „Porovnáno s …“ (klepnutím otevře minulý trénink, Zpět vrátí) a „Minule navíc“ s cviky, které tentokrát chyběly. Nová část „Procvičené partie“: postava zepředu/zezadu obarvená podle počtu sérií a pruhy s poměrem partií. U každého cviku nejlepší série a objem (u cviků na čas celkový čas, u vzdálenosti km) proti poslednímu výskytu cviku, i z jiného tréninku; štítek „Poprvé“. Rozdíly všude stejně: ▲ víc (zeleně), ▼ míň (červeně), ◄► 0 beze změny (u času jen šedě); datum minula s rokem, když je z jiného roku. Rekordy v souhrnu seskupené po cvicích (název cviku na řádku, pod ním jednotlivé rekordy). „Cvičit znovu“ si nově pamatuje původní trénink (`againOf`), aby šel porovnat i trénink bez šablony. Formát zálohy beze změny. |
| 23. 9. 2026 | F1-04 | Záznam oznámení jen pro vývoj: vede se a je vidět (Nastavení → Verze aplikace) jen v testovací verzi PR a lokálně, ve vydané verzi není. |
| 23. 9. 2026 | F1-04 | Záznam z telefonu ukázal, že se zamčeným displejem Android uspí procesor a oznámení se někdy zpozdí o desítky sekund (2 ze 4 pokusů), při přepnutí do jiné aplikace chodí včas. Webová appka neumí telefon probudit v přesný čas (to umí jen nativní aplikace). Pokus s neslyšitelným tónem, který by telefon držel vzhůru, zamítnut, omezení se přijímá: po odemčení appka hned ukáže přečas. Záznam oznámení v Nastavení zůstává. |
| 23. 9. 2026 | F1-04 | Oprava po testu na telefonu (se zamčeným displejem oznámení nepřišlo): oznámení se vynechá, jen když je appka viditelná a zároveň aktivní (dřív stačilo „viditelná“). Nový Záznam oznámení v Nastavení (kdy se oznámení naplánovalo, zobrazilo, se zpožděním, nebo vůbec, a kdy šla appka na pozadí) pro hledání příčiny. |
| 23. 9. 2026 | F1-04 | Časovač pauzy přežije zavření appky i automatickou aktualizaci (uložený v telefonu, počítá se z času konce). Na konci pauzy v appce 2 dlouhé vibrace a pípnutí (Nastavení: zvuk i vibrace / zvuk / vibrace). Když je appka na pozadí nebo displej zhasnutý, přijde oznámení Androidu „Odpočinek skončil · Další: cvik · N. série“ (service worker, Chrome ho udrží nejvýš asi 5 min), klepnutí otevře appku; po návratu už nepípá a oznámení zmizí. O povolení oznámení se appka zeptá při první pauze, v Nastavení je přepínač, stav povolení a tlačítko Vyzkoušet. Nově přečas „+0:25“ po konci pauzy (vypínatelný), zmizí odškrtnutím další série, Zavřít nebo po 15 min. Nastavení jsou v `config/main` s výchozími hodnotami, formát zálohy beze změny. Do plánu přidána F1-09 (délka pauzy podle cviku). |
| 23. 9. 2026 | F0-06 | Oprava: přepnutí záložky z úpravy tréninku nebo šablony (i ze stránky cviku otevřené z úpravy) už neuložené změny nezahodí potichu, ale zeptá se „Zahodit změny?“ stejně jako Zpět. Bez změn se záložka přepne rovnou. |
| 23. 9. 2026 | F2-01 | „Cvičit znovu“ v detailu tréninku v Historii (ne v okně Hotovo po dokončení): okno s volbou fitka (předvybrané aktuální, upozornění, když byl trénink v jiném fitku), pak nový trénink se stejným názvem a cviky. Počet a druh sérií z vybraného tréninku, hodnoty šedě z minula ve zvoleném fitku (jako u šablony, F1-01). Poznámky ke cvikům jen ve stejném fitku, cvik, který už v appce není, se vynechá. Vazba na šablonu zůstává (naposledy u šablony), „Aktualizovat šablonu“ při dokončení je nezaškrtnuté. Při rozdělaném tréninku jen hláška. Oprava: šablona z tréninku, aktualizace šablony při dokončení a úprava šablony už neztrácí čas a vzdálenost (plank, běh). Data ani formát zálohy beze změny. |
| 23. 9. 2026 | F1-01 | „Minule“ podle fitka: série se párují podle druhu (zahřívací se zahřívací, pracovní s pracovní), takže zahřívací série už neposunou porovnání. Hodnoty z minula v aktuálním fitku jsou v políčkách šedě a klepnutí na ✓ je převezme; zapsané číslo je bílé/černé. Ani šablona už nepředvyplní váhy natvrdo (počet a druh sérií ano, hodnoty jen u cviku, který jsi nikdy necvičil). Přepnutí fitka během tréninku šedé hodnoty přepočítá. Cvik vázaný na fitko bez záznamu v tomto fitku ukáže jen informaci „V jiném fitku (…)“. Série bez záznamu z minula (navíc oproti minule, nové fitko) má „–“ ve sloupci Minule i v políčkách, hodnoty ze série nad ní se nepřebírají. Oprava: při úpravě starého tréninku se „Minule“ bere z tréninku před ním. Data ani formát zálohy beze změny. |
| 23. 9. 2026 | F0-06 | Systémové tlačítko Zpět (i gesto): panel o úroveň zpět nebo zavřít, stránka cviku a úprava tréninku/šablony zpět tam, odkud se přišlo (i do otevřeného panelu, např. detail tréninku nebo výběr cviků se zaškrtnutými cviky, a na stejné místo seznamu), jiná záložka → Trénink. Na hlavní obrazovce Tréninku první Zpět ukáže hlášku, druhý appku zavře (dokud se mezitím nedotkneš displeje; klepnutí i swipe hlášku hned schová a pojistku obnoví). Úprava se změnami se zeptá „Zahodit změny?“. Šipka ← v appce dělá totéž. Zapojené i panely hledání v online databázi (F0-03): výsledky → formulář a zpět, ze stránky cviku zpět do výsledků. Rozdělaný trénink Zpět nikdy neukončí. Data ani formát zálohy beze změny. |
| 23. 9. 2026 | F0-07 | Pořadí fitek se mění šipkami ↑/↓ v Nastavení → Fitka a platí všude (začátek tréninku, úprava tréninku, filtry v Historii a Statistikách, přepínač a graf na stránce cviku). Každé fitko má uloženou barvu (`col`, 1–6), při prvním načtení se doplní podle dosavadního pořadí, takže se nic nepřebarví; barva se nemění ani přesunem, ani smazáním jiného fitka. Nové fitko dostane první volnou barvu, při sloučení zálohy se kolize barvy vyřeší stejně. Formát zálohy beze změny. |
| 23. 9. 2026 | F0-03 | Hledání cviků v online databázi free-exercise-db (876 cviků, kopie v `js/fedb.js`, načte se až při prvním hledání, pak funguje i offline). Tlačítko „Hledat v online databázi“ ve výběru cviků, v záložce Cviky a ve formuláři Nový cvik. Hledá se česky i anglicky, posilovací cviky nahoře, protahování/kardio/plyometrie na přepínač. Výběr předvyplní formulář (název, český název, partie – nejvýš 3 pomocné, vybavení, typ zápisu, vázáno na fitko, anglický popis). U cviků, které už v appce jsou, „Už máš“ s tlačítkem Vybrat/Otevřít (224 shod s výchozí databází). Vlastní cvik dostane značku `src`, formát zálohy beze změny. Popis cviku nově zachovává řádky. wger odloženo. |
| 23. 9. 2026 | F0-04 | Oprava: testovací verze nešla v Androidu nainstalovat („aplikace už je nainstalována“), protože adresa `…/workout-denik/pr-N/` patří nainstalované vydané appce. Testovací verze se proto nasazují do samostatného repa `workout-denik-test` (`…/workout-denik-test/pr-N/`, rozcestník v kořeni), nahrávají se tokenem v secretu `TEST_REPO_TOKEN`. Vydaná verze se nasazuje jen při změně v `main`. Komentář s odkazem se aktualizuje u všech nasazených PR. Data testovacích verzí zůstávají oddělená (stejná doména). |
| 23. 9. 2026 | F0-04 | Nasazení přes GitHub Actions: `main` = vydaná verze, každý otevřený PR = testovací verze v `…/pr-N/` (odkaz v komentáři PR, po zavření PR zmizí). Testovací verze má vlastní data (IndexedDB `workout-denik-prN`, prefix `zd1-prN:`), tlačítko „Zkopírovat data z vydané verze“, oranžový pruh nahoře, oranžový stavový řádek a vlastní ikonu TEST (jde nainstalovat zvlášť). Nastavení → Verze aplikace: vydaná / testovací verze, čas nasazení, kód změny, „Zkontrolovat aktualizaci“; ve vydané verzi úklid dat testovacích verzí. Verze appky se doplňuje automaticky (`js/verze.js`), ruční zvyšování `VERSION` v `sw.js` zrušeno. Service worker maže jen své cache a neobsluhuje adresy `pr-N`. Formát dat ani zálohy beze změny. Před sloučením nutné přepnout Settings → Pages → Source na GitHub Actions. |
| 23. 9. 2026 | – | Do CLAUDE.md přidáno pravidlo pro souběžnou práci na víc úlohách: před dokončením PR sloučit aktuální `main` do větve a vyřešit konflikty (vyšší `VERSION`, v logu nechat řádky z obou větví). |
| 23. 9. 2026 | – | Do plánu přidány úlohy F0-06 (systémové tlačítko Zpět) a F0-07 (měnitelné pořadí fitek). |
| 23. 9. 2026 | F0-05 | Nová záložka Cviky (6. ve spodní liště, ikona kniha): všechny cviky, nahoře cvičené; řazení Naposledy / A–Z; filtr partie a vybavení (pamatuje se), filtr Skryté; + Nový cvik. Hledání všude bez ohledu na diakritiku. Stránka cviku rozdělená na Popis a Statistiky: ze záložky Cviky a z výběru cviku se otevře Popis, ze Statistik, Historie a tréninku Statistiky. „Spravovat“ z Nastavení odstraněno. Data ani formát zálohy beze změny. |
| 23. 9. 2026 | – | Do plánu přidány úlohy F0-04 (verze appky v Nastavení) a F0-05 (záložka Cviky). |
| 23. 9. 2026 | F0-02 | Výchozí databáze 388 cviků je součástí appky (`js/cviky.js`), v telefonu se ukládají jen vlastní úpravy, skryté a vlastní cviky. Partie zkontrolované podle free-exercise-db a wger a schválené: ramena jako jedna partie, nejvýš 3 pomocné partie, jen svaly, které opravdu pracují (32 úprav, 120× jen sloučení ramen). Převod dat v telefonu jednou automaticky, předtím bod obnovy. V úpravě cviku tlačítko „Výchozí". Vyhledávání v otevřených databázích přesunuto do nové úlohy F0-03. |
| 23. 9. 2026 | PWA-01 | Appka převedena na PWA (GitHub Pages): data v IndexedDB, body obnovy v IndexedDB, stahování zálohy přes Chrome, písma a ikony v repu, service worker s verzovanou cache a automatickou aktualizací, CLAUDE.md a README. Vzhled a funkce beze změny. Zbývá: převést data z artefaktu (záloha → obnova) a otestovat na telefonu. |
| 23. 9. 2026 | – | Rozhodnuto o přechodu z artefaktu na PWA hostovanou na GitHub Pages. Plán převeden do repa. Další na řadě: PWA-01, pak F0-02. |
| 23. 9. 2026 | F0-01 | Záloha hotová (verze 9 artefaktu): pruh s připomínkou po 7 dnech bez zálohy, po stažení návod na Disk, obnova „sloučit" nebo „nahradit vše", body obnovy v appce (týdně, před obnovou, ručně; drží se 8), formát zálohy v2 s místem pro fotky. Otestováno na simulovaných datech, zbývá ověřit v Chromu na telefonu. |
| 23. 9. 2026 | – | Brainstorming dokončen, plán a priority sepsány. |
