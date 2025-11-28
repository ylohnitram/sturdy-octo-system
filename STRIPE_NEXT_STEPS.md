# Stripe Payments - Next Steps

## ✅ Co bylo implementováno

### 1. Databáze
- ✅ Migrace `16_stripe_subscriptions.sql` s tabulkami `customers` a `subscriptions`
- ✅ RLS policies pro bezpečný přístup k datům
- ✅ Automatické triggery pro synchronizaci `is_premium` statusu
- ✅ Funkce pro automatickou aktualizaci premium statusu

### 2. Backend (Supabase Edge Functions)
- ✅ `stripe-webhook` - Zpracování webhook eventů s validací podpisu
- ✅ `create-checkout-session` - Vytvoření platební session
- ✅ `cancel-subscription` - Zrušení předplatného
- ✅ `reactivate-subscription` - Obnovení předplatného

### 3. Frontend
- ✅ Aktualizovaný `paymentService.ts` s reálnou Stripe integrací
- ✅ Aktualizovaný `PremiumModal.tsx` s loading states a error handling
- ✅ Nová komponenta `SubscriptionManagement.tsx` pro správu předplatného
- ✅ TypeScript typy pro Subscription a StripeCustomer

### 4. Dokumentace
- ✅ `STRIPE_DEPLOYMENT.md` - Kompletní deployment guide
- ✅ `supabase/functions/README.md` - Dokumentace Edge Functions
- ✅ Aktualizovaný `.env.example` s Stripe proměnnými
- ✅ Aktualizovaný `CHANGELOG.md` a `package.json`

## 🚀 Další kroky k nasazení

### Krok 1: Stripe Setup (30 minut)
1. **Vytvoř Stripe účet** na [stripe.com](https://stripe.com)
2. **Vytvoř produkt "Notch Gold"**:
   - Cena: 199 CZK měsíčně
   - Trial: 7 dní zdarma
   - Zkopíruj Price ID (začíná `price_...`)
3. **Získej API klíče**:
   - Publishable key (začíná `pk_test_...`)
   - Secret key (začíná `sk_test_...`)
4. **Nastav webhook**:
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`
   - Zkopíruj Signing secret (začíná `whsec_...`)

### Krok 2: Supabase Setup (15 minut)
1. **Spusť databázovou migraci**:
   ```bash
   # V Supabase Dashboard → SQL Editor
   # Zkopíruj a spusť obsah db/migrations/16_stripe_subscriptions.sql
   ```

2. **Nasaď Edge Functions**:
   ```bash
   # Nainstaluj Supabase CLI (pokud ještě nemáš)
   npm install -g supabase
   
   # Přihlaš se
   supabase login
   
   # Propoj projekt
   supabase link --project-ref your-project-ref
   
   # Nasaď funkce
   supabase functions deploy stripe-webhook
   supabase functions deploy create-checkout-session
   supabase functions deploy cancel-subscription
   supabase functions deploy reactivate-subscription
   ```

3. **Nastav environment variables** v Supabase Dashboard → Edge Functions:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   APP_URL=https://your-app-url.com
   ```

### Krok 3: Frontend Configuration (5 minut)
1. **Lokální development** - aktualizuj `.env`:
   ```bash
   VITE_STRIPE_PRICE_ID=price_test_your_price_id
   ```

2. **Production** - nastav v Vercel Environment Variables:
   ```bash
   VITE_STRIPE_PRICE_ID=price_live_your_price_id  # Po přepnutí na live mode
   ```

### Krok 4: Testování (30 minut)
1. **Lokální testování webhooků**:
   ```bash
   # Nainstaluj Stripe CLI
   stripe login
   stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
   
   # V novém terminálu
   stripe trigger checkout.session.completed
   ```

2. **Test flow v aplikaci**:
   - Otevři aplikaci
   - Klikni "Aktivovat Gold"
   - Použij test kartu: `4242 4242 4242 4242`
   - Ověř, že:
     - ✅ Webhook byl přijat
     - ✅ Záznam v `subscriptions` byl vytvořen
     - ✅ `profiles.is_premium` je `TRUE`
     - ✅ UI zobrazuje Gold status

3. **Test zrušení**:
   - Jdi na Správa předplatného
   - Zruš obnovení
   - Ověř retention modal
   - Zkontroluj `cancel_at_period_end` v DB

4. **Test obnovení**:
   - Po zrušení klikni "Obnovit"
   - Ověř, že flag byl resetován

### Krok 5: Integrace do UI (volitelné)
Aktuálně `SubscriptionManagement` komponenta není integrována do aplikace. Doporučuji:

1. **Přidat do ProfileView**:
   ```tsx
   // V ProfileView.tsx
   import { SubscriptionManagement } from './SubscriptionManagement';
   
   // Přidat stav
   const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);
   
   // Přidat tlačítko v sekci Premium
   {userStats.tier === UserTier.PREMIUM && (
     <button onClick={() => setShowSubscriptionManagement(true)}>
       Spravovat předplatné
     </button>
   )}
   
   // Renderovat modal
   {showSubscriptionManagement && (
     <SubscriptionManagement onClose={() => setShowSubscriptionManagement(false)} />
   )}
   ```

2. **Nebo přidat do Settings** (pokud bude vytvořena Settings obrazovka)

### Krok 6: Go Live (po testování)
1. **Aktivuj Stripe účet** v production modu
2. **Vytvoř live produkt** a získej live Price ID
3. **Nahraď test klíče** za live klíče:
   - V Supabase: `STRIPE_SECRET_KEY=sk_live_...`
   - V Vercel: `VITE_STRIPE_PRICE_ID=price_live_...`
4. **Aktualizuj webhook URL** na production endpoint
5. **Otestuj s reálnou kartou** (můžeš ihned zrušit)
6. **Monitoruj** první platby v Stripe Dashboard

## 📝 Poznámky

### Bezpečnost
- ✅ Secret keys jsou pouze v Edge Functions
- ✅ Webhook signature je vždy validována
- ✅ RLS policies chrání data
- ✅ JWT autentizace pro všechny user-facing funkce

### Monitoring
- **Stripe Dashboard**: Sleduj platby a webhooky
- **Supabase Logs**: Kontroluj Edge Function logy
- **Database**: Pravidelně kontroluj `subscriptions` tabulku

### Známé problémy
- Lint chyby v Edge Functions jsou očekávané (Deno vs Node.js)
- Tyto chyby můžeš ignorovat - funkce běží v Deno runtime

## 🎯 Doporučené vylepšení (budoucnost)

1. **Email notifikace**:
   - Potvrzení platby
   - Připomenutí konce trial periody
   - Upozornění na selhání platby

2. **Analytics**:
   - Tracking conversion rate
   - A/B testing cen
   - Retention metrics

3. **Více platebních metod**:
   - Apple Pay
   - Google Pay
   - SEPA Direct Debit

4. **Roční předplatné**:
   - Sleva za roční platbu
   - Další Price ID v Stripe

## 📚 Další zdroje

- [Stripe Dokumentace](https://stripe.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
