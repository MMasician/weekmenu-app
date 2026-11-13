# Intentie

## Doel
Een simpel huishoudelijk hulpmiddel voor het gezin: automatisch een weekmenu
samenstellen uit een vaste receptenpool en daaruit, plus de voorraadstatus,
met n klik een boodschappenlijst genereren voor twee vaste boodschappenmomenten.

## Gebruikerswensen
1. Week start op **zaterdag** (boodschappen dag 1) met tweede boodschappenrun op **woensdag**.
2. Vaste regels: **vis op zaterdag en woensdag**; de overige dagen een mix van
   vegetarisch en vlees, met instelbare verhouding (standaard 2 vega / 3 vlees).
3. Recepten uit het eigen Word-document "Recepten 2 per blad" (52 recepten).
4. Dagen kunnen vergrendeld worden; per dag kan een gerecht handmatig worden
   overschreven (dropdown met alle recepten behalve categorie "extra").
5. Boodschappenlijst gegroepeerd per dag en per gerecht, plus vrije extra
   artikelen en een "Standaardvoorraad aanvullen"-sectie, met afvinkboxen.
6. Voorraadbeheer (kast, koel, fruit, kruiden): tekorten komen automatisch op
   de boodschappenlijst ("n van want"). Kruidenla werkt met binaire toggle
   (aanwezig ja/nee). Knoppen "Alles aangevuld" en "Standaardlijst terug".
7. Alles lokaal (geen account, geen server): status bewaart in localStorage.
8. Per recept bewerkbare bereidingstijd (minuten) en vrije tekst voor het
   koken (bijv. "stomen", "oven 200C").

## Niet-functionele wensen
- Klein en overzichtelijk: n React-component, geen dependencies.
- Toekomstige uitbreidingen via Vibe met minimale tokens: daarom staan intent,
  specs, ADR's en tests in deze repo als context.
