# Metodika Verzování (Versioning Methodology)

Tento dokument popisuje standardy pro verzování aplikace Notch.

## Changelog

### 2.15.7 (2025-11-24)
- **[CRITICAL FIX] Message Sending:** Opravena chyba při odesílání zpráv - aktualizován constraint v tabulce `notifications` pro podporu typu 'message'.

### 2.15.6 (2025-11-24)
- **[FIX] Message Sending:** Přidáno lepší error handling pro odesílání zpráv s upozorněním uživatele při selhání.
- **[SECURITY] RLS Policy:** Aktualizována INSERT politika pro zprávy - zabránění odesílání zpráv ghostnutým uživatelům.

### 2.15.5 (2025-11-24)
- **[FIX] Notification Badge:** Opraveno mizení badge nepřečtených zpráv v dolní navigaci ihned po přečtení zprávy.
- **[FIX] Realtime Notifications:** Opraveno zobrazování notifikací na nové zprávy v reálném čase (hlavní zvoneček).
- **[UI] Notification Icons:** Přidána specifická ikona pro notifikace zpráv.

### 2.15.4 (2025-11-24)
- **[FEATURE] Chat Notifications:** Notifikace na nové zprávy se nyní posílají pouze pro první nepřečtenou zprávu v konverzaci (zamezení spamu).
- **[UI] Navigation Badge:** Přidán indikátor počtu nepřečtených konverzací na ikonu "Zprávy" v dolní navigaci.
- **[UX] Notification Handling:** Kliknutí na notifikaci zprávy otevře přímo daný chat. Přečtení zprávy automaticky označí i notifikaci jako přečtenou.

### 2.15.3 (2025-11-24)
- **[UX] Chat Menu:** Menu v chatu (Ghost Mode) se nyní zavře kliknutím kamkoliv mimo něj.
- **[FIX] Realtime Chat:** Opraveno načítání zpráv v reálném čase (přidána chybějící publikace pro tabulku `messages`).
- **[FIX] Unread Badge:** Indikátor nepřečtených zpráv se nyní správně aktualizuje ihned po otevření chatu.

### 2.15.2 (2025-11-24)
- **[IMPROVEMENT] Chat Grouping:** Seznam chatů nyní seskupuje konverzace podle uživatele (partnera). Pokud máte s někým více shod (Matches), zobrazí se jako jedna konverzace se společnou historií zpráv.
- **[DB] SQL Update:** Aktualizována funkce `get_user_matches` pro seskupování a přidána funkce `get_conversation_messages`.

### 2.15.1 (2025-11-24)
- **[FIX] Chat Detail Overlay:** Detail chatu se nyní zobrazuje přes celou obrazovku (pomocí React Portal) a překrývá hlavičku i navigaci, což řeší problém s chybějícím vstupním polem.

### 2.15.0 (2025-11-24)
- **[FEATURE] Chat System:** Kompletní implementace chatu pro uživatele s Matchem.
- **[FEATURE] Ghost Mode:** Možnost ignorovat uživatele (Ghost Mode), což trvale zablokuje komunikaci a skryje uživatele.
- **[UI] Navigation:** Přidána záložka "Zprávy" do hlavní navigace (nahradila "Statistika").
- **[DB] Schema:** Přidány tabulky `messages` a `blocked_users` a příslušné funkce.

### 2.14.7 (2025-11-24)
- **[FIX] Gallery Modal Overlay:** Opraven problém, kdy se galerie zobrazovala pod hlavičkou aplikace a překrývala obsah. Nyní se vykresluje pomocí React Portal přímo do `body` s nejvyšší prioritou (z-index).
- **[FIX] Caption Visibility:** Opravena viditelnost popisků, která byla ovlivněna špatným vrstvením elementů.

### 2.14.6 (2025-11-24)
- **[SECURITY] DOMPurify:** Implementována knihovna `dompurify` pro robustní sanitizaci uživatelských vstupů (popisků fotek) místo vlastního regex řešení.

