# Metodika Verzování (Versioning Methodology)

Tento dokument popisuje standardy pro verzování aplikace Notch.

## Changelog

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
