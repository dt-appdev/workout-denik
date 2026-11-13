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
- **Každý PR při každém pushi** (F6-08) dostane testovací APK **„WD TEST“**: oranžová ikona, jiné ID aplikace
  (jde nainstalovat vedle hlavní a má vlastní data), pruh TEST s číslem PR nahoře a zapnuté ladění přes
  `chrome://inspect`. Je jedno pro všechny PR (vždy z naposledy změněného, data společná pro všechny PR)
  a vydává se jako `tN` v repu `workout-denik-test` (vedle testovacího webu), kde ho sleduje Obtainium jako
  druhou appku. Vydání s nejvyšším číslem je vždy označené Latest, drží se posledních 5, po zavření PR se nic
  nemaže. Odkaz přijde i do komentáře v PR. Zapisuje se tokenem `TEST_REPO_TOKEN` (stejný jako pro testovací
  web), ten potřebuje u repa `workout-denik-test` oprávnění **Contents: Read and write**; bez něj workflow
  jen varuje a APK nevydá.
- **Ručně** (Actions → APK → Run workflow): bez čísla PR = vydaná verze z `main`, s číslem PR = testovací APK
  z toho PR (když chceš vyzkoušet PR, do kterého jsi naposled nepushoval).
- Aktualizace nejsou automatické jako u webové appky: novou verzi stáhne a nainstaluje aplikace **Obtainium**.

## Nastavení (jednou)

1. **Klíč k podpisu** do secretů repa (Settings → Secrets and variables → Actions → New repository secret):
   - `WD_KEYSTORE_B64` = obsah souboru `WD_KEYSTORE_B64.txt` (klíč v base64),
   - `WD_KEYSTORE_PASSWORD` = obsah souboru `WD_KEYSTORE_PASSWORD.txt` (heslo).

   Soubor klíče `workout-denik-klic.jks` a heslo si ulož i mimo GitHub (Disk, správce hesel). Ze secretu se
   zpátky přečíst nedají. **Ztráta klíče = novou verzi nepůjde nainstalovat přes starou**, jen odinstalovat
   a nainstalovat znovu (s obnovou ze zálohy). Klíč do repa nikdy nepatří (`*.jks` je v `.gitignore`).
2. **Obtainium** v telefonu, podrobně v další sekci.

## Instalace a aktualizace v telefonu (návod pro nováčka)

**APK** je instalační soubor aplikace pro Android (jako `.exe` ve Windows). Appka není v Obchodu Play, proto se
APK instaluje „mimo Obchod“ a Android se na to jednou zeptá. **Obtainium** je bezplatná aplikace, která hlídá
vydání na GitHubu, upozorní na novou verzi a jedním klepnutím ji nainstaluje (náhrada aktualizací z Obchodu Play).
Data v appce aktualizace nemaže, nová verze se nainstaluje přes starou (obě podepsané stejným klíčem).
Přesné názvy tlačítek se podle verze Androidu a Obtainia můžou trochu lišit.

### Ruční instalace APK (bez Obtainia)

Takhle se instaluje Obtainium samo, nebo APK z odkazu v komentáři PR.

1. Otevři odkaz na soubor `.apk` v telefonu v Chromu.
2. Klepni na stažený soubor (oznámení nebo Chrome → ⋮ → Stažené soubory).
3. Když Android napíše, že Chrome nesmí instalovat neznámé aplikace: **Nastavení** → zapnout **Povolit z tohoto
   zdroje** → zpět.
4. **Instalovat**. Varování Play Protect „Neznámá aplikace“: **Další podrobnosti → Přesto nainstalovat**
   (normální u každého APK mimo Obchod).

### Obtainium (jednou, po prvním vydání z `main`)

1. **Instalace Obtainia:** v Chromu otevři `https://github.com/ImranR98/Obtainium/releases`, u nejnovější verze
   (štítek **Latest**) rozbal **Assets** a stáhni soubor končící na **`arm64-v8a-release.apk`** (ne `fdroid`).
   Nainstaluj ho podle sekce Ruční instalace APK výše.
2. Otevři Obtainium a povol **oznámení** (bez nich se o nové verzi nedozvíš).
3. Dole záložka **Add App**, do políčka **App Source URL** vlož `https://github.com/dt-appdev/workout-denik`
   a klepni na **Add**. Ostatní volby nech (**Include prereleases** nezapínej).
4. **Install**. Android se zeptá, jestli smí instalovat Obtainium: povolit stejně jako u Chromu.
5. Na ploše přibude **Workout deník** s červenou ikonou.