### 2.14.5 (2025-11-24)
- **[SECURITY] Input Sanitization:** Přidána sanitizace vstupu pro popisky fotek (odstranění HTML tagů) a omezení délky na 80 znaků pro zajištění bezpečnosti a konzistence UI.
- **[UX] Auto-hide Captions:** Popisky v lightboxu se nyní automaticky skryjí po 3 sekundách pro nerušený zážitek. Znovu se zobrazí při pohybu myši nebo klepnutí.

### 2.14.4 (2025-11-24)
- **[UI] Lightbox Overlay:** Popisek fotky se nyní zobrazuje jako overlay přes spodní část obrazovky (místo pod fotkou), což zaručuje jeho viditelnost i na mobilních zařízeních s vysokými obrázky.

### 2.14.3 (2025-11-24)
- **[UX] Caption Indicator:** Přidána ikona bubliny k fotkám v mřížce galerie, které mají popisek.
- **[UI] Caption Display:** Zobrazení popisku v lightboxu je nyní plně integrováno.

### 2.14.2 (2025-11-24)
- **[BUGFIX] Incremental Unlocks:** Opravena chyba v SQL funkci `unlock_user_gallery_v2`, která bránila odemčení nových "permanentních" fotek, pokud už uživatel nějaké odemčené měl. Nyní se vždy přepočítají a aktualizují všechny fotky.

### 2.14.1 (2025-11-24)
- **[BUGFIX] Gallery Persistence:** Opravena chyba, kdy se odemčené fotky po znovuotevření galerie jevily jako zamčené.
- **[FEATURE] Subscription Renewal:** Implementována logika pro obnovení předplatného za sníženou cenu (5 kreditů).
- **[UX] Dynamic Unlock UI:** Vylepšené texty a UI pro rozlišení mezi prvním odemčením a obnovením.

### 2.14.0 (2025-11-24)
- **[FEATURE] Gallery Captions:** Uživatelé mohou přidávat volitelné popisky k fotkám (max 100 znaků).
- **[UX] Caption Input:** Nový input v upload modalu pro popisek s emoji supportem.
- **[BACKEND] Caption Storage:** Nový sloupec `caption` v `gallery_images` tabulce.
- **[API] Caption Support:** Aktualizován interface `GalleryImage` a všechny fetch/upload funkce.

### 2.13.24 (2025-11-24)
- **[UX] Better Gallery Dialog:** Dynamický a srozumitelný text v unlock dialogu podle počtu fotek.
- **[BUGFIX] RLS Policy:** Přidána SELECT policy pro gallery_images - opraveno zobrazování galerií.

### 2.13.23 (2025-11-24)
- **[DEBUG] Gallery Logging:** Přidán debug logging do fetchPublicGallery pro diagnostiku prázdných galerií.

### 2.13.22 (2025-11-24)
- **[BUGFIX] Gallery Display:** Opraveno zobrazování galerií - i při selhání unlock query se nyní zobrazí fotky (jako locked).
- **[BUGFIX] Error Handling:** Vylepšené graceful degradation při DB issues.

### 2.13.21 (2025-11-24)
- **[MONETIZATION] Image-Level Unlocks:** Odemykání konkrétních fotek podle ID.
- **[FEATURE] Locked by ID:** Pokud vlastník smaže fotku, uživatel ji ztratí (motivace k renewal).
- **[FEATURE] Permanent Top 5:** Prvních 5 fotek je permanent, zbytek subscription.
- **[BACKEND] gallery_image_unlocks:** Nová tabulka pro granulární tracking.
- **[REVENUE] Optimalizováno pro max získ:** Každá změna galerie = důvod k renewal.

