# Changelog

Všechny významné změny v projektu Notch budou dokumentovány v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/),
a projekt dodržuje [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.29.3] - 2025-12-01
### Fixed
- **[Bug] AI Wingman Cancel:** Opraveno nefunkční tlačítko Zrušit během generování zprávy
  - Tlačítko Zrušit nyní funguje **okamžitě** i během generování
  - Odstraněn `disabled` stav z tlačítka Zrušit
  - Přidán AbortController pro zrušení probíhajícího API requestu
  - Při zrušení se modal okamžitě zavře a generování se zastaví
  - Lepší UX - uživatel má plnou kontrolu nad generováním


## [2.29.2] - 2025-12-01
### Improved
- **[UX] Audio Recorder:** Vylepšeno ovládání nahrávání hlasových zpráv
  - Nahrávání se nyní spustí **automaticky** při kliknutí na ikonu mikrofonu
  - Odstraněna nutnost dvojitého kliknutí (1x otevřít recorder, 2x start)
  - Přidán `autoStart` prop do AudioRecorder komponenty
  - Při chybě oprávnění k mikrofonu se recorder automaticky zavře
  - Jednodušší a intuitivnější UX - jedno kliknutí = nahrávání běží


## [2.29.1] - 2025-11-30
### Fixed
- **[Critical] Chat Image Display:** Opraveno zobrazování obrázků v chatu
  - Změna z `getPublicUrl()` na `createSignedUrl()` pro privátní bucket
  - Signed URLs s expirací 1 rok (31 536 000 sekund)
  - Obrázky se nyní správně zobrazují jako náhledy v chatu

### Added
- **[Feature] Image Gallery Navigation:** Galerie pro procházení obrázků v chatu
  - Click-to-expand lightbox pro fullscreen zobrazení
  - Navigační šipky (← →) pro listování mezi obrázky
  - Keyboard controls: `←` `→` pro navigaci, `Esc` pro zavření
  - Počítadlo obrázků: "1 / 5" (aktuální / celkem)
  - Error handling s placeholder při selhání načtení
  - Smooth animace a hover efekty
  - Responzivní design (mobil + desktop)

### Technical
- Signed URLs pro zabezpečený přístup k privátním médiím
- Gallery state management v ChatView
- Enhanced ImageLightbox komponenta s navigací


## [2.29.0] - 2025-11-30
### Added
- **[Feature] Multimedia Chat Messaging:** Kompletní podpora pro odesílání fotografií a hlasových zpráv v chatu! 📷🎤
  - **Fotografie:**
    - Výběr z galerie nebo fotoaparátu přes tlačítko 📷
    - Automatická komprese obrázků (max 1920px, 80% JPEG kvalita)
    - Preview modal s volitelným popiskem před odesláním
    - Click-to-expand lightbox pro fullscreen prohlížení
    - Podpora formátů: JPEG, PNG, WebP, GIF
  - **Hlasové zprávy:**
    - Tap-to-record nahrávání přes tlačítko 🎤
    - Real-time zobrazení délky nahrávání
    - Možnost zrušení před odesláním
    - Custom audio player s play/pause a progress barem
    - Formát: WebM/Opus (nativní MediaRecorder API)
  - **Nové komponenty:**
    - `AudioRecorder.tsx` - Nahrávání hlasových zpráv
    - `AudioPlayer.tsx` - Přehrávání audio zpráv
    - `ImagePreviewModal.tsx` - Preview fotek před odesláním
    - `ImageLightbox.tsx` - Fullscreen prohlížeč obrázků
  - **Service layer:**
    - Rozšířená funkce `sendMessage()` s podporou file uploadu
    - Nový `mediaUtils.ts` s kompresí, validací a konverzí
    - Upload do Supabase Storage bucket `chat-media`
  - **Databáze:**
    - Nové sloupce v `messages`: `type`, `media_url`, `metadata`
    - Podpora pro 3 typy zpráv: text, image, audio
    - Metadata pro délku audia a rozměry obrázků

### Improved
- **[UX] Chat Input Bar:** Vylepšený input bar s multiline podporou
  - **Textarea** místo inputu pro delší zprávy
  - **Enter** → odešle zprávu
  - **Shift+Enter** → nový řádek
  - Auto-resize (max 3 řádky viditelné, pak scroll)
  - Tlačítko Send **vždy viditelné** (ne podmíněně)
  - Layout: `[📷] [🎤] [Textarea] [😊] [✨] [📤]`

