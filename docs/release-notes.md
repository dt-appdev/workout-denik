# Co je nového (release notes)

Přehled změn Workout deníku, nejnovější nahoře. Číslo verze je datum vydání
a pořadí v daném dni (např. `2026-09-23.2` = druhá verze vydaná 23. 9. 2026).
Appka si novou verzi stáhne sama při dalším otevření.

Návod k appce: [docs/navod](navod/README.md).

---

## 2026-09-23.4 – Návod k appce

**Nové**

- [Návod k appce](navod/README.md) s obrázky: instalace, trénink krok za krokem,
  šablony, historie, cviky, statistiky, měření, záloha a obnova, časté otázky.
- V **Nastavení → O aplikaci** jsou tlačítka **Návod** a **Co je nového**
  (otevřou se v Chromu, potřebují internet).

**Data:** beze změny.

---

## 2026-09-23.3 – Záložka Cviky

**Nové**

- Nová záložka **Cviky** ve spodní liště (ikona otevřené knihy) s celou databází cviků:
  nahoře cviky, které jsi cvičil naposledy, řazení *Naposledy* nebo *A–Z*,
  filtr partie a vybavení (appka si ho pamatuje), filtr skrytých cviků
  a tlačítko **+ Nový cvik**.
- Stránka cviku je rozdělená na **Popis** (svalová mapa, popis provedení, úprava)
  a **Statistiky** (graf, rekordy, historie cviku). Ze záložky Cviky a z výběru cviku
  se otevře Popis, ze Statistik, Historie a z tréninku rovnou Statistiky.

**Změny**

- Hledání cviků všude ignoruje diakritiku („tlak na lavici" najde i „Tlak na lavici").
- Tlačítko **Spravovat** v Nastavení → Databáze cviků je pryč, nahradila ho záložka Cviky.

**Data:** beze změny, formát zálohy také.

---

## 2026-09-23.2 – Databáze cviků s partiemi

**Nové**

- Výchozí databáze **388 cviků** je přímo součástí appky, každý cvik má hlavní
  a pomocné svalové partie zkontrolované podle otevřených databází
  (free-exercise-db, wger).
- V úpravě cviku přibylo tlačítko **Výchozí**, které vrátí cvik do původní podoby.

**Změny**

- Ramena jsou jedna partie (dřív přední, boční a zadní zvlášť).
- Každý cvik má nejvýš 3 pomocné partie a jen svaly, které opravdu pracují
  (32 cviků opraveno).

**Data:** při prvním spuštění se cviky v telefonu jednou automaticky převedou
na novou databázi (předtím appka sama vytvoří bod obnovy). Tvoje vlastní úpravy,
skryté a vlastní cviky zůstávají.

---

## 2026-09-23.1 – Appka na GitHub Pages (PWA)

**Nové**

- Appka se přestěhovala z Claude artefaktu na vlastní adresu
  <https://dt-appdev.github.io/workout-denik/> a instaluje se na plochu telefonu
  jako aplikace (PWA).
- Funguje **offline** a **aktualizuje se sama**.
- Data se ukládají do úložiště Chromu v telefonu (IndexedDB), body obnovy také.
  Chrome je požádán, aby data appky nikdy sám nemazal.
- Záloha se stahuje přímo do složky **Stažené**.

**Změny**

- Vzhled i funkce jsou stejné jako ve verzi 9 artefaktu.

**Data:** tréninky z artefaktu se přenesou zálohou: v artefaktu **Stáhnout zálohu**,
v nové appce **Nastavení → Záloha → Obnovit ze souboru → Nahradit vše**.

---

## Verze 9 (Claude artefakt) – Záloha dat

**Nové**

- **Záloha jedním klepnutím** do souboru JSON a návod, jak ji poslat na Google Disk
  nebo e-mailem.
- Připomínka na úvodní obrazovce po 7 dnech bez zálohy.
- **Obnova ze zálohy**: *Sloučit* (doplní jen chybějící) nebo *Nahradit vše*.
- **Body obnovy** uvnitř appky: automaticky jednou týdně, vždy před obnovou
  a ručně; drží se posledních 8.

---

## Verze 1–8 (Claude artefakt)

Původní appka vznikla jako Claude artefakt (jeden HTML soubor). Podrobný seznam změn
jednotlivých verzí se nedochoval. Poslední verze artefaktu (verze 9, uložená
v `puvodni/`) kromě zálohy uměla:

- zápis tréninku se sériemi (pracovní, zahřívací, drop set, do selhání),
  hodnotami z minula a časovačem odpočinku se zvukem a ±15 s,
- více fitek a cviky vázané na fitko (vlastní progres pro každé fitko),
- šablony tréninků a vytvoření šablony z odcvičeného tréninku,
- historii s úpravou odcvičených tréninků,
- statistiky s volbou období a fitka, osobní rekordy a odhad 1RM,
- databázi cviků s českými názvy, svalovou mapou a vlastními cviky,
- tělesná měření (hmotnost, tuk, svaly, obvody) s grafem,
- odkazy na návody ke cvikům na Hevy nebo na video,
- tmavý a světlý motiv.

Historie tréninků z aplikace Hevy byla do appky převedena jednorázově.
