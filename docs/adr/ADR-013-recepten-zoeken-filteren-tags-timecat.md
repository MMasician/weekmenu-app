# ADR-013: Recepten-tab — zoeken/filteren, tags en bereidingstijd als categorie

## Status
Geaccepteerd

## Context
De recepten-tab toonde een lange, per categorie gegroepeerde lijst met bovenaan een
altijd zichtbaar "Nieuw recept toevoegen"-formulier. Er was geen manier om te zoeken
of te filteren. Het receptmodel kende `time` (bereidingstijd in minuten) en `cook`
("wie kan dit koken"). De wens: bovenaan de tab zoeken op receptnaam en filteren op
bereidingstijd, ingrediënten en/of tags; toevoegen pas na een knop; in plaats van
`cook` tags per recept (toevoegen/verwijderen); bereidingstijd als categorie
`kort`/`normaal`/`lang` (exacte minuten onbekend), initieel geseed: overal `normaal`,
ovengerechten + Kofta + Borsjt `lang`, Tortelloni + Kip Siam `kort`.

UX-voorstel met mocks per scherm (2 versies): `docs/ux/recepten-tab-zoeken-filteren/`
(PR #8). Goedgekeurd: scherm 1 = versie B (maximaal 5 tags direct zichtbaar, uitleg
achter een ℹ️-icoon, toevoegen via een klein ＋-icoon), scherm 2 = versie A (filter-sheet
als bottom sheet), scherm 3 = versie B (platte resultaatlijst met teller), scherm 4 =
versie A (toevoegen in bottom sheet), scherm 5 = versie A (bewerken met chips/segmented). Ronde 2 (weekmenu-koppeling): goedgekeurd = versie 12 (dagkiezer als bottom sheet); onvergrendelde dagen met een bestaand gerecht mogen worden overschreven, vergrendelde (🔒) niet.
Tag-filters zijn AND; ingrediënt-filter is een vrij tekstveld ("bevat"); migratiedrempels
≤ 25 min = kort, ≥ 45 min = lang; export/import/reset blijven onderaan de tab.

## Besluit
- **Model**: recept = `{ id, name, cat, ingredients[], bereiding, timeCat, tags[] }`.
  `time` (minuten) en `cook` zijn vervallen. `normalizeRecipe` wordt toegepast bij laden
  (`loadRecipes`), import, reset en toevoegen: ontbrekende `timeCat` wordt afgeleid uit
  oude `time` (≤ 25 → `kort`, ≥ 45 → `lang`, anders/ontbrekend → `normaal`), `cook` wordt
  gewist, `tags` wordt `[]`.
- **Seed** `BASE_RECIPES`: `timeCat: "lang"` op r2, r24, r36 (Borsjt), r37, r42 (Kofta),
  r45, r51; `timeCat: "kort"` op r17 (Tortelloni) en r41 (Kip Siam); overige `normaal`
  (via `normalizeRecipe`); `tags: []`.
- **Zoeken/filteren bovenaan de tab**: zoekbalk (naam), filterrij met tijd-chips +
  top-5 tags (frequentie, dan alfabetisch) + `⚙ Filters ▾`; filter-sheet (bottom sheet)
  met segmented tijd, "Ingrediënt bevat" en alle tags als multi-select. Alle filters AND.
  Bij actieve filters: platte lijst op naam, teller "n van N recepten", actieve
  filterchips met ×, "Alles wissen". Zonder filters: gegroepeerd per categorie.
- **Toevoegen** via ＋-icoon → bottom sheet; **bewerken** met segmented tijd en tag-chips
  met × + "＋ tag toevoegen"; geen "kok"-veld meer. Exporteren/Importeren/"Standaardlijst
  terug" als stille rij onderaan de tab. Uitlegtekst achter ℹ️-icoon.
- In de weekmenu-dagregel: tijd-badge (kort/normaal/lang) in plaats van "X min"; geen kok.
- **Weekmenu-koppeling (ronde 2)**: rechts op elke receptenrij een 📅-knop → bottom sheet "Kies een dag deze week" (7 dagen van offset 0, 🔒 vergrendeld = niet klikbaar, vandaag gemarkeerd). Kiezen zet `{ id }` op die datum in `menuByDate` (onvergrendeld gerecht wordt overschreven, `eaters` blijft behouden, vergrendeld nooit) + toast-melding.

## Gevolgen
+ Zoeken/filteren direct bovenaan de tab; de tab start rustig (geen formulier, geen uitleg).
+ Bereidingstijd als categorie past bij hoe recepten worden ervaren (kort/normaal/lang).
+ `cook` (persoonsgebonden) is uit het model — privacy-vriendelijker (ADR-010); tags zijn
  vrij en generiek.
+ Weekmenu-dagregel toont de badge; geen minuten/kok meer.
- Bestaande opslag met `time`/`cook` migreert automatisch bij het laden (drempels ≤ 25/≥ 45).
- Export/import carry `timeCat`/`tags` mee; oude exports zonder die velden worden bij
  import genormaliseerd.
- Nieuwe statische klassen in `styles.css` (searchbar, chips, segl, tag, tb-*, afilter, dayrow, toast…);
  tests in `tools/test-recepten-ux.cjs` dekken model, migratie, zoeken/filteren, toevoegen
  en bewerken.