### Technical
- Databázová migrace `17_chat_media_support.sql`
- Storage bucket `chat-media` s RLS policies
- TypeScript typy: `MessageType`, `MessageMetadata`
- Validace souborů (typ, velikost)
- Limity: Obrázky 10MB, Audio 5MB
- Realtime synchronizace pro multimedia zprávy

### Documentation
- `CHAT_MEDIA_SETUP.md` - Kompletní setup guide
- `CHAT_MEDIA_QUICKSTART.md` - Rychlý start
- `STORAGE_FIX.md` - Troubleshooting pro storage bucket
- `CHAT_MEDIA_CHECKLIST.md` - Checklist pro deployment
- `.agent/implementation_plans/chat_media_implementation_summary.md` - Technická dokumentace


## [2.28.0] - 2025-11-28
### Added
- **[Feature] Stripe Payments Integration:** Implementována kompletní platební brána přes Stripe pro Notch Gold předplatné.
  - **Bezpečná architektura**: API klíče jsou uloženy pouze v Supabase Edge Functions, nikdy ve frontend kódu.
  - **Databázové schéma**: Nové tabulky `customers` a `subscriptions` pro správu předplatných.
  - **Edge Functions**: 4 serverless funkce pro bezpečnou komunikaci se Stripe:
    - `stripe-webhook`: Zpracování webhook eventů s validací podpisu
    - `create-checkout-session`: Vytvoření platební session s 7denní trial periodou
    - `cancel-subscription`: Zrušení předplatného ke konci období (uživatel si zachová přístup)
    - `reactivate-subscription`: Obnovení zrušeného předplatného
  - **Automatická synchronizace**: Premium status se automaticky aktualizuje podle stavu předplatného
  - **UI komponenty**:
    - Aktualizovaný `PremiumModal` s reálnou Stripe integrací a loading states
    - Nová komponenta `SubscriptionManagement` pro správu předplatného
    - Retention flow při zrušení s přehledem ztrácených výhod
  - **Dokumentace**: Kompletní deployment guide (`STRIPE_DEPLOYMENT.md`) a README pro Edge Functions
- **[Service] Payment Service:** Nový `paymentService.ts` s funkcemi pro checkout, zrušení a obnovení předplatného
- **[Types] Subscription Types:** Přidány TypeScript typy pro `Subscription`, `StripeCustomer` a `SubscriptionStatus`

### Technical
- Databázová migrace `16_stripe_subscriptions.sql` s RLS policies a automatickými triggery
- Supabase Edge Functions v Deno runtime s TypeScript supportem
- Environment variables pro Stripe klíče a webhook secret
- Automatická synchronizace `profiles.is_premium` podle subscription statusu


## [2.27.5] - 2025-11-28
### Fixed
- **[UI] Radar Modal Fix:** Opraveno pozicování modálu `HotspotUsersModal` v Radaru.
  - Modál se nyní renderuje přes `createPortal` přímo do `body`, což řeší problém s překrýváním a "tmavou obrazovkou" bez obsahu.
  - Funguje správně na desktopu i mobilu nezávisle na rodičovském kontejneru.
- **[UX] Location Permission:** Vylepšeno chování žádosti o polohu.
  - Přidán loading indikátor "Zjišťuji polohu..." místo okamžité chybové hlášky.
  - Upozornění "Povolte prosím přístup k poloze" se zobrazí až po skutečném selhání nebo odmítnutí přístupu.
### Changed
- **[UX] Wording:** Změněn text "Vystříleno" na "Prozkoumáno" v Radaru.
  - Odstraněna nevhodná konotace, nový termín lépe vystihuje prozkoumání lokality a hledání lásky.

## [2.27.4] - 2025-11-27
### Added
- **[Feature] Interactive Radar Hotspots:** Radar nyní zobrazuje interaktivní hotspoty s detaily.
  - Kliknutím na hotspot se zobrazí seznam uživatelů v dané lokalitě.
  - Rozlišení mezi "čerstvými" cíli (Target) a již reagovanými uživateli (Liked, Matched, Dismissed).
  - Vizuální indikace "vystřílených" míst (šedá ikona) vs. aktivních hotspotů (červená pulzující ikona).
  - Možnost prokliku na profil uživatele přímo ze seznamu v hotspotu.
