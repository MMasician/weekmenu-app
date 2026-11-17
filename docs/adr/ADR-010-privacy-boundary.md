# ADR-010: Privacy-grens — wat in de repo staat en wat lokaal/privé blijft

## Status
Accepted (2026-11-16)

## Context
De app wordt breder dan alleen het eigen huishouden ingezet, maar household-specifieke context (gezinssamenstelling, eetroutines, boodschappenmomenten, voorkeuren) is vertrouwelijk en mag NOOIT in GitHub terechtkomen — ook niet in een private repo. Vibe/agents moeten er wél rekening mee kunnen houden bij werk aan deze app.

## Besluit
1. **Repo/GitHub bevat alleen de algemene app.** Geen household-specifieke gegevens (namen, aantallen personen, routines) in code, docs, issues of PRs. INTENT/SPECS beschrijven alleen generiek, instelbaar gedrag (ADR-009).
2. **Privé household-context leeft buiten GitHub**, op twee plekken:
   - een **privé Mistral Studio Skill** (alleen zichtbaar voor de eigenaar), met een description die activeert op taken over `weekmenu-app`;
   - optioneel een **project-lokale skill** `.vibe/skills/<naam>/SKILL.md` in de lokale clone van de repo — `.vibe/` staat in `.gitignore` en wordt dus nooit gecommit of gepusht.
3. **App-data blijft op het apparaat**: settings, recepten, voorraad, menu, afvinkjes en prijzen staan in localStorage (`weekmenu-app-v1`) en gaan nooit naar een server.
4. **Online alleen voor niet-privé data**: het optioneel ophalen van actuele supermarktprijzen mag (prijzen zijn geen household-data); zonder netwerk werkt de app volledig (offline-first, ADR-007). Household-data wordt nooit naar externe services gestuurd. Dit versoepelt ADR-008: de lokale prijzendatabase blijft als cache/fallback, online ophalen is toegestaan.

## Gevolgen
+ Agents (Vibe) kunnen privé-context meenemen zonder dat deze in GitHub belandt.
+ Andere households kunnen de app gebruiken zonder iets van elkaar te zien.
+ `.gitignore` bevat `.vibe/` als vangnet tegen per ongeluk committen.
