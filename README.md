# Workout deník

Osobní appka na zapisování tréninků ve fitku: tréninky, šablony, statistiky,
databáze cviků, časovač pauzy a tělesná měření. Funguje jako PWA – nainstaluje
se na plochu Androidu a běží i bez internetu.

Data se ukládají jen v telefonu (IndexedDB v Chromu), na žádný server se
neposílají. Zálohu uděláš v appce: **Nastavení → Záloha → Stáhnout zálohu**
(soubor JSON, který si ulož třeba na Google Disk).

Adresa appky: https://dt-appdev.github.io/workout-denik/

## Nasazení

Appka je čisté HTML/CSS/JavaScript bez build kroku. Na GitHub Pages ji nasazuje
GitHub Actions (`.github/workflows/nasazeni.yml`):

1. Změny se dělají ve vlastní větvi a slučují přes pull request do `main`.
2. Každý otevřený PR má vlastní **testovací verzi** na adrese
   `https://dt-appdev.github.io/workout-denik/pr-<číslo PR>/`. Odkaz se objeví
   v komentáři v PR. Testovací verze má oranžovou ikonu, oranžový pruh nahoře
   a vlastní data, oddělená od vydané verze.
3. Po sloučení do `main` se do pár minut nasadí nová vydaná verze. Appka
   v telefonu si ji sama stáhne při dalším otevření. Jakou verzi používáš,
   uvidíš v **Nastavení → Verze aplikace**.

Nastavení GitHub Pages (jednou): **Settings → Pages → Build and deployment →
Source: GitHub Actions.**

Plán vývoje: [docs/plan-vyvoje.md](docs/plan-vyvoje.md). Kontext pro Claude Code: [CLAUDE.md](CLAUDE.md).
