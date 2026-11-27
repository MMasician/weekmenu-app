# ADR-022: Modulaire bronstructuur met mini-bundler (vervangt ADR-001)

## Status
Geaccepteerd (2026-11-27) — vervangt ADR-001

## Context
`src/App.jsx` was gegroeid naar > 4000 regels (één bestand met data, state, logica en UI).
Dat is belemmerend voor context en schrijflimieten bij doorontwikkelen. Tegelijkertijd
moet de app zonder npm-build-pipeline blijven werken (ADR-007): React komt uit
`vendor/`, de app wordt als classic script geladen en `src/app.js` wordt meegecommit
met een CI-sync-check (ADR-011).

## Besluit
De bron is modulair opgedeeld in ES-modules onder `src/`, gebundeld door een
uitgebreide `tools/jsx-transform.cjs` (mini-bundler) naar één classic script
`src/app.js`:

```
src/
  App.jsx            — compositieroot: tabbalk + aanroep van de tab-views
  state/store.js     — useAppStore(): alle useState/useMemo/useEffect + acties (één hook)
  domain/            — pure logica, geen DOM/React: settings, stock, recipes, catalog,
                       dates, storage, share, menu
  ui/                — render-functies per tab/sheet (menuTab, recipesTab, stockTab,
                       shoppingTab, settingsTab, components, labels) als plain-functie-
                       aanroepen (geen <Component/>), zodat de test-harness de boom kan
                       uitvouwen; alle hooks blijven in useAppStore
  i18n/              — GUI-teksten per taal (nl/en/fr/de) + t()/setLanguage (ADR-023)
  lib/externals.js   — PN/TT/GF (UMD-modules die via index.html als globale worden geladen)
  productNormalisatie.js / timetags.js / gerechtFotos.js — ongewijzigde UMD-modules
```

- **Bundler** (`tools/jsx-transform.cjs <entry> <output>`): crawlt relative imports
  vanuit het entry-bestand, herschrijft `import`/`export` naar een kleine
  module-registry (`__modules`/`__load`) en past de bestaande JSX-transform toe op
  `.jsx`-bestanden. JSX-teksten en tekst-attributen (`title`/`placeholder`/`aria-label`/`alt`)
  worden automatisch gewikkeld in `__t("...")` (zie ADR-023). `import ... from "react"`
  wordt de globale `React` (vendor). Output: `src/app.js` met `globalThis.App`.
- **Build/CI ongewijzigd**: `npm run build` = `node tools/jsx-transform.cjs src/App.jsx src/app.js`;
  `src/app.js` wordt meegecommit en CI controleert `git diff --exit-code src/app.js` (ADR-011).
- **Test-harness ongewijzigd**: laadt de UMD-modules in de sandbox en wrappert
  `src/app.js`; de bundle zet `globalThis.App` (en `globalThis.__weekmenuModules`
  voor tests die pure domain-functies benaderen, zie tools/test-delen-bestand.cjs).
- **Render-functies, geen componenten**: tab-views zijn plain-functie-aanroepen
  (`renderMenuTab()`), aangemaakt via factory-functies (`createMenuTab(ctx)`) die de
  potige state destructuren uit `ctx`. Zo kan de harness (fake `createElement`)
  de hele boom uitvouwen zonder component-rendering.

## Gevolgen
+ Functionaliteit, state, GUI en taal zijn gescheiden in lagen; elk bestand is klein
  en gericht aan te passen.
+ Geen nieuwe runtime-afhankelijkheden; build/test/CI en PWA blijven zoals ze waren.
+ De bundler is eigen code (~100 regels); import/export moeten per regel bovenaan
  staan (regel-gebaseerde herschrijving).
- `src/app.js` is gegenereerd en groter geworden (modules + registry), maar nog
  steeds één bestand.
