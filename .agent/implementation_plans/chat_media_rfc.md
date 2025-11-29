# RFC: Implementace Multimediálních Zpráv v Chatu (Audio & Foto)

## 1. Cíl
Umožnit uživatelům posílat v chatu nejen textové zprávy, ale také:
1.  **Fotografie** (z galerie nebo fotoaparátu).
2.  **Hlasové zprávy** (nahrávání přímo v aplikaci).

## 2. Architektura a Data

### 2.1 Databázové Schéma (`messages`)
Současná tabulka `messages` má sloupec `content` (TEXT). Pro podporu médií ji rozšíříme.

**Možnost A (Preferovaná):** Přidat sloupce `type` a `metadata`.
*   `type`: ENUM ('text', 'image', 'audio') - default 'text'.
*   `media_url`: TEXT (URL k souboru v Supabase Storage).
*   `metadata`: JSONB (pro délku audia, rozměry obrázku, blurhash pro placeholder, atd.).

**SQL Migrace:**
```sql
ALTER TABLE messages 
ADD COLUMN type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'audio')),
ADD COLUMN media_url TEXT,
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
```

### 2.2 Supabase Storage
Vytvoříme dva nové buckety (nebo složky v existujícím bucketu `chat-media`):
1.  `chat-images`: Pro poslané fotky.
    *   **Public:** False (privátní bucket).
    *   **RLS Policies:**
        *   INSERT: Authenticated users.
        *   SELECT: Only users who are participants in the conversation (match).
2.  `chat-audio`: Pro hlasové zprávy.
    *   **Public:** False.
    *   **RLS Policies:** Stejné jako u images.

**Cesta k souboru:** `{match_id}/{message_id}.{ext}`
Tím zajistíme unikátnost a snadné čištění při smazání matche.

## 3. Frontend Implementace (`ChatView.tsx`)

### 3.1 UI Změny v Input Baru
Input bar se musí rozšířit o nová tlačítka.
*   **Levá strana inputu:** Tlačítko `+` (Plus) nebo `Image` ikona pro výběr fotky.
*   **Pravá strana inputu:**
    *   Pokud je input prázdný: Tlačítko `Mic` (Mikrofon) pro nahrávání.
    *   Pokud je text: Tlačítko `Send` (Odeslat).

### 3.2 Nahrávání Hlasových Zpráv (Audio)
*   **Interakce:**
    *   Hold-to-record (držet pro nahrávání) NEBO Tap-to-record (kliknout pro start, kliknout pro stop).
    *   Preferuji **Tap-to-record** pro lepší přístupnost a UX (možnost zrušit).
*   **Stavy:**
    *   `idle`: Zobrazen mikrofon.
    *   `recording`: Zobrazen časovač, waveform (vizualizace), tlačítko pro zrušení (koš) a odeslání.
*   **Technologie:** `MediaRecorder` API (browser native).
*   **Format:** WebM nebo MP4 (podpora napříč prohlížeči).

### 3.3 Posílání Fotek (Image)
*   **Interakce:**
    *   Kliknutí na ikonu obrázku -> otevře systémový file picker (kamera/galerie).
    *   Po výběru -> **Preview Modal**.
*   **Preview Modal:**
    *   Zobrazí vybranou fotku.
    *   Možnost přidat popisek (caption) - volitelné (uloží se jako `content`).
    *   Tlačítko Odeslat.
*   **Komprese:** Před uploadem zmenšit obrázek (max 1920px, JPEG 80% kvalita) pomocí `browser-image-compression` nebo Canvas API, aby se šetřilo místo a data.

### 3.4 Zobrazení Zpráv (Message Bubbles)
*   **Text:** Stávající bublina.
*   **Image:**
    *   Zobrazit náhled obrázku (s `object-cover` a `rounded`).
    *   Po kliknutí otevřít v **Lightboxu** (fullscreen prohlížeč).
    *   Loading state (blurhash nebo skeleton).
*   **Audio:**
    *   Custom audio player.
    *   Tlačítko Play/Pause.
    *   Progress bar (scrubbable).
    *   Čas (trvání).

## 4. Backend Logic (Service Layer)

### 4.1 `chatService.ts` (nebo `userService.ts`)
Rozšířit funkci `sendMessage`:
```typescript
interface SendMessageParams {
  matchId: string;
  content?: string; // Text nebo caption
  file?: File; // Pro image/audio
  type: 'text' | 'image' | 'audio';
  metadata?: any; // Duration pro audio
}
```

**Logika odeslání:**
1.  Pokud je `file`:
    *   Upload souboru do Supabase Storage (`chat-media/{matchId}/{timestamp}_{random}.{ext}`).
    *   Získání cesty (path).
2.  Insert do `messages`:
    *   `content`: text (nebo prázdný string).
    *   `type`: 'image' | 'audio'.
    *   `media_url`: cesta k souboru.
    *   `metadata`: `{ duration: 12s }` atd.

## 5. Bezpečnostní Aspekty
*   **Signed URLs:** Protože buckety budou privátní, musíme pro zobrazení obrázků/audia generovat **Signed URLs** s platností (např. 1 hodina).
*   **Alternativa:** Použít RLS na úrovni Storage (Supabase to umí), pak můžeme používat public URL, ale přístup bude kontrolován tokenem uživatele. Toto je jednodušší pro implementaci v Reactu (nemusíme refreshovat tokeny).

## 6. Implementační Plán

### Fáze 1: Databáze a Storage
1.  Vytvořit migraci pro `messages` (přidat sloupce).
2.  Vytvořit Storage Bucket `chat-media`.
3.  Nastavit RLS policies pro Storage.

### Fáze 2: Service Layer
1.  Aktualizovat `sendMessage` funkci pro podporu uploadu.
2.  Vytvořit helper funkce pro upload médií.

### Fáze 3: UI - Audio
1.  Implementovat `AudioRecorder` komponentu.
2.  Implementovat `AudioPlayer` bublinu.

### Fáze 4: UI - Image
1.  Implementovat výběr souboru a kompresi.
2.  Implementovat `ImagePreview` modal.
3.  Implementovat `ImageBubble` v chatu.
4.  Implementovat Lightbox pro prohlížení.

### Fáze 5: Integrace a Testování
1.  Integrovat do `ChatView`.
2.  Testovat na mobilních zařízeních (iOS/Android permissions).
