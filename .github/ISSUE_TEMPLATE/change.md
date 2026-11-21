---
name: Change-aanvraag
about: Voorgestelde change voor de weekmenu-app. Wordt opgepakt zodra het label `ready` erop staat (zie docs/domeinproces.md).
title: ''
labels: needs-approval
---

## Definition of Ready

Vul onderstaand in; het issue mag pas het label `ready` krijgen (na approval) als álle punten zijn ingevuld:

- [ ] Doel/probleem beschreven in 1–2 zinnen, met verwijzing naar `docs/SPECS.md`, een ADR of `docs/ux/`
- [ ] Acceptatiecriteria concreet en testbaar
- [ ] Scope begrensd (inclusief wat buiten scope valt)
- [ ] UX: mocks gelinkt of "geen UI-wijziging"
- [ ] Randgevallen benoemd (lege state, foutafhandeling, offline, per-huishouden-instellingen)
- [ ] Geen open vragen (of expliciet gemarkeerd als "tijdens werk te beslissen")
- [ ] Verificatiepad bepaald (tests + `npm run verify` + CI)
- [ ] Afhankelijkheden genoteerd

## Doel / probleem

<!-- 1–2 zinnen: wat moet er veranderen en waarom? -->

## Acceptatiecriteria

<!-- Concreet en testbaar, bijv. Given/When/Then -->

- [ ]
- [ ]

## Scope

- Getroffen tab(s)/onderdelen:
- Buiten scope:

## UX / mocks

<!-- Link naar mocks in `docs/ux/<onderwerp>/` + VOORSTEL.md, of: "geen UI-wijziging" -->

## Randgevallen

- [ ] Lege state
- [ ] Foutafhandeling
- [ ] Offline gedrag
- [ ] Per-huishouden-instellingen (ADR-009/ADR-010)

## Open vragen

<!-- of: "geen open vragen" -->

## Verificatie

- [ ] Tests uitgebreid in `tools/test-*.cjs`
- [ ] `npm run verify` geslaagd (build + sync-check + tests + lint + typecheck)
- [ ] CI groen (test/quality/security, ADR-014)

## Afhankelijkheden

<!-- Blokkeert dit issue iets anders, of hangt het af van een ander issue? -->
