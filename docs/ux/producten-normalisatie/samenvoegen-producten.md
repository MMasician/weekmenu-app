# Mock — Dialog "Producten samenvoegen"

Geselecteerde producten: Tomaten (blikje), Tomaten, rood (blikje), Tomaten, cherry (250 g)

## v1 — 3-staps wizard

```
Stap 1/3: Kies hoofdproduct
  ○ Tomaten          (blikje)
  ○ Tomaten, rood    (blikje)
  ○ Tomaten, cherry  (250 g)
  [Volgende ➜]

Stap 2/3: Receptkoppelingen
  "Tomaten" hangt aan 4 recepten, "Tomaten, rood" aan 2, ...
  [x] Alle recepten overhevelen naar hoofdproduct
  [Volgende ➜]

Stap 3/3: Per-recept tags
  [recept]          [tags................]
  [Volgende ➜] -> [Samenvoegen]
```
Nadeel: 3 stappen voor een actie die in één scherm kan; kans op afbreken.

## v2 — Dialog, alleen hoofdproduct-keuze

```
+ Samenvoegen (3) ----------------------------------------+
| Hoofdproduct:                                            |
|   ○ Tomaten (blikje) — 4 recepten                        |
|   ○ Tomaten, rood (blikje) — 2 recepten                 |
|   ○ Tomaten, cherry (250 g) — 1 recept                   |
|                                                          |
| [Annuleren]                        [Samenvoegen ➜]       |
+----------------------------------------------------------+
```
Nadeel: geen mogelijkheid voor per-recept tags (kern van het issue!) en geen
preview van eenheid-verschillen.

## v3 — ✅ AANBEVOLEN — Alles in één dialog

```
+ Samenvoegen: 3 productvarianten ------------------------+
| Hoofdproduct (behoudt deze naam + default eenheid):     |
|   ● Tomaten            — blikje — 4 recepten            |
|   ○ Tomaten, rood      — blikje — 2 recepten            |
|   ○ Tomaten, cherry    — 250 g  — 1 recept  ⚠ andere   |
|                                             eenheid     |
|                                                          |
| Per-recept tags (gelden ALLEEN voor dat recept):        |
|   Recept "Pasta rossa"      [rood ✕] [optioneel ✕] [+]  |
|   Recept "Salade"           [cherry ✕] [+]             |
|                                                          |
| Eenheid-conversie preview:                               |
|   "Tomaten, cherry" 250 g -> in recept "Salade":        |
|   [1] [blikje ▾]  (handmatig aanpasbaar; geen auto-     |
|   conversie voor 'blikje'; 1 dl = 10 cl elders wel auto)|
|                                                          |
| [Annuleren]                        [Samenvoegen ➜]       |
+----------------------------------------------------------+
```
- Na merge: `product.recipeTags = { "pasta-rossa": ["rood","optioneel"], "salade": ["cherry"] }`
- Receptkoppelingen van alle varianten worden overgenomen.
- ⚠ markeert eenheid-verschil t.o.v. hoofdproduct.
