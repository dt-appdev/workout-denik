# F3-47 Design manuál – návrh

**Stav:** odloženo 14. 10. 2026. Uživatel zatím není přesvědčen, že úloha stojí za svou náročnost, vrátí se
k ní sám. Tady je celá diskuse, aby se na ni dalo navázat.

## Cíl

Vizuální podklad, ve kterém uživatel snadno zkontroluje, jak jsou věci v appce udělané: nákresy stránek, písma,
styly, odsazení a mezery. Pro Claude je hlavním podkladem dál text v `CLAUDE.md` (obrázky čte draze), manuál
je obrázkový přehled pravidel s odkazy na jejich ID (F3-11, F3-23, F3-43, F3-45…).

## Rozhodnuto v diskusi 14. 10. 2026

- **Umístění:** HTML stránka ve složce `manual/` v repu, ne artefakt na claude.ai. `sestav-web.sh` maže při
  nasazení jen `.github`, `docs`, `tools`, `puvodni` a `*.md`, takže se `manual/` dostane na web sama
  (`…/workout-denik/manual/`, v testovací verzi PR `…/pr-N/manual/`). Výhoda: součást kódu s historií,
  v testovací verzi PR je vidět manuál pro změny v PR, nezávisí na Claudovi. GitHub sám HTML nezobrazí
  (jen zdrojový kód), otevírá se přes web.
- **Úprava `sw.js` nutná:** service worker dnes na každé otevření stránky (`req.mode === "navigate"`) vrací
  `index.html` z cache, takže by se místo manuálu otevřela appka. Náhradní `index.html` jen pro appku, ne pro
  `manual/`. Ověřit, že offline režim appky funguje dál.
- **Bez polí pro komentáře:** statická stránka na Pages nemá kam ukládat, připomínky v chatu nebo v PR.
- **Prvky živě, ne snímky:** stránka načte skutečný `css/app.css`, takže barvy, písma a mezery jsou vždy
  aktuální, s přepínačem motivu a velikosti písma. Snímky v gitu by zůstaly navždy a každé obnovení by přidalo
  několik MB do historie repa.
- **Rozdělení do dvou kroků** (kvůli spotřebě tokenů a kvůli F3-44 krok B, která ještě mění karty).

## Krok A – pravidla a prvky (bez snímků)

1. Barvy: vzorky obou motivů a k čemu se která smí použít (`--accent` jen hlavní akce a vybrané, barvy fitek
   `--sN` z `g.col`, druhy sérií, `--chart`, skupiny partií `--g-*`).
2. Písmo: každá velikost `--fs-*` skutečným písmem, ukázka při Velikost písma „Největší“ (`--fs-k` 1,3),
   typografie F3-45 (název v kartě, řádek seznamu, popisek, nadpis sekce, drobný popisek, velké číslo).
3. Mezery: stupnice `--gap-lbl` 4 / `--gap-list` 8 / `--gap-in` 10 / `--gap-out` 22 px s nákresem použití,
   `--tap` 44 px a `--row-h` 36 px.
4. Prvky: tlačítka (pořadí dole F2-12, patička panelu F3-23, `icoBtn`), políčka `.inp`, přepínače `.seg`,
   čipy, karty, odznaky sérií, ikony `IC`.

Omezení (ověřeno v kódu): `js/app.js` je jeden uzavřený blok `(function () { … })()`, který se při načtení
spouští jako appka, takže manuál nemůže volat jeho funkce (`icoBtn`, šablony karet). Živé je jen CSS, kostru
HTML prvků je nutné do manuálu opsat (může zastarat, při změně tříd prvku manuál upravit). Ikony `IC` lze
číst z `js/app.js` jako text při otevření manuálu (křehké: přejmenování `IC` by to rozbilo).

## Krok B – nákresy stránek (až po F3-44 krok B)

Skript podle `tools/mezery.js` (Playwright lokálně, zkušební data, šířka 412 px) udělá snímek každé stránky
(asi 12) a hlavních panelů s vyznačenými mezerami (barevné pruhy s px) a odkazem na pravidlo. Jen světlý
motiv, komprimovaně (JPEG, 1×), obnovovat jen při větší změně vzhledu, ne po každém PR. Do pravidel v
`CLAUDE.md` pak přibude krok „po větší změně vzhledu obnovit snímky manuálu“.

## Odhad náročnosti (tokeny, odhad 14. 10. 2026)

Celkem středně až hodně náročná, podobně jako F3-43 s náhledem. Rozdělení: průzkum kódu asi 15 %, napsání
stránky (1 000–1 500 řádků HTML) asi 25 %, skript na snímky asi 10 %, prohlížení snímků a opravná kola asi 35 %,
`sw.js`, plán, log a PR asi 15 %. Krok A sám odhadem 40–50 % celku. Bez paralelních pomocníků (subagentů).

## Otevřené otázky (výchozí volba v závorce)

1. Rozsah snímků v kroku B: všechny stránky a asi 10 hlavních panelů, nebo jen hlavní záložky?
   (všechny stránky + hlavní panely)
2. Tmavý motiv ve snímcích: jen jeden přehledový snímek, nebo všechny? (jen přehledový)
3. Zdroj pravdy: `CLAUDE.md` zůstává závazný, manuál je přehled s odkazy na ID pravidel (ano).
4. Pořadí: krok A kdykoli, krok B až po F3-44 krok B (ano).
5. Odkaz na manuál z appky (např. Nastavení → O aplikaci, jen v testovací verzi)? (ne, jen adresa)
