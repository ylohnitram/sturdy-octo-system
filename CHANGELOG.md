# Changelog

Všechny významné změny v projektu Notch budou dokumentovány v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/),
a projekt dodržuje [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.19.3] - 2025-11-24

### Fixed
- **[LOGIC] Ghosted User Journaling:** Umožněno přidávat do Černé Knihy i uživatele, které jste ghostnuli (zablokovali).
  - Pro ghostnuté uživatele se přeskakuje kontrola zpráv (protože zprávy od blokovaných uživatelů nejsou viditelné).
  - Tito uživatelé se zobrazí v seznamu s ikonou ducha 👻.

## [2.19.2] - 2025-11-24

### Fixed
- **[LOGIC] Client-side Diary Validation:** Přepsána logika `checkDiaryEligibility` z SQL RPC na přímé klientské dotazy.
  - Řeší problém, kdy SQL funkce "neviděla" zprávy, i když v chatu byly.
  - Zajišťuje konzistenci mezi Chatem a Černou Knihou.
  - Věk v době matche se nyní počítá v JavaScriptu.

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

## [2.16.6] - 2025-11-24
- **[UX] Chat Profile:** Kliknutí na hlavičku chatu (avatar nebo jméno) nyní otevře profil uživatele (s možností zobrazit galerii).
- **[DEV] Chat Props:** Přidán `onViewProfile` callback do `ChatView`.

## [2.16.5] - 2025-11-24
- **[FIX] Profile Picture:** Opravena chyba, kdy se profilová fotka po nahrání neaktualizovala v UI (přidána synchronizace stavu).
- **[FIX] Gold Status:** Opraveno zobrazování "FREE" účtu pro uživatele s aktivním Gold členstvím. Nyní se správně zobrazuje "Notch Gold AKTIVNÍ" a deaktivuje se prodejní modal.

## [2.16.4] - 2025-11-24
- **[UI] Unghost Modal:** Přidán potvrzovací modal pro odghostování uživatele v Ghost Listu.
- **[FEATURE] Ghost Filtering:** Ghostnutí uživatelé (oboustranně) se nyní nezobrazují v Lovu/Radaru.

## [2.16.3] - 2025-11-24
- **[FIX] Build:** Oprava syntaxe v `ChatView.tsx` (uzavírací tagy), která způsobovala selhání buildu.

## [2.16.2] - 2025-11-24
- **[UI] Ghost Modal:** Nahrazen systémový `confirm()` dialog vlastním moderním modalem pro potvrzení ghostování.
- **[UX] Ghost Feedback:** Modal jasně vysvětluje důsledky akce a možnost návratu přes Ghost List.

## [2.16.1] - 2025-11-24
- **[UX] Ghost Mode:** Zjednodušeno ghostování - jedno kliknutí místo menu.
- **[UI] Ghost Tooltip:** Přidán hover tooltip s vysvětlením Ghost Mode a možností vrátit v Ghost List.
- **[UX] Ghost Confirmation:** Vylepšený potvrzovací dialog s jasným vysvětlením a zmínkou o Ghost List.

## [2.16.0] - 2025-11-24
- **[FEATURE] Ghost List:** Nový view pro správu ghostnutých uživatelů s možností odghostnout.
- **[UI] Chat Ghost Icon:** Nahrazena ikona tří teček moderní ikonou ducha s hover efekty.
- **[SQL] Unghost Function:** Přidána funkce `unghost_user` a `get_ghost_list` pro správu ghost listu.
- **[UX] Ghost Management:** Uživatelé mohou odghostnout ostatní a obnovit komunikaci od daného okamžiku.

## [2.15.11] - 2025-11-24
- **[FIX] Duplicate Messages:** Opraveno zobrazování zpráv 2x - přidána kontrola duplicit v realtime subscription.
- **[UX] Chat Notifications:** Toast notifikace se již nezobrazují když je uživatel v Chat view (vidí zprávy přímo).
- **[FIX] Notification Badge:** Přidána real-time aktualizace badge zvonečku - počet se aktualizuje okamžitě při změnách v notifikacích.

## [2.15.10] - 2025-11-24
- **[UX] Chat Navigation:** Opravena logika navigace - kliknutí na Chat ikonu v navigaci zobrazí seznam chatů, kliknutí na notifikaci zprávy otevře přímo chat detail.
- **[UI] Chat Layout:** Přidán max-width container do ChatView pro konzistentní layout s ostatními obrazovkami.