### Improved
- **[Logic] Ghost Filtering:** Radar a Hotspoty nyní automaticky filtrují uživatele, kteří vás ghostnuli (nebo vy je).
- **[UI] Hotspot Detail:** Nový modál `HotspotUsersModal` s přehledným seznamem uživatelů, jejich statusy a vzdáleností.

## [2.27.3] - 2025-11-27
### Fixed
- **[UI] iPhone 13 Mini Modal Fix:** Opraveno pozicování modálu "Nový Zářez" na malých displejích (iPhone 13 mini).
  - Přidána `relative` pozice na vnitřní kontejner modálu pro lepší stabilitu layoutu.
  - Zachováno `fixed` pozicování pouze na vnějším overlay wrapperu.
  - Zajištěno správné zarovnání `items-end` pro bottom sheet efekt na mobilu.

## [2.27.2] - 2025-11-27
### Fixed
- **[UI] Chat Bubble Contrast:** Upraven vzhled zpráv odeslaných uživatelem.
  - Původní červené pozadí nahrazeno tmavým gradientem s červeným ohraničením (`border-red-500/50`).
  - Důvod: Červené emotikony (srdíčka ❤️, jahody 🍓) splývaly s červeným pozadím a nebyly vidět.
  - Nový design je konzistentní s "premium" vzhledem aplikace a zajišťuje perfektní čitelnost.

## [2.27.1] - 2025-11-27
### Fixed
- **[Critical] Journal Modal Positioning:** Definitivně opraveno centrování modálu "Nový Zářez" v Černé Knize.
  - Modál nyní používá `createPortal` pro renderování přímo do `document.body`.
  - Vyřešen problém s `transform` na parent elementu (slider), který rozbíjel `fixed` pozicování.
  - Modál je nyní správně vycentrovaný na desktopu i jako bottom sheet na mobilu.
  - Přidán backdrop click handler pro intuitivní zavření modálu.
  - Odstraněno rozostření pozadí při swipování mezi obrazovkami.


## [2.27.0] - 2025-11-27
### Fixed
- **[Performance] AI Wingman Model:** Aktualizován model z `gemini-1.5-flash` na `gemini-2.5-flash` pro rychlejší a kvalitnější odpovědi.
  - Opravena chyba, kdy AI Wingman vracel generické texty kvůli nepodporovanému modelu.
  - Aktualizováno v `geminiService.ts` i serverless API (`api/wingman.js`).
  - Model 2.5 Flash je aktuálně podporovaný a optimalizovaný pro rychlost.


## [2.26.0] - 2025-11-27
### Fixed
- **[Critical] AI Wingman API:** Opravena chyba, která způsobovala selhání AI Wingman API.
  - Převeden `api/wingman.js` na ES Module syntax (import/export místo require/module.exports).
  - Opravena detekce API klíče v lokálním vývoji (podpora pro `VITE_GEMINI_API_KEY`).
  - Vylepšeno error handling a logování pro lepší diagnostiku.
- **[Performance] AI Response Speed:** Přepnut model z `gemini-2.5-flash` na `gemini-1.5-flash` pro rychlejší odpovědi.
- **[UI] Journal Modal Centering:** Opraveno posunutí modálu "Nový Zářez" v Černé Knize.
  - Odstraněn nadbytečný bottom padding, který posouvál modál mimo střed.
  - Modál nyní správně funguje jako bottom sheet na mobilu a vycentrovaný na desktopu.

## [2.25.0] - 2025-11-27
### Security
- **[Critical] Secure AI Wingman:** Implementován bezpečný backend pro volání Gemini API.
  - API klíč se již nenachází v klientském kódu (prevence zneužití).
  - Vytvořen serverless endpoint `/api/wingman` (Vercel Functions).
  - Hybridní režim: Lokálně volá SDK napřímo (pro rychlost), v produkci přes zabezpečené API.
  - Přidán `SECURITY.md` a bezpečnostní audit.

## [2.24.5] - 2025-11-27
### Fixed
- **[UX] Chat Navigation:** Při návratu z profilu uživatele zpět do chatu zůstává konverzace otevřená přesně tam, kde jste skončili.
- **[UX] Navigation History:** Tlačítko Zpět z profilu nyní správně vrací na předchozí obrazovku (např. zpět do chatu místo na Lov).
- **[UX] Navigation Indicator:** Spodní navigace správně zvýrazňuje aktivní sekci i při prohlížení profilu uživatele.
- **[Data] Match Profile:** Přidáno `partnerBio` do dat o matchích pro lepší fungování AI Wingman.

