# UX-voorstel: recepten-tab — sorteren op "laatst gegeten", readonly-weergave met klikbare producten, editknop, inline ingrediënten bij nieuw recept

**Status: ronde 1 goedgekeurd (keuzes hieronder), ronde 2 = verbesserde screenshots ter review.** Nog niet geïmplementeerd; na goedkeuring van ronde 2 volgen SPECS/ADR/tests/`src/App.jsx` (+ build) in deze PR.

## Ronde 1 — goedkeuring per scherm (2026-11-21)

- Scherm 1 (sorteerknop bovenaan): **versie A** (dropdown "⇅ Sorteer ▾" naast "⚙ Filters ▾") — met de opmerking dat het screenshot onhandig was (tekst buiten beeld, 2× filterknop zichtbaar door een mock-bug) → verbeterde screenshot in ronde 2 (`r2-01-…-v2.png`).
- Scherm 2 (hoelang geleden bij sorteren): **versie A** — badge-chips `🕒 …` in de metarow; "Onbekend" = donkere chip, bovenaan.
- Scherm 3 (rij-readonly): **versie A** — rij uitklapbaar naar readonly detail (chips + bereiding).
- Scherm 4 (product-klik in readonly): **versie A** — product-kaart binnen het detail, direct onder de chips. Opmerking: in het screenshot zat geen sperziebonen in Couscous, waardoor onduidelijk was welk product geopend was → verbeterde screenshot in ronde 2 (`r2-02-…-v2.png`, kaart van "350 g zoete aardappel", geklikte chip gemarkeerd).
- Scherm 5 (nieuw recept, ingrediënten): **versie A** — inline rijen onderaan de sheet (zelfde plek als bij bewerken).
- Scherm 6 (edit via ✏️): **versie A inline**, maar categorie als **chips** (zoals bij nieuw recept) in plaats van een dropdown → ronde 2 (`r2-03-…-categoriechips.png`).

Aanvullende beslissingen:
- **"Gegeten" = alleen vergrendelde dagen**: `lastEaten(receptId)` = grootste datum-sleutel in `menuByDate` met `entry.id === receptId` **én `entry.locked === true`** én datum ≤ vandaag (verleden weken tellen mee, toekomstige niet). Nooit vergrendeld geweest = `null` = **"Onbekend"** = bovenaan.
- **Sorteren op "laatst gegeten" = altijd een platte lijst** (niet per categorie gegroepeerd).

## Ronde 2 — verbeterde screenshots (ter review)

- `r2-01-kop-sorteer-versie-A-dropdown-v2.png` — scherm 1 opnieuw: dropdown volledig in beeld, beide items op één regel, rechts in de filterrij staat 1× "⇅ Sorteer ▾" en 1× "⚙ Filters ▾".
- `r2-02-productklik-versie-A-kaart-in-detail-v2.png` — scherm 4 opnieuw: in Couscous is de chip "350 g zoete aardappel" gemarkeerd (actief) en klapt onder álle chips de product-kaart open met naam "zoete aardappel" — de chips blijven zichtbaar, dus ondubbelzinnig welk product geopend is.
- `r2-03-edit-versie-A-inline-categoriechips.png` — scherm 6 aangepast: edit inline in de rij, **categorie als chips** (Vega/Vis/Vlees/Extra) zoals bij "Nieuw recept".

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

- **Geen nieuw opslagveld nodig voor "laatst gegeten"**: `lastEaten(receptId)` = de **grootste datum-sleutel ≤ vandaag in `menuByDate`** waar `entry.id === receptId` **én `entry.locked`** (alle verleden weken tellen; niet-vergrendelde dagen en toekomstige dagen niet; `custom`-dagen tellen niet). Nooit vergrendeld = `null` = **"Onbekend"** = bovenaan bij sorteren.
- Sorteermodus is vluchtige UI-state (zoals de filterkeuze): `"naam"` (default) of `"laatst"`. Bij `"laatst"` → **altijd een platte lijst**, sortering: `null` (Onbekend) eerst, dan op datum oplopend (langst geleden = kleinste datum bovenaan); bij gelijke/null: op naam. Bij `"naam"` blijft de huidige weergave (gegroepeerd per categorie zonder filters; plat op naam mét filters).
- Tekst "hoelang geleden" (alleen zichtbaar bij sortering `"laatst"`): `vandaag` / `gisteren` / `n dagen geleden` (< 7) / `n wk geleden` (< 8 wk) / `n mnd geleden` (< 12 mnd) / `n jr geleden`; onbekend = `Onbekend`.
- Readonly-rij: klik = detail open (ingrediënt-chips als `prodchip` → `openProdCard`/`renderProductCard`, ADR-017 — hergebruik van het bestaande mechanisme; kaart opent binnen het detail, direct onder de chips); ✏️ = edit (inline in de rij, categorie als chips); 📅 blijft weekmenu-koppeling.
- Nieuw recept: `newRecipe.ingredients` als array van `{ pid, amount, unit, name }` met dezelfde inline rijen + autocomplete als `renderIngRow` (hergebruik), ipv textarea; parsen bij "Toevoegen" vervalt (direct gestructureerd).
- Bij elke app-wijziging in deze PR: `CACHE_VERSION` in `sw.js` + `?v=` in `index.html` bumpen (les PR #8/#9).

## Open vragen / knopen om door te hakken — ronde 1 beslecht (2026-11-21)

- Scherm 1: **dropdown (A)** — zie ronde 2 voor de verbeterde screenshot.
- Scherm 2: **badge-chip in de metarow (A)**; "Onbekend" bovenaan.
- Scherm 3: **uitklapbaar readonly detail (A)**.
- Scherm 4: **product-kaart binnen het detail, onder de chips (A)**.
- Scherm 5: **inline rijen onderaan het sheet (A)**.
- Scherm 6: **edit inline (A)**, categorie als chips (ronde 2).
- "Gegeten" tellen: **alleen vergrendelde dagen t/m vandaag** (beslist).
- Sortering "laatst gegeten": **altijd platte lijst** (beslist).

### Opmerking: categorie vs. vega-variant (Kip Siam ook met cashewnoten)
Niet in deze ronde opgepakt. De bestaande **tags** dekken dit al zonder modelwijziging: een tag als `ook vega` (vrij toe te voegen, ADR-013) markeert gerechten met een makkelijke vegetarische variant; de dagcategorie (vega/vis/vlees) blijft leidend voor het weekmenu. Eventueel later uit te breiden (bijv. aparte `vegaVariant`-notitie per recept) in een eigen ADR.

## Wat er ná goedkeuring per scherm gebeurt (nog niet uitgevoerd)

- `docs/SPECS.md` (sectie Recepten) + nieuw ADR (volgend nummer, bijv. ADR-018) bijwerken; `docs/TESTS.md` aanvullen.
- Tests in `tools/test-*.cjs` (via `tools/render-harness.cjs`): sorteren op laatst gegeten (Onbekend bovenaan, hoelang-geleden-tekst, badge alleen bij die sortering), readonly-rij + ✏️-edit, prodchip → product-kaart in readonly, inline ingrediënt-rijen bij nieuw recept.
- Implementatie in `src/App.jsx` + `npm run build` (`src/app.js` synchroon) + `npm run verify` groen; `CACHE_VERSION`/`?v=` bump in dezelfde PR.
- Dit `VOORSTEL.md` wordt na goedkeuring aangevuld met de gekozen versie per scherm (status per ronde).
