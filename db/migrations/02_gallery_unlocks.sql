-- 1. Tabulka pro odemčené fotky
create table if not exists public.gallery_unlocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null, -- Kdo si to odemkl
  image_id uuid references public.gallery_images(id) not null, -- Jakou fotku
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, image_id) -- Nemůže si to odemknout 2x
);

-- 2. RLS Policy pro gallery_unlocks
alter table public.gallery_unlocks enable row level security;

create policy "Users can see their own unlocks" 
  on public.gallery_unlocks for select 
  using (auth.uid() = user_id);

create policy "Users can insert unlocks (via RPC only ideally, but for now RLS)" 
  on public.gallery_unlocks for insert 
  with check (auth.uid() = user_id);

-- 3. Uprava RLS pro gallery_images (aby byly vidět odemčené)
drop policy if exists "Public images are viewable by everyone" on public.gallery_images;

create policy "Public images are viewable by everyone" 
  on public.gallery_images for select 
  using (
    is_private = false 
    OR auth.uid() = user_id -- Vlastník vidí vše
    OR exists ( -- Nebo existuje záznam v unlocks
      select 1 from public.gallery_unlocks 
      where gallery_unlocks.image_id = gallery_images.id 
      and gallery_unlocks.user_id = auth.uid()
    )
  );

-- 4. Funkce pro bezpečné odemknutí (transakce: strhni coiny -> vytvoř unlock)
create or replace function public.unlock_image(img_id uuid)
returns boolean as $$
declare
  v_price int := 20; -- Cena za fotku (může být dynamická v budoucnu)
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- 1. Zkontroluj, jestli už není odemčeno
  if exists (select 1 from public.gallery_unlocks where user_id = v_user_id and image_id = img_id) then
    return true;
  end if;

  -- 2. Zkontroluj zůstatek a strhni coiny
  if (select coins from public.user_stats where user_id = v_user_id) >= v_price then
    update public.user_stats 
    set coins = coins - v_price 
    where user_id = v_user_id;
    
    -- 3. Vytvoř záznam o odemknutí
    insert into public.gallery_unlocks (user_id, image_id)
    values (v_user_id, img_id);
    
    return true;
  else
    return false; -- Nedostatek coinů
  end if;
end;
$$ language plpgsql security definer;
