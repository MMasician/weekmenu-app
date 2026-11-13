# ADR-001: Single-file React-app, geen dependencies

## Status
Geaccepteerd

## Context
De app wordt gegenereerd en onderhouden vanuit een Vibe Canvas. De
runtime daarvan laadt React maar geen npm-ecosysteem.

## Besluit
De volledige app is n bestand (`src/App.jsx`): data, state en UI in
n React-component, zonder externe packages.

## Gevolgen
+ Directe uitwisselbaarheid tussen repo en Canvas (copy-paste).
+ Geen build-step of node_modules nodig.
- Bij groei van de app kan het bestand groot worden; dan eventueel opsplitsen.