### 2.13.20 (2025-11-24)
- **[FEATURE] Gallery Subscription:** Galerie s 6+ privátními fotkami vyžadují předplatné (30 dní).
- **[FEATURE] Permanent Unlock:** Galerie s 1-5 privátními fotkami = permanent unlock.
- **[FEATURE] Subscription Renewal:** Obnovení předplatného za 5 kreditů (50% sleva).
- **[UX] Smart Unlock Dialog:** Dialog automaticky rozpozná typ unlocku a zobrazí správné info.
- **[BACKEND] Expiration System:** Tracking expirace předplatných v databázi.

### 2.13.19 (2025-11-24)
- **[FEATURE] Gallery Unlock System:** Platí se za celou galerii (10 kreditů), ne po fotce.
- **[FEATURE] Revenue Share:** 30% kreditů jde vlastníkovi galerie.
- **[FEATURE] Premium Benefits:** Premium uživatelé vidí všechny privátní galerie zdarma.
- **[UX] Gallery Teaser:** Privátní fotky se zobrazují rozmazané jako lákadlo.
- **[DOCS] Credit System:** Kompletní dokumentace kreditového systému v `.agent/CREDIT_SYSTEM.md`.

### 2.13.18 (2025-11-23)
- **[FEATURE] Gallery in PublicProfileView:** Přidána možnost prohlížet galerii i z detailu uživatele (z Leaderboardu, Notifikací).
- **[UX] Gallery Modal:** Vylepšen UX pro odemykání fotek - místo window.confirm() se používá elegantní overlay přímo v modálu.

### 2.13.17 (2025-11-23)
- **[FEATURE] Public Gallery:** Přidána možnost prohlížet galerii ostatních uživatelů přímo z Discovery karty.
- **[FEATURE] Private Photos:** Soukromé fotky v cizích galeriích jsou rozmazané a lze je odemknout za kredity.
- **[UI] AI Wingman:** Tlačítko AI Wingman bylo nahrazeno tlačítkem Galerie (AI Wingman bude přesunut do chatu).

### 2.13.16 (2025-11-23)
- **[FIX] iOS Autofill:** Další vylepšení pro správce hesel na iOS. Přidány unikátní klíče pro inputy a upraveny atributy `autoComplete` pro lepší rozlišení mezi přihlášením a registrací.

### 2.13.15 (2025-11-23)
- **[FIX] iOS Safe Areas:** Opraveno překrývání notifikačního panelu a chybových hlášek systémovým řádkem (status bar) na iPhonech. Všechny overlay prvky nyní respektují bezpečné zóny displeje.

### 2.13.14 (2025-11-23)
- **[FIX] iOS Autofill:** Opraveno chybné vyplňování hesla do pole pro email na iOS zařízeních. Přidány explicitní atributy pro správce hesel (iCloud Keychain).

### 2.13.13 (2025-11-23)
- **[UX] View Persistence:** Aplikace si nyní pamatuje poslední otevřenou obrazovku i po obnovení stránky (refresh). Při odhlášení se tento stav resetuje.
- **[UI] Journal Polish:** Zaobleny rohy patičky v modálním okně Deníku pro čistší vzhled.

### 2.13.12 (2025-11-23)
- **[FIX] Android Gestures:** Opraveno nechtěné obnovování stránky při skrolování v modálním okně (overscroll-contain).
- **[FIX] UI Layering:** Zvýšena priorita zobrazení modálního okna (z-index), aby překrývalo spodní navigaci a tlačítka byla vždy přístupná.

### 2.13.11 (2025-11-23)
- **[FIX] Android UI:** Tlačítko pro uložení záznamu v Deníku je nyní ukotveno ve spodní části okna (sticky footer), takže je vždy viditelné a dostupné i při otevřené klávesnici nebo dlouhém formuláři.

### 2.13.10 (2025-11-23)
- **[FIX] iOS UI:** Opraveno překrývání hlavičky systémovými prvky (čas, baterie) a zvednuto tlačítko pro potvrzení v Deníku, aby nebylo schované pod ovládacími prvky.

