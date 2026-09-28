# F1-15 Druh série výběrem místo cyklu – odložený návrh

**Stav:** odloženo 28. 9. 2026. Úloha zůstává v plánu jako možná, teď se nedělá. Tady je zapsaná
diskuse, ověřené chování appky a podklady, aby se na ni dalo navázat.

## Proč odloženo

Návrh vznikl z UX auditu 27. 9. 2026 (§5 nález 2, P2 · A): klepnutí na číslo série bez potvrzení přepne
druh, omyl mění objem, rekordy i předvyplnění. Uživatel se ale za dobu používání appky
nikdy neuklikl, v praxi problém nemá (odpověď na otázku z „Ověřit při používání“). Výběr z panelu by
přidal jedno klepnutí u zahřívací série, kterou uživatel nastavuje nejčastěji.

Vrátit se k úloze, když:

- se druh série změní omylem (např. osamělá zahřívací série mezi pracovními ve starších trénincích),
- nebo budou u druhů sérií potřeba vysvětlivky (viz Hevy níže), např. kvůli F1-17 nebo F3-25.

## Jak to funguje dnes (ověřeno v kódu 28. 9. 2026)

- Klepnutí na odznak série (`case "cycType"`, tlačítko `.stype` v `vExCard`) přepne druh dokola podle
  `TYPES`: pracovní → W (zahřívací) → D (drop set) → F (do selhání) → pracovní. Z W zpátky na pracovní
  jsou to 3 klepnutí. Platí v tréninku, v úpravě uloženého tréninku i v šabloně.
- **Nic se neztratí.** Zapsané hodnoty (kg, opakování…) jsou v sérii a druh je nemění. Šedé předvyplnění
  a sloupec Minule se neukládají, počítají se při každém vykreslení podle druhu (`exHints`, `draftHints`):
  zahřívací série se párují se zahřívacími z minula, ostatní s pracovními, v pořadí. Po vrácení druhu je
  všechno jako předtím.
- Dokud je série přepnutá, série pod ní se přečíslují a spárují s jinou sérií z minula (v auditu pak
  série 3 ukazovala hodnotu ze série 2).
- Jediné, co se nevrátí: změna druhu volá `progTouch` (`e.progNo`), takže zelený řádek s nepoužitým
  návrhem progrese (F4-01) zmizí nadobro, i když druh vrátíš. Použitý návrh (`e.progUse`) zůstane.
  Při znovuotevření zvážit, jestli `progTouch` volat jen při změně z pracovní nebo na pracovní.
- Odznak má 34 × 32 px a je na levém kraji, kde se drží telefon (zvětšení dotykové plochy řeší F1-18).

## Jak to má Hevy (screenshoty uživatele 28. 9. 2026)

Klepnutí na číslo série otevře panel zespodu **Select Set Type** se 4 druhy a smazáním série:

| Značka | Položka | Nápověda (tlačítko ? u položky, okno s Ok) |
|---|---|---|
| W (žlutá) | Warm Up Set | Warm up sets are used to prepare the body to lift heavier weights. |
| 1 (bílá) | Normal Set | Normal sets refer to "working sets", these will increase strength/muscle. |
| F (červená) | Failure Set | Failure set is a normal set, in which you reached muscular failure and were not able to complete the last rep of the exercise successfully. If you fail on your 11th rep, you should record 10 reps. |
| D (modrá) | Drop Set | A technique for continuing an exercise with a lower weight once muscle failure has been achieved at a higher weight. |
| × (červený) | Remove Set | – |

Pořadí v Hevy: W, Normal, Failure, Drop. Každý druh má vlastní barvu značky.

## Návrh, kdyby se úloha otevřela

- Klepnutí na odznak otevře krátký panel (`openSheet`) se 4 druhy (Pracovní, Zahřívací, Do selhání,
  Drop set), aktuální zvýrazněný, klepnutí na druh ho nastaví a panel zavře. Vždy 2 klepnutí, bez omylu.
  Dál volá `progTouch` a platí ve všech třech režimech editoru.
- Vysvětlivky druhů: pravidla F3-21 dávají do krátkých panelů nejvýš jednu větu a žádné tlačítko
  nápovědy. Buď jedna krátká věta pod každým druhem v panelu (výjimka z pravidla, rozhodnout), nebo
  vysvětlivky do `HELP` u sekce, kde se druhy sérií nastavují.
- Smazat sérii v panelu jako v Hevy: zvážit, dnes se maže tahem doleva (F2-03).
- Varianta audit: cyklus zůstane, jen s hláškou „Série 2 → Zahřívací · Vrátit“. Pozor, tlačítko Vrátit
  u smazané série bylo odmítnuto (F2-03), u druhu série by šlo o jiný případ.
