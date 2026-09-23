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
   `https://dt-appdev.github.io/workout-denik-test/pr-<číslo PR>/`. Odkaz se
   objeví v komentáři v PR, přehled všech je na
   `https://dt-appdev.github.io/workout-denik-test/`. Testovací verze má oranžovou
   ikonu, oranžový pruh nahoře a vlastní data, oddělená od vydané verze.
   Jde nainstalovat jako samostatná appka vedle vydané.
3. Po sloučení do `main` se do pár minut nasadí nová vydaná verze. Appka
   v telefonu si ji sama stáhne při dalším otevření. Jakou verzi používáš,
   uvidíš v **Nastavení → Verze aplikace**.

Testovací verze jsou v samostatném repu `workout-denik-test`. Kdyby byly pod
adresou `…/workout-denik/`, Android by je bral jako součást nainstalované appky
a nedovolil by je nainstalovat zvlášť.

### Nastavení (jednou)

**Vydaná verze:** v repu `workout-denik` **Settings → Pages → Build and
deployment → Source: GitHub Actions**.

**Testovací verze:**

1. **Repo pro testovací verze.** Na GitHubu **+ → New repository**: Owner
   `dt-appdev`, název `workout-denik-test`, **Public**, zaškrtnout **Add a README
   file** → **Create repository**.
2. **Pages v novém repu.** V `workout-denik-test` **Settings → Pages → Build and
   deployment → Source: Deploy from a branch**, Branch **main**, složka
   **/ (root)** → **Save**.
3. **Token (klíč pro nahrávání).** Vpravo nahoře fotka profilu → **Settings →
   Developer settings → Personal access tokens → Fine-grained tokens →
   Generate new token**:
   - Token name: `workout-denik-test nasazení`
   - Expiration: **No expiration** (když chybí, nejdelší možná)
   - Repository access: **Only select repositories** → `workout-denik-test`
   - Permissions → Repository permissions → **Contents: Read and write**
   - **Generate token** a token (`github_pat_…`) zkopírovat. Ukáže se jen jednou,
     nikam jinam ho neposílej.
4. **Secret v hlavním repu.** V repu `workout-denik` **Settings → Secrets and
   variables → Actions → New repository secret**: Name `TEST_REPO_TOKEN`,
   Secret = vložený token → **Add secret**.

Když token vyprší nebo chybí, vydaná verze se nasazuje dál, jen testovací verze
ne (workflow v záložce Actions to ohlásí). Pak stačí vytvořit nový token
a v kroku 4 ho uložit znovu (Update secret).

Plán vývoje: [docs/plan-vyvoje.md](docs/plan-vyvoje.md). Kontext pro Claude Code: [CLAUDE.md](CLAUDE.md).