## [2.24.4] - 2025-11-27
### Fixed
- **[Critical] Navigation Crash:** Opravena kritická chyba "ReferenceError: previousView is not defined", která způsobovala pád aplikace při kliknutí na profil uživatele z chatu.

## [2.24.3] - 2025-11-27
### Fixed
- **[UX] Profile Navigation History:** Opravena navigace při prohlížení profilu (např. z chatu).
  - Tlačítko **Zpět** nyní vrací na předchozí obrazovku (např. zpět do chatu), nikoliv vždy na Lov.
  - Spodní navigace nyní správně zvýrazňuje aktivní sekci (např. Zprávy), i když je otevřený detail profilu.

## [2.24.2] - 2025-11-27
### Fixed
- **[UX] Chat Profile Navigation:** Opravena chyba, kdy se při kliknutí na profil v chatu profil otevřel "pod" chatem a nebyl vidět. Nyní se chat správně minimalizuje.

## [2.24.1] - 2025-11-26
### Fixed
- **[UX] Match Profile Actions:** Opraveno chování tlačítek na profilu uživatele, se kterým máte match.
  - Místo tlačítka Like (které bylo zbytečné) se nyní zobrazuje tlačítko **Zpráva** (💬), které otevře chat.
  - Tlačítko Dismiss (❌) nyní funguje jako **Unmatch** (zrušení propojení) s potvrzovacím dialogem.
  - Opravena chyba, kdy se nový match nezobrazil v seznamu chatů ihned po prokliku z profilu.

## [2.24.0] - 2025-11-26
### Added
- **[Feature] AI Wingman:** Asistent s umělou inteligencí pro pomoc s konverzacemi! ✨💬
  - **Tlačítko ✨ (Sparkles)** vedle emoji pickeru v chat inputu.
  - **Ice-breaker mode:** AI pomůže napsat první zprávu (pokud ještě není konverzace).
  - **Chat assist mode:** AI navrhne odpověď na základě celé chat historie.
  - **Cena: 5 kreditů** za jeden assist (velmi konzervativní pricing s 500x marží).
  - **Preview režim:** Návrh se zobrazí nejdřív v modalu, kde ho můžeš upravit, regenerovat nebo použít.
  - **Powered by Gemini 2.0 Flash:** Bleskově rychlé a velmi levné API volání (~0.02 centu).
  - **Kontextové prompty:** AI dostane info o tvém profilu, profilu partnera a celou konverzaci.

## [2.23.0] - 2025-11-26
### Added
- **[Feature] Emoji Picker v Chatu:** Přidán emoji picker pro zpestření konverzací! 😊🔥❤️
  - Tlačítko 😊 vedle pole pro psaní zprávy.
  - 6 kategorií (Smajlíci, Srdíčka, Aktivita, Jídlo, Objekty, Nedávné).
  - Vyhledávání emoji.
  - **Nedávně použitá emoji** se automaticky ukládají do localStorage.
  - 500+ native emoji bez externích závislostí.
  - Moderní dark mode design konzistentní s aplikací.

## [2.22.3] - 2025-11-26
### Fixed
- **[UI] Slide Animation:** Opravena animace přepínání obrazovek, která byla dříve neviditelná nebo "skákavá".
  - Problém byl v nesprávném výpočtu šířky kontejneru. Nyní je šířka slideru dynamicky nastavena podle počtu obrazovek (N * 100%) a každá obrazovka má šířku (100 / N)%.
  - Animace je nyní plynulá a správně zarovnaná.
- **[Bug] Modals in Profile:** Opraveno otevírání modálních oken (Ghost List, Statistiky, Smazání účtu) v Profilu.
  - Modaly byly "uvězněny" uvnitř transformovaného slideru, což rozbíjelo jejich `fixed` pozicování.
  - Vyřešeno použitím `createPortal`, který renderuje modaly přímo do `body`, mimo kontext slideru.

## [2.22.2] - 2025-11-26
### Improved
- **[UX] Animated Swipe Navigation:** Přidána plynulá animace (slide effect) při přepínání mezi obrazovkami.
  - Views jsou nyní uspořádány vedle sebe a posouvají se jako jeden celek.
  - **Discovery Swipe:** Povolena swipe navigace i na obrazovce Lov (Discovery).
    - Uživatel může swipovat mezi sekcemi i z této obrazovky (pozor na kolizi s kartami - swipe funguje nejlépe u okrajů nebo mimo karty).
  - **User Profile Overlay:** Detail uživatele se nyní otevírá jako overlay přes celou obrazovku nad sliderem.

