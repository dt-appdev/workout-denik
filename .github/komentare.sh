#!/usr/bin/env bash
# Komentář s odkazem na testovací verzi v každém nasazeném PR (F0-04).
# Jeden komentář na PR (značka <!-- testovaci-verze -->), při změně se jen upraví.
# Použití: komentare.sh <složka testovacího webu>
# Proměnné: GH_TOKEN, REPO (vlastník/repo), TEST_URL, OK (true = nahráno do testovacího repa),
#           EVENT_PR (číslo PR, kvůli kterému workflow běží; prázdné = jiná událost)
set -euo pipefail
DIR=${1:?Použití: komentare.sh <složka>}
MARK="<!-- testovaci-verze -->"

# vytvořit nebo upravit komentář v PR $1 s textem $2
upsert() {
  local body="$MARK
$2" id old
  id=$(gh api "repos/$REPO/issues/$1/comments" --paginate --jq ".[] | select(.body | startswith(\"$MARK\")) | .id" | head -n1 || true)
  if [ -z "$id" ]; then
    gh api -X POST "repos/$REPO/issues/$1/comments" -f body="$body" > /dev/null
  else
    old=$(gh api "repos/$REPO/issues/comments/$id" --jq .body)
    [ "$old" = "$body" ] || gh api -X PATCH "repos/$REPO/issues/comments/$id" -f body="$body" > /dev/null
  fi
}

if [ "${OK:-}" != true ]; then
  [ -z "${EVENT_PR:-}" ] || upsert "$EVENT_PR" "**Testovací verze tohoto PR se nenasadila:** chybí nastavení repa \`workout-denik-test\` (secret \`TEST_REPO_TOKEN\`), návod je v README."
  exit 0
fi

for f in "$DIR"/pr-*/js/verze.js; do
  [ -f "$f" ] || continue
  b=$(sed -n 's/^self\.APP_BUILD=\(.*\);$/\1/p' "$f")
  n=$(jq -r .pr <<<"$b")
  kdy=$(TZ=Europe/Prague date -d "$(jq -r .cas <<<"$b")" +'%-d. %-m. %Y %H:%M')
  upsert "$n" "**Testovací verze tohoto PR:** ${TEST_URL%/}/pr-$n/

Otevři odkaz v Chromu v telefonu. V Nastavení → Verze aplikace musí být kód změny \`$(jq -r .commit <<<"$b")\` (nasazeno $kdy).
Testovací verze má vlastní data, oddělená od vydané verze. Skutečná data si do ní zkopíruješ v Nastavení → Verze aplikace → Zkopírovat data z vydané verze.
Jako samostatnou appku (oranžová ikona TEST) ji nainstaluješ přes menu Chromu ⋮ → Přidat na plochu → Instalovat.

Po každé další změně v PR se testovací verze sama aktualizuje (trvá to 1–3 minuty)."
done

if [ -n "${EVENT_PR:-}" ] && [ ! -d "$DIR/pr-$EVENT_PR" ]; then
  upsert "$EVENT_PR" "**Testovací verze tohoto PR se nenasadila:** větev ještě nemá změny z F0-04 (chybí \`js/verze.js\`). Po sloučení aktuálního \`main\` do větve se nasadí sama."
fi
