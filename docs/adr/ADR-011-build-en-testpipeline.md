# ADR-011: Vastgelegde build- en testpipeline (geen ad-hoc scripts)

## Status
Accepted (2026-11-16)

## Context
De JSX-compile gebeurde eerder ad-hoc, wat tot een wit scherm leidde doordat `src/app.js` niet synchroon was met `src/App.jsx`. Ook maakten agents losse testscripts met harde paden (`/home/user/weekmenu-app/...`) die alleen op één machine werkten.

## Besluit
1. **`package.json` met vaste commando's**: `npm run build` = `node tools/jsx-transform.cjs src/App.jsx src/app.js` (bundelt `src/**`); `npm test` = `node tools/run-tests.cjs`; `npm run verify` = build + test. Geen dependencies, alleen de Node-standaardbibliotheek.
2. **Tests**: alle functionaliteit uit SPECS.md moet gedekt zijn door automatische tests in `tools/test-*.cjs`, gedraaid via `tools/run-tests.cjs` (elke test in een eigen proces; exit-codes worden samengevat). Tests draaien tegen de gecompileerde `src/app.js` via `tools/render-harness.cjs`.
3. **`src/app.js` wordt meegecommit en CI controleert synchroniteit**: de CI-workflow hieronder wordt geplaatst als `.github/workflows/test.yml` (opmerking: aanmaken van bestanden onder `.github/workflows/` vereist een token met `workflow`-scope) en draait bij elke push/PR: `npm run build`, `git diff --exit-code src/app.js`, `npm test`.

   ```yaml
   name: build-and-test
   on:
     push:
     pull_request:
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - name: Build (src/App.jsx -> src/app.js)
           run: npm run build
         - name: Controleer dat src/app.js synchroon is met src/App.jsx
           run: git diff --exit-code src/app.js
         - name: Tests
           run: npm test
   ```

4. **Geen ad-hoc scripts**: agents mogen geen tijdelijke build/test-scripts aanmaken; ze breiden `tools/test-*.cjs` uit met relatieve paden (`path.join(__dirname, "..")`). Oude absolute paden worden door `tools/legacy-path-shim.cjs` (geladen via `node --require` door de runner) naar de repo-root gemapt.
5. **Bron is modulair** (ADR-022): `src/` bevat ES-modules; `tools/jsx-transform.cjs` bundelt ze naar het enige gecompileerde bestand `src/app.js` (entry: `src/App.jsx`).

## Gevolgen
+ Eén commando om te builden en één om te testen, op elke machine en in CI.
+ Geen drift meer tussen bron en gecompileerde app (geen "wit scherm"-situaties).
- Iets meer repo-structuur (package.json, tools/, CI-workflow) — acceptabel binnen ADR-007 (nog steeds geen zware build-pipeline).
