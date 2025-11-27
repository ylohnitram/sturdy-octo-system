# AI Wingman - Bezpečnostní Audit & Opravy

## ✅ Provedené opravy

### 1. API Endpoint (`api/wingman.js`)
- ✅ Převedeno na CommonJS (Vercel kompatibilita)
- ✅ Přidáno lepší error handling
- ✅ Přidáno logování pro debugging
- ✅ CORS konfigurace s volitelným omezením origin
- ✅ Validace prázdných odpovědí

### 2. Frontend Service (`services/geminiService.ts`)
- ✅ Hybridní režim: Dev = SDK, Prod = API
- ✅ Automatický fallback na `/api/wingman`
- ✅ Zachování všech funkcí (icebreaker, chat assist, bio, insight)

### 3. Build Konfigurace (`vite.config.ts`)
- ✅ API klíč se exponuje POUZE v dev mode
- ✅ Production build nemá klíč v kódu
- ✅ Tree-shaking zajistí odstranění mrtvého kódu

### 4. Environment Variables
- ✅ `.env.example` aktualizován s GEMINI_API_KEY
- ✅ `.gitignore` opraveno (bylo poškozené kódování)
- ✅ `scripts/generate-env.js` zahrnuje GEMINI_API_KEY

### 5. Dokumentace
- ✅ `SECURITY.md` - kompletní bezpečnostní guide
- ✅ `vercel.json` - konfigurace pro API routes
- ✅ Tento checklist

## 🔒 Bezpečnostní Analýza

### GEMINI_API_KEY
| Prostředí | Kde je klíč | Bezpečné? |
|-----------|-------------|-----------|
| **Development** | `.env` → `process.env` → Frontend | ⚠️ Lokálně OK |
| **Production** | Vercel Env Vars → Serverless API | ✅ ANO |

**Výsledek**: ✅ Klíč je v produkci bezpečný (není v buildu)

### VITE_SUPABASE_ANON_KEY
| Prostředí | Kde je klíč | Bezpečné? |
|-----------|-------------|-----------|
| **Všude** | Frontend (veřejný) | ✅ ANO (s RLS) |

**Výsledek**: ✅ Veřejný klíč, chráněný Row Level Security

**⚠️ DŮLEŽITÉ**: Ujisti se, že máš v Supabase zapnuté RLS policies!

### VITE_SUPABASE_URL
| Prostředí | Kde je URL | Bezpečné? |
|-----------|------------|-----------|
| **Všude** | Frontend (veřejná) | ✅ ANO |

**Výsledek**: ✅ Veřejná URL, není tajná

## 📋 Checklist pro Deployment

### Před prvním deploymentem:

- [ ] Přidej `GEMINI_API_KEY` do Vercel Environment Variables
- [ ] Přidej `VITE_SUPABASE_URL` do Vercel Environment Variables
- [ ] Přidej `VITE_SUPABASE_ANON_KEY` do Vercel Environment Variables
- [ ] (Volitelně) Přidej `ALLOWED_ORIGINS` s tvou doménou
- [ ] Zkontroluj RLS policies v Supabase
- [ ] Commitni a pushni změny
- [ ] Spusť deployment na Vercelu

### Po deploymentu:

- [ ] Otestuj AI Wingman v produkci
- [ ] Zkontroluj Vercel logs: `vercel logs --follow`
- [ ] Ověř, že klíč není v produkčním JS (DevTools → Sources)

### Lokální vývoj:

- [ ] Vytvoř `.env` soubor (viz `.env.example`)
- [ ] Přidej svůj `GEMINI_API_KEY`
- [ ] Spusť `npm run dev`
- [ ] Otestuj AI Wingman lokálně

## 🧪 Testování

### Test 1: Lokální vývoj
```bash
# Ujisti se, že máš .env s GEMINI_API_KEY
npm run dev
# Otevři chat, zkus AI Wingman
# Měl by volat přímo Gemini SDK
```

### Test 2: Production build (simulace)
```bash
# Build bez dev klíče
npm run build
npm run preview
# Otevři chat, zkus AI Wingman
# Měl by volat /api/wingman (ale selže, protože preview nemá serverless)
```

### Test 3: Vercel deployment
```bash
# Po deployi na Vercel
# Otevři produkční URL
# Zkus AI Wingman
# Zkontroluj Vercel logs
vercel logs --follow
# Měl bys vidět: [Wingman API] Generating content...
```

## 🐛 Troubleshooting

### "Server configuration error"
**Příčina**: Chybí `GEMINI_API_KEY` v Vercel env vars  
**Řešení**: Přidej do Vercel → Settings → Environment Variables

### "Failed to fetch" v produkci
**Příčina**: API endpoint není dostupný  
**Řešení**: Zkontroluj, že `api/wingman.js` je v repozitáři a byl deploynutý

### CORS error
**Příčina**: Origin není povolený  
**Řešení**: Přidej `ALLOWED_ORIGINS` nebo nech `*` (méně bezpečné)

### Funguje lokálně, ale ne v produkci
**Příčina**: Různé cesty kódu (SDK vs API)  
**Řešení**: Zkontroluj Vercel logs pro detaily chyby

## 📊 Monitoring

### Vercel Dashboard
1. Jdi na **Functions** → `api/wingman`
2. Sleduj invocations, errors, duration
3. Zkontroluj logs

### Vercel CLI
```bash
# Real-time logs
vercel logs --follow

# Filtruj jen API
vercel logs --follow | grep "Wingman API"
```

## 🎯 Závěr

Všechny identifikované bezpečnostní problémy byly opraveny:

✅ **GEMINI_API_KEY** - bezpečně na serveru  
✅ **VITE_SUPABASE_ANON_KEY** - veřejný klíč s RLS  
✅ **VITE_SUPABASE_URL** - veřejná URL  
✅ **Build proces** - klíče nejsou v produkčním JS  
✅ **Dokumentace** - kompletní guide v SECURITY.md  

**Aplikace je připravena pro bezpečný production deployment! 🚀**
