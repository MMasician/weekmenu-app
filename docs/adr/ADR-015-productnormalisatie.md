# ADR-015 — Productnormalisatie, merge van duplicaten en per-recept tags (issue #59)

- **Status:** geaccepteerd (owner-approval in issue #59)
- **Context:** in de productenlijst kwamen duplicaten voor doordat beschrijvingen bij recepten toevoegingen bevatten (rood, zakje, optioneel) of andere eenheden (dl, blikje). Er moesten mogelijkheden komen om duplicaten op te lossen en te voorkomen. Besloten is om dit local-first op te lossen, zonder backend/sync-server.

## Besluiten
1. **Normalisatie:** `normalizeKey` stripst case/diakrieten, tekst na `,`/`(`, variant-kwalificaties en generieke descriptors. Producten met gelijke sleutel groeperen als duplicaten (badge + samenvoegen-actie). Lege sleutel → fallback op originele naam.
2. **Kanjer-heuristiek bij merge:** kortste benaming met de minste woorden → bij gelijke lengte meest gebruikt in recepten → anders alfabetisch eerste. In de UI subtiel gehouden (info-icoon 'voorgesteld').
3. **Per-recept tags:** bij een merge worden tags logisch afgeleid uit het benamingsverschil (`melk` vs `volle melk` → `vol`); willekeurige woorden (rood/zakje/optioneel) worden nooit automatisch voorgesteld. Tags zijn per recept aanpasbaar/verwijderbaar, gelden alléén voor dat recept en zijn zichtbaar in recept én weekmenu-weergave (#60) — niet in de algemene productlijst.
4. **Eenheidsomrekening:** automatisch via tabellen (1 dl = 10 cl, 1 el = 3 tl, g/kg); het getal is handmatig te corrigeren en wordt opgeslagen bij het ingrediënt. Niet-converteerbare eenheden → waarschuwing; ongeldige hoeveelheid (leeg/negatief/niet-numeriek) → validatiefout, geen opslag.
5. **Undo:** een merge kan binnen dezelfde sessie ongedaan worden gemaakt (in-memory undo-stack); na het afsluiten van de sessie is de merge permanent. Falende opslag → rollback.
6. **Local-first per huishouden (ADR-009/ADR-010):** producten, merges, per-recept tags en undo zijn strikt gescheiden per huishouden in localStorage; alles werkt offline. Een merge in huishouden A beïnvloedt huishouden B niet.

## Gevolgen
- Nieuwe module `src/productNormalisatie.js` (pure logica, testbaar in Node) + sync-check in `src/app.js`.
- Tests in `tools/test-product-normalisatie.cjs`; CACHE_VERSION bump in de service worker.
- #58 (timetags), #60 (weekmenu-weergave) en #48 (EAN/voedingswaarden) bouwen op dit productmodel; implementatievolgorde #59 → #58 → #60 → #48.
- Buiten scope: EAN/voedingswaarden (#48), AI/afbeeldingen, bulk-import, permanente history van merges, gedeelde productdatabase over huishoudens heen.