## [2.15.9] - 2025-11-24
- **[CRITICAL FIX] Premium Status:** Kompletně opraveno načítání premium statusu - všechny části aplikace nyní správně čtou `profiles.tier` místo zastaralého `user_stats.is_premium`.
- **[SQL] Rivals Leaderboard:** Aktualizována RPC funkce `get_rivals_leaderboard` pro použití `profiles.tier`.

## [2.15.8] - 2025-11-24
- **[FIX] Chat Badge:** Opraveno mizení badge nepřečtených zpráv - přidán refresh při zavření chat detailu.
- **[FIX] Premium Tier:** Opraveno načítání premium statusu z `profiles.tier` místo zastaralého `user_stats.is_premium`.

## [2.15.7] - 2025-11-24
- **[CRITICAL FIX] Message Sending:** Opravena chyba při odesílání zpráv - aktualizován constraint v tabulce `notifications` pro podporu typu 'message'.

## [2.15.6] - 2025-11-24
- **[FIX] Message Sending:** Přidáno lepší error handling pro odesílání zpráv s upozorněním uživatele při selhání.
- **[SECURITY] RLS Policy:** Aktualizována INSERT politika pro zprávy - zabránění odesílání zpráv ghostnutým uživatelům.

## [2.15.5] - 2025-11-24
- **[FIX] Notification Badge:** Opraveno mizení badge nepřečtených zpráv v dolní navigaci ihned po přečtení zprávy.
- **[FIX] Realtime Notifications:** Opraveno zobrazování notifikací na nové zprávy v reálném čase (hlavní zvoneček).
- **[UI] Notification Icons:** Přidána specifická ikona pro notifikace zpráv.

## [2.15.4] - 2025-11-24
- **[FEATURE] Chat Notifications:** Notifikace na nové zprávy se nyní posílají pouze pro první nepřečtenou zprávu v konverzaci (zamezení spamu).
- **[UI] Navigation Badge:** Přidán indikátor počtu nepřečtených konverzací na ikonu "Zprávy" v dolní navigaci.
- **[UX] Notification Handling:** Kliknutí na notifikaci zprávy otevře přímo daný chat. Přečtení zprávy automaticky označí i notifikaci jako přečtenou.

## [2.15.3] - 2025-11-24
- **[UX] Chat Menu:** Menu v chatu (Ghost Mode) se nyní zavře kliknutím kamkoliv mimo něj.
- **[FIX] Realtime Chat:** Opraveno načítání zpráv v reálném čase (přidána chybějící publikace pro tabulku `messages`).
- **[FIX] Unread Badge:** Indikátor nepřečtených zpráv se nyní správně aktualizuje ihned po otevření chatu.

## [2.15.2] - 2025-11-24
- **[IMPROVEMENT] Chat Grouping:** Seznam chatů nyní seskupuje konverzace podle uživatele (partnera). Pokud máte s někým více shod (Matches), zobrazí se jako jedna konverzace se společnou historií zpráv.
- **[DB] SQL Update:** Aktualizována funkce `get_user_matches` pro seskupování a přidána funkce `get_conversation_messages`.

## [2.15.1] - 2025-11-24
- **[FIX] Chat Detail Overlay:** Detail chatu se nyní zobrazuje přes celou obrazovku (pomocí React Portal) a překrývá hlavičku i navigaci, což řeší problém s chybějícím vstupním polem.

## [2.15.0] - 2025-11-24
- **[FEATURE] Chat System:** Kompletní implementace chatu pro uživatele s Matchem.
- **[FEATURE] Ghost Mode:** Možnost ignorovat uživatele (Ghost Mode), což trvale zablokuje komunikaci a skryje uživatele.
- **[UI] Navigation:** Přidána záložka "Zprávy" do hlavní navigace (nahradila "Statistika").
- **[DB] Schema:** Přidány tabulky `messages` a `blocked_users` a příslušné funkce.

## [2.14.7] - 2025-11-24
- **[FIX] Gallery Modal Overlay:** Opraven problém, kdy se galerie zobrazovala pod hlavičkou aplikace a překrývala obsah. Nyní se vykresluje pomocí React Portal přímo do `body` s nejvyšší prioritou (z-index).
- **[FIX] Caption Visibility:** Opravena viditelnost popisků, která byla ovlivněna špatným vrstvením elementů.

