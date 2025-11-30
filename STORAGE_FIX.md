# 🔧 OPRAVA: Storage Bucket Setup

## Problém
```
Error: Bucket not found
```

## Řešení (5 minut)

### Krok 1: Vytvoř Bucket (Dashboard)

1. Otevři Supabase Dashboard: https://supabase.com/dashboard
2. Vyber svůj projekt
3. Jdi na **Storage** (levé menu)
4. Klikni **New Bucket**
5. Vyplň:
   ```
   Name: chat-media
   Public: ❌ (VYPNUTO - musí být private!)
   File size limit: 10 MB
   Allowed MIME types: (nech prázdné nebo přidej):
     - image/jpeg
     - image/png
     - image/webp
     - audio/webm
   ```
6. Klikni **Create Bucket**

### Krok 2: Spusť Databázovou Migraci

1. V Supabase Dashboard jdi na **SQL Editor**
2. Klikni **New Query**
3. Zkopíruj obsah souboru: `db/migrations/17_chat_media_support.sql`
4. Vlož do editoru
5. Klikni **Run** (nebo F5)
6. ✅ Mělo by být: "Success. No rows returned"

### Krok 3: Přidej Storage Policies

1. Stále v **SQL Editor**
2. Klikni **New Query**
3. Zkopíruj tento SQL:

```sql
-- Policy 1: Upload
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM matches 
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

-- Policy 2: View
CREATE POLICY "Users can view chat media from matches"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM matches 
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

-- Policy 3: Delete
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-media'
    AND owner = auth.uid()
);
```

4. Klikni **Run**
5. ✅ Mělo by být: "Success. No rows returned"

### Krok 4: Ověř Setup

Spusť tento SQL pro kontrolu:

```sql
-- Zkontroluj bucket
SELECT * FROM storage.buckets WHERE id = 'chat-media';

-- Zkontroluj policies (měly by být 3)
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%chat media%';
```

Měl bys vidět:
- 1 bucket s názvem `chat-media`
- 3 policies

### Krok 5: Test

1. Otevři aplikaci
2. Otevři chat
3. Klikni 📷 → vyber fotku → odešli
4. ✅ Mělo by fungovat!

## Troubleshooting

### Stále "Bucket not found"?
- Zkontroluj, že bucket se jmenuje **přesně** `chat-media` (lowercase, pomlčka)
- Zkontroluj, že bucket je **private** (public = false)

### "Permission denied"?
- Zkontroluj, že jsi spustil všechny 3 policies
- Zkontroluj, že jsi přihlášený uživatel

### Policies se nedají vytvořit?
- Možná už existují - zkus je nejdřív smazat:
```sql
DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat media from matches" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;
```
- Pak spusť znovu vytvoření policies

## ✅ Hotovo!

Po dokončení těchto kroků by mělo vše fungovat:
- ✅ Odesílání fotek
- ✅ Odesílání hlasovek
- ✅ Zobrazení médií v chatu
- ✅ Shift+Enter pro nový řádek
- ✅ Tlačítko Send vždy viditelné
