# ADR-023: Meertalige GUI (Nederlands standaard, en/fr/de)

## Status
Geaccepteerd (2026-11-27)

## Context
De app was alleen in het Nederlands. De GUI-taal moet instelbaar zijn per huishouden,
zonder dat dat de data (recepten/producten/voorraad) raakt — migratie van data is
 expres buiten scope.

## Besluit
1. **Taallaag in `src/i18n/`**: `index.js` met `t(key, vars)`, `setLanguage()`,
   `getLanguage()`, `LANGUAGES` (nl/en/fr/de) en dag-/maandnamen per taal; dictionaries
   `nl.js`, `en.js`, `fr.js`, `de.js`.
2. **Sleutels zijn de Nederlandse tekst** (natural keys, gettext-stijl): de bundler
   (ADR-022) wikkelt JSX-teksten en tekst-attributen automatisch in `__t("NL tekst")`.
   Dynamische strings in code gebruiken `t("NL tekst met {plaatsaanduiding}", { … })`.
   `nl.js` bevat alle sleutels met de NL-waarde; `en/fr/de.js` de vertalingen.
   Fallback: actieve taal → nl → de sleutel zelf (dus NL-weergave is altijd exact).
3. **Instelling `settings.language`** (`"nl" | "en" | "fr" | "de"`, default `"nl"`),
   genormaliseerd in `normalizeSettings` (ongeldig/ontbrekend → `"nl"`). Kiest de
   gebruiker in Instellingen via de kaart "Taal" (radio-lijst). De taal wordt
   toegepast op de GUI (`t()`, dag-/maandnamen) en op `<html lang>`, `<title>` en
   meta-description (via useEffect). Geen datamigratie nodig: oude data zonder
   `language` krijgt automatisch `"nl"`.
4. **Data blijft onvertaald**: receptnamen, productnamen, categorieën, tags, vrije
   tekst en het weekmenu zijn gebruikersdata en worden niet vertaald.
5. **Tests**: `tools/test-i18n.cjs` — NL default, en/fr/de rendering, schakelen via
   de Instellingen-radio, ongeldige taal → NL, dictionary-pariteit (alle NL-sleutels
   vertaald) en `t()`-fallbacks.

## Gevolgen
+ GUI in te stellen op Engels, Frans of Duits; nieuwe teksten worden door de bundler
  automatisch als sleutel geëxtraheerd (voeg de vertaling toe in en/fr/de.js).
+ Nederlands gedrag is bit-identiek gebleven (fallback = sleutel = NL-bronstring;
  geverifieerd met de bestaande tests).
- De NL-tekst staat als sleutel in de code (natural keys); vertalingen staan
  volledig gescheiden in `src/i18n/*.js`.
