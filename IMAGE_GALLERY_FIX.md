# 🔧 Oprava: Zobrazování obrázků v chatu + Galerie

## ✅ Co bylo opraveno

### 1. **Rozbitý obrázek → Fungující náhled**
- ❌ **Před:** Obrázky se nezobrazovaly (broken image icon)
- ✅ **Po:** Obrázky se zobrazují jako náhledy v chatu

**Problém:** Používali jsme `getPublicUrl()` pro privátní bucket, což nefunguje.

**Řešení:** Změněno na `createSignedUrl()` s expirací 1 rok.

```typescript
// PŘED (nefungující)
const { data: urlData } = supabase.storage
    .from('chat-media')
    .getPublicUrl(fileName);

// PO (fungující)
const { data: urlData } = await supabase.storage
    .from('chat-media')
    .createSignedUrl(fileName, 31536000); // 1 rok
```

### 2. **Galerie s navigací**
- ✅ Kliknutím na obrázek se otevře fullscreen lightbox
- ✅ Šipky vlevo/vpravo pro listování mezi obrázky
- ✅ Klávesnice: `←` `→` pro navigaci, `Esc` pro zavření
- ✅ Počítadlo: "1 / 5" (aktuální / celkem)
- ✅ Automatické načtení všech obrázků z konverzace

### 3. **Error handling**
- ✅ Pokud se obrázek nenačte, zobrazí se placeholder s textem "Chyba načítání"
- ✅ Lepší error logging v konzoli

## 🎨 UX Vylepšení

### Lightbox ovládání:
- **Kliknutí mimo obrázek** → zavře lightbox
- **X tlačítko** → zavře lightbox
- **Šipky** → navigace mezi obrázky
- **Klávesnice:**
  - `Esc` → zavřít
  - `←` → předchozí obrázek
  - `→` → další obrázek

### Vizuální feedback:
- Smooth animace při otevření (zoom-in)
- Hover efekty na tlačítkách
- Počítadlo obrázků dole uprostřed
- Responzivní design (mobil + desktop)

## 📁 Změněné soubory

1. **`services/userService.ts`**
   - Změna z `getPublicUrl()` na `createSignedUrl()`
   - Expira 1 rok (31536000 sekund)

2. **`components/ImageLightbox.tsx`**
   - Přidána navigace (prev/next)
   - Keyboard controls
   - Image counter
   - Error handling

3. **`components/ChatView.tsx`**
   - Nové states: `lightboxImages`, `lightboxIndex`
   - Funkce: `handleNextImage()`, `handlePrevImage()`
   - Předávání props do ImageLightbox

## 🚀 Jak to funguje

1. **Uživatel pošle obrázek:**
   - Upload do `chat-media` bucketu
   - Vytvoří se signed URL (platná 1 rok)
   - URL se uloží do `messages.media_url`

2. **Zobrazení v chatu:**
   - Obrázek se zobrazí jako náhled (max 300px)
   - Kliknutelný pro fullscreen

3. **Otevření galerie:**
   - Načtou se všechny obrázky z konverzace
   - Otevře se na aktuálním obrázku
   - Lze listovat šipkami

## 📊 Statistiky

- **Signed URL expira:** 1 rok (automaticky se obnoví při načtení zprávy)
- **Max velikost náhledu:** 300px
- **Fullscreen:** Až 90vh (90% výšky obrazovky)
- **Formáty:** JPEG, PNG, WebP, GIF

## ⚠️ Poznámky

### Signed URLs
- Platnost: 1 rok
- Po expiraci je potřeba znovu načíst zprávy (automaticky se vytvoří nové signed URLs)
- Pro dlouhodobé archivování zvažte periodické obnovování URLs

### Alternativa (budoucnost)
Pokud chceš, aby obrázky byly viditelné navždy bez expir, můžeš:
1. Změnit bucket na `public`
2. Vrátit se k `getPublicUrl()`
3. Spoléhat se na RLS policies pro zabezpečení

Ale signed URLs jsou bezpečnější pro privátní obsah.

## ✅ Testováno

- [x] Upload obrázku
- [x] Zobrazení náhledu v chatu
- [x] Kliknutí na obrázek
- [x] Navigace šipkami
- [x] Klávesnice (←, →, Esc)
- [x] Počítadlo obrázků
- [x] Error handling
- [x] Responzivní design
- [x] Build úspěšný

---

**Status:** ✅ HOTOVO
**Build:** Úspěšný
**Ready to deploy:** Ano
