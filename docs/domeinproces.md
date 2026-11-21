# Domeinproces: van strategie tot kookdag

De app ondersteunt één doorlopende stroom van vijf stappen, van het bepalen
wat er überhaupt gekookt kan worden tot het daadwerkelijk koken op de dag zelf.
Dit is het algemene, deelbare domeinproces; huishoud-specifieke context (routines,
voorkeuren, gezinssamenstelling) hoort niet in deze repo (ADR-010).

| Stap | Wat er gebeurt | In de app |
|---|---|---|
| **Strategie** | Bepalen welke gerechten gemaakt kunnen worden, waar de planning rekening mee moet houden en hoe voorraad en boodschappen gesorteerd worden | Receptenpool beheren (toevoegen/bewerken/verwijderen, importeren/exporteren) en Instellingen: weekstart, boodschappenmomenten, dagcategorieën (vis/vega/vlees), aantal eters, winkels — zie `docs/SPECS.md` (Recepten, Instellingen per huishouden), ADR-002, ADR-006, ADR-009 |
| **Planning** | Per week de maaltijden plannen die deze week gegeten worden | Weekmenu-tab: automatisch genereren uit dagcategorie (niet herhaald binnen de week waar mogelijk), per dag vergrendelen of vrije tekst (bijv. "eten bij familie"), datumkiezer om weken terug/vooruit te kijken — zie `docs/SPECS.md` (Weekmenu), ADR-012 |
| **Voorbereiding** | Checken welke voorraad aanwezig is en welke ingrediënten al in huis zijn | Voorraad-tab: per locatie producten met have/want, categorie en optionele winkelvoorkeur; tekorten uit de voorraad voeden automatisch de boodschappenlijst — zie `docs/SPECS.md` (Voorraad), ADR-015 |
| **Boodschappen** | In de winkel 1 voor 1 de boodschappen afvinken tot alles binnen is | Boodschappen-tab "van vandaag": lijst van vandaag + aantal dagen, supermarktkeuze, sortering op categorie-volgorde, afvinkboxen met teller, knop "Klaar met winkelen" — zie `docs/SPECS.md` (Boodschappen), ADR-003, ADR-016 |
| **Koken** | Op de dag zelf koken, mits alle ingrediënten in huis zijn | Weekmenu: per gerecht de status ✅ (alles in huis) of ❗ (mist nog), op basis van de afgevinkte boodschappen en de voorraad — zie `docs/SPECS.md` (Boodschappen, Weekmenu) |

## Relatie tussen de stappen

- Strategie levert de **receptenpool en regels** waarmee Planning kan genereren.
- Planning levert de **gerechten van de week**; samen met Voorbereiding (voorraad)
  bepalen die de **boodschappenlijst**.
- Boodschappen afvinken — samen met de voorraad — bepalen de **kookstatus**
  (✅/❗) op de dag zelf.

## Werkwijze: changes via issues (Definition of Ready)

Changes aan de app lopen via GitHub-issues met een vaste workflow:

1. Issue wordt aangemaakt (door mens of agent) met label `needs-approval` via het
   template `.github/ISSUE_TEMPLATE/change.md` (bevat de Definition of Ready).
2. De eigenaar keurt het issue goed: label `needs-approval` vervangen door `ready`.
3. De agent pakt alleen issues met label `ready` op, werkt op een branch
   `vibe/<slug>`, en zet het label op `in-progress`.
4. Mocks-eerst: UX-voorstellen gaan eerst als mocks in `docs/ux/<onderwerp>/`
   met `VOORSTEL.md`; na feedback de code in dezelfde branch.
5. Ter review: label `needs-review`; na merge terug naar `Done`/issue dicht.

Definition of Ready — een issue mag pas op `ready` als álle punten gelden:

- [ ] Doel/probleem beschreven in 1–2 zinnen, met verwijzing naar `docs/SPECS.md`, ADR of `docs/ux/`
- [ ] Acceptatiecriteria concreet en testbaar (Given/When/Then of bullet-lijst)
- [ ] Scope begrensd: welke tab(s)/onderdelen, én expliciet wat buiten scope valt
- [ ] UX: link naar mocks/schets, of "geen UI-wijziging"
- [ ] Randgevallen benoemd: lege state, foutafhandeling, offline, per-huishouden-instellingen
- [ ] Geen open vragen (of expliciet gemarkeerd als "tijdens werk te beslissen")
- [ ] Verificatiepad bepaald: tests in `tools/test-*.cjs`, `npm run verify`, CI groen
- [ ] Afhankelijkheden genoteerd (blokkeert dit issue iets, of hangt het ergens vanaf?)

Definition of Done — een PR is klaar om te mergen als:

- [ ] CI groen: test + sync-check (`src/App.jsx` ↔ `src/app.js`), lint, typecheck, security (ADR-011, ADR-014)
- [ ] Tests uitgebreid in `tools/test-*.cjs`; `npm run verify` geslaagd
- [ ] `docs/SPECS.md` en/of relevante ADR bijgewerkt
- [ ] `src/app.js` geregenereerd via `npm run build` en meegecommit

## Conflicten bij parallel werken

De app-logica staat in één bestand (`src/App.jsx`, ADR-001) en de gecompileerde
`src/app.js` wordt meegecommit, dus parallelle branches conflicten vrijwel zeker
in beide bestanden. Daarom:

- Issues klein houden, per tab/domeinstap; mocks-only branches (`docs/ux/...`)
  mogen wel parallel.
- Eén branch per issue (`vibe/<slug>`), zo snel mogelijk mergen naar `main`;
  andere branches daarna rebasen + `npm run build` + `npm run verify`.
- Maximaal 2–3 open code-branches tegelijk; merges van code-branches altijd
  geserialiseerd (nooit twee tegelijk mergen).
- Bij conflicten: rebase op `main`, daarna `npm run build` (regenereert
  `src/app.js`) en `npm run verify` vóór het pushen.
- Op termijn kan `src/App.jsx` verder worden opgesplitst per domeinstap
  (strategie/planning/voorraad/boodschappen/koken); ADR-001 staat dat toe bij
  groei en het verkleint het conflictvlak.
