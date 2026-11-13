# ADR-002: Receptregels per dagcategorie

## Status
Geaccepteerd

## Context
De gebruiker wil vaste patroonregels: vis op zaterdag en woensdag, op de
overige dagen een instelbare vega/vlees-mix.

## Besluit
- `FISH_DAYS = [0, 4]` (zaterdag, woensdag) -> categorie vis, automatisch.
- `OTHER_DAYS = [1, 2, 3, 5, 6]` -> vega/vlees volgens instelbare mix
  (default 2 vega, 3 vlees; som afgekapt op 5 dagen).
- Categorie "extra" (Speelklei) komt nooit automatisch in het menu en staat
  niet in de override-dropdown.
- Vergrendelde dagen en handmatige overrides hebben voorrang op regeneratie.

## Gevolgen
+ Voorspelbaar weekpatroon zonder handwerk.
+ Flexibiliteit via mix-instelling, vergrendeling en override.