## [2.22.1] - 2025-11-26
### Removed
- **[Feature] Panic Mode:** Kompletně odstraněna funkce "Panic Mode" (rychlé skrytí aplikace).
  - Odstraněn stav `isPanicMode` a související handlery z `App.tsx`.
  - Odstraněny props a logika z `ProfileView.tsx`.
  - Funkce byla vyhodnocena jako nepotřebná a matoucí.

### Improved
- **[Performance] View Rendering:** Optimalizováno přepínání mezi obrazovkami.
  - Implementován "keep-alive" mechanismus pro hlavní views (Lov, Žebříček, Deník, Galerie, Zprávy, Profil).
  - Komponenty se nyní neničí a znovu nevytváří při každém přepnutí, ale pouze se skrývají (`display: none`).
  - Výsledkem je **okamžitá odezva** při swipe navigaci bez blikání nebo načítání.

## [2.22.0] - 2025-11-26
### Added
- **[UX] Swipe Navigation:** Implementována globální navigace gesty (swipe) mezi obrazovkami.
  - Umožňuje plynulý přechod mezi záložkami (Žebříček ↔ Černá Kniha ↔ Galerie ↔ Zprávy ↔ Profil) tažením prstu.
  - **Smart Discovery Handling:** Na obrazovce **Lov (Discovery)** je swipe navigace záměrně vypnuta, aby nekolidovala s gesty pro Like/Pass (Tinder style).
  - Použita knihovna `react-swipeable` pro plynulou detekci gest.

## [2.21.10] - 2025-11-26
### Fixed
- **[UI] Text Clipping:** Definitivní oprava useknutých písmen v nadpisech.
  - Přidán pravý padding (`pr-2`) přímo na gradientní text (`span`).
  - Toto řešení specificky řeší ořezávání kurzívy (italic) u `bg-clip-text` elementů.
  - Zajišťuje, že písmena jako "E", "U", "Y" na konci slov jsou plně viditelná.

## [2.21.9] - 2025-11-26
### Improved
- **[UI] Unified Screen Design:** Sjednocen vzhled všech obrazovek pomocí komponenty `PageHeader`.
  - Přidána hlavička do **Lovu (DiscoveryView)** a **Profilu (ProfileView)**.
  - Sjednoceno barevné schéma **Žebříčku (LeaderboardView)** na standardní červenou variantu.
- **[UI] Typography Fix:** Opraven problém s useknutými písmeny v nadpisech (způsobený kombinací `italic` a `tracking-tighter`).
  - Upravena typografie v `PageHeader` na `tracking-tight` s dodatečným paddingem.
- **[UX] Ghost List Modal:** Ghost List přesunut z hlavní navigace do modálního okna v Profilu.
  - Zlepšena přehlednost navigace.
  - Implementováno potvrzovací okno pro odghostování přímo v modalu.
  - Odstraněna stará obrazovka `GhostListView`.

