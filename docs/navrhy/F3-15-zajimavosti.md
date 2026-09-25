# F3-15 Zajímavosti ve Statistikách – návrh

**Stav:** nápad zapsaný 25. 9. 2026, zatím nic nerozhodnuto. Tady je celý seznam nápadů a otevřené otázky,
aby se na ně dalo navázat při otevření úlohy.

## Cíl

Statistiky jsou dnes jen grafy, pruhy a porovnání. Přidat vtipné nebo unikátní „zajímavosti“ z vlastních
dat: den s největším objemem, nejdelší trénink, oblíbený den v týdnu apod. Vše se počítá z uložených
tréninků, nic nového se neukládá (bez rizika pro data a zálohu).

## Z čeho se dá počítat (ověřeno v kódu 25. 9. 2026)

- Trénink: začátek a konec (`start`, `end`, ručně upravená délka `endOrig`), fitko, název, šablona.
- Série: druh (`t`, zahřívací `w`), kg, opakování, čas, km; objem přes `setVol` / `wVol`, délka `wDur`.
- Čas odškrtnutí série `s.at`: jen u tréninků zapsaných v appce, starší historie z Hevy ho nemá.
- Tělesná hmotnost z měření (`body/all`), rekordy tréninku `wRecs`, partie a skupiny `MGRP`.

## Nápady (⭐ = návrh na první verzi)

### Rekordní dny („Síň slávy“)

Dlaždice s číslem, datem a názvem tréninku, klepnutí otevře souhrn tréninku (`sheetWorkout`, jako z Historie).

- ⭐ Největší objem za den („18,4 t · 12. 3. · Push A“).
- ⭐ Nejdelší trénink.
- Rychlovka: nejkratší trénink s aspoň pár pracovními sériemi.
- ⭐ Nejvíc sérií / nejvíc cviků v jednom tréninku.
- Nejvíc rekordů v jednom tréninku („Zlatý den: 5 rekordů“).
- ⭐ Nejintenzivnější trénink: objem za minutu („310 kg/min“).
- Nejdelší série: nejvíc opakování v jedné sérii, nejdelší výdrž (plank).

### Zvyky a „osobnost“

- ⭐ Ranní ptáče, nebo noční sova: nejdřívější a nejpozdější trénink, „obvykle cvičíš v úterý kolem 18:00“.
- ⭐ Oblíbený den v týdnu („Pondělí je tvůj den (31 %)“), naopak „Pátek tě v posilovně nevidí“.
- ⭐ Nejdelší prázdniny: nejdelší mezera bez tréninku („23 dní, 3.–26. 7.“) a nejvíc dní po sobě.
- Index vynechaných nohou 🐔: poměr sérií nohy / horní polovina těla s hláškou podle výsledku.
- Zapomenutý cvik: dřív častý, naposledy před 4 měsíci.
- Jednorázovky: cviky zkoušené jen jednou.
- Sváteční trénink: Štědrý den, Silvestr, Nový rok, pátek 13.
- Věrnostní karta fitka: kolikátá návštěva v každém fitku.

### Kuriozity z čísel

- ⭐ Nejkratší a nejdelší pauza mezi sériemi („Nejdelší pauza: 14 min. Telefon?“), jen z tréninků se `s.at`.
- Magické číslo: nejčastější počet opakování („Desítka, 412×“), nejoblíbenější váha („20 kg, 380 sérií“).
- Celkem opakování od začátku.
- Tělesná hmotnost: „Za den nejvíc zvednuto 230× tvoje váha“.

### Obrazná srovnání (= F5-07)

- Objem: „celkem 412 t = 3 plejtváci“, „za měsíc 1 autobus“.
- Čas: „celkem 96 h = 32× Pán prstenů v prodloužené verzi“.
- Opakování: „kdyby každé opakování byl schod, vylezl bys na Sněžku 4×“.
- Kardio: „Uběhnuto 84 km = Praha → Benešov a kus zpátky“.

## Jak by to fungovalo (návrh)

- Nová část **Zajímavosti** ve Statistikách (čtvrtá vedle Přehled / Partie / Cviky z F3-13), nebo do té
  doby sekce na konci Statistik.
- Platí filtr fitka i období Statistik.
- Dlaždice bez dat (málo tréninků, starší historie bez času sérií) se neukáže.

**Rizika:** zapomenuté ukončení tréninku (5 h) vyhraje Nejdelší trénink (délka jde upravit ručně); stránka
Statistik se prodlouží (proto F3-13).

## Souvislosti s plánem

- **F3-13** Rozdělení Statistik na části: Zajímavosti jako čtvrtá část.
- **F5-07** Objem obrazně: patří sem, udělat spolu nebo hned po.
- **F5-03** Milníky, **F5-05** Měsíční shrnutí / „Rok v posilovně“: můžou použít stejné výpočty.
- **F4-08** Sdílení obrázku: Síň slávy by se hodila ke sdílení.
- Tréninky podle dne přes `wByDay` / `dayKey` (F3-06), klepnutí na trénink přes `sheetWorkout` s `nav`.

## Otevřené otázky (v závorce navržená výchozí volba)

1. Které zajímavosti v první verzi? (⭐ + Index vynechaných nohou a Sváteční trénink, zbytek později.)
2. Umístění? (Část Zajímavosti v rámci F3-13; bez F3-13 zatím sekce na konci Statistik.)
3. Platí filtr fitka a období? (Ano.)
4. Tón: jen čísla, nebo i vtipné podtitulky? (Krátký vtipný podtitulek, číslo zůstává hlavní.)
5. Obrazná srovnání F5-07 rovnou? (Ano, aspoň objem a čas.)
6. Vyřadit podezřele dlouhé tréninky z Nejdelšího tréninku? (Ne, z dlaždice jde délka opravit.)
