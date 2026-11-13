# ADR-005: localStorage met versiesleutel en migratie

## Status
Geaccepteerd

## Context
De app heeft geen backend; state moet bewaard blijven zonder account.

## Besluit
Alle state (menu, vergrendelingen, overrides, vinkjes, extra artikelen,
voorraad) wordt geserialiseerd naar localStorage onder sleutel
**`weekmenu-app-v1`**. Bij het laden normaliseert `normalizeStock` oudere
of incomplete voorraaddata naar het huidige formaat.

## Gevolgen
+ Werkt offline, geen privacy- of kostenaspecten.
- Bij formatwijzigingen: versiesleutel ophogen of migratie uitbreiden,
  anders kan oude state onbruikbaar worden.