## [2.14.6] - 2025-11-24
- **[SECURITY] DOMPurify:** Implementována knihovna `dompurify` pro robustní sanitizaci uživatelských vstupů (popisků fotek) místo vlastního regex řešení.

## [2.14.5] - 2025-11-24
- **[SECURITY] Input Sanitization:** Přidána sanitizace vstupu pro popisky fotek (odstranění HTML tagů) a omezení délky na 80 znaků pro zajištění bezpečnosti a konzistence UI.
- **[UX] Auto-hide Captions:** Popisky v lightboxu se nyní automaticky skryjí po 3 sekundách pro nerušený zážitek. Znovu se zobrazí při pohybu myši nebo klepnutí.

## [2.14.4] - 2025-11-24
- **[UI] Lightbox Overlay:** Popisek fotky se nyní zobrazuje jako overlay přes spodní část obrazovky (místo pod fotkou), což zaručuje jeho viditelnost i na mobilních zařízeních s vysokými obrázky.

## [2.14.3] - 2025-11-24
- **[UX] Caption Indicator:** Přidána ikona bubliny k fotkám v mřížce galerie, které mají popisek.
- **[UI] Caption Display:** Zobrazení popisku v lightboxu je nyní plně integrováno.

## [2.14.2] - 2025-11-24
- **[BUGFIX] Incremental Unlocks:** Opravena chyba v SQL funkci `unlock_user_gallery_v2`, která bránila odemčení nových "permanentních" fotek, pokud už uživatel nějaké odemčené měl. Nyní se vždy přepočítají a aktualizují všechny fotky.

## [2.14.1] - 2025-11-24
- **[BUGFIX] Gallery Persistence:** Opravena chyba, kdy se odemčené fotky po znovuotevření galerie jevily jako zamčené.
- **[FEATURE] Subscription Renewal:** Implementována logika pro obnovení předplatného za sníženou cenu (5 kreditů).
- **[UX] Dynamic Unlock UI:** Vylepšené texty a UI pro rozlišení mezi prvním odemčením a obnovením.

## [2.14.0] - 2025-11-24
- **[FEATURE] Gallery Captions:** Uživatelé mohou přidávat volitelné popisky k fotkám (max 100 znaků).
- **[UX] Caption Input:** Nový input v upload modalu pro popisek s emoji supportem.
- **[BACKEND] Caption Storage:** Nový sloupec `caption` v `gallery_images` tabulce.
- **[API] Caption Support:** Aktualizován interface `GalleryImage` a všechny fetch/upload funkce.

## [2.13.24] - 2025-11-24
- **[UX] Better Gallery Dialog:** Dynamický a srozumitelný text v unlock dialogu podle počtu fotek.
- **[BUGFIX] RLS Policy:** Přidána SELECT policy pro gallery_images - opraveno zobrazování galerií.

## [2.13.23] - 2025-11-24
- **[DEBUG] Gallery Logging:** Přidán debug logging do fetchPublicGallery pro diagnostiku prázdných galerií.

## [2.13.22] - 2025-11-24
- **[BUGFIX] Gallery Display:** Opraveno zobrazování galerií - i při selhání unlock query se nyní zobrazí fotky (jako locked).
- **[BUGFIX] Error Handling:** Vylepšené graceful degradation při DB issues.

## [2.13.21] - 2025-11-24
- **[MONETIZATION] Image-Level Unlocks:** Odemykání konkrétních fotek podle ID.
- **[FEATURE] Locked by ID:** Pokud vlastník smaže fotku, uživatel ji ztratí (motivace k renewal).
- **[FEATURE] Permanent Top 5:** Prvních 5 fotek je permanent, zbytek subscription.
- **[BACKEND] gallery_image_unlocks:** Nová tabulka pro granulární tracking.
- **[REVENUE] Optimalizováno pro max získ:** Každá změna galerie = důvod k renewal.

