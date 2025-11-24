# Changelog

Všechny významné změny v projektu Notch budou dokumentovány v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/),
a projekt dodržuje [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.17.0] - 2025-11-24

### Changed
- **UI Konzistence**: Sjednoceny akční tlačítka (Like/Dismiss) napříč celou aplikací
  - `DiscoveryView`: Zachován styl pouze s ikonami
  - `PublicProfileView`: Odstraněn text z tlačítek, ponechány pouze ikony
  - Tlačítko galerie zůstává uprostřed s textem pro lepší UX
- Design tlačítek nyní konzistentně používá:
  - Kulaté tlačítko s ikonou X pro dismiss/ignorovat
  - Kulaté tlačítko se srdíčkem pro like
  - Tlačítko galerie uprostřed s ikonou a textem

### Technical
- Aktualizován layout tlačítek v `PublicProfileView.tsx` na grid 4 sloupce (1-2-1)
- Jednotný přístup k hover efektům a transitions

## [2.16.7] - 2025-11-24

### Fixed
- Oprava zobrazení notifikací
- Integrace notifikačního panelu s chaty

## Starší verze

Starší změny před verzí 2.16.7 nebyly systematicky zaznamenávány.
