# UX-voorstel: woord "categorie" weglaten in de voorraadtab (issue #36)

**Status: ronde 1 — ter review door de eigenaar (label `needs-review`). Nog niet geïmplementeerd.**

## Aanleiding (wens uit issue #36)

De voorraadtab moet zo compact maar compleet mogelijk zijn. Nu toont elke productrij de
subtekst `categorie: <cat>` (`renderStockTab` in `src/App.jsx`, ADR-015) — het woord
"categorie" wordt bij élke rij herhaald en voegt weinig toe zodra een categorie getoond wordt.

Wens: het woord "categorie" hoeft niet getoond te worden als een categorie getoond wordt.

## Gedeelde regels (ter vastlegging bij goedkeuring)

- Alleen de **weergave** in de productrij van de voorraadtab wijzigt; de categorie zelf blijft
  per huishouden instelbaar (ADR-009/ADR-015) en blijft overal elders zichtbaar waar nodig.
- Formulier-labels "Categorie" (recept bewerken/toevoegen, product-kaart, categorieën beheren ⚙️)
  blijven ongewijzigd — daar is het label wél nodig.
- De boodschappenlijst toont sowieso geen categorietekst (ADR-016); daar wijzigt niets.
- Alles lokaal, geen externe assets (ADR-010). SVG-mocks 390×844 in eigen huisstijl.

## Schermen (1 scherm × 3 versies)

### 1. Voorraadtab: productrij in een uitgeklapte locatie (Koelkast: Melk / Yoghurt / Kaas)
- `01-productrij-versie-A-kale-subtekst.svg` — **A**: categorie als kale subtekst onder de
  productnaam (`zuivel`), zonder het woord "categorie" ervoor
- `02-productrij-versie-B-categorie-chip.svg` — **B**: categorie als chip rechts op de rij
  (zelfde look als de winkel-chip), geen subtekst
- `03-productrij-versie-C-alleen-in-productkaart.svg` — **C**: geen categorie in de rij;
  wel nog zichtbaar in de product-kaart (klik op de productnaam)

## Na goedkeuring (implementatie, zelfde branch/PR)

- `docs/SPECS.md` (sectie Voorraad, ADR-015) bijwerken: productrij toont de gekozen weergave.
- Tests in `tools/test-voorraad-locaties.cjs`: productrij bevat de categorie zonder het woord
  "categorie" (volgens de gekozen versie); fallback `overig` idem.
- Implementatie in `src/App.jsx` (`renderStockTab`, ~1 regel) + evt. kleine CSS in `styles.css`;
  `npm run build` (`src/app.js` synchroon), `npm run verify` groen, CI groen (ADR-014),
  cache-bump (`CACHE_VERSION` + `?v=` in `index.html`).
- Gekoppeld in deze sessie: #41 (tabicoontjes) en #40 (thema's) — branch `vibe/issues-36-41-40-26a2f9`.

## Open vragen / knopen om door te hakken

- Welke versie: kale subtekst (A), chip (B) of helemaal weg uit de rij (C)?
- Moet bij versie C een subtiele hint blijven (bijv. titel/tooltip "categorie: zuivel" op de rij)?
