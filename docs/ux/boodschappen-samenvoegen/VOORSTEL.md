# UX-voorstel: boodschappenlijst —zelfde product samenvoegen op 1 regel (issue #33)

**Status: ronde 1 — mocks ter review (label `needs-review` op issue #33).** Nog geen app-code in deze PR.

## Aanleiding (wens uit issue #33)

Producten komen nu vanuit recepten én voorraad apart op de boodschappenlijst, waardoor de lijst
langer is dan nodig en er meer vinkjes gezet moeten worden. Als het product hetzelfde is, moeten
de aantallen bij elkaar opgeteld worden op 1 regel: voor Boboti 1 appel halen + voorraad met
2 appels aanvullen → **"3 appels"** op de lijst.

## Gedeelde regels (ter vastlegging bij goedkeuring)

- Samenvoegen op **product** (`pid`, fallback `productKey` op de naam — ADR-017) **én gelijke eenheid**;
  eenheden eerst normaliseren (g↔kg, ml↔l via `convertAmount`); afwijkende eenheden (bijv. `200 g` + `1 stuk`) → aparte regels.
- Schaling per afwijkende eters (ADR-012) eerst per bronddag, daarna pas samenvoegen.
- Afvinken geldt voor de samengevoegde regel als geheel; de gerechtstatus ✅/❗ per dag in het weekmenu
  blijft werken op de onderliggende bronrijen. Teller in de tab telt samengevoegde regels.
- Regels "ingrediënten voor x" (#43) worden nooit samengevoegd. Categorie-sortering en supermarkt-filter
  blijven ongewijzigd (bepaald op het samengevoegde product).
- Mock-data is generiek (Boboti/Hutspot uit `BASE_RECIPES`, fictief tekort "appels (2 van 3)", extra "Chips");
  geen household-specifieke context in deze map (ADR-010). Mocks zijn SVG op 390×844 in de eigen huisstijl
  (geen Chromium in de sessie-omgeving — zelfde aanpak als `docs/ux/delen-bestand/`).

## Schermen (1 scherm × 3 versies)

### 1. Boodschappen-tab: platte lijst met samengevoegde productregels
Scenario: za 22-11 Boboti 🔒 (1 appel, 400 g kipgehakt, 1 blik gepelde tomaten), zo 23-11 Hutspot 🔒
(500 g aardappelen), voorraadtekort appels "(2 van 3)", extra artikel "Chips".
- `01-lijst-versie-A-plat-zonder-bronnote.svg` — **versie A**: plat; "3 appels" als enige appel-regel, zonder bron-note. Further rijen ongewijzigd.
- `02-lijst-versie-B-met-bronnote.svg` — **versie B**: samengevoegde regel met grijze bron-note erachter ("3 appels  boboti · voorraadtekort"); enkele-bron regels krijgen een korte note ("boboti").
- `03-lijst-versie-C-uitklapbare-bronrijen.svg` — **versie C**: samengevoegde regel uitklapbaar ("3 appels ▾") met sub-rijen per bron ("1 appel · za 22-11 · Boboti", "(2 van 3) appels · voorraadtekort").

## Na goedkeuring (implementatie, zelfde PR)

`docs/SPECS.md` (sectie Boodschappen) bijwerken, tests in `tools/test-boodschappen-lijst.cjs`
(merge op pid/productKey, eenheid-conversie, eters-schaling vóór merge, teller, gerechtstatus op bronrijen),
implementatie in `src/App.jsx` (`listRows`), `npm run build` (`src/app.js` synchroon), `npm run verify` groen,
CI groen (ADR-014), cache-bump (`CACHE_VERSION` in `sw.js` + `?v=` in `index.html`).
