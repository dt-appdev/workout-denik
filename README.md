# Workout deník

Osobní appka na zapisování tréninků ve fitku: tréninky, šablony, statistiky,
databáze cviků, časovač pauzy a tělesná měření. Funguje jako PWA – nainstaluje
se na plochu Androidu a běží i bez internetu.

Data se ukládají jen v telefonu (IndexedDB v Chromu), na žádný server se
neposílají. Zálohu uděláš v appce: **Nastavení → Záloha → Stáhnout zálohu**
(soubor JSON, který si ulož třeba na Google Disk).

Adresa appky: https://dt-appdev.github.io/workout-denik/

**[Návod k appce](docs/navod/README.md)** (s obrázky) · **[Co je nového](docs/release-notes.md)**

## Nasazení

Appka je čisté HTML/CSS/JavaScript bez build kroku. GitHub Pages ji servíruje
přímo z větve `main`:

1. Změny se dělají ve vlastní větvi a slučují přes pull request do `main`.
2. Při každé změně se zvýší `VERSION` v `sw.js`.
3. Po sloučení do `main` GitHub Pages do pár minut nasadí novou verzi.
   Appka v telefonu si ji sama stáhne při dalším otevření.

Zapnutí GitHub Pages: **Settings → Pages → Source: Deploy from a branch →
Branch: `main`, složka `/ (root)` → Save.**

Plán vývoje: [docs/plan-vyvoje.md](docs/plan-vyvoje.md). Kontext pro Claude Code: [CLAUDE.md](CLAUDE.md).
