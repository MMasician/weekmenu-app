# Weekmenu & Boodschappen

Installeerbare web-app (PWA) voor het plannen van een weekmenu en het automatisch genereren van een boodschappenlijst, inclusief voorraadbeheer en een prijsoverzicht per supermarkt (standaard Albert Heijn, Jumbo, Lidl — instelbaar).

De app is per huishouden instelbaar (weekstart, boodschappenmomenten, vis/vega/vlees-dagen, aantal eters, winkels) en werkt volledig lokaal en offline: alle gegevens (instellingen, recepten, voorraad, menu, afvinkjes, prijzen) blijven op je eigen apparaat in localStorage. Er is geen account en geen server; het ene huishouden ziet niets van het andere. Zie `docs/INTENT.md` en `docs/adr/ADR-009` / `ADR-010`.

## Gebruiken op je telefoon
- Zet de repo-bestanden op een webserver (of draai ze lokaal) en open de URL op je telefoon.
- Kies "Toevoegen aan beginscherm" / "Installeer" om de app te installeren. Na eerste gebruik werkt hij ook zonder internet.

## Ontwikkelen
- Bronbestand: `src/App.jsx` (enige app-bron, ADR-001). Gecompileerde versie: `src/app.js`.
- Build: `npm run build` — compileert `src/App.jsx` naar `src/app.js` via `tools/jsx-transform.cjs`. `src/app.js` wordt meegecommit; CI controleert dat beide synchroon zijn (ADR-011).
- Tests: `npm test` — draait alle automatische tests in `tools/test-*.cjs` via `tools/run-tests.cjs`. Elke functionaliteit in `docs/SPECS.md` moet gedekt zijn (zie `docs/TESTS.md`). Alles in één keer: `npm run verify`.
- Lint: `npm run lint` (ESLint, flat config in `eslint.config.mjs`, zie ADR-014). Typecheck: `npm run typecheck` (tsc `--checkJs` via `tsconfig.json` + `tsconfig.sw.json`).
- Maak geen losse build/test-scripts (ADR-011); breid `tools/test-*.cjs` uit met relatieve paden.
- CI (allemaal op elke push en pull request, zie ADR-014): `.github/workflows/test.yml` = build + sync-check + tests (ADR-011); `.github/workflows/quality.yml` = lint + typecheck + `npm ci` (lockfile-check) + `npm audit`; `.github/workflows/security.yml` = gitleaks secret-scan (push/PR) + dependency-review (alleen PR); CodeQL loopt via de default code scanning-setup van GitHub (check `CodeQL`). Dependencies lopen via `package-lock.json` (`npm ci`) en Dependabot (`.github/dependabot.yml`).

## Documentatie
- `docs/INTENT.md` — doel en principes
- `docs/SPECS.md` — functionaliteit per tab + schema van de per-huishouden instellingen
- `docs/TESTS.md` — testbeleid en checklist
- `docs/adr/` — ADR-001 t/m ADR-011
