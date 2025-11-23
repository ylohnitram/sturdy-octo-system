# Metodika Verzování (Versioning Methodology)

Tento dokument popisuje standardy pro verzování aplikace Notch.

## Changelog

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
