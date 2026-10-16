#!/usr/bin/env bash
# Kontrola přístupu k úložišti (F0-18), spouští ji úloha „kontrola“ v GitHub Actions (nasazeni.yml).
# Testovací verze PR běží na stejné doméně jako vydaná verze, takže chyba v kódu by mohla přepsat skutečná data
# v telefonu. Data se proto smí ukládat jen přes Local / Idb / Store (CLAUDE.md). Skript najde v js/*.js a sw.js
# přímý přístup k úložišti a odmítne ho mimo schválená místa (POVOLENO). Místo = nejbližší definice na nejvyšší
# úrovni appky (řádek s odsazením 2 mezery: „  function x(“, „  async function x(“, „  const x =“).
# Komentáře se nekontrolují. Nové schválené místo přidat do POVOLENO jen s dobrým důvodem (a do popisu
# sekce POJISTKA DAT VYDANÉ VERZE v js/app.js).
# Použití: bash .github/kontrola-uloziste.sh   (z kořene repa; konec s kódem 1 = nález)
set -euo pipefail

# přímý přístup k úložišti a názvy úložiště vydané verze
VZOR='indexedDB\.open\(|deleteDatabase\(|localStorage\.(setItem|removeItem|clear)|localStorage\[|localStorage\.[A-Za-z_$]+ *=[^=]|Storage\.prototype|IDBFactory|IDBDatabase\.prototype|MAIN_(DB|P)([^A-Za-z0-9_]|$)'
# schválená místa: definice úložiště (Local, Idb, názvy), pojistka F0-18, data testovacích verzí (F0-04)
POVOLENO=' MAIN_P Local Idb idbOpenExisting guardInstall guardInit testKeys testDbs scanTestData deleteTestData copyFromMain '

FILES=$(ls js/*.js sw.js | grep -vE '^js/(atlas|fedb|verze)\.js$')
# vzor přes prostředí (ENVIRON), ne -v: awk by v -v zpracoval zpětná lomítka
found=$(VZOR=$VZOR POVOLENO=$POVOLENO awk '
  BEGIN { vzor = ENVIRON["VZOR"]; povoleno = ENVIRON["POVOLENO"] }
  FNR == 1 { place = "(začátek souboru)"; incomment = 0 }
  {
    line = $0
    # blokový komentář /* … */ přes víc řádků
    if (incomment) {
      if (index(line, "*/")) { incomment = 0 }
      next
    }
    if (line ~ /^[ \t]*\/\*/) {
      if (!index(line, "*/")) { incomment = 1 }
      next
    }
    if (line ~ /^[ \t]*\/\//) next
    sub(/[ \t]\/\/ .*$/, "", line) # komentář na konci řádku
    if (match(line, /^  (async )?function [A-Za-z0-9_$]+/)) {
      place = substr(line, RSTART, RLENGTH); sub(/^  (async )?function /, "", place)
    } else if (match(line, /^  (const|let) [A-Za-z0-9_$]+/)) {
      place = substr(line, RSTART, RLENGTH); sub(/^  (const|let) /, "", place)
    }
    if (line ~ vzor && index(povoleno, " " place " ") == 0) {
      printf "%s:%d (v %s): %s\n", FILENAME, FNR, place, $0
    }
  }' $FILES)

if [ -n "$found" ]; then
  echo "$found"
  echo "::error::Přímý přístup k úložišti mimo Local / Idb / Store (řádky výše, F0-18). Testovací verze by mohla" \
    "přepsat data vydané verze. Použij Local.get/set, Idb nebo Store (CLAUDE.md → Pravidla napříč funkcemi)."
  exit 1
fi
echo "Přístup k úložišti: v pořádku."
