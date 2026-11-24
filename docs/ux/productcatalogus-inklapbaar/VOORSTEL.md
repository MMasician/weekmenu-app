# UX-voorstel: productcatalogus uitklapbaar en alfabetisch gesorteerd (issue #44)

**Status: ronde 2 — feedback eigenaar verwerkt (issue #44), label `needs-review`.**

## Aanleiding (wens uit issue #44)

De instellingen moeten compact en makkelijk in gebruik zijn. De **productcatalogus** op de
Instellingen-tab is nu **altijd volledig uitgeklapt** en de lijst (nu in invoervolgorde) is heel lang
en onoverzichtelijk. Net als de voorraad-locaties (ADR-015: "uitklapbaar en starten ingeklapt")
moet de catalogus **initieel ingeklapt** zijn; bij uitklappen staan de producten **alfabetisch**
(A–Z, nl).

## Gedeelde regels (ter vastlegging bij goedkeuring)

- **Ingeklapt (scherm 1)**: sectie "Productcatalogus" toont alleen een header met teller en
  klap-pijl (▸); de lijst en het zoekveld zijn verborgen. Klap-state is **vluchtig** (per sessie,
  niet opgeslagen — idem als `openLocs` bij voorraad-locaties).
- **Uitgeklapt (scherm 2)**: zoekveld + lijst, **gesorteerd alfabetisch** op `name`
  (`localeCompare(..., "nl")`; ties op cat). De bestaande teller "n van N producten" blijft
  (bij zoekopdracht: gefilterde lijst, nog steeds A–Z). Sorteer-toggle A–Z/categorie is versie C
  (default A–Z volgens het issue).
- Product-kaart via prodlink en verwijderen via ✕ blijven ongewijzigd werken vanuit de lijst.
- Mock-data generiek; geen household-specifieke context (ADR-010). SVG-mocks 390×844 in eigen
  huisstijl. Overlap met #35 (product-kaart) en #42: mocks in deze batch op elkaar afgestemd.

## Schermen (2 schermen × 3 versies)

### 1. Catalogus-sectie ingeklapt (initieel)
- `01-ingeklapt-versie-A-header-klap.svg` — **A**: header "Productcatalogus · 128 producten ▸"
- `02-ingeklapt-versie-B-zoekveld-zichtbaar.svg` — **B**: zoekveld altijd zichtbaar, lijst via "▸ Toon alle 128 producten (A–Z)"
- `03-ingeklapt-versie-C-accordion.svg` — **C**: catalogus als accordion-rij tussen de andere secties (📦 Productcatalogus · 128 ▸)

### 2. Catalogus-sectie uitgeklapt, alfabetisch
- `04-uitgeklapt-versie-A-puur-az.svg` — **A**: puur A–Z-lijst met zoekveld bovenaan
- `05-uitgeklapt-versie-B-az-zoekveld-teller.svg` — **B**: A–Z + zoekveld + teller "n van N · A–Z"
- `06-uitgeklapt-versie-C-sorteer-toggle.svg` — **C**: sorteer-toggle (A–Z default / Categorie) boven de lijst

## Na goedkeuring (implementatie, zelfde branch/PR)

`docs/SPECS.md` (Productcatalogus) bijwerken; tests in `tools/test-instellingen.cjs` (klap-state,
A–Z-sortering, teller, lege state); implementatie in `src/App.jsx` (Instellingen-tab: `catOpen`-state,
`filteredProducts` sorteren), `npm run build`, `npm run verify` groen, CI groen (ADR-014), cache-bump.

## Ronde 2 (feedback eigenaar, 2026-11-24)

- **Scherm 1 (ingeklapt): versie C gekozen** — accordion-rij "📦 Productcatalogus · 128 ▸" is het simpelst (`03-ingeklapt-versie-C-accordion.svg`).
- **Scherm 2 (uitgeklapt)**: elementen van B en C zijn beide goed; additionally **2 nieuwe mocks** die tekst-zoeken en categorie-filter elegant combineren:
  - `07-uitgeklapt-versie-D-zoekveld-categoriechips.svg` — **D**: zoekveld + inline categorie-chips (multi-select) boven de A–Z-lijst.
  - `08-uitgeklapt-versie-E-zoekveld-filtersheet.svg` — **E**: zoekveld + "⚙ Categorieën ▾"-knop → filter-sheet met categorie multi-select (zelfde patroon als de recepten-tab) + "Toon n producten".
- Blijft leidend: uitgeklapt is de lijst **alfabetisch A–Z** (nl), klap-state vluchtig.