## [2.13.20] - 2025-11-24
- **[FEATURE] Gallery Subscription:** Galerie s 6+ privátními fotkami vyžadují předplatné (30 dní).
- **[FEATURE] Permanent Unlock:** Galerie s 1-5 privátními fotkami = permanent unlock.
- **[FEATURE] Subscription Renewal:** Obnovení předplatného za 5 kreditů (50% sleva).
- **[UX] Smart Unlock Dialog:** Dialog automaticky rozpozná typ unlocku a zobrazí správné info.
- **[BACKEND] Expiration System:** Tracking expirace předplatných v databázi.

## [2.13.19] - 2025-11-24
- **[FEATURE] Gallery Unlock System:** Platí se za celou galerii (10 kreditů), ne po fotce.
- **[FEATURE] Revenue Share:** 30% kreditů jde vlastníkovi galerie.
- **[FEATURE] Premium Benefits:** Premium uživatelé vidí všechny privátní galerie zdarma.
- **[UX] Gallery Teaser:** Privátní fotky se zobrazují rozmazané jako lákadlo.
- **[DOCS] Credit System:** Kompletní dokumentace kreditového systému v `.agent/CREDIT_SYSTEM.md`.

## [2.13.18] - 2025-11-23
- **[FEATURE] Gallery in PublicProfileView:** Přidána možnost prohlížet galerii i z detailu uživatele (z Leaderboardu, Notifikací).
- **[UX] Gallery Modal:** Vylepšen UX pro odemykání fotek - místo window.confirm() se používá elegantní overlay přímo v modálu.

## [2.13.17] - 2025-11-23
- **[FEATURE] Public Gallery:** Přidána možnost prohlížet galerii ostatních uživatelů přímo z Discovery karty.
- **[FEATURE] Private Photos:** Soukromé fotky v cizích galeriích jsou rozmazané a lze je odemknout za kredity.
- **[UI] AI Wingman:** Tlačítko AI Wingman bylo nahrazeno tlačítkem Galerie (AI Wingman bude přesunut do chatu).

## [2.13.16] - 2025-11-23
- **[FIX] iOS Autofill:** Další vylepšení pro správce hesel na iOS. Přidány unikátní klíče pro inputy a upraveny atributy `autoComplete` pro lepší rozlišení mezi přihlášením a registrací.

## [2.13.15] - 2025-11-23
- **[FIX] iOS Safe Areas:** Opraveno překrývání notifikačního panelu a chybových hlášek systémovým řádkem (status bar) na iPhonech. Všechny overlay prvky nyní respektují bezpečné zóny displeje.

## [2.13.14] - 2025-11-23
- **[FIX] iOS Autofill:** Opraveno chybné vyplňování hesla do pole pro email na iOS zařízeních. Přidány explicitní atributy pro správce hesel (iCloud Keychain).

## [2.13.13] - 2025-11-23
- **[UX] View Persistence:** Aplikace si nyní pamatuje poslední otevřenou obrazovku i po obnovení stránky (refresh). Při odhlášení se tento stav resetuje.
- **[UI] Journal Polish:** Zaobleny rohy patičky v modálním okně Deníku pro čistší vzhled.

## [2.13.12] - 2025-11-23
- **[FIX] Android Gestures:** Opraveno nechtěné obnovování stránky při skrolování v modálním okně (overscroll-contain).
- **[FIX] UI Layering:** Zvýšena priorita zobrazení modálního okna (z-index), aby překrývalo spodní navigaci a tlačítka byla vždy přístupná.

## [2.13.11] - 2025-11-23
- **[FIX] Android UI:** Tlačítko pro uložení záznamu v Deníku je nyní ukotveno ve spodní části okna (sticky footer), takže je vždy viditelné a dostupné i při otevřené klávesnici nebo dlouhém formuláři.

## [2.13.10] - 2025-11-23
- **[FIX] iOS UI:** Opraveno překrývání hlavičky systémovými prvky (čas, baterie) a zvednuto tlačítko pro potvrzení v Deníku, aby nebylo schované pod ovládacími prvky.

## [2.13.9] - 2025-11-23
- **[FIX] PWA Standards:** Přidán standardní meta tag `mobile-web-app-capable` pro lepší kompatibilitu s moderními prohlížeči a odstranění varování v konzoli.

## [2.13.8] - 2025-11-23
- **[PERF] Startup Speed:** Další optimalizace startu aplikace. Odstraněny konflikty mezi čištěním cache a načítáním dat, což zajišťuje bleskové načtení profilu bez zbytečného čekání.

