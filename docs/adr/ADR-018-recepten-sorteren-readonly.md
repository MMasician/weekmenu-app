# ADR-018: Recepten-tab — sorteren op "laatst gegeten", readonly-rij met product-klik, ✏️-editknop, inline ingrediënten bij nieuw recept

## Status
Geaccepteerd (2026-11-21)

## Context
De recepten-tab kon elk recept altijd direct volledig bewerken (klik op de rij = edit-formulier), en bovenaan
stond alleen een filterknop. Wensen: (1) een **sorteerknop naast de filterknop** om te sorteren op **laatst
gegeten gerecht (langst geleden bovenaan)**, met per gerecht "hoelang geleden" — alleen zichtbaar bij die
sortering; onbekend = "Onbekend" = héél lang geleden = bovenaan; (2) recepten zijn stabiel, dus standaard een
**compacte readonly-weergave** en de bestaande bewerkmogelijkheden pas achter een **✏️-knop** per gerecht;
(3) in de readonly-weergave klikbare ingrediënten/producten met dezelfde inline product-kaart als op de
voorraad- en boodschappentab (ADR-017); (4) bij **nieuwe recepten** ingrediënten op dezelfde manier
toevoegen als bij bestaande gerechten/voorraad/boodschappen (inline rijen met autocomplete, ipv textarea).

UX-voorstel met mocks per scherm (2 versies), PR #30 (`docs/ux/recepten-tab-sorteren-readonly/`). Goedgekeurd
per scherm (ronde 1 + ronde 2 met verbeterde screenshots): scherm 1 = versie A (dropdown "⇅ Sorteer ▾" naast
"⚙ Filters ▾"); scherm 2 = versie A (badge-chips `🕒 …` in de metarow, "Onbekend" = donkere chip, bovenaan);
scherm 3 = versie A (rij uitklapbaar naar readonly detail); scherm 4 = versie A (product-kaart binnen het
detail, direct onder de chips); scherm 5 = versie A (inline rijen onderaan het sheet); scherm 6 = versie A
inline, met **categorie als chips** ipv dropdown. Beslissingen: "gegeten" = alleen **vergrendelde** dagen t/m
vandaag (verleden weken mee, toekomst niet); sorteren op "laatst" = altijd een **platte lijst**.

## Besluit
- **Sorteren**: vluchtige UI-state `recipeSort` = `"naam"` (default) | `"laatst"`; knop "⇅ Sorteer ▾" rechts in
  de filterrij vóór "⚙ Filters ▾" opent een dropdown ("✓ Naam (A–Z)" / "🕒 Laatst gegeten (langst geleden
eerst)"). `lastEaten[receptId]` = grootste datum-sleutel `k ≤ todayKey` in `menuByDate` met
  `entry.id === receptId && entry.locked` (geen nieuw opslagveld nodig). Bij `"laatst"`: altijd platte lijst,
  sortering Onbekend (`null`) eerst, dan datum oplopend, ties op naam; in de afilterrow een chip
  "🕒 Laatst gegeten ×". Alleen bij `"laatst"` toont elke rij in de metarow een badge `🕒 <agoLabel>`
  (`agoLabel`: vandaag / gisteren / n dagen geleden (<7) / n wk (<8 wk) / n mnd (<12 mnd) / n jr;
  `null` → "Onbekend", donkere chip `.last.unknown`).
- **Readonly-rij**: klik op de rij opent een compact readonly-detail: "Ingrediënten" als klikbare
  `prodchip`s (prodchip → `openProdCard("rec-"+id)` + `renderProductCard` direct onder de chips — hergebruik
  ADR-017) en "Bereiding". Rechts per rij: **✏️** ("Recept bewerken", opent het bestaande formulier inline,
  nu met **categorie als chips**) en 📅 (weekmenu-koppeling, ongewijzigd).
- **Nieuw recept**: `newRecipe.ingredients` is nu een array van `{ pid, amount, unit, name }` met dezelfde
  inline rijen + autocomplete als bij bewerken (`renderNewIngRow`, drafts via `ingDrafts["new:"+idx]`);
  de textarea "één per regel" vervalt; `addRecipe` slaat de gestructureerde ingrediënten direct op
  (producten worden bij resolve/select al aangemaakt via `ensureProduct`).
- Nieuwe statische klassen in `styles.css`: `.sortwrap`, `.sortmenu`, `.last`, `.last.unknown`.
- Cache-bump in dezelfde PR (les PR #8/#9): `CACHE_VERSION` v10→v11 in `sw.js`, `?v=9`→`?v=10` op alle
  4 plekken in `index.html`.

## Gevolgen
+ Sorteren op laatst gegeten zonder nieuw datamodel (afgeleid van `menuByDate`); "Onbekend" staat bovenaan.
+ De tab start rustig: rijen zijn compact readonly; bewerken zit expres achter de ✏️-knop.
+ Product-klik in readonly is exact hetzelfde mechanisme als op voorraad/boodschappen/weekmenu (ADR-017).
+ Opvoeren van ingrediënten is nu overal uniform (recept bewerken, nieuw recept, voorraad, boodschappen).
- Bestaande tests m.b.t. "klik op rij = bewerken" zijn aangepast (edit nu via ✏️); de textarea bij
  "Nieuw recept" is vervangen door inline rijen.
- De categorie van een recept blijft één waarde (vega/vis/vlees/extra); een gerecht met een makkelijke
  vega-variant krijgt daarvoor een tag (bijv. "ook vega") — geen modelwijziging (zie VOORSTEL-opmerking).
- Geteste dekking: `tools/test-recepten-sorteren-readonly.cjs` (sorteerknop/dropdown, sorteringsvolgorde met
  locked/unlocked/toekomst, badges, readonly-detail + product-kaart, ✏️-edit met categorie-chips, inline
  rijen bij nieuw recept) + aangepaste tests in `tools/test-recepten-ux.cjs` en `tools/test-producten-catalogus.cjs`.
