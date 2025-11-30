# ✅ CHAT MEDIA - CHECKLIST

## Co jsem opravil:

### ✅ Tlačítko Send
- [x] Tlačítko Send je **vždy viditelné**
- [x] Disabled když je input prázdný
- [x] Funguje na kliknutí i Enter

### ✅ Shift+Enter
- [x] Enter → odešle zprávu
- [x] Shift+Enter → nový řádek
- [x] Textarea místo inputu
- [x] Auto-resize (max 3 řádky, pak scroll)

### ✅ Layout Input Baru
```
[📷] [🎤] [Textarea...] [😊] [✨] [📤]
```
- Fotka vlevo
- Mikrofon vedle fotky
- Textarea uprostřed
- Emoji, AI, Send vpravo

## Co musíš udělat (Supabase):

### 1. Vytvoř Bucket
- [ ] Dashboard → Storage → New Bucket
- [ ] Name: `chat-media`
- [ ] Public: **NE** (private!)
- [ ] Create

### 2. Spusť Migraci
- [ ] SQL Editor → New Query
- [ ] Zkopíruj: `db/migrations/17_chat_media_support.sql`
- [ ] Run

### 3. Přidej Policies
- [ ] SQL Editor → New Query
- [ ] Zkopíruj SQL z `STORAGE_FIX.md` (Krok 3)
- [ ] Run

### 4. Test
- [ ] Otevři chat
- [ ] Zkus poslat fotku
- [ ] Zkus poslat hlasovku
- [ ] Zkus Shift+Enter

## Soubory k použití:

1. **STORAGE_FIX.md** - Kompletní průvodce setupem
2. **db/migrations/17_chat_media_support.sql** - Databázová migrace
3. **db/migrations/17b_storage_setup.sql** - Storage policies SQL

## Rychlý SQL pro zkopírování:

### Policies (zkopíruj do SQL Editoru):
```sql
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM matches 
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

CREATE POLICY "Users can view chat media from matches"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM matches 
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'chat-media'
    AND owner = auth.uid()
);
```

## Po setupu:

✅ Build funguje (zkontrolováno)
✅ Všechny komponenty vytvořeny
✅ Send button vždy viditelný
✅ Shift+Enter funguje
✅ Čeká jen na Supabase setup

---

**Potřebuješ pomoc?** Viz `STORAGE_FIX.md` pro detailní kroky.