## [2.13.7] - 2025-11-23
- **[PERF] Data Loading Optimization:** Vylepšena logika načítání dat při startu aplikace. Odstraněny zbytečné pokusy o stažení dat, které způsobovaly timeouty na pomalejších připojeních. Aplikace nyní inteligentně čeká na správný signál od databáze.

## [2.13.6] - 2025-11-23
- **[UX] Profile Skeleton:** Pokud se profilová data ještě načítají, zobrazuje se v profilu skeleton místo fallback textu "Lovce", což sjednocuje vzhled s hlavičkou.

## [2.13.5] - 2025-11-23
- **[FIX] PWA Data Loading:** Opravena chyba, kdy se po instalaci PWA nebo opětovném přihlášení nenačetl profil a bylo nutné aplikaci obnovit.

## [2.13.4] - 2025-11-23
- **[UX] Full Header Skeleton:** Skeleton loading nyní pokrývá i pravou část hlavičky (notifikace a kredity), takže se nezobrazují nuly (0) před načtením dat.

## [2.13.3] - 2025-11-23
- **[UX] Header Skeleton:** Při načítání profilu se v hlavičce zobrazuje pulzující skeleton (místo placeholder textu "Lovce"), dokud nejsou data k dispozici.

## [2.13.2] - 2025-11-23
- **[FIX] UI Glitch:** Odstraněn nechtěný znak `\n` z patičky navigace.

## [2.13.1] - 2025-11-23
- **[FIX] iOS Safe Areas:** Opraveno podtékání obsahu pod ovládací prvky na iPhonech (notch, home indicator). Aplikace nyní respektuje safe areas v hlavičce, navigaci i modálních oknech.

## [2.13.0] - 2025-11-23
- **[NEW] Loading Screen:** Stylová loading obrazovka s rotujícími ikonami, particles a vtipnými zprávami během načítání profilu.
- **[NEW] Modern Navigation:** Bottom navigation s 2025/2026 trendy - glassmorphism pill pro aktivní tab, glow efekty, smooth animations.
- **[CHANGE] Default View:** Aplikace se nyní otevírá na záložce "Profil" místo "Lov".

## [2.12.0] - 2025-11-23
- **[NEW] Smart Email Check:** Při registraci se kontroluje, zda email již existuje. Pokud ano, zobrazí se tlačítka pro rychlé přepnutí na přihlášení nebo reset hesla.
- **[FIX] Error UX:** Místo generické chyby "databáze" se zobrazí konkrétní a užitečná hláška s akcemi.

## [2.11.1] - 2025-11-23
- **[FIX] Badge Update:** Badge se nyní aktualizuje okamžitě po kliknutí na notifikaci (místo až po opětovném otevření panelu).

## [2.11.0] - 2025-11-23
- **[NEW] Modern Notification UX:** Nepřečtené notifikace mají glassmorphism efekt, modrý glow, větší avatary a animovaný indikátor. Přečtené notifikace jsou ztlumené a průhledné.
- **[FIX] Database:** Přidán sloupec `read_at` do tabulky notifikací.

## [2.10.2] - 2025-11-23
- **[FIX] Realtime Badge:** Badge se nyní aktualizuje v reálném čase když přijde nová notifikace.
- **[FIX] Match UX:** Nahrazen alert() za toast notifikaci při matchi.

## [2.10.1] - 2025-11-23
- **[FIX] Notifications:** Badge se nyní správně aktualizuje po přečtení notifikace.
- **[FIX] Public Profile:** Tlačítko "Odesláno" se již nezobrazuje na všech profilech po odeslání jednoho like.

## [2.10.0] - 2025-11-23
- **[NEW] Notification Badge:** Zvoneček nyní zobrazuje počet nepřečtených notifikací (červený badge) a mění barvu na žlutou.

## [2.9.1] - 2025-11-23
- **[FIX] Notifications:** Opraven chybějící onClick handler na zvonečku - notifikace se nyní správně otevírají.

## [2.9.0] - 2025-11-23
- **[NEW] Rich Notifications:** Notifikace o lajcích a matchích nyní zobrazují avatara a jméno uživatele.
- **[NEW] Public Profiles:** Po kliknutí na notifikaci se otevře profil uživatele, kde je možné oplatit like.
- **[FIX] Database:** Přidán `related_user_id` do tabulky notifikací pro správné párování.