### 2.13.9 (2025-11-23)
- **[FIX] PWA Standards:** Přidán standardní meta tag `mobile-web-app-capable` pro lepší kompatibilitu s moderními prohlížeči a odstranění varování v konzoli.

### 2.13.8 (2025-11-23)
- **[PERF] Startup Speed:** Další optimalizace startu aplikace. Odstraněny konflikty mezi čištěním cache a načítáním dat, což zajišťuje bleskové načtení profilu bez zbytečného čekání.

### 2.13.7 (2025-11-23)
- **[PERF] Data Loading Optimization:** Vylepšena logika načítání dat při startu aplikace. Odstraněny zbytečné pokusy o stažení dat, které způsobovaly timeouty na pomalejších připojeních. Aplikace nyní inteligentně čeká na správný signál od databáze.

### 2.13.6 (2025-11-23)
- **[UX] Profile Skeleton:** Pokud se profilová data ještě načítají, zobrazuje se v profilu skeleton místo fallback textu "Lovce", což sjednocuje vzhled s hlavičkou.

### 2.13.5 (2025-11-23)
- **[FIX] PWA Data Loading:** Opravena chyba, kdy se po instalaci PWA nebo opětovném přihlášení nenačetl profil a bylo nutné aplikaci obnovit.

### 2.13.4 (2025-11-23)
- **[UX] Full Header Skeleton:** Skeleton loading nyní pokrývá i pravou část hlavičky (notifikace a kredity), takže se nezobrazují nuly (0) před načtením dat.

### 2.13.3 (2025-11-23)
- **[UX] Header Skeleton:** Při načítání profilu se v hlavičce zobrazuje pulzující skeleton (místo placeholder textu "Lovce"), dokud nejsou data k dispozici.

### 2.13.2 (2025-11-23)
- **[FIX] UI Glitch:** Odstraněn nechtěný znak `\n` z patičky navigace.

### 2.13.1 (2025-11-23)
- **[FIX] iOS Safe Areas:** Opraveno podtékání obsahu pod ovládací prvky na iPhonech (notch, home indicator). Aplikace nyní respektuje safe areas v hlavičce, navigaci i modálních oknech.

### 2.13.0 (2025-11-23)
- **[NEW] Loading Screen:** Stylová loading obrazovka s rotujícími ikonami, particles a vtipnými zprávami během načítání profilu.
- **[NEW] Modern Navigation:** Bottom navigation s 2025/2026 trendy - glassmorphism pill pro aktivní tab, glow efekty, smooth animations.
- **[CHANGE] Default View:** Aplikace se nyní otevírá na záložce "Profil" místo "Lov".

### 2.12.0 (2025-11-23)
- **[NEW] Smart Email Check:** Při registraci se kontroluje, zda email již existuje. Pokud ano, zobrazí se tlačítka pro rychlé přepnutí na přihlášení nebo reset hesla.
- **[FIX] Error UX:** Místo generické chyby "databáze" se zobrazí konkrétní a užitečná hláška s akcemi.

### 2.11.1 (2025-11-23)
- **[FIX] Badge Update:** Badge se nyní aktualizuje okamžitě po kliknutí na notifikaci (místo až po opětovném otevření panelu).

### 2.11.0 (2025-11-23)
- **[NEW] Modern Notification UX:** Nepřečtené notifikace mají glassmorphism efekt, modrý glow, větší avatary a animovaný indikátor. Přečtené notifikace jsou ztlumené a průhledné.
- **[FIX] Database:** Přidán sloupec `read_at` do tabulky notifikací.

### 2.10.2 (2025-11-23)
- **[FIX] Realtime Badge:** Badge se nyní aktualizuje v reálném čase když přijde nová notifikace.
- **[FIX] Match UX:** Nahrazen alert() za toast notifikaci při matchi.

### 2.10.1 (2025-11-23)
- **[FIX] Notifications:** Badge se nyní správně aktualizuje po přečtení notifikace.
- **[FIX] Public Profile:** Tlačítko "Odesláno" se již nezobrazuje na všech profilech po odeslání jednoho like.

