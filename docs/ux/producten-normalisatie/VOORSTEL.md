# VOORSTEL — productnormalisatie (issue #59)

## Aanbeveling (owner-akkoord in issue #59)
- **01-productenlijst: versie A** — gegroepeerde duplicaten met badge.
- **02-samenvoegen-producten: versie A (herzien)** — compacte weergave met info-icoontjes (ℹ️ ⟲ ✕) in plaats van beschrijvende labels; logische per-recept tag-voorspelling zoals in versie D (`melk` vs `volle melk` → `vol`), tag per recept toepasbaar/uit te schakelen/handmatig aan te passen; hoofdproduct subtiel als 'voorgesteld' (kanjer niet nadrukkelijk benadrukt).
- **03-recept-ingrediënt: versie B** — inline eenheidsomrekening met automatische hoeveelheid + per-recept tags.

## Rationale
- **Kanjer-heuristiek:** kortste benaming met de minste woorden → bij gelijke lengte meest gebruikt in recepten → anders alfabetisch eerste. In de dialog als voorstel (ℹ️), niet als nadrukkelijke kanjer-badge.
- **Tag-logica:** tags worden logisch afgeleid uit het benamingsverschil (`volle melk` vs `melk` → `vol`; `magere yoghurt` → `mager`). Willekeurige woorden zoals `rood`/`zakje`/`optioneel` worden nóóit automatisch voorgesteld; ze zijn wel handmatig toe te voegen. Tags zijn per recept aanpasbaar/verwijderbaar en zichtbaar in recept én weekmenu-weergave (#60).
- **Eenheidsomrekening:** 1 dl = 10 cl (volume: ml/cl/dl/l/el/tl; massa: mg/g/kg); het getal wordt automatisch omgerekend en is handmatig te corrigeren.
- **Undo:** een samenvoeging is binnen dezelfde sessie ongedaan te maken (⟲); daarna permanent.
- **Compacte weergave:** beschrijvende labels zoveel mogelijk vervangen door informatie-icoontjes (owner-wens bij versie A).

## Status
Goedgekeurd door de owner in issue #59 → implementatie (branch vibe/issue-59-normalisatie-producten). Volgorde: #59 → #58 → #60 → #48.
