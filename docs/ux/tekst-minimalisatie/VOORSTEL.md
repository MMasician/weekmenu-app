# VOORSTEL — Tekstminimalisatie, tag-weergave en kleine letters

Status: geïmplementeerd in deze PR (mocks ter review; versie A voor de info-knopjes is doorgevoerd).

## Aangevraagde wijzigingen en mocks

1. **Leeg tagveld bij product wijzigen toont niets** (was "＋ tag toevoegen…") — 1 mock: `01-productkaart-tekstfixes.svg` (specifieke fix, daarom 1 mock). Ook toegepast op de tagvelden bij recepten (zelfde component/patroon).
2. **Geen × achter een tag-chip** — zelfde mock (`01-productkaart-tekstfixes.svg`). De chip zelf is klikbaar om de tag te verwijderen (title "Tag verwijderen"); visueel staat er alleen de tag.
3. **Label "Timetag" zonder "(optioneel, #58)"** — zelfde mock. De uitleg (0–365 dagen) staat als tooltip op het invulveld.
4. **Instellingen: geen issue-/ADR-verwijzingen, minimale tekst, uitleg achter klein ℹ️-knopje direct achter het onderwerp** (niet op een aparte regel) — 3 varianten:
   - `02-instellingen-versie-A-popover.svg` — **AANBEVOLEN / geïmplementeerd**: ℹ️ achter de kop opent een popover met de uitleg (zelfde patroon als het bestaande ℹ️ op de boodschappen-tab). Toegepast op: intro "Instellingen per huishouden", Weergave, Taal, Afhaalmaaltijden, Productcatalogus, Producten samenvoegen (merge-sheet), Categorieën (boodschappen-tab) en "Inhoud per verpakking" in de product-kaart.
   - `03-instellingen-versie-B-tooltip.svg` — ℹ️ met native tooltip (title). Minder geschikt op mobiel (geen hover).
   - `04-instellingen-versie-C-sheet.svg` — ℹ️ opent een bottom sheet met de uitleg. Zwaarder; meer tikken.
5. **Tags en categorieën altijd volledig in kleine letters** — 1 mock: `05-tags-categorieen-kleine-letters.svg`. Bestaande data wordt bij het laden genormaliseerd (`normalizeSettings`/`normalizeProducts`/`normalizeStock`/`normalizeExtras`/`normalizeRecipe`, incl. per-ingrediënt-tags); nieuwe tags/categorieën worden direct lowercase opgeslagen en de invulvelden hebben `autoCapitalize="none"` (geen Caps Lock).

## Implementatie

- `src/ui/components.jsx`, `src/ui/recipesTab.jsx`, `src/ui/menuTab.jsx`, `src/ui/shoppingTab.jsx`, `src/ui/settingsTab.jsx` — tagchips als knop zonder ×, lege tagvelden zonder placeholder + `autoCapitalize="none"`, label "Timetag", issue-/ADR-refs uit zichtbare teksten, ℹ️-popovers via `makeInfoBtn` (gedeelde state `infoOpen` in `src/state/store.js`).
- `src/state/store.js` — `addCat` lowercase, `saveProductEdit` cat lowercase, `setIngTags` lowercase.
- `src/domain/settings.js` / `catalog.js` / `stock.js` / `recipes.js` — bestaande tags en categorieën lowercasen bij laden.
- `styles.css` — `button.tag` (chip-klik), `.iconbtn.sm` (klein ℹ️); `.tagx` verwijderd.
- `src/i18n/{nl,en,fr,de}.js` — sleutels bijgewerkt (nieuwe teksten vertaald, verweesde sleutels verwijderd).
- Tests in `tools/test-*.cjs` aangepast/uitgebreid; `npm run verify`, lint en typecheck groen. SPECS.md bijgewerkt.
