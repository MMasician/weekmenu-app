# ADR-020: Coverage (c8) en SonarCloud in de CI-straat

## Status
Voorgesteld (2026-11-24)

## Context
De CI-straat dekte tot nu toe build + tests, lint, typecheck, lockfile-integriteit, dependency-audit en security-scans (ADR-011, ADR-014), maar gaf geen inzicht in code coverage, codekwaliteit over tijd en complexiteit. De tests draaien via een custom runner (`tools/run-tests.cjs`) tegen de gecompileerde `src/app.js`; de render-harness laadde die via `new Function(...)`, waardoor V8-coverage de code niet aan het bestand koppelt (anoniem script). Voor een public repo is SonarCloud (SaaS, gratis voor public repos) de logische Sonar-variant; een zelf-gehoste SonarQube-server is daarvoor overkill.

## Besluit
1. **c8 als devDependency** (alleen tooling, runtime blijft dependency-vrij volgens ADR-007) met script `npm run test:coverage` = `c8 --no-all --reporter=lcov --reporter=text --reporter=text-summary --reports-dir=coverage npm test`. De runner geeft `process.env` door aan de test-processen, dus `NODE_V8_COVERAGE` propagate automatisch naar alle children. `coverage/` staat in `.gitignore`.
2. **npm `overrides` voor `glob` (^14.0.6) en `minimatch` (^11.0.8)**: de tree van c8@12 (via test-exclude) bevatte anders kwetsbare glob/minimatch-versies, waardoor `npm audit --audit-level=moderate` in `quality.yml` zou falen.
3. **`tools/render-harness.cjs` laadt `src/app.js` via `vm.runInNewContext(wrapped, {}, { filename: file })`** in plaats van `new Function(...)`. De wrapper is dan één script met bestandsnaam, waardoor c8/V8-coverage de dekking aan `src/app.js` toeschrijft. Gedrag van de harness is anders identiek.
4. **`test.yml`**: voegt `npm ci` toe (c8 is een devDependency; zonder install faalt de test-stap met `c8: not found`) en draait de test-stap voortaan via `npm run test:coverage` (build + sync-check ongewijzigd, ADR-011). De coverage-tabel staat in het CI-log.
5. **Nieuw `.github/workflows/sonarcloud.yml`** (push + PR, least-privilege `contents: read` + `pull-requests: write` voor PR-decoratie, concurrency-groep zoals de andere workflows): checkout met `fetch-depth: 0` (blame/PR-decoratie), `npm ci`, `npm run test:coverage` (genereert `coverage/lcov.info`), daarna `SonarSource/sonarcloud-github-action@v5` met `SONAR_TOKEN` uit repo-secrets.
6. **`sonar-project.properties`**: `sonar.sources=src,sw.js` en `sonar.tests=tools` (disjoint — overlap geeft "can't be indexed twice"), met `sonar.exclusions=src/App.jsx,src/domain/**,src/state/**,src/ui/**,src/i18n/**,src/lib/**,vendor/**,studio/**,...`. De app-code die SonarCloud analyseert is de gecompileerde `src/app.js` (die de tests raken, dus coverage koppelt correct); de ESM-bronnen onder `src/` (ADR-022) zijn build-input ervan en worden al door ESLint + `tsc --checkJs` gedekt. `studio/` (aparte Python-monorepo) en `vendor/` worden niet meegenomen. Coverage via `sonar.javascript.lcov.reportPaths=coverage/lcov.info`.
7. **SonarCloud-project + `SONAR_TOKEN` secret** moeten eenmalig worden eingerichtet (project aanmaken op sonarcloud.io onder organisatie `mmasician`, key `MMasician_weekmenu-app`, GitHub-binding via de SonarCloud-app, token als repo-secret). Tot dan faalt de `sonarcloud`-check — dat is het signaal om de setup te doen.

## Gevolgen
+ Per push/PR: coverage-% in het CI-log (`test.yml`) en op SonarCloud coverage, quality gate, code smells, reliability/security-hotspots, duplicatie en cognitive/cyclomatische complexiteit per functie, met PR-decoratie en historie/trends.
+ Test-vs-code-ratio is bewust geen aparte metric (zwak signaal zonder context); dekkingsgaten zijn wel zichtbaar per bestand/functie.
+ `npm run test:coverage` draait ook lokaal; `npm run verify` blijft ongewijzigd (build + plain tests).
- Eenmalige setup: SonarCloud-project + `SONAR_TOKEN` secret; c8 voegt dev-only tooling toe (incl. overrides) zonder runtime-impact.
