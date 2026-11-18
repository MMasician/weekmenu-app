# UX-voorstel: recepten-tab — zoeken, filteren, tags en bereidingstijd-categorieën

**Status: ter review.** 10 mock-screenshots (2 versies per scherm) in deze map, 390px telefoonbreedte (device_scale_factor 2), gerenderd in de eigen huisstijl van de app (`styles.css` inline) met headless Chromium; recepten uit `BASE_RECIPES`.

## Aanleiding (wensen)

1. Bovenaan de recepten-tab: **zoeken op receptnaam** en **filteren** op bereidingstijd (kort / normaal / lang), op ingrediënten en/of op tags.
2. Bereidingstijd wijzigt van het huidige model (aantal minuten) naar een **categorie** `kort` / `normaal` / `lang` — exacte minuten zijn niet bekend.
3. Een recept **toevoegen** blijft mogelijk, maar het formulier verschijnt pas na een knop ("＋ Recept toevoegen").
4. Het veld **"wie kan dit koken" (`cook`) vervalt**; daarvoor in de plaats **tags per recept**, vrij toe te voegen en te verwijderen.
5. Bij het seeden worden bereidingstijden meteen ingevuld: **overal `normaal`**, behalve **ovengerechten, Kofta en Borsjt = `lang`** en **Tortelloni en Kip Siam = `kort`**.

Per te wijzigen scherm zijn er **2 versies**:

## 1. Recepten-tab, standaardweergave (zoekbalk bovenaan)

- `01-recepten-tab-versie-A.png` — full-width zoekbalk ("🔍 Zoek op receptnaam…"), daaronder een filterrij met tijd-chips **Alle / Kort / Normaal / Lang** + rechts de knop "⚙ Meer filters ▾" (ingrediënt + tags). Daaronder een full-width secundaire knop **"＋ Recept toevoegen"**. Recepten gegroepeerd per categorie; elke rij toont naam (+ "deze week"), categorie-chip, tijd-badge (kort = groen, normaal = grijs, lang = amber) en tag-chips. Onderaan een stille rij: Exporteren · Importeren · Standaardlijst terug.
- `02-recepten-tab-versie-B.png` — zoekbalk + **alle** filters direct zichtbaar (tijd-chips én tag-chips in aparte rijen), géén "Meer filters"-knop; toevoegen via een **zwevende ronde "＋"-knop (FAB)** rechtsonder.

## 2. Filterpaneel (ingrediënt & tags) — na knop/open state

- `03-filters-versie-A-bottomsheet.png` — bottom sheet over gedimde lijst: **Bereidingstijd** als segmented (Alles/Kort/Normaal/Lang), **Ingrediënt bevat** (tekstveld, bijv. "zalm"), **Tags** als multi-select chips, onderaan "Wis filters" + primaire knop "Toon N recepten".
- `04-filters-versie-B-inlinepaneel.png` — zelfde inhoud, maar als **inline paneel** direct onder de zoekbalk (geen overlay).

In beide versies: filters combineren (AND): zoekterm op naam + tijdcategorie + ingrediënt-bevat + tags (meerdere tags = AND of OR? zie open vragen).

## 3. Zoek-/filterresultaat

- `05-zoekresultaat-versie-A-gegroepeerd.png` — zoekterm "zalm" actief: chip "🔍 “zalm” ×", teller **"4 van 52 recepten"**, resultaten **gegroepeerd per categorie** (Vis).
- `06-filterresultaat-versie-B-plat.png` — filter "⏱ kort" actief: chips met × + "Alles wissen", teller "2 van 52 recepten", **platte lijst** op naam (Tortelloni met spinazie, Kip Siam) zonder categorie-koppen.

## 4. Recept toevoegen (pas na knop "＋ Recept toevoegen")

- `07-recept-toevoegen-versie-A-bottomsheet.png` — bottom sheet met formulier: Naam, Categorie (chips), **Bereidingstijd als segmented Kort/Normaal/Lang (standaard Normaal)**, Tags (veld + "＋"), Ingrediënten (één per regel), Bereiding, primaire knop "Toevoegen".
- `08-recept-toevoegen-versie-B-inlinekaart.png` — zelfde formulier als **inline kaart bovenaan de lijst** (compactere grid), direct onder de zoekbalk.

## 5. Recept bewerken (detail open) — zonder "kok", mét tags

