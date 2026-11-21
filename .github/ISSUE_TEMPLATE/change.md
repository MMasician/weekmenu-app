---
name: Change-aanvraag
about: Voorgestelde change voor de weekmenu-app. Zie docs/domeinproces.md voor de workflow.
title: ''
labels: needs-approval
---

> Vul alleen de **seed** hieronder in (doel + richting). De agent vult de overige
> secties aan tot de volledige Definition of Ready en maakt de mocks
> (`docs/ux/<onderwerp>/` + VOORSTEL.md) vóór implementatie. Na approval van de
> seed zet de eigenaar het label `needs-approval` om in `ready`.

## Seed — door de indiener (mens of agent)

### Doel / probleem
<!-- 1–2 zinnen: wat moet er veranderen en waarom? -->

### Richting van de wijziging
<!-- Wat moet er ongeveer gebeuren? (bijv. "boodschappen-tab compacter", "nieuwe filter op recepten") -->

### Context (optioneel)
<!-- Links naar docs/SPECS.md, een ADR, docs/ux/..., of een bestaand issue -->

## Rest van de DoR — aan te vullen door de agent, te accorderen door de eigenaar

### Acceptatiecriteria
<!-- Concreet en testbaar, bijv. Given/When/Then -->
- [ ]
- [ ]

### Scope
- Getroffen tab(s)/onderdelen:
- Buiten scope:

### UX / mocks
<!-- Door de agent: mocks in docs/ux/<onderwerp>/ + VOORSTEL.md, of "geen UI-wijziging" -->

### Randgevallen
- [ ] Lege state
- [ ] Foutafhandeling
- [ ] Offline gedrag
- [ ] Per-huishouden-instellingen (ADR-009/ADR-010)

### Open vragen
<!-- of: "geen open vragen" -->

### Verificatie
- [ ] Tests uitgebreid in `tools/test-*.cjs`
- [ ] `npm run verify` geslaagd (build + sync-check + tests + lint + typecheck)
- [ ] CI groen (test/quality/security, ADR-014)

### Afhankelijkheden
<!-- Blokkeert dit issue iets anders, of hangt het af van een ander issue? -->
