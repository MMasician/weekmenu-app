# ADR-003: Twee vaste boodschappenruns

## Status
Geaccepteerd

## Context
Gekookt wordt er voor twee boodschappenmomenten: zaterdag (groot) en
woensdag (tussendoor).

## Besluit
`SHOP_RUNS` deelt de week hard in: run "zaterdag" dekt dagen 0-3
(za-di), run "woensdag" dekt dagen 4-6 (wo-vr). Ingredienten van een
gerecht vallen in de run van de dag waarop het gerecht staat.
Verder per run: extra vrije artikelen, afvinkboxen en de sectie
"Standaardvoorraad aanvullen" (voorraadtekorten).

## Gevolgen
+ Lijst past bij het echte winkelmoment.
- Versproducten voor einde week zitten in de zaterdagrun; bij behoefte aan
  meer runs moet SHOP_RUNS worden uitgebreid.
