# NXTFASE Quick Scan

Gratis, interactieve zelf-scan (16 stellingen) voor de NXTFASE-website. Alles draait
client-side (geen Operations Hub, geen server) en stuurt de lead + antwoorden via de
HubSpot Forms Submission API (v3) naar je CRM.

## Wat zit erin

```
nxtfase-quick-scan/
├── module/
│   └── quick-scan.module/       ← upload deze map via Design Manager
│       ├── module.html
│       ├── module.css
│       ├── module.js
│       ├── meta.json
│       └── fields.json
├── standalone/
│   └── nxtfase-quick-scan-standalone.html   ← los bestand, open 'm gewoon in je browser
└── README.md
```

## Status van je gekoppelde HubSpot-account

Ik heb de gekoppelde HubSpot-account gebruikt om zo veel mogelijk automatisch te
regelen. Resultaat:

- ✅ **Portal-ID bevestigd:** `145441377` (EU-datacenter, `app-eu1.hubspot.com`,
  valuta EUR) — staat al ingevuld in `module.js` en de standalone versie.
- ✅ **Landingspagina aangemaakt in je portal** (na reautorisatie): een concept
  pagina "Gratis Quick Scan" op basis van je eigen `nxtfase-theme`, op
  `nxtfase.hs-sites-eu1.com/quick-scan` (content-ID `430963027134`, **nog niet
  gepubliceerd**). Hero, pijnpunten, aanpak-stappen en de diensten-sectie zijn al
  ingevuld met scan-specifieke copy. Open 'm in de editor:
  `https://app.hubspot.com/pages/145441377/editor/430963027134`
- ⛔ **De interactieve scan zelf kon ik niet via de API op de pagina zetten.**
  Alle manieren om custom HTML/CSS/JS via de landingspagina-API in te voegen
  zijn door HubSpot zelf geblokkeerd: `@hubspot/raw_html` en `@hubspot/raw_jinja`
  renderen niet vanuit een insert-actie ("content does not render from insert" —
  een harde regel, geen bug), en `@hubspot/rich_text` knipt `<script>`- en
  `<style>`-tags eruit. Dit is dus geen rechten-probleem maar een platformregel:
  er bestaat geen API-pad om werkende custom JS op een pagina te krijgen. Je
  moet de module daarom nog steeds handmatig via **Design Manager** uploaden
  (stap 4) en op de pagina slepen — ik heb alvast een `id="quick-scan"` anchor
  in de module gezet zodat de "Start de gratis Quick Scan"-knop in de hero er
  automatisch naartoe scrollt zodra je 'm ergens op de pagina plaatst.
- ⛔ **Formulieren aanmaken via de API is sowieso niet beschikbaar** voor deze
  integratie, los van rechten. Wel kon ik je bestaande formulieren opzoeken —
  je hebt al een paar formulieren (o.a. "NXTFASE CTA") en een Meetings-link,
  maar geen daarvan heeft de scan-specifieke score-velden. Formulier en Form
  GUID blijven dus een handmatige stap (2 minuten, zie stap 2).
- ⛔ **Custom properties aanmaken** kan ook niet via deze koppeling — geverifieerd
  dat de 6 custom properties (`scan_score_strategie` etc.) nog niet bestaan in dit
  portal. Moet je zelf doen in de HubSpot-UI (stap 1).
- ⚠️ **Geen browser-automatisering met een ingelogde HubSpot-sessie beschikbaar.**
  Ik heb alleen een kale, niet-ingelogde headless browser (voor lokaal testen van
  de standalone HTML) en een read-only webfetch-tool die geen ingelogde pagina's
  kan laden — dus ik kan niet namens jou inloggen om het formulier of de
  properties via de UI te klikken. Die twee stappen (1 en 2 hieronder) moet je
  zelf in de HubSpot-UI doen.

## Stap 1 — Maak de contactproperties aan in HubSpot

Ga naar **Instellingen → Eigenschappen → Contacteigenschappen → Eigenschap maken** en
maak de volgende properties aan **voordat** je het formulier instelt:

| Interne naam                 | Label (vrij te kiezen) | Type            |
|-------------------------------|-------------------------|-----------------|
| `scan_score_strategie`        | Quick Scan – Richting    | Getal (Number)  |
| `scan_score_mensen`           | Quick Scan – Je team     | Getal (Number)  |
| `scan_score_processen`        | Quick Scan – Hoe je werkt| Getal (Number)  |
| `scan_score_systemen`         | Quick Scan – Je tools    | Getal (Number)  |
| `scan_score_totaal`           | Quick Scan – Totaalscore | Getal (Number)  |
| `scan_antwoorden`             | Quick Scan – Antwoorden  | Tekst, meerdere regels (de JSON-string met alle 16 antwoorden kan lang worden) |

## Stap 2 — Maak het HubSpot-formulier

1. Maak een nieuw formulier (Marketing → Formulieren). Type maakt niet uit, want het
   formulier zelf wordt niet getoond — alleen de portal ID en form GUID worden gebruikt
   om via de API in te sturen.
2. Zet er in elk geval de standaardvelden **E-mailadres**, **Voornaam** en
   **Bedrijfsnaam** op.
3. Voeg ook de 6 velden uit stap 1 toe aan het formulier (mag als verborgen/hidden
   veld). De Forms Submission API matcht op interne naam — als een veld niet op het
   formulier staat, kan HubSpot de inzending soms alsnog weigeren of het veld negeren,
   dus zet ze er expliciet op.
4. Haal de **Portal ID** en **Form GUID** op:
   - Portal ID: rechtsboven in HubSpot naast je accountnaam, of in de URL
     (`.../123456/...`).
   - Form GUID: open het formulier, kijk in de URL naar het lange ID
     (`.../edit/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`).
5. **GDPR-check:** als jouw HubSpot-account verwerkingstoestemming (consent) verplicht
   heeft staan voor formulieren, moet je in `module.js` ook een `legalConsentOptions`
   blok toevoegen aan de `payload` in `handleSubmit`/`submitToHubSpot`. Dat is met
   opzet niet standaard ingebouwd, omdat het per account/formulier-instelling
   verschilt. Check dit voordat je live gaat.

## Stap 3 — Vul de constants in

Open `module/quick-scan.module/module.js` (en optioneel ook
`standalone/nxtfase-quick-scan-standalone.html`, die bevat dezelfde code inline) en
vul bovenin in:

```js
var PORTAL_ID = '145441377';   // ✅ al ingevuld, bevestigd via de gekoppelde account
var FORM_GUID = 'FORM_GUID';   // → nog in te vullen na stap 2
var MEETING_URL = 'MEETING_URL'; // → link naar je HubSpot meetings-agenda voor de Quick Process Scan
```

Zolang `FORM_GUID` nog op de placeholder-tekst staat, simuleert het script een
geslaagde inzending (met een `console.warn`) in plaats van echt naar HubSpot te
posten — zo kun je de hele flow lokaal testen zonder live formulier.

## Stap 4 — Upload de module

Upload de map `module/quick-scan.module/` via **Design Manager** (of met de HubSpot
CLI: `hs upload module/quick-scan.module quick-scan.module`). Sleep de module
vervolgens op de pagina "Gratis Quick Scan"
(`https://app.hubspot.com/pages/145441377/editor/430963027134`) op de plek waar
"Start de gratis Quick Scan" naartoe moet scrollen — de module heeft al
`id="quick-scan"`, dus de hero-knop werkt automatisch zodra hij ergens op die
pagina staat. Publiceer de pagina pas nadat je `FORM_GUID` hebt ingevuld (stap 3),
anders komen inzendingen niet in je CRM terecht.

## Lokaal testen

Open `standalone/nxtfase-quick-scan-standalone.html` gewoon dubbelklikkend in je
browser — geen server nodig. Doorloop de scan, vul het e-mailformulier in en
controleer in de browserconsole (F12) of de simulatie-log klopt met wat je zou
verwachten in HubSpot. Zodra je de echte `PORTAL_ID`/`FORM_GUID` invult, doet
hetzelfde bestand een echte inzending.

## Hoe de scan werkt

- 16 stellingen, 4 per categorie, in willekeurige (vaste, gemengde) volgorde zodat
  bezoekers de categorieën niet doorzien.
- Antwoorden: **Klopt** (2 punten), **Soms** (1 punt), **Klopt niet** (0 punten) —
  hoe hoger, hoe meer pijn.
- Categorieën zijn intern Strategie / Mensen / Processen / Systemen, maar worden aan
  de bezoeker getoond als **Richting / Je team / Hoe je werkt / Je tools**.
- Na de 16e vraag volgt de e-mail-gate (voornaam + e-mail verplicht, bedrijfsnaam
  optioneel). Pas na een geslaagde inzending zie je de resultaten.
- Score-banden op de totaalscore (max 32):
  - 0–10: "Je zaak staat er goed voor"
  - 11–21: "Er lekt tijd en geld weg op een paar plekken"
  - 22–32: "Je verliest structureel avonden aan dingen die vanzelf zouden moeten gaan"
- Resultatenscherm toont per categorie een balk (max 8 punten) zodat de bezoeker ziet
  waar het lekt, plus één CTA-knop naar `MEETING_URL`.

## Aanpassen

Alle teksten (stellingen, band-copy, knoppen) staan als leesbare strings bovenin
`module.js`. Wil je de teksten aanpassen, doe dat in `module.js` en herbouw
vervolgens (kopieer/plak) de standalone versie, of laat de twee gewoon los van elkaar
lopen als je alleen met de module in HubSpot werkt.
