#!/usr/bin/env bash
# Sestaví celý web pro GitHub Pages do složky $1 (F0-04):
#   kořen  = vydaná verze z větve main,
#   pr-N/  = testovací verze každého otevřeného PR (jen větve z tohoto repa, ne z forků).
# Do každé kopie zapíše js/verze.js (kanál, PR, větev, commit, čas nasazení).
# Testovací kopie dostane oranžové ikony (icons/test/) a název „Workout TEST #N".
#
# Čas nasazení se převezme z právě zveřejněného webu, pokud se commit dané kopie
# nezměnil. Jinak by každé nasazení (třeba jiného PR) změnilo verze.js všech kopií
# a appka v telefonu by se zbytečně aktualizovala.
#
# Potřebuje git, jq, curl a gh (s GH_TOKEN). Proměnné:
#   SITE_URL  adresa zveřejněného webu (např. https://dt-appdev.github.io/workout-denik/)
#   PR_JSON   seznam PR místo volání gh (pro zkoušku na počítači), formát jako
#             gh pr list --json number,title,headRefName,isCrossRepository
#   MAIN_REF  co nasadit jako vydanou verzi (výchozí: origin/main po stažení)
set -euo pipefail

OUT=${1:?Použití: sestav-web.sh <výstupní složka>}
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
rm -rf "$OUT"
mkdir -p "$OUT"

# čas nasazení: převzít ze zveřejněné kopie ($1 = podsložka "" nebo "pr-12/"), pokud má stejný commit ($2)
build_time() {
  local old=""
  if [ -n "${SITE_URL:-}" ]; then
    old=$(curl -fsS --max-time 20 "${SITE_URL%/}/$1js/verze.js" 2>/dev/null | sed -n 's/^self\.APP_BUILD=\(.*\);$/\1/p' || true)
  fi
  if [ -n "$old" ] && [ "$(jq -r '.commit // ""' <<<"$old" 2>/dev/null)" = "$2" ]; then
    jq -r .cas <<<"$old"
  else
    echo "$NOW"
  fi
}

# rozbalit commit $1 do složky $2 bez souborů, které na web nepatří
export_tree() {
  mkdir -p "$2"
  git archive "$1" | tar -x -C "$2"
  rm -rf "$2/.github" "$2/docs" "$2/puvodni" "$2"/*.md
}

# zapsat js/verze.js do kopie $1, údaje $2 (JSON na jeden řádek)
write_version() {
  printf '/* Údaje o verzi appky, vygenerováno při nasazení (.github/sestav-web.sh). */\nself.APP_BUILD=%s;\n' "$2" > "$1/js/verze.js"
}

# --- vydaná verze (main) ---
if [ -z "${MAIN_REF:-}" ]; then
  git fetch -q --no-tags --depth=1 origin main
  MAIN_REF=origin/main
fi
sha=$(git rev-parse --short=7 "$MAIN_REF")
export_tree "$MAIN_REF" "$OUT"
write_version "$OUT" "$(jq -nc --arg c "$sha" --arg t "$(build_time "" "$sha")" \
  '{kanal:"main",pr:0,nazev:"",vetev:"main",commit:$c,cas:$t}')"
echo "main: $sha"

# --- testovací verze otevřených PR ---
if [ -z "${PR_JSON:-}" ]; then
  PR_JSON=$(gh pr list --repo "${GITHUB_REPOSITORY:?}" --state open --limit 100 \
    --json number,title,headRefName,isCrossRepository)
fi
while read -r pr; do
  [ -n "$pr" ] || continue
  n=$(jq -r .number <<<"$pr")
  if ! git fetch -q --no-tags --depth=1 origin "refs/pull/$n/head"; then
    echo "PR $n: větev nejde stáhnout, přeskakuji"; continue
  fi
  # Starší větve bez F0-04 by sdílely data s vydanou verzí. Nasadit až po sloučení main do větve.
  if ! git cat-file -e FETCH_HEAD:js/verze.js 2>/dev/null; then
    echo "PR $n: větev nemá js/verze.js (chybí aktuální main), přeskakuji"; continue
  fi
  sha=$(git rev-parse --short=7 FETCH_HEAD)
  d="$OUT/pr-$n"
  export_tree FETCH_HEAD "$d"
  cp "$d"/icons/test/* "$d/icons/"
  jq --arg n "$n" '.name="Workout TEST #"+$n | .short_name="TEST #"+$n | .theme_color="#f59f00"' \
    "$d/manifest.webmanifest" > "$d/manifest.tmp" && mv "$d/manifest.tmp" "$d/manifest.webmanifest"
  write_version "$d" "$(jq -c --arg c "$sha" --arg t "$(build_time "pr-$n/" "$sha")" \
    '{kanal:"pr",pr:.number,nazev:.title,vetev:.headRefName,commit:$c,cas:$t}' <<<"$pr")"
  echo "pr-$n: $sha"
done < <(jq -c '.[] | select(.isCrossRepository | not)' <<<"$PR_JSON")
