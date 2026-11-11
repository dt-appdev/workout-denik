# Nativní appka pro Android (F6-01)

Stejná appka jako na GitHub Pages, zabalená do aplikace pro Android přes **Capacitor** (zdarma, open source).
Kód appky (`index.html`, `css/`, `js/`) se nemění a nesestavuje, Capacitor ho jen vloží do APK a spustí
v zabudovaném Chromu (WebView). Co WebView neumí, doplní `js/nativni.js` přes doplňky Capacitoru.

## Co je v téhle složce

| Soubor | Co v něm je |
|---|---|
| `package.json`, `package-lock.json` | Balíčky Capacitoru (pevné verze). npm jen tady a v GitHub Actions, appka sama dál bez npm. |
| `capacitor.config.json` | ID aplikace `cz.workoutdenik.app` (testovací APK `cz.workoutdenik.test`), název, nastavení WebView. |
| `android/` | Projekt pro Android (vytvořil `npx cap add android`, upravený). Ikona: `res/drawable/ic_launcher_foreground.xml` (stejná činka jako `icons/icon.svg`), barva `res/values/ic_launcher_background.xml`. Oprávnění v `AndroidManifest.xml`. Podpis a číslo verze v `app/build.gradle`. |
| `sestav-apk.sh` | Sestavení APK (spouští ho `.github/workflows/apk.yml`). |
| `www/`, `out/`, `node_modules/` | Vznikají při sestavení, nejsou v gitu. |

## Jak se APK sestavuje a vydává

- **Po každém sloučení do `main`** sestaví GitHub Actions (workflow „APK“) podepsané APK a vydá ho jako
  GitHub Release `vN` (Releases v repu). Číslo `N` je zároveň číslo verze pro Android, takže každé další APK
  jde nainstalovat přes předchozí a data zůstanou.
- **PR, který mění nativní obal** (`nativni/`, `js/nativni.js`, `.github/workflows/apk.yml`), dostane testovací
  APK „WD TEST #N“: oranžová ikona, jiné ID aplikace (jde nainstalovat vedle hlavní a má vlastní data), pruh
  TEST nahoře a zapnuté ladění přes `chrome://inspect`. Odkaz přijde do komentáře v PR, po zavření PR se smaže.
  Ostatní PR mají dál jen testovací webovou verzi.
- Aktualizace nejsou automatické jako u webové appky: novou verzi stáhne a nainstaluje aplikace **Obtainium**.

## Nastavení (jednou)

1. **Klíč k podpisu** do secretů repa (Settings → Secrets and variables → Actions → New repository secret):
   - `WD_KEYSTORE_B64` = obsah souboru `WD_KEYSTORE_B64.txt` (klíč v base64),
   - `WD_KEYSTORE_PASSWORD` = obsah souboru `WD_KEYSTORE_PASSWORD.txt` (heslo).

   Soubor klíče `workout-denik-klic.jks` a heslo si ulož i mimo GitHub (Disk, správce hesel). Ze secretu se
   zpátky přečíst nedají. **Ztráta klíče = novou verzi nepůjde nainstalovat přes starou**, jen odinstalovat
   a nainstalovat znovu (s obnovou ze zálohy). Klíč do repa nikdy nepatří (`*.jks` je v `.gitignore`).
2. **Obtainium** v telefonu (zdarma, z GitHubu nebo F-Droidu): Přidat aplikaci → adresa repa
   `https://github.com/dt-appdev/workout-denik` → Přidat. Obtainium sleduje poslední vydání (testovací APK jsou
   předběžná vydání a ignoruje je). Při první instalaci Android požádá o povolení instalace z Obtainia.

## Přechod z webové appky (až po F6-02)

Rozhodnuto 14. 10. 2026: data nesmí žít ve dvou appkách zároveň. Nejdřív nativní appku zkoušej jen se
zkušebními daty (Nastavení → O aplikaci, jen v testovacím APK) nebo s kopií zálohy. Den přechodu:

1. Webová appka: Nastavení → Data a záloha → Nativní appka → **Přesunout data do nativní appky**. Stáhne se
   záloha i s fotkami a webová appka od té chvíle ukazuje červený pruh „Data jsou v nativní appce“.
2. Nativní appka: Nastavení → Data a záloha → Obnovit ze souboru → vybrat zálohu → **Nahradit vše**.
3. Dál zapisovat jen do nativní appky. Webovou appku nemaž, kdyby se nativní neosvědčila
   (Zrušit přesun vypne pruh, data přeneseš zálohou zpátky).

## Lokálně

Sestavení potřebuje Android SDK a JDK 21 (Android Studio ne):
`WD_KEYSTORE_B64=… WD_KEYSTORE_PASSWORD=… bash nativni/sestav-apk.sh vydana` (bez klíče vznikne nepodepsané APK).
Do `www/` se kopíruje poslední commit, ne rozpracované změny. Automatické testy (`tools/testy/nativni.js`)
nativní appku jen napodobují (falešný `window.Capacitor`), skutečné APK se zkouší v telefonu.