## [2.21.8] - 2025-11-26
### Changed
- **[PWA] Black Splash Screen Background:** Změněno pozadí splash screenů z tmavě modré (#0F172A) na černou (#000000).
  - Pozadí nyní perfektně ladí s černým saténovým pozadím loga (tygří drapance).
  - Aktualizováno pro všechny iOS splash screens a Android maskable icon.
  - PWA manifest `background_color` změněn na #000000.

## [2.21.6] - 2025-11-25
### Added
- **[PWA] Professional Splash Screens:** Implementovány vlastní splash screens pro perfektní vzhled při spouštění PWA.
  - **iOS**: Vlastní splash screens pro všechny iPhone a iPad modely (9 různých rozlišení).
  - **Android**: Maskable adaptive icon s bezpečnými zónami pro jakýkoliv tvar ikony.
  - **Design**: Černé pozadí (#0F172A) s centrovaným logem a názvem aplikace pro konzistentní branding.
  - **Automatizace**: Nový skript `scripts/generate-splash-screens.js` pro generování všech variant.
  - **Dokumentace**: Kompletní guide v `SPLASH_SCREENS.md` včetně troubleshooting a testování.
  - Vyřešen problém s neprofesionálně vypadajícím splash screenem (čtverečkové logo s neladícími barvami).

## [2.21.5] - 2025-11-25
### Changed
- **[Branding] New Logo Implementation:** Implementováno nové logo s designem 4 diagonálních pruhů (slash marks).
  - Design: 3 bílé pruhy + 1 červený na černém pozadí - moderní, agresivní vizuální identita.
  - Aktualizovány všechny logo assety: `logo.png`, `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`.
  - Nový favicon vygenerovaný z loga pro konzistentní branding (`favicon.ico`, `favicon-32x32.png`).
  - Vytvořen automatický skript `scripts/generate-logo-assets.js` pro generování všech variant z source loga.
  - Přidána dokumentace `LOGO.md` s kompletním popisem implementace a regenerační návodem.
  - Vytvořena preview stránka `public/logo-preview.html` pro vizuální kontrolu všech assetů.

## [2.21.4] - 2025-11-25
### Changed
- **[Branding] Simplified Favicon:** Nový zjednodušený favicon pro lepší čitelnost.
  - 3 diagonální pruhy (2 bílé, 1 červený uprostřed) na černém pozadí.
  - Jednoduchý, ikonický design perfektní pro malé rozměry (32×32px).
  - Okamžitě rozpoznatelný i v tabu browseru.
- **[UI] Removed Logo from UI:** Odstraněno logo z AuthView a LoadingScreen.
  - Vráceno textové zobrazení - minimalistický design.

## [2.21.2] - 2025-11-25
### Changed
- **[Branding] New Logo:** Implementováno nové logo "claw marks" (drápy) napříč celou aplikací.
  - Aktualizovány všechny logo soubory v `/public/` (logo.png, PWA ikony, favicon).
  - Vytvořen automatický skript `scripts/generate-logos.js` pro generování variant loga.
  - Logo má transparentní pozadí pro hlavní soubor, černé pozadí pro PWA/mobile ikony.
  - Favicon optimalizován pro malé rozměry.

## [2.21.1] - 2025-11-25
### Improved
- **[UI] Premium Card Design System:** Kompletní redesign všech seznamů a karet v aplikaci.
  - **ChatView**: Konverzace mají gradientní pozadí, hover efekty (glow), větší avatary a chevron indikátor.
  - **JournalView (Černá Kniha)**: Zářezy mají nový premium vzhled s gradientními kartami a hover efekty.
  - **LeaderboardView**: Žebříček s barevnými medailemi pro top 3 (zlato, stříbro, bronz) a gradientním skóre.
  - **GhostListView**: Ghostnutí uživatelé s konzistentním stylem a lepší vizuální hierarchií.
  - Všechny karty nyní používají jednotný design: `rounded-2xl`, gradient pozadí `from-slate-800/50 to-slate-900/50`, hover glow efekty.
  - Konzistentní spacing: `space-y-3`, `p-4`, `gap-4`.
  - Interaktivní hover stavy s barevným přechodem (červená/oranžová, žlutá/zlatá, zelená).

## [2.21.0] - 2025-11-25
### Improved
- **[UI] Unified Page Headers:** Sjednocen vzhled hlaviček na všech podstránkách.
  - Vytvořena nová komponenta `PageHeader` pro konzistentní typografii a layout.
  - Použita v `LeaderboardView`, `JournalView`, `StatsView`, `GhostListView` a `GalleryView`.
  - Hlavičky nyní používají "Red & Gold" téma s gradienty a ikonami.
- **[UI] Typography Polish:** Aktualizována typografie v `ProfileView` a `DiscoveryView` (Radar) pro shodu s novým design systémem (font-black, uppercase, italic).

## [2.20.2] - 2025-11-25
### Improved
- **[Core] Location Tracking:** Přidáno automatické sledování polohy uživatele.
  - Poloha se nyní aktualizuje při startu aplikace a následně každých 5 minut.
  - To zajišťuje přesnější fungování Radaru a zobrazování relevantních hotspotů.

## [2.20.1] - 2025-11-25
### Improved
- **[Radar] Places Aggregation:** Opravena logika radaru.
  - Místo jednotlivých uživatelů se nyní zobrazují známá místa (kluby, bary, parky).
  - Uživatelé jsou shlukováni do těchto míst (pokud jsou v okruhu 500m).
  - Vytvořena databáze míst (`places`) s testovacími daty pro Prahu.
  - Hotspoty nyní ukazují název místa a počet lidí v něm.

## [2.20.0] - 2025-11-25
### Added
- **[Core] Smart Discovery Filtering:** Implementováno chytré filtrování kandidátů v Lovu.
  - **Vyloučeni permanentně:** Ghostnutoí uživatelé (obousměrně) a matched uživatelé.
  - **Vyloučeni na 1 den:** Uživatelé, kterým jsem dnes dal like (čekám na odpověď), a uživatelé, kterým jsem dnes dal X (dismissed).
  - Přidána tabulka `dismisses` pro tracking odmítnutí.
  - Nová RPC funkce `get_discovery_exclusions` pro efektivní filtrování.
  - Každý den se profily "resetují" a mohou se objevit znovu (kromě matched a ghosted).

## [2.19.12] - 2025-11-24
### Updated
- **[Design] New Logo:** Aktualizováno logo aplikace.
  - Nahrazeno logo v `/public/logo.png`.
  - Aktualizovány PWA ikony (`pwa-192x192.png` a `pwa-512x512.png`).
  - Logo se zobrazuje ve favicon, PWA manifestu a všech relevantních místech aplikace.

## [2.19.11] - 2025-11-24
### Improved
- **[UX] Unified Terminology:** Sjednoceno názvosloví napříč aplikací.
  - Všude nahrazeno "záznam/y" za "zářez/y" (chlipnější, líp zapadá do charakteru appky).
  - Zkontrolována konzistence ikon pro stejné akce (Trash2 pro smazání, Edit2 pro úpravu, MessageCircle pro zprávy, Image pro galerii).
  - Změněn text tlačítka "Uložit do Černé Knihy" → "Přidat zářez".

## [2.19.10] - 2025-11-24
### Fixed
- **[Bug] Body Count Sync:** Opraveno zobrazování počtu zářezů v profilu.
  - Přidán database trigger, který automaticky aktualizuje `user_stats.body_count` při přidání/odebrání záznamu v Černé Knize.
  - Počet zářezů se nyní správně zobrazuje v profilu v reálném čase.

## [2.19.9] - 2025-11-24
### Fixed
- **[Bug] Ghost Status in Journal:** Opraveno zobrazování ghost ikony v Černé Knize.
  - Přidána chybějící RPC funkce `get_ghost_list()`, která vrací seznam ghostnutých uživatelů.
  - Ghostnutí uživatelé se nyní správně zobrazují s ikonou ducha a nabízejí možnost "Odghostnout".

## [2.19.8] - 2025-11-24
### Added
- **[UI] Match Celebration:** Přidána nová obrazovka "It's a Match!", která se zobrazí při vzájemné shodě.
  - Obsahuje animaci avatarů, konfetový efekt a možnost okamžitě napsat zprávu.
  - Zvyšuje vizuální odezvu a "šťavnatost" aplikace při úspěšném seznámení.

## [2.19.7] - 2025-11-24
### Improved
- **[UX] Custom Delete Modal:** Nahrazen nativní `confirm()` dialog pro mazání záznamů v Černé Knize vlastním, stylovým modálním oknem, které lépe zapadá do designu aplikace.

## [2.19.6] - 2025-11-24
### Added
- **[UI] Journal Action Menu:** Přidáno interaktivní menu pro záznamy v Černé Knize.
  - Po kliknutí na záznam se zobrazí možnosti: Smazat, Upravit, Galerie, Zpráva, Odghostnout.
  - Menu dynamicky reaguje na stav uživatele (Aktivní, Ghost, Smazaný).
  - Přidána vizuální indikace stavu profilu (lebka pro smazané, duch pro ghostnuté).

## [2.19.5] - 2025-11-24
### Fixed
- **[UI] Duplicate Matches:** Opraveno zobrazování duplicitních uživatelů v seznamu pro Černou Knihu.
  - Pokud existuje více matchů se stejnou osobou, zobrazí se pouze ten nejnovější.

## [2.19.4] - 2025-11-24
### Fixed
- **[LOGIC] Robust Diary Validation:** Kompletně přepsána logika pro načítání kontaktů do Černé Knihy.
  - Místo nespolehlivých SQL dotazů se nyní používá **stejná funkce jako pro Chat** (`fetchMatches`).
  - To garantuje, že pokud vidíte konverzaci v Chatu, uvidíte ji i v Černé Knize.
  - Odstraněna redundantní funkce `checkDiaryEligibility`.

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