- `09-recept-bewerken-versie-A-chips.png` — open kaart: Naam, Categorie, **Bereidingstijd als segmented Kort/Normaal/Lang**, **Tags als chips met × + "＋ tag toevoegen"-veld**, Ingrediënten, Bereiding, "Recept verwijderen". Geen "wie kan dit koken"-veld meer.
- `10-recept-bewerken-versie-B-dropdown.png` — zelfde, maar Bereidingstijd als **dropdown** ("Kort (tot ±25 min)" etc.) en tags als **kommagescheiden tekstveld**.

## Modelwijzigingen (gevolg van bovenstaande, na goedkeuring in ADR-013)

- Receptveld `time` (minuten) → **`timeCat`: `"kort" | "normaal" | "lang"`**. Migratie van bestaande `time`: ≤ 25 min → kort, ≥ 45 min → lang, anders normaal; ontbrekend → normaal.
- Receptveld `cook` vervalt (ook in de weekmenu-dagregel, die nu `· ${r.cook}` toonde); in de weekmenu-tab verschijnt in plaats van "X min" een tijd-badge kort/normaal/lang.
- Nieuw veld **`tags`: string[] per recept** (leeg mag); tags vrij toe te voegen/verwijderen; de set alle tags in de pool is de bron voor de tag-filterchips.
- Seed `BASE_RECIPES`: overal `timeCat: "normaal"`, behalve **lang**: Kofta (r42), Borsjt (r36) en de ovengerechten (voorstel: r2 Accenture burgers, r24 Spinaziequiche met zalm, r37 Broccoli-perziktaart, r45 Mexicaanse ovenschotel, r51 Zuurkool met stoofpeertjes — zie open vraag), en **kort**: Tortelloni met spinazie (r17), Kip Siam (r41). Reset ("Standaardlijst terug") seedt inclusief timeCat/tags.
- Zoeken/filteren gebeurt in-memory op de geladen pool; export/import (JSON) exporteert `timeCat` + `tags` mee (import zonder `timeCat` → normaal; zonder `tags` → []).

## Open vragen / knopen om door te hakken

- Scherm 1: tijd-chips direct zichtbaar + "Meer filters" (A), of álle filters direct zichtbaar + FAB (B)?
- Scherm 2: filters in bottom sheet (A) of inline paneel (B)?
- Scherm 3: resultaten gegroepeerd per categorie (A) of platte lijst (B)? Teller "n van N" bovenaan de lijst (beide) prima?
- Scherm 4: toevoegen via bottom sheet (A) of inline kaart (B)?
- Scherm 5: bewerken met chips/segmented (A) of dropdown + komma-tags (B)?
- Meerdere tag-filters: AND (alle geselecteerde tags moeten erop) of OR (minstens één)? (huidig voorstel: AND)
- Ingrediënt-filter: vrij tekstveld "bevat" (huidig voorstel) of autocomplete-chips uit alle ingrediënten in de pool?
- Drempels voor migratie van oude minutenwaarden: kort ≤ 25 min, lang ≥ 45 min (huidig voorstel)?
- Welke recepten tellen precies als "ovengerecht" voor `lang` (bovenstaand voorstel: r2, r24, r37, r45, r51)?
- Waar blijven Exporteren / Importeren / Standaardlijst terug? (huidig voorstel: stille rij onderaan de tab)

## Wat er ná goedkeuring per scherm gebeurt (nog niet uitgevoerd)

- `docs/SPECS.md` (sectie Recepten) + `docs/INTENT.md` bijwerken: zoeken/filteren, `timeCat`, `tags`, `cook` weg, seed-waarden.
- Nieuw ADR (volgend nummer, ADR-013): modelwijziging `time` → `timeCat` + `tags` + migratie + seed.
- Tests in `tools/test-recepten-ux.cjs` (nieuw, via `tools/render-harness.cjs`): zoekfilter op naam, filter op tijdCat/ingrediënt/tags, teller, toevoegen pas na knop, tags toevoegen/verwijderen, kok-veld absent, seed timeCat-waarden.
- Implementatie in `src/App.jsx` (+ `npm run build` → `src/app.js` synchroon, `npm run verify` groen): zoekbalk + filters bovenaan de recepten-tab, toevoegen-knop, bewerkformulier zonder kok mét tags en tijd-segmented, badges op de rijen, weekmenu-dagregel met tijd-badge.
- Dit `VOORSTEL.md` wordt na goedkeuring aangevuld met de gekozen versies per scherm.
