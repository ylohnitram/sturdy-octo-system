# 👻 Oprava Ghosting Funkcionality

## ❌ Problém

Uživatelé hlásili, že po "odghostnutí" (zrušení ignorování) uživatele není možné mu poslat zprávu.

## 🔍 Příčina

Pravděpodobně chybějící nebo nefunkční RPC funkce `unghost_user` v databázi, která má za úkol smazat záznam z tabulky `blocked_users`. Pokud záznam v `blocked_users` zůstane, RLS policies na tabulce `messages` nedovolí odeslat zprávu (protože systém si myslí, že uživatel je stále blokován).

## ✅ Řešení

Vytvořil jsem novou migraci `db/migrations/18_fix_ghosting_functions.sql`, která explicitně definuje funkce `ghost_user` a `unghost_user`.

### Jak aplikovat opravu

1. Otevři **Supabase Dashboard**
2. Jdi do **SQL Editor**
3. Vlož a spusť obsah souboru `db/migrations/18_fix_ghosting_functions.sql`:

```sql
-- 1. ghost_user function
CREATE OR REPLACE FUNCTION public.ghost_user(p_blocker_id uuid, p_blocked_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.blocked_users (blocker_id, blocked_id)
    VALUES (p_blocker_id, p_blocked_id)
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
END;
$$;

-- 2. unghost_user function
CREATE OR REPLACE FUNCTION public.unghost_user(p_blocker_id uuid, p_blocked_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.blocked_users
    WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id;
END;
$$;
```

### Ověření

Po spuštění SQL skriptu:
1. Ghostni uživatele (v chatu ikona ducha)
2. Jdi do Profil -> Ghost List
3. Odghostni uživatele
4. Zkus mu poslat zprávu - **mělo by to fungovat!** 🎉