### Testovací APK v Obtainiu (F6-08, jednou)

1. V Obtainiu **Add App**, do **App Source URL** vlož `https://github.com/dt-appdev/workout-denik-test` → **Add**
   → **Install**.
2. Na ploše přibude **WD TEST** s oranžovou ikonou (vedle hlavní appky, data má vlastní).
3. Po pushi do kteréhokoli PR (asi 5 minut, odkaz přijde i do komentáře v PR) otevři Obtainium, stáhni seznam
   tahem prstem dolů a u WD TEST klepni na **Update** → **Instalovat**. Ze kterého PR je, ukáže pruh TEST nahoře
   v appce.
4. Kdyby Obtainium hlásilo, že nepozná verzi (nabízí stále stejnou aktualizaci): u appky v Obtainiu ozubené kolo →
   vypnout **Version detection**. Název verze APK je od F6-08 stejný jako název vydání (`vN`, `tN`), takže by to
   nemělo být potřeba.

### Aktualizace

Každé sloučení do `main` vydá novou verzi. Obtainium ji samo najde (kontroluje zhruba po několika hodinách)
a pošle oznámení. Klepni na něj (nebo v Obtainiu u appky **Update**) → **Instalovat**. Hned to zkontroluješ tahem
prstem dolů na seznamu aplikací v Obtainiu.

### Konec pauzy (F6-02)

Konec pauzy hlásí oznámení Androidu naplánované na přesný čas, i se zamčeným displejem a bez internetu. Jednou
po instalaci (i u každého testovacího APK):

1. Při první pauze povol **oznámení** (Android se zeptá sám).
2. Hned potom appka nabídne panel **Přesný čas oznámení** → **Povolit**. Otevře se nastavení Androidu
   **Budíky a připomenutí**, zapni vypínač a vrať se. Bez toho oznámení přijde, ale třeba o minuty později.
   Když dáš Teď ne, najdeš tlačítko Povolit v Nastavení → Trénink → Odpočinek mezi sériemi.
3. Vyzkoušej: **Vyzkoušet**, zamkni displej a počkej 10 s.

Když oznámení chodí pozdě nebo vůbec:

- Nastavení Androidu → Aplikace → Workout deník → **Baterie** → **Neomezeno** (Samsung jinak málo používané
  aplikace uspává).
- Tichý režim a Nerušit oznámení ztlumí. Zvuk a vibraci jde doladit v Nastavení Androidu → Aplikace → Workout
  deník → Oznámení (tři kategorie „Konec pauzy“ podle volby Na konci pauzy v appce).
- Hodinky: v telefonu **Galaxy Wearable** → Nastavení hodinek → Oznámení → zapnout **Workout deník**. Hodinky
  oznámení zopakují hlavně tehdy, když telefon zrovna nepoužíváš.

### Záloha se zálohou telefonu (F6-03)

Appka po každé změně dat zapíše zálohu (bez fotek) do jednoho souboru uvnitř appky a Android ho zhruba jednou
denně při nabíjení a na Wi-Fi nahraje do zálohy telefonu v Google One. Data zabudovaného prohlížeče se nezálohují
(pravidla `android/app/src/main/res/xml/zaloha_pravidla.xml`, Android 12 a novější). Stav ukazuje Nastavení →
Data a záloha → Záloha telefonu.

- Zapnutí: Nastavení Androidu → Google → Zálohování → Záloha Googlem zapnutá.
- Hned zálohovat: tamtéž **Zálohovat nyní** (jinak až v noci u nabíječky).
- Obnova: při instalaci appky (nový telefon, přeinstalace) Android soubor vrátí. Prázdná appka pak sama
  nabídne obnovu, jinak Nastavení → Data a záloha → Záloha telefonu → Obnovit ze zálohy telefonu.
- Vymazat data aplikace v Androidu smaže i soubor; kopie v Google One se vrátí jen odinstalováním
  a novou instalací.
- Fotky u cviků v ní nejsou, ty ochrání jen ruční záloha s fotkami.

### Na co pozor

- Do nativní appky nic skutečného nezapisuj před dnem přechodu (sekce Přechod níže), data by byla ve dvou appkách.
- Ztráta klíče (`workout-denik-klic.jks` a heslo) = Obtainium další verzi nenainstaluje, jen odinstalovat
  a obnovit ze zálohy.
- Google chystá od roku 2027 ověření vývojářů i pro aplikace mimo Obchod Play. Pak bude potřeba jednou
  zaregistrovat bezplatný účet pro koníčkáře (do 20 zařízení), jinak by Android instalaci odmítl.

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
