# 🖼️ Oprava: Obrázky zmizí po znovuotevření chatu

## ❌ Problém

Po zavření a znovuotevření chatu se obrázky nezobrazují - místo nich jsou jen prázdné bubliny.

## 🔍 Příčina

RPC funkce `get_conversation_messages` buď:
1. **Neexistuje** v databázi (chybí migrace)
2. **Nevrací** sloupec `media_url` a další multimedia pole

Když se chat znovu otevře, volá se `fetchConversation()`, která používá `supabase.rpc('get_conversation_messages', ...)`. Pokud tato funkce nevrací `media_url`, obrázky se nezobrazí.

## ✅ Řešení

Vytvořil jsem novou migraci `db/migrations/19_chat_rpc_functions.sql`, která definuje všechny potřebné RPC funkce pro chat včetně podpory multimédií.

### Jak aplikovat opravu

1. Otevři **Supabase Dashboard**
2. Jdi do **SQL Editor**
3. Vlož a spusť obsah souboru `db/migrations/19_chat_rpc_functions.sql`

### Co migrace obsahuje

1. **`get_conversation_messages`** - Načte všechny zprávy v konverzaci
   - ✅ Vrací `media_url`, `type`, `metadata`
   - ✅ Podporuje obrázky a audio zprávy

2. **`get_user_matches`** - Načte seznam matchů s náhledem poslední zprávy
   - ✅ Filtruje ghostnuté uživatele
   - ✅ Počítá nepřečtené zprávy

3. **`get_unread_conversations_count`** - Spočítá nepřečtené konverzace

4. **`mark_conversation_as_read`** - Označí zprávy jako přečtené

### Ověření

Po spuštění SQL skriptu:
1. Otevři chat s někým, komu jsi poslal obrázek
2. Zavři chat (zpět na seznam)
3. Znovu otevři chat
4. **Obrázky by se měly zobrazit!** 🎉

## 🔧 Technické detaily

### Před (nefunkční)
```typescript
// RPC funkce neexistuje nebo nevrací media_url
const { data } = await supabase.rpc('get_conversation_messages', {...});
// data[0].media_url = undefined ❌
```

### Po (funguje)
```typescript
// RPC funkce vrací všechna pole včetně media_url
const { data } = await supabase.rpc('get_conversation_messages', {...});
// data[0].media_url = "https://..." ✅
```

## 📝 Poznámka

Tato migrace je **kritická** pro funkčnost multimedia chatu. Bez ní:
- ❌ Obrázky zmizí po reload
- ❌ Audio zprávy se nezobrazí
- ❌ Metadata se ztratí

Po aplikaci migrace vše funguje správně! ✅
