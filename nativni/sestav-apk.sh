#!/usr/bin/env bash
# Sestaví APK nativní appky (F6-01). Spouští ho GitHub Actions (.github/workflows/apk.yml), lokálně jen
# s Android SDK a JDK 21 (Android Studio není potřeba). Postup a nastavení v nativni/README.md.
#   bash nativni/sestav-apk.sh vydana     APK „Workout deník“ (cz.workoutdenik.app)
#   bash nativni/sestav-apk.sh test N     testovací APK „WD TEST #N“ pro PR č. N (cz.workoutdenik.test)
# Proměnné prostředí:
#   WD_VERSION_CODE   číslo verze pro Android (musí růst, GitHub Actions dává číslo běhu), výchozí 1
#   NAZEV, VETEV      název a větev PR (zobrazí se v testovacím APK)
#   WD_KEYSTORE_B64   klíč k podpisu (soubor .jks v base64), WD_KEYSTORE_PASSWORD heslo, WD_KEY_ALIAS alias;
#                     bez klíče vznikne nepodepsané APK (nejde nainstalovat, jen kontrola sestavení)
# Výsledek: nativni/out/workout-denik[-test-prN].apk
# Kód appky se nemění: do nativni/www se zkopírují soubory webu z aktuálního commitu (bez .github, docs,
# tools, nativni …), přepíše se js/verze.js (kanál nativni / nativni-pr) a Capacitor je vloží do APK.
# Testovací sestavení mění jen pracovní kopii (název, barvu ikony), nic se necommituje.
set -euo pipefail

MODE=${1:-}
PR=${2:-0}
if [ "$MODE" != vydana ] && [ "$MODE" != test ]; then
  echo "Použití: sestav-apk.sh vydana | test <číslo PR>" >&2
  exit 2
fi
ROOT=$(git rev-parse --show-toplevel)
N="$ROOT/nativni"
cd "$N"

# 1) soubory webu z aktuálního commitu (stejný výběr jako web na GitHub Pages, .github/sestav-web.sh)
rm -rf www out
mkdir -p www out
git -C "$ROOT" archive HEAD | tar -x -C www
rm -rf www/.github www/docs www/puvodni www/tools www/nativni www/.gitignore www/.ignore \
  www/.git-blame-ignore-revs www/.nojekyll www/*.md www/*.png

# 2) údaje o verzi (js/verze.js), kanál nativni = vydané APK, nativni-pr = testovací APK
SHA=$(git -C "$ROOT" rev-parse --short=7 HEAD)
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if [ "$MODE" = test ]; then
  BUILD=$(jq -nc --arg c "$SHA" --arg t "$NOW" --arg p "$PR" --arg n "${NAZEV:-}" --arg v "${VETEV:-}" \
    '{kanal:"nativni-pr",pr:($p|tonumber),nazev:$n,vetev:$v,commit:$c,cas:$t}')
else
  BUILD=$(jq -nc --arg c "$SHA" --arg t "$NOW" '{kanal:"nativni",pr:0,nazev:"",vetev:"main",commit:$c,cas:$t}')
fi
printf '/* Údaje o verzi appky, vygenerováno při sestavení APK (nativni/sestav-apk.sh). */\nself.APP_BUILD=%s;\n' \
  "$BUILD" > www/js/verze.js

# 3) testovací APK: jiný název, oranžová ikona, ladění přes chrome://inspect (jen pracovní kopie)
if [ "$MODE" = test ]; then
  export WD_TEST=1
  sed -i "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">WD TEST #$PR</string>|" \
    android/app/src/main/res/values/strings.xml
  sed -i "s|<string name=\"title_activity_main\">.*</string>|<string name=\"title_activity_main\">WD TEST #$PR</string>|" \
    android/app/src/main/res/values/strings.xml
  sed -i 's|<color name="ic_launcher_background">#CF3A31</color>|<color name="ic_launcher_background">#F59F00</color>|' \
    android/app/src/main/res/values/ic_launcher_background.xml
  jq '.android.webContentsDebuggingEnabled = true' capacitor.config.json > capacitor.tmp
  mv capacitor.tmp capacitor.config.json
fi

# 4) Capacitor: soubory webu a doplňky do projektu pro Android
npm ci --no-audit --no-fund
npx cap sync android

# 5) klíč k podpisu ze secretu (soubor jen v dočasné složce běhu)
if [ -n "${WD_KEYSTORE_B64:-}" ]; then
  KS=$(mktemp -d)/klic.jks
  printf '%s' "$WD_KEYSTORE_B64" | base64 -d > "$KS"
  export WD_KEYSTORE="$KS"
else
  echo "::warning::Chybí klíč k podpisu (secret WD_KEYSTORE_B64), APK nepůjde nainstalovat."
fi
export WD_VERSION_CODE=${WD_VERSION_CODE:-1}
export WD_VERSION_NAME="$SHA"

# 6) sestavení
(cd android && ./gradlew --no-daemon assembleRelease)
APK=android/app/build/outputs/apk/release/app-release.apk
[ -f "$APK" ] || APK=android/app/build/outputs/apk/release/app-release-unsigned.apk
NAME=workout-denik
[ "$MODE" = test ] && NAME="workout-denik-test-pr$PR"
cp "$APK" "out/$NAME.apk"
echo "APK: nativni/out/$NAME.apk (verze $WD_VERSION_CODE, $SHA)"
