# ADR-014: CI met codekwaliteits- en securitychecks (lint, typecheck, lockfile, secret-scan, CodeQL)

## Status
Geaccepteerd (2026-11-18)

## Context
CI was tot nu toe beperkt tot build + synchronisatiecheck + tests (ADR-011, `.github/workflows/test.yml`). Er was geen lint of typecheck, geen controle op de integriteit van dependencies (lockfile) en geen securitychecks. De app zelf heeft expres geen runtime-dependencies (ADR-007); tooling is daarom dev-only.

## Besluit
1. **devDependencies (alleen tooling; runtime blijft dependency-vrij)** in `package.json`: `eslint`, `eslint-plugin-react-hooks`, `globals`, `typescript`, `@types/node`, `@types/react`. `package-lock.json` wordt meegecommit ("locks": reproduceerbare installs).
2. **Lint**: `eslint.config.mjs` (flat config) + `npm run lint`. Regels: `eslint:recommended` + `react-hooks` (`rules-of-hooks` als error, `exhaustive-deps` als warning); lege `catch`-blocks toegestaan; `no-unused-vars` negeert `React` (JSX-factory), `_`-args en ongebruikte catch-params. Gegenereerde code (`src/app.js`) en `vendor/` worden niet gelint.
3. **Typecheck**: `npm run typecheck` = `tsc --noEmit --allowJs --checkJs` via `tsconfig.json` (src/App.jsx + tools/) en `tsconfig.sw.json` (sw.js met WebWorker-lib). De code blijft plain JS; types komen uit JSDoc + `@types/*`. Geen conversie naar TypeScript.
4. **Lockfile-integriteit**: CI installeert met `npm ci` (faalt als `package.json` en `package-lock.json` uit sync zijn). `.github/dependabot.yml` (npm + github-actions, wekelijks) houdt lockfile en action-versies actueel via PRs.
5. **Securitychecks**: `.github/workflows/security.yml` (gitleaks secret-scan; `dependency-review-action` met fail op severity >= moderate en weigering van GPL-3.0/AGPL-3.0-licenties), `.github/workflows/codeql.yml` (CodeQL `javascript` op push/PR naar main + wekelijks schema) en `npm audit --audit-level=moderate` in `quality.yml`.
6. **Workflows**: `test.yml` blijft ongewijzigd (ADR-011); nieuw zijn `quality.yml` (jobs lint, typecheck, audit) en `security.yml`, alle op `push` en `pull_request`, met least-privilege permissions (`contents: read`; CodeQL additionally `security-events: write`) en concurrency-groepen die verouderde runs cancelen.
7. **Branch protection** (repo-instelling, niet via bestanden in de repo): op `main` de status checks `build-and-test`, `code-quality/*`, `security/*` en `codeql` verplicht stellen vóór merge.

## Gevolgen
+ Elke push/PR wordt gevalideerd op build-sync, tests, lint, typecheck, lockfile-integriteit, dependency-kwetsbaarheden en secrets.
+ `npm run lint` en `npm run typecheck` draaien ook lokaal; samen met ADR-011-pipeline: `npm run verify && npm run lint && npm run typecheck`.
+ devDependencies vergroten `node_modules`, maar raken de runtime/PWA niet (alles wat de browser laadt staat in `vendor/` en `src/app.js`).
- Eenmalige opruiming in bestaande code (ongebruikte vars, Date-rekenwerk, null-narrowing in tests) om de checks groen te krijgen.
