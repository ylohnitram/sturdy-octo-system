# 🔧 OPRAVA: Obrázky viditelné pouze odesílateli

## ❌ Problém

Obrázky v chatu se zobrazují pouze odesílateli, příjemce vidí broken image icon.

## 🔍 Příčina

Signed URLs z privátního bucketu nefungují správně s RLS policies. Když odesílatel vytvoří signed URL, příjemce k ní nemá přístup, protože URL je podepsána credentials odesílatele.

## ✅ Řešení

Změnit bucket `chat-media` z **private** na **public** a spoléhat se na RLS policies pro zabezpečení.

### Krok 1: Změň bucket na public

V Supabase Dashboard:

1. Jdi na **Storage** → **chat-media** bucket
2. Klikni na **Settings** (⚙️)
3. Změň **Public bucket** na **ON** (✅)
4. Klikni **Save**

### Krok 2: Aktualizuj RLS Policies

RLS policies zůstávají stejné - zajišťují, že pouze účastníci matche mohou vidět média:

```sql
-- Policy pro SELECT (viewing)
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
```

### Krok 3: Ověř, že policies jsou aktivní

```sql
-- Zkontroluj policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%chat media%';
```

Měly by být 3 policies:
1. Upload (INSERT)
2. View (SELECT)  
3. Delete (DELETE)

## 🔒 Bezpečnost

**Je to bezpečné?**

✅ **ANO!** I když je bucket public, RLS policies zajišťují:

- Pouze authenticated uživatelé mohou přistupovat k médiím
- Pouze účastníci matche vidí média z jejich konverzace
- Nikdo jiný nemá přístup k médiím

**Public bucket** znamená pouze to, že URL jsou veřejné, ale **RLS policies kontrolují přístup**.

## 🎯 Jak to funguje

### Před (private bucket + signed URLs):
```
Odesílatel → Upload → Signed URL (s credentials odesílatele)
Příjemce → Pokus o načtení → ❌ Nemá přístup (jiné credentials)
```

### Po (public bucket + RLS):
```
Odesílatel → Upload → Public URL
Příjemce → Pokus o načtení → ✅ RLS policy zkontroluje match → Povoleno
```

## 📝 Alternativní řešení (pokud chceš zůstat u private)

Pokud opravdu chceš private bucket, musíš:

1. **Generovat signed URLs pro každého uživatele zvlášť**
2. **Ukládat signed URLs do databáze** (ne do messages)
3. **Periodicky obnovovat expirované URLs**

To je ale složitější a není to nutné, protože RLS policies poskytují dostatečnou bezpečnost.

## ✅ Doporučení

**Změň bucket na public** - je to jednodušší, bezpečnější (RLS policies) a funguje to okamžitě pro všechny uživatele.

---

**Po změně bucketu na public:**
- Obrázky budou viditelné všem účastníkům matche ✅
- RLS policies zajistí bezpečnost ✅
- Žádné problémy se signed URLs ✅
