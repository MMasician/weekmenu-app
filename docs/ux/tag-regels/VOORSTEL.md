# UX-voorstel: tags op producten + tag-regels voor het weekmenu (issue #37)

**Status: goedgekeurd in issue #37 — geïmplementeerd in deze PR.**

Goedkeuring (reactie in issue #37):
- **Scherm 1 (product-kaart): versie C**, maar met dezelfde look & feel als het tag-bewerken bij recepten (consistente app): `.tag`-chips met `.tagx` × + `.tagadd`-veld "＋ tag toevoegen…" met autocomplete (datalist) op bestaande product-tags + "+"-knop.
- **Scherm 2 (regels-sheet): versie A** — tag-regels inline in de regels-sheet (chip 🏷️/🍽️ + tag, stapper dagen 0–30, ✕; toevoegen via kind-select + tag-veld met datalist + stapper + ＋).

## Aanleiding (wens uit issue #37)

Regels op basis van product- en gerecht-tags: "niet binnen 3 dagen opnieuw een gerecht met een product
met tag *spinazie*" of "na een *stamppot* (gerecht-tag) niet binnen 5 dagen nogmaals stamppot". Nu kunnen
er geen tags aan **producten** toegekend worden en geen regels opgesteld worden. Bij gerechten bestaan tags
al (ADR-013), maar zijn er nog geen regels voor. **Blokkeert #42** (afwijking weekplan gebruikt product-tags).

## Gedeelde regels (ter vastlegging bij goedkeuring)

- **Product-tags**: `products[].tags: string[]` (ADR-017), lokaal; normaliseren (trim/lowercase); delen via bestand neemt ze mee (ADR-019).
- **Tag-regels**: `settings.tagRules: [{ kind: "product"|"recipe", tag, days }]` per huishouden (ADR-009), direct opgeslagen.
- **Generatie**: bij automatisch plannen worden tag-regels gecheckt tegen alle al geplande dagen (incl. gelockte, per datum over weekgrenzen heen) binnen `days` dagen; overtredende gerechten worden overgeslagen "waar mogelijk". Meerdere regels: strengste wint. Handmatig plannen wordt niet geblokkeerd.
- Mock-data generiek (product "Kipgehakt" met tags spinazie/ijzerhoudend; gerecht-tag "stamppot"); geen household-specifieke context (ADR-010). SVG-mocks 390×844 in eigen huisstijl.

## Schermen (2 schermen × 3 versies)

### 1. Product-kaart (inline via prodlink): tags toevoegen/verwijderen
- `01-productkaart-versie-A-tags-inline.svg` — **A**: "Tags"-label + chips met ✕ + veld "+ tag toevoegen…" inline in de kaart.
- `02-productkaart-versie-B-tags-blok-onderaan.svg` — **B**: tags als eigen blok onderaan de kaart (onder "n× gebruikt").
- `03-productkaart-versie-C-tags-met-suggesties.svg` — **C**: "+ tag"-veld met autocomplete-suggesties uit bestaande product-tags.

### 2. Regels-sheet (⚙️ onderaan weekmenu-tab): tag-regels beheren
- `04-regelsheet-versie-A-tagregels-inline.svg` — **A**: sectie "Tag-regels" inline: rijen (tag-chip + stapper dagen + ✕) + toevoegen-formulier (product/gerecht + tag + dagen + ＋).
- `05-regelsheet-versie-B-subsheet.svg` — **B**: knop "🏷 Tag-regels beheren (n) ▾" opent aparte sub-sheet met regels + formulier.
- `06-regelsheet-versie-C-tagregels-chips.svg` — **C**: compacte chips "🏷 spinazie · 3 dagen ✕" + dashed "＋ tag-regel toevoegen".

## Na goedkeuring (implementatie, zelfde PR)

`docs/SPECS.md` (Productcatalogus + Weekmenu + Instellingen) bijwerken, normalizers (`normalizeProducts`, settings), tests in `tools/test-producten-catalogus.cjs`, `tools/test-weekmenu-ux.cjs`, `tools/test-instellingen.cjs`, `tools/test-delen-bestand.cjs`, implementatie in `src/App.jsx` (product-kaart, regels-sheet, `generateMenu`), `npm run build` (`src/app.js` synchroon), `npm run verify` groen, CI groen (ADR-014), cache-bump (`CACHE_VERSION` + `?v=`).
