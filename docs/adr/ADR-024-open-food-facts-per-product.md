# ADR-024: Productgegevens via Open Food Facts (EAN, voedingswaarden, foto) — issue #48

## Status
Geaccepteerd (2026-11-28)

## Context
Producten in de catalogus (ADR-017) hebben nu alleen een korte `name`, categorie, eenheid en supermarkt.
De eigenaar wil per product een EAN/barcode kunnen koppelen (scannen/invoeren of zoeken op
productnaam met een selectielijst uit Open Food Facts) en van het gekozen product de volledige
naam, voedingswaarden (per 100 g en per portie) en productfoto ophalen via Open Food Facts
(gratis, keyless, publieke data onder CC BY-SA 3.0) en lokaal opslaan als cache — bij opnieuw
openen geen nieuwe API-call, ook offline beschikbaar. ADR-010 ("nooit iets naar een server")
wordt genuanceerd: publieke, keyless data ophalen is toegestaan; privé-data blijft lokaal.

## Besluit
1. **Productmodel (ADR-017)** krijgt optionele velden `ean` (8/12/13 cijfers, spaties/streepjes
   eraf), `fullName` (max 160 tekens), `nutrition` (`{ per100, servingSize?, perServing? }` met
   alleen `energyKcal`/`fat`/`carbs`/`protein`/`salt`, gevalideerd: finite, >= 0, <= 1e6,
   afgerond op 2 decimalen) en `offImageUrl` (alleen `https://images.openfoodfacts.org/images/products/…`).
   `normalizeProducts` valideert en wist ongeldige waarden. Opslag per huishouden in
   localStorage `weekmenu-app-v1` (onderdeel van `products`, dus ook deelbaar via ADR-019).
2. **OFF-module `src/openFoodFacts.js`** (`globalThis.OpenFoodFacts`; geladen via `index.html`
   vóór `src/app.js`, in Node-tests via `require`):
   - Alleen HTTPS naar de host-allowlist: API `world.openfoodfacts.org`, foto's
     `images.openfoodfacts.org` (alleen als `<img src>`; nooit object/embed/fetch-verwerking).
   - Responses alleen via `JSON.parse` (nooit `eval`/`new Function`); elke call met een
     beschrijvende User-Agent.
   - Numerieke waarden valideren vóór opslag; remote tekst wordt altijd via React-escaping
     gerenderd (nooit `innerHTML`/`dangerouslySetInnerHTML`).
   - EAN-8 beginnend met 20–29 ("restricted circulation", o.a. Lidl) is niet uniek: alle matches
     worden getoond ter desambiguatie.
   - API: `GET /api/v2/product/{ean}.json` (lookup) en `/api/v2/search` (zoeken op naam,
     page_size 8); foto's via de 400px-variant van de image-URL.
3. **Foto-cache**: OFF-productfoto's worden bij koppelen/vernieuwen gedownload en opgeslagen in
   de gedeelde IndexedDB image-store `product-images` (keyed per EAN; #60, DB v2). Bij openen
   van een gekoppelde product-kaart laadt `ensureProdFoto` de foto uit de cache (objectURL) —
   offline werkt, met cache-badge in de UI.
4. **UI** (goedgekeurde v2-mocks, versie C per scherm): product-kaart zonder EAN toont badge
   "geen EAN gekoppeld" + knop "EAN koppelen / zoeken"; met EAN een EAN-chip + knop
   "Productgegevens". Koppelen/zoeken-sheet: EAN-invoer (Enter = lookup), 📷 scan
   (BarcodeDetector indien de browser dit ondersteunt, anders melding + handmatige invoer),
   zoekveld op productnaam, resultaten met foto/naam/merk·EAN + "Kies", bronvermelding
   "Bron: Open Food Facts · data & foto's CC BY-SA 3.0". Detail-sheet: gecachete foto met
   "● gecachet · offline", volledige naam + EAN, voedingswaarden per 100 g én per portie,
   "Waarden opnieuw ophalen", "Ontkoppelen" en bronvermelding (CC BY-SA verplicht).
5. **Foutafhandeling**: ongeldige EAN, onbekend product (status 0), lege zoekresultaten,
   netwerkfout/rate-limit (HTTP-fout) → duidelijke melding in de sheet met mogelijkheid tot
   handmatige invoer/andere zoekterm; offline zonder cache → melding, geen crash.
6. **Cache-bumps**: `CACHE_VERSION` → `weekmenu-app-v25` in `sw.js` (incl. `src/openFoodFacts.js`
   in APP_SHELL) en `?v=24` in `index.html`.

## Gevolgen
+ Per productkoppeling is éénmalig een publieke lookup nodig; daarna lokaal (localStorage +
  IndexedDB) en offline beschikbaar. Bronvermelding Open Food Facts (CC BY-SA 3.0) staat in de UI.
+ Elke lookup is zichtbaar voor OFF (IP + query, geen account) — vermeld in de issue; de app
  zelf logt niets.
- Fase 2 (recepten doorrekenen op voedingswaarden uit ingrediënt-producten) is apart issue.
- Prijzen blijven buiten scope (geen publieke prijs-API; ADR-008/010ongewijzigd voor prijzen).
- Tests: `tools/test-open-food-facts.cjs` (module, image-store, normalisatie, volledige UI-flow
  met fake fetch/IndexedDB, security-checks).
