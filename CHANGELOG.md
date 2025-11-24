# Changelog

Všechny významné změny v projektu Notch budou dokumentovány v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/),
a projekt dodržuje [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.19.1] - 2025-11-24

### Fixed
- **[DB] Diary Validation Fix:** Uvolněna pravidla pro přidání do Černé Knihy. Nyní stačí **jakákoliv** zpráva v konverzaci (místo striktní oboustranné výměny), což řeší problém s nezobrazováním kontaktů.
- **[DB] Messages Table:** Zajištěna existence tabulky `messages` a `blocked_users` s korektními RLS policies (migrace `10_create_messages_table.sql`).

## [2.19.0] - 2025-11-24

### Changed
- **[UX] Jednotný Název:** "Deník" přejmenován na **"Černá Kniha"** napříč celou aplikací
  - Aktualizována navigace, ProfileView, StatsView a vše ostatní
  - Konzistentní branding napříč celým UI
- **[UX] Pouze Výběr ze Seznamu:** Odebrána možnost volného textu pro jméno
  - Uživatelé nyní **musí vybrat** ze seznamu lidí s matchem
  - Automaticky seřazeno podle data matche (nejnovější nahoře)
  - Zobrazuje se pouze seznam lidí, se kterými máš match + výměnu zpráv
- **[FEATURE] Ghost Indikátor:** Uživatelé, které jsi ghostnul, jsou označeni ikonou ducha 👻
  - Jasně viditelné v seznamu výběru i v záznamech
  - Pomáhá s orientací v kontaktech

### Technical
- Nová funkce `fetchAllMatchedUsersForDiary()` v `userService.ts`
- Kompletní redesign `JournalView.tsx` komponenty
- Včlenění ghost statusu do výběru uživatelů

## [2.18.0] - 2025-11-24

### Added
- **[FEATURE] Diary Match Validation:** Do deníku nyní můžeš zapsat pouze lidi z platformy
  - Vyžadován oboustranný match (oba jste si dali like)
  - Vyžadována vzájemná komunikace (oba jste si poslali aspoň 1 zprávu)
  - Vyhledávání v deníku nyní zobrazuje pouze uživatele, kteří splňují tyto podmínky
- **[DATA] Age at Match Time:** Věk partnera/ky se automaticky zaznamená podle toho, kolik mu/jí bylo v den matche
  - Tento věk se již nikdy nemění v deníku (zůstává jako historický záznam)
  - Pole věku je read-only při propojení s Notch profilem
  
### Technical
- Nová databázová migrace `09_diary_match_validation.sql`
- Nová RPC funkce `can_add_to_diary` pro validaci oprávnění
- Nový sloupec `partner_age_at_match` v tabulce `journal_entries`
- Nové service funkce: `searchMatchedUsers`, `checkDiaryEligibility`
- Vylepšený UX s error messagí při pokusu o přidání nesplňujícího uživatele

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
