# AI Wingman - Bezpečnostní Konfigurace

## Přehled

AI Wingman používá **hybridní přístup** pro volání Gemini API:

- **Development (lokálně)**: Přímé volání přes SDK s klíčem z `.env`
- **Production (Vercel)**: Bezpečné volání přes serverless API endpoint

## Proč je to bezpečné?

### ❌ Původní problém
Klíč byl "zapečený" do JavaScriptu → kdokoli mohl otevřít DevTools a klíč ukrást.

### ✅ Nové řešení
1. **V produkci**: Klíč je POUZE na serveru (Vercel Serverless Function)
2. **Build proces**: `vite.config.ts` vypustí klíč z produkčního buildu
3. **Frontend**: Volá `/api/wingman` endpoint místo přímého volání Google API

## Nastavení

### 1. Lokální vývoj

Vytvoř soubor `.env` v kořenu projektu:

```env
GEMINI_API_KEY=tvuj_gemini_api_klic
VITE_SUPABASE_URL=tvoje_supabase_url
VITE_SUPABASE_ANON_KEY=tvuj_supabase_anon_key
```

### 2. Vercel (Produkce)

Jdi do **Project Settings** → **Environment Variables** a přidej:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `GEMINI_API_KEY` | `tvůj_klíč` | Production, Preview |
| `VITE_SUPABASE_URL` | `tvoje_url` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | `tvůj_key` | Production, Preview |

**Volitelně** (pro lepší CORS bezpečnost):
| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `ALLOWED_ORIGINS` | `https://tvoje-domena.vercel.app` | Production |

### 3. Redeploy

Po přidání proměnných spusť nový deployment:
- Buď pushni nový commit
- Nebo v Vercelu klikni na **Redeploy**

## Jak to funguje

### Development Mode
```typescript
// geminiService.ts detekuje lokální klíč
const localApiKey = process.env.GEMINI_API_KEY; // ✅ Existuje
// → Volá přímo Google Gemini SDK
```

### Production Mode
```typescript
// geminiService.ts nenajde klíč (vite.config.ts ho nevložil)
const localApiKey = process.env.GEMINI_API_KEY; // ❌ Prázdný string
// → Fallback na fetch('/api/wingman')
// → Serverless funkce má klíč z Vercel env vars
```

## Bezpečnostní kontrola

### ✅ Co JE bezpečné
- `VITE_SUPABASE_ANON_KEY` - veřejný klíč, chráněný Row Level Security
- API endpoint `/api/wingman` - klíč zůstává na serveru

### ⚠️ Co NENÍ bezpečné (ale je OK)
- `VITE_SUPABASE_URL` - veřejná URL, není tajná
- `VITE_SUPABASE_ANON_KEY` - veřejný klíč, **musíš mít RLS policies v Supabase!**

### ❌ Co by NEBYLO bezpečné
- ~~`SUPABASE_SERVICE_ROLE_KEY`~~ - NIKDY nedávat do frontendu!
- ~~`GEMINI_API_KEY` v produkčním buildu~~ - už je vyřešeno ✅

## Supabase Row Level Security (RLS)

Ujisti se, že máš v Supabase zapnuté RLS policies pro všechny tabulky:

```sql
-- Příklad: Uživatelé vidí jen své vlastní profily
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

## Troubleshooting

### "Server configuration error" v produkci
→ Zkontroluj, že `GEMINI_API_KEY` je nastavený ve Vercel Environment Variables

### Funguje lokálně, ale ne v produkci
→ Zkontroluj Vercel logs: `vercel logs --follow`

### CORS error
→ Přidej `ALLOWED_ORIGINS` do Vercel env vars s tvou doménou

## Monitoring

Logy z API endpointu najdeš v Vercel:
- **Dashboard** → **Functions** → `api/wingman`
- Nebo přes CLI: `vercel logs`

Hledej:
- `[Wingman API] Generating content with model: ...`
- `[Wingman API] Successfully generated content`
- `[Wingman API] Error: ...`
