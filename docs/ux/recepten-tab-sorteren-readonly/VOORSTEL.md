# UX-voorstel: recepten-tab — sorteren op "laatst gegeten", readonly-weergave met klikbare producten, editknop, inline ingrediënten bij nieuw recept

**Status: ter review (ronde 1).** Nog niet geïmplementeerd; na goedkeuring per scherm volgen SPECS/ADR/tests/`src/App.jsx` (+ build) in deze PR.

## Aanleiding (wensen)

1. Bovenaan de recepten-tab staat een filterknop; **daarnaast een sorteerknop** waarmee je sorteert op **laatst gegeten gerecht (langst geleden bovenaan)**. Alleen bij die sortering toon je per gerecht **hoelang geleden** dit gegeten is; onbekend = **"Onbekend"** en telt als héél lang geleden, dus **bovenaan**.
2. Recepten zijn nu altijd volledig bewerkbaar (klik op de rij = edit-formulier). Nieuw: **editknop (✏️) naast elk gerecht** — pas dáárop zie je de huidige bewerkmogelijkheden; standaard staat elk gerecht in een **compacte, leesbare readonly-weergave**.
3. In de readonly-weergave klik je op **ingrediënten/producten** voor meer info en evt. wijzigingen — **exact zoals op de voorraad- en boodschappentab** (prodlink/prodchip → inline product-kaart, ADR-017).
4. Bij **nieuwe recepten** worden ingrediënten op **dezelfde wijze** toegevoegd als bij bestaande gerechten/voorraad/boodschappen: inline rijen `[aantal][eenheid][productnaam met autocomplete][✕]` + "＋ Ingrediënt toevoegen" (nu nog een textarea "één per regel").

Per te wijzigen scherm zijn er **2 versies** (mocks gerenderd in de eigen app-stijl, 390×844 @2x; data uit `BASE_RECIPES`, "vandaag" = za 21 nov 2026 in de mocks).

## 1. Kop van de recepten-tab: sorteerknop náást de filterknop

- `01-kop-sorteer-versie-A-dropdown.png` — rechts in de filterrij, direct vóór **⚙ Filters ▾**, een knop **"⇅ Sorteer ▾"** met dropdown: **✓ Naam (A–Z)** (default) en **🕒 Laatst gegeten (langst geleden eerst)**.
- `02-kop-sorteer-versie-B-togglechip.png` — rechts in de filterrij een **toggle-chip "🕒 Laatst gegeten"** (inactief = sorteren op naam, actief = laatst gegeten); bij actief verschijnt in de afilterrow een chip "🕒 Laatst gegeten ×" + "Alles wissen" + teller.

## 2. Lijst bij sortering "laatst gegeten": per gerecht hoelang geleden (alleen dan zichtbaar)

- `03-lijst-laatstgegeten-versie-A-badgechip.png` — platte lijst, sortering: **Onbekend bovenaan**, dan langst geleden eerst (2 mnd → 7 wk → 1 wk → gisteren). Per rij een **badge-chip in de metarow**: `🕒 Onbekend` (donker), `🕒 2 mnd geleden`, `🕒 7 wk geleden`, … Bij sortering op naam zijn deze badges **weg**.
- `04-lijst-laatstgegeten-versie-B-rechtstekst.png` — zelfde sortering, maar hoelang geleden als **losse tekst rechts in de rij** (naast de naam, vóór ▾/✏️/📅), geen chip in de metarow.

## 3. Receptenrij: standaard compact readonly, edit pas via ✏️

- `05-rij-readonly-versie-A-uitklapbaar.png` — dichte rij = naam + metarow (categorie, tijd, tags) + **✏️** en 📅 rechts. Klik op de rij klapt een **readonly detail** open: ingrediënten als klikbare product-chips + bereiding. ✏️ opent het bewerkformulier (zie scherm 6).
- `06-rij-readonly-versie-B-compactdirect.png` — elke rij toont direct compact: naam + metarow + **ingrediënt-chips in de rij** + bereiding als 2-regels preview; geen uitklappen. ✏️/📅 rechts.

## 4. Product-klik in de readonly-weergave (zelfde als voorraad/boodschappen, ADR-017)

- `07-readonly-productklik-versie-A-kaart-in-detail.png` — klik op een ingrediënt-chip in het uitgeklapte detail → **product-kaart klapt open binnen het detail**, direct onder de chips (boven "Bereiding"): naam, categorie, eenheid, voorkeurssupermarkt, "n× gebruikt", Opslaan, Verwijderen.
- `08-readonly-productklik-versie-B-kaart-onder-rij.png` — zelfde, maar de product-kaart klapt open **onder de hele receptenrij** (onder het detail), exact zoals bij een voorraad-rij.

## 5. Nieuw recept: ingrediënten inline rijen (zelfde als bewerken/voorraad/boodschappen)

