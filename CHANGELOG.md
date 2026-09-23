# Changelog

## v0.2.0 — Bugfixes en compacter na eerste test

**Fixes:**
- `getCardSize()` gooide altijd een fout door een destructuring-bug
  (`_computeGroups()` geeft `{ groups, broken }` terug, niet een array) —
  de masonry-view kon hierdoor de kaartgrootte niet goed inschatten
- De rotatie op smalle schermen zat op de verkeerde as (de kolomkoppen /
  entity-namen werden 90° gekanteld) en gaf het optisch effect dat X en Y
  omgewisseld waren — verwijderd. Kolomkoppen (horizontale as) staan nu
  altijd rechtop
- Rijlabels (opties, verticale as) kantelen nu 30° zodra de tekst langer
  is dan 10 tekens, zodat een compacte rijhoogte leesbaar blijft — dit kon
  niet visueel getest worden zonder live Home Assistant, dus graag checken
  of het niet overlapt met de rij erboven/onder

**Compacter:**
- Kleinere cellen, kleinere labels, minder padding en gap — het balletje
  blijft hetzelfde, de vakken eromheen zijn een stuk kleiner

**Verduidelijkt (geen codewijziging):**
- 1 entity was al genoeg als minimum in v0.1.0 — nu ook expliciet in de
  README
- De "Visual editor not supported"-melding is verwacht gedrag: er is nog
  geen `getConfigElement()` gebouwd, geen bug. Config gaat voorlopig via
  YAML; een echte visuele editor is genoeg werk om als eigen stap te doen
  in plaats van in deze bugfix-ronde mee te nemen

**Cache:**
- Versie zit nu overal in de metadata (`package.json`, dit changelog, een
  console-log bij laden). Bestandsnaam blijft `matrix-card.js` — anders
  moet je ook telkens de resource-URL/dashboard-config aanpassen. Gebruik
  in plaats daarvan `?v=0.2.0` achter de resource-URL, zie README

## v0.1.0 — Eerste MVP

Basisversie van de matrix-kaart, gericht op `select`-entities.

**Werkt:**
- Eén of meer `select`-entities als kolommen configureren
- Automatisch clusteren: entities met exact dezelfde `options`-lijst
  (zelfde volgorde) worden samen als één grid getekend; een entity met een
  unieke optielijst krijgt vanzelf zijn eigen 1-koloms grid — geen aparte
  layout-modus nodig
- Klikken op een cel roept `select.select_option` aan
- Optimistische UI: cel toont direct de nieuwe keuze; valt terug naar de
  vorige staat met een zichtbare foutindicatie als de service-call faalt of
  er na 8s geen bevestiging is
- Ontbrekende of niet-`select`-entities worden zichtbaar als fout getoond
  in plaats van de hele kaart te breken
- Titel per kaart instelbaar, naam per kolom optioneel overschrijfbaar

**Nog niet gebouwd (bewust uitgesteld):**
- Switch-entities als losse cel (voor apparatuur zonder `select`-domain)
- Secundaire entities per kolom (bijv. lock-switch, gain als `number`)
- Icoon-labels en geroteerde labels op de verticale as
- Losstaande "list"-modus die clustering uitschakelt
- Visuele config-editor (YAML-only voor nu)

Geen tests meegepubliceerd in deze repo; lokaal is alleen een syntax-check
(`node --check`) gedraaid, geen functionele test in een live Home Assistant.
