-- Vyčistit staré (volitelné)
-- truncate table public.beta_codes;

-- Admin kód
insert into public.beta_codes (code) values ('NOTCH-ADMIN-TEST') ON CONFLICT DO NOTHING;

-- Generování 100 kódů
insert into public.beta_codes (code)
select 'TIKTOK-' || upper(substring(md5(random()::text) from 1 for 5))
from generate_series(1, 100)
ON CONFLICT DO NOTHING;

-- Výpis
SELECT code FROM public.beta_codes ORDER BY id ASC;