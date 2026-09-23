# Matrix Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![Validate](https://github.com/Videobarista/matrix-card/actions/workflows/validate.yml/badge.svg)
![CodeQL](https://github.com/Videobarista/matrix-card/actions/workflows/codeql.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

Home Assistant Lovelace-kaart die één of meer `select`-entities toont als een
klikbare routing-matrix: rijen zijn de beschikbare opties, kolommen zijn de
entities. Entities met exact dezelfde optielijst clusteren automatisch samen
in één grid; een entity met een unieke optielijst krijgt vanzelf zijn eigen
kolom, zonder aparte configuratie.

Geen build-stap nodig — dit is één self-contained JS-bestand.

## Installatie via HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Videobarista&repository=matrix-card&category=plugin)

Of handmatig:
1. HACS → Frontend → menu rechtsboven → Custom repositories
2. URL: `https://github.com/Videobarista/matrix-card`, categorie: Plugin
3. Installeer "Matrix Card" en herlaad je browser

## Configuratie

```yaml
type: custom:matrix-card
title: Video matrix
columns:
  - entity: select.output_1
    name: Scherm 1        # optioneel, anders friendly_name
  - entity: select.output_2
  - entity: select.teranex_input
```

| Optie | Verplicht | Beschrijving |
|---|---|---|
| `columns` | ja | Lijst van kolommen, elk met minstens `entity` — **1 kolom is al genoeg**, dan krijg je een 1-koloms grid |
| `columns[].entity` | ja | Een `select.*`-entity |
| `columns[].name` | nee | Label boven de kolom; anders `friendly_name` |
| `title` | nee | Titel boven de kaart |

## Bestand vervangen / updaten

Bij handmatig kopiëren naar `www/` (zonder HACS) cachet de browser
`matrix-card.js` agressief. Zet de resource-URL op
`/local/matrix-card.js?v=0.2.0` en hoog dat versienummer op bij elke
volgende update — betrouwbaarder dan alleen een harde refresh. De kaart
logt zijn eigen versie in de devtools-console (`[matrix-card] v0.2.0
geladen`) zodat je kunt controleren of de browser echt de nieuwe versie
heeft opgehaald.

## Beperkingen in deze versie

- Alleen `select`-entities; andere domeinen worden zichtbaar als fout getoond,
  niet stilletjes genegeerd
- Geen visuele editor — configuratie gaat via YAML
- Zie `CHANGELOG.md` voor wat er nog op de planning staat

## Brand

Zie `Brand/` — bewust leeg, voeg zelf logo's toe indien gewenst.

## Licentie

MIT, zie `LICENSE`.
