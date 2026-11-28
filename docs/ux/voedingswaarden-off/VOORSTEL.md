# VOORSTEL — Voedingswaarden per product via Open Food Facts (issue #48)

Onderwerp: `docs/ux/voedingswaarden-off/`
Bestanden: 9 SVG-mocks (3 schermen × 3 versies A/B/C), 390×844, inline styling in de huisstijl van `styles.css`. SVG (tekst/XML) — expres geen PNG i.v.m. de text-only file-pipeline.

## Schermen
| Scherm | Bestand | Inhoud |
|---|---|---|
| 1. Productkaart (catalogus) | `01-product-kaart-versie-{A,B,C}.svg` | kaart met product zonder ean/voedingswaarden + actie 'EAN koppelen / zoeken'; merkloos product (bloemkool) met NEVO-fallback-actie |
| 2. Koppelen / zoeken | `02-koppelen-zoeken-versie-{A,B,C}.svg` | EAN scannen/invoeren óf zoeken op productnaam; resultatenlijst Open Food Facts; versie C: EAN-8 (20–29) multi-match-waarschuwing + bronvermelding |
| 3. Productdetail gekoppeld | `03-product-detail-gekoppeld-versie-{A,B,C}.svg` | fullName + EAN-chip + productfoto + voedingswaarden per 100 g en per portie + bronvermelding + (C) offline cache-badge |

## Versies
- A — kaal: geen foto, geen bronvermelding, geen cache-indicatie
- B — + productfoto (alleen via `<img src>` met allowlist `https://images.openfoodfacts.org/images/products/`) + bronvermelding 'Gegevens & foto's: Open Food Facts (CC BY-SA 3.0)'
- C — + foto lokaal gecachet in de image-store (#60) met offline cache-badge + bronvermelding + cache-status in de voedingswaardenkaart

## Aanbeveling: versie C — approved door de eigenaar
Owner: 'Voor alle schermen is versie C akkoord'.

Rationale:
- OFF-productfoto's vallen onder CC BY-SA 3.0 → bronvermelding 'Open Food Facts' is verplicht in de UI; versie C toont deze expliciet.
- De app is offline-first (localStorage/PWA): foto's worden na het eerste ophalen lokaal gecachet (#60) en werken dan offline; versie C maakt dat zichtbaar met een cache-badge.
- Security-richtlijnen uit de owner-comments zijn in alle versies als randgevallen verwerkt: HTTPS host-allowlist (world.openfoodfacts.org / images.openfoodfacts.org), JSON.parse-only (nooit eval/new Function), escaped rendering (nooit innerHTML/dangerouslySetInnerHTML), img-URL-allowlist, numerieke validatie (parseFloat, NaN/negatief/extreem) vóór opslag, beschrijvende User-Agent, EAN-8 restricted circulation (20–29) multi-match, lege/fout/offline states.

## Implementatienotities (voor het latere implementatie-PR ná #59/#60)
- Productmodel (ADR-017) uitbreiden met `fullName`, `ean`, `nutrition100`, `nutritionPerServing`, optioneel `imageUrl`; cache per huishouden in localStorage `weekmenu-app-v1`; CACHE_VERSION bump bij migratie.
- OFF lookup: `GET https://world.openfoodfacts.org/api/v2/product/{ean}.json` en search via `…/api/v2/search`; numerieke waarden valideren vóór opslag in localStorage.
- Prijzen blijven buiten scope (ADR-008/ADR-010 aanpassen: geen betrouwbare publieke prijs-API; publieke data zoals voedingswaarden/foto's mogen wel opgehaald worden).

Zie issue #48 voor de volledige DoR (acceptatiecriteria, scope, randgevallen, open vragen, verificatie, afhankelijkheden).

## v2 — mocks in de bestaande app (ter review, issue #48 heropend)

Owner-feedback: de v1-mocks hielden geen rekening met de huidige app. Daarom nu per **goedgekeurd scherm 1 mock** (versie C was overal akkoord) die laat zien hoe het eruitziet **in de bestaande app** (huidige product-kaart inline vanuit de catalogus, huidige bottom-sheet-stijl):

- `v2-01-product-kaart-akkoord-in-bestaande-app.svg` — product-kaart versie C: badge "geen EAN gekoppeld" + knop "EAN koppelen / zoeken" in de bestaande product-kaart; merkloze basisproducten krijgen "NEVO-fallback zoeken".
- `v2-02-koppelen-zoeken-akkoord-in-bestaande-app.svg` — koppelen/zoeken versie C: bottom sheet met EAN-invoer/scan + zoeken op naam, resultaten met foto + "Kies", EAN-8-waarschuwing en bronvermelding "Bron: Open Food Facts · data & foto's CC BY-SA 3.0" onderaan.
- `v2-03-product-detail-gekoppeld-akkoord-in-bestaande-app.svg` — product-detail gekoppeld versie C: gecachete OFF-frontfoto met "● gecachet · offline" badge, volledige naam + EAN, voedingswaarden per 100 g én per portie, "● uit lokale cache · offline beschikbaar", knop "Waarden opnieuw ophalen" en bronvermelding "Gegevens & foto's: Open Food Facts (CC BY-SA 3.0) · foto lokaal gecachet".

Security-richtlijnen uit de issue-comments blijven van kracht (HTTPS host-allowlist world/images.openfoodfacts.org, JSON.parse-only, escaped rendering, img-URL-allowlist, numerieke validatie, User-Agent, Cache API). Na owner-akkoord op deze v2-mocks volgt implementatie in een aparte PR (na #60; gedeelde image-store).

## Implementatie — na owner-akkoord op de v2-mocks (issue #48)

Geïmplementeerd volgens ADR-024: productmodel + `ean`/`fullName`/`nutrition`/`offImageUrl` (gevalideerd in `normalizeProducts`); `src/openFoodFacts.js` (host-allowlist world/images.openfoodfacts.org, JSON.parse-only, img-URL-allowlist, numerieke validatie vóór opslag, beschrijvende User-Agent, restricted EAN-8 20–29 multi-match); OFF-foto's gecachet in de gedeelde image-store `product-images` (#60, DB v2); UI volgens de goedgekeurde v2-mocks (versie C per scherm) in de bestaande product-kaart + bottom sheets; tests in `tools/test-open-food-facts.cjs`; `CACHE_VERSION` → `weekmenu-app-v26`, `?v=26`.

Afwijking t.o.v. mock v2-01: de tweede info-regel belooft geen NEVO-fallback (NEVO/RIVM zit niet in de host-allowlist); merkloze basisproducten (bv. bloemkool) gebruiken de generieke OFF-zoekopdracht op productnaam — dat is de fallback.
