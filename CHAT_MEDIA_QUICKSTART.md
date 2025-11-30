# 🚀 Quick Start: Multimedia Chat

## ⚡ Rychlé Spuštění

### 1. Supabase Setup (5 minut)

```sql
-- A) Spustit migraci v Supabase SQL Editor
-- Zkopírovat obsah: db/migrations/17_chat_media_support.sql
```

```
-- B) Vytvořit Storage Bucket
Dashboard → Storage → New Bucket
  Name: chat-media
  Public: false
  ✅ Create
```

```sql
-- C) Přidat RLS Policies (zkopírovat do SQL Editor)

-- Policy 1: Upload
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM matches 
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

-- Policy 2: View
CREATE POLICY "Users can view chat media from matches"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM matches 
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

-- Policy 3: Delete
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'chat-media'
    AND owner = auth.uid()
);
```

### 2. Deploy

```bash
npm run build
# Deploy na Vercel
```

### 3. Test

1. Otevři chat
2. Klikni 📷 → vyber fotku → odešli
3. Klikni 🎤 → nahraj audio → odešli
4. ✅ Hotovo!

## 📱 Jak Používat

### Poslat Fotku
```
[📷] ← Klikni sem
  ↓
Vyber fotku
  ↓
Přidej popisek (volitelné)
  ↓
Odešli
```

### Poslat Audio
```
[🎤] ← Klikni sem (když je input prázdný)
  ↓
Klikni pro start nahrávání
  ↓
Klikni ✓ pro odeslání nebo ✕ pro zrušení
```

## 🔍 Troubleshooting

### Fotky se nenahrávají?
1. ✅ Bucket `chat-media` existuje?
2. ✅ RLS policies nastaveny?
3. ✅ Migrace spuštěna?

### Audio nefunguje?
1. ✅ HTTPS (vyžadováno pro mikrofon)?
2. ✅ Oprávnění k mikrofonu povoleno?
3. ✅ Moderní prohlížeč (Chrome 49+, Safari 14.1+)?

## 📚 Dokumentace

- **Setup Guide**: `CHAT_MEDIA_SETUP.md`
- **Implementation Summary**: `.agent/implementation_plans/chat_media_implementation_summary.md`
- **RFC Plan**: `.agent/implementation_plans/chat_media_rfc.md`

## ✅ Checklist

- [ ] Spustit SQL migraci
- [ ] Vytvořit bucket `chat-media`
- [ ] Přidat 3 RLS policies
- [ ] Build & deploy
- [ ] Test na mobilu
- [ ] Test na desktopu
- [ ] 🎉 Profit!

---

**Potřebuješ pomoc?** Viz `CHAT_MEDIA_SETUP.md` pro detaily.
