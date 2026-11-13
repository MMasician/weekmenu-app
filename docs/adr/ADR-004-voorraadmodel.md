# ADR-004: Voorraad met have/want en binaire kruidenla

## Status
Geaccepteerd

## Context
De gebruiker wil dat tekorten automatisch op de boodschappenlijst komen,
maar voor kruiden is een getal niet zinvol.

## Besluit
- Voorraaditems: `{ name, cat, have, want }` met categorien
  `STOCK_CATS = [kast, koel, fruit, kruiden]`.
- Tekort = `have < want` -> automatisch op de boodschappenlijst met
  "(n van want)".
- Kruidenla: binaire toggle (present ja/nee); toggle "aan" = tekort.
- "Alles aangevuld" zet have = want; "Standaardlijst terug" reset naar
  `STOCK_DEFAULT`.
- Foto-herkenning van voorraad is buiten de app gehouden; workaround:
  foto in de chat, Vibe zet de voorraadstatussen.

## Gevolgen
+ Consistent "tekort"-model over alle categorien.
+ Kruiden zonder zinloze nummers.