- `09-nieuw-recept-versie-A-rijenonderaan.png` — bottom sheet "Nieuw recept" met **inline ingrediënt-rijen** `[aantal][eenheid][naam + autocomplete][✕]` + "＋ Ingrediënt toevoegen" op dezelfde plek als bij bewerken (na tags, vóór bereiding); textarea "één per regel" vervalt.
- `10-nieuw-recept-versie-B-rijendirectondernaam.png` — zelfde inline rijen, maar **direct onder de naam** (bovenaan het formulier).

## 6. Bewerken via de ✏️-knop (huidige mogelijkheden blijven, alleen achter de knop)

- `11-edit-versie-A-inline.png` — ✏️ opent het **bestaande bewerkformulier inline in de rij** (naam, categorie, segmented tijd, tags, inline ingrediënt-rijen, bereiding, "Recept verwijderen") — huidig formulier, alleen te openen via ✏️.
- `12-edit-versie-B-bottomsheet.png` — ✏️ opent hetzelfde formulier in een **bottom sheet** ("Recept bewerken").

## Model- & datagevolgen (na goedkeuring in een nieuw ADR)

- **Geen nieuw opslagveld nodig voor "laatst gegeten"**: `lastEaten(receptId)` = de **grootste datum-sleutel in `menuByDate`** waar `entry.id === receptId` (alle weken, vergrendeld of niet; `custom`-dagen tellen niet). Nooit in het menu = `null` = **"Onbekend"** = bovenaan bij sorteren.
- Sorteermodus is vluchtige UI-state (zoals de filterkeuze): `"naam"` (default) of `"laatst"`. Bij `"laatst"` → **platte lijst** (net als bij actieve filters), sortering: `null` (Onbekend) eerst, dan op datum oplopend (langst geleden = kleinste datum bovenaan); bij gelijke/null: op naam. Bij `"naam"` blijft de huidige weergave (gegroepeerd per categorie zonder filters; plat op naam mét filters).
- Tekst "hoelang geleden" (alleen zichtbaar bij sortering `"laatst"`): `vandaag` / `gisteren` / `n dagen geleden` (< 7) / `n wk geleden` (< 8 wk) / `n mnd geleden` (< 12 mnd) / `n jr geleden`; onbekend = `Onbekend`.
- Readonly-rij: klik = detail open (ingrediënt-chips als `prodchip` → `openProdCard`/`renderProductCard`, ADR-017 — hergebruik van het bestaande mechanisme); ✏️ = edit; 📅 blijft weekmenu-koppeling.
- Nieuw recept: `newRecipe.ingredients` als array van `{ pid, amount, unit, name }` met dezelfde inline rijen + autocomplete als `renderIngRow` (hergebruik), ipv textarea; parsen bij "Toevoegen" vervalt (direct gestructureerd).
- Bij elke app-wijziging in deze PR: `CACHE_VERSION` in `sw.js` + `?v=` in `index.html` bumpen (les PR #8/#9).

## Open vragen / knopen om door te hakken

- Scherm 1: sorteerknop met dropdown (A) of toggle-chip (B)?
- Scherm 2: badge-chip in de metarow (A) of losse tekst rechts in de rij (B)? — "Onbekend" in beide versies bovenaan.
- Scherm 3: rij uitklapbaar naar readonly detail (A) of direct compact in de rij (B)?
- Scherm 4: product-kaart binnen het detail (A) of onder de hele rij (B)?
- Scherm 5: inline rijen onderaan het sheet (A) of direct onder de naam (B)?
- Scherm 6: edit inline in de rij (A) of in een bottom sheet (B)?
- Telt een gerecht op een **niet-vergrendelde** dag van een verleden week ook als "gegeten"? (voorstel: ja, elke datum in `menuByDate` telt)
- Moet de sortering "laatst gegeten" ook werken binnen de per-categorie-gegroepeerde weergave (sorteren binnen categorie), of altijd als platte lijst? (huidig voorstel: altijd platte lijst)

## Wat er ná goedkeuring per scherm gebeurt (nog niet uitgevoerd)

- `docs/SPECS.md` (sectie Recepten) + nieuw ADR (volgend nummer, bijv. ADR-018) bijwerken; `docs/TESTS.md` aanvullen.
- Tests in `tools/test-*.cjs` (via `tools/render-harness.cjs`): sorteren op laatst gegeten (Onbekend bovenaan, hoelang-geleden-tekst, badge alleen bij die sortering), readonly-rij + ✏️-edit, prodchip → product-kaart in readonly, inline ingrediënt-rijen bij nieuw recept.
- Implementatie in `src/App.jsx` + `npm run build` (`src/app.js` synchroon) + `npm run verify` groen; `CACHE_VERSION`/`?v=` bump in dezelfde PR.
- Dit `VOORSTEL.md` wordt na goedkeuring aangevuld met de gekozen versie per scherm (status per ronde).