### 2.10.0 (2025-11-23)
- **[NEW] Notification Badge:** Zvoneček nyní zobrazuje počet nepřečtených notifikací (červený badge) a mění barvu na žlutou.

### 2.9.1 (2025-11-23)
- **[FIX] Notifications:** Opraven chybějící onClick handler na zvonečku - notifikace se nyní správně otevírají.

### 2.9.0 (2025-11-23)
- **[NEW] Rich Notifications:** Notifikace o lajcích a matchích nyní zobrazují avatara a jméno uživatele.
- **[NEW] Public Profiles:** Po kliknutí na notifikaci se otevře profil uživatele, kde je možné oplatit like.
- **[FIX] Database:** Přidán `related_user_id` do tabulky notifikací pro správné párování.

## 1. Standard
Používáme **Semantic Versioning 2.0.0** (Major.Minor.Patch).

### Kdy zvedat verzi?

#### 🔴 MAJOR (X.0.0) - Breaking Changes
Zvedni první číslo, když děláš **nekompatibilní změny API** nebo zásadní změny v chování aplikace.
- Přepsání celé části aplikace (např. nový design systém).
- Změna databázového schématu, která vyžaduje migraci a není zpětně kompatibilní.
- Odstranění podporovaných funkcí.

#### 🟡 MINOR (0.X.0) - New Features
Zvedni druhé číslo, když přidáváš **novou funkcionalitu**, která je zpětně kompatibilní.
- Přidání nové stránky nebo pohledu (např. GalleryView).
- Přidání nové funkce (např. PWA podpora, notifikace).
- Rozšíření existujícího API o nové nepovinné parametry.

#### 🟢 PATCH (0.0.X) - Bug Fixes
Zvedni třetí číslo, když děláš **zpětně kompatibilní opravy chyb**.
- Oprava bugu v UI (např. špatná barva tlačítka).
- Oprava logiky (např. case-insensitive pozvánky).
- Bezpečnostní záplaty.
- Drobné úpravy textů nebo dokumentace.

## 2. Single Source of Truth (Zdroj Pravdy)
Jediným místem, kde se definuje verze, je soubor `package.json`.

```json
{
  "version": "1.1.0"
}
```

## 3. Architektura Propagace
Verze se z `package.json` automaticky propisuje do všech částí aplikace:

1.  **UI Aplikace (React):**
    - `vite.config.ts` načte verzi z `process.env.npm_package_version`.
    - Zpřístupní ji jako globální konstantu `import.meta.env.PACKAGE_VERSION`.
    - Komponenty (např. `ProfileView.tsx`) ji zobrazují uživateli.

2.  **PWA Manifest (OS/Instalace):**
    - `vite.config.ts` injektuje verzi do generovaného `manifest.webmanifest`.
    - Operační systém (Windows, Android, iOS) vidí tuto verzi ve správci aplikací.

## 4. Workflow pro Release (Checklist)
Při vydávání nové verze postupuj takto:

1.  [ ] **Změň verzi v `package.json`** (např. z `1.1.0` na `1.2.0`).
2.  [ ] **Commit & Push:**
    ```bash
    git add package.json
    git commit -m "chore: bump version to 1.2.0"
    git push
    ```
3.  [ ] **Build & Deploy:**
    - CI/CD pipeline (nebo manuální build) automaticky použije novou verzi.
    - Uživatelům se zobrazí výzva k aktualizaci (díky PWA `ReloadPrompt`).

## 5. Pro AI Agenty
Pokud jsi AI agent a máš za úkol "zvednout verzi":
1.  Edituj **POUZE** `package.json`.
2.  Ověř, že `vite.config.ts` má správně nastavené `define` a `manifest` (nemělo by se měnit, ale pro jistotu).
3.  Nikdy needituj verzi natvrdo v komponentách (např. `v1.0` stringy).
