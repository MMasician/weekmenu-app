# Mock — Productenlijst (tab Producten)

## v1 — Extra kolom "varianten"

```
+--------------------------------------------------------------+
| Producten                          [Zoeken...]  [＋ Nieuw]     |
+--------------------------------------------------------------+
| Naam              | Default eenheid | Varianten | Acties       |
+--------------------------------------------------------------+
| Tomaten           | blikje          | 3         | [Samenvoegen]|
| Tomaten, rood     | blikje          |           | [Samenvoegen]|
| Tomaten, cherry   | 250 g           |           | [Samenvoegen]|
| Melk              | l               | 2         | [Samenvoegen]|
| Melk, halfvol     | l               |           | [Samenvoegen]|
+--------------------------------------------------------------+
```
Nadeel: kolom "Varianten" verbergt de groepering; actie staat ver van de items.

## v2 — Gegroepeerde lijst

```
+--------------------------------------------------------------+
| Producten                          [Zoeken...]  [＋ Nieuw]     |
+--------------------------------------------------------------+
| ▼ Tomaten (3 duplicaten)                                     |
|     • Tomaten            — blikje                           |
|     • Tomaten, rood      — blikje                           |
|     • Tomaten, cherry    — 250 g          [Samenvoegen...]  |
| ▶ Melk (2 duplicaten)                                        |
+--------------------------------------------------------------+
```
Nadeel: bij veel duplicaten wordt de lijst lang en onoverzichtelijk.

## v3 — ✅ AANBEVOLEN — Normalisatie-indicator + checkbox-selectie

```
+--------------------------------------------------------------+
| Producten                          [Zoeken...]  [＋ Nieuw]     |
+--------------------------------------------------------------+
| ☐ Tomaten            blikje     ⚠ zelfde na normalisatie ─┐  |
| ☐ Tomaten, rood      blikje     ⚠ zelfde na normalisatie  ├─▶ [Samenvoegen (2)]
| ☐ Tomaten, cherry    250 g      ⚠ zelfde na normalisatie ─┘  |
| ☐ Melk               l          ⚠ zelfde na normalisatie ─┐  |
| ☐ Melk, halfvol      l          ⚠ zelfde na normalisatie ─┘  |
|                                                              |
| (lege state, geen duplicaten:)                               |
|   "Geen dubbelingen gevonden — alle productnamen zijn uniek  |
|    na normalisatie."                                         |
+--------------------------------------------------------------+
```
- ⚠-badge toont aan dat de naam na normalisatie (lowercase, trim, zonder
  "rood"/"zakje"/"optioneel") gelijk is.
- Bij ≥2 concomitant-selected met zelfde `normalizedName` verschijnt de
  actie "Samenvoegen (n)".
