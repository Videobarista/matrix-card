# Security Policy

## Supported Versions

Alleen de laatste gepubliceerde release wordt actief onderhouden. Update naar
de nieuwste versie via HACS voordat je een kwetsbaarheid meldt.

## Reporting a Vulnerability

Dit is een hobbyproject zonder eigen security-team, maar meldingen worden
serieus genomen.

- Meld kwetsbaarheden bij voorkeur via GitHub's "Report a vulnerability"
  (Security tab → Advisories) zodat het privé blijft tot er een fix is.
- Geen reactie binnen 14 dagen? Open dan gerust een gewone GitHub issue.
- Dit project raakt geen inloggegevens, geldstromen of persoonsgegevens aan —
  het is een Lovelace-kaart die alleen entity-state leest en
  `select.select_option` aanroept binnen je eigen Home Assistant-instantie.
  Impact van een kwetsbaarheid is dus in de praktijk beperkt tot de dashboard-
  weergave zelf (bijv. een XSS via een kwaadaardige entity- of optienaam).

Er is geen bug bounty; credit in de release notes is de beloning.
