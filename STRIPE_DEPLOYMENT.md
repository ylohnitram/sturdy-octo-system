# Stripe Payments - Deployment Guide

Tento dokument popisuje kroky potřebné k nasazení Stripe platební integrace do produkce.

## 1. Stripe Setup

### 1.1 Vytvoření Stripe účtu
1. Zaregistruj se na [stripe.com](https://stripe.com)
2. Aktivuj účet a dokončí ověření

### 1.2 Vytvoření produktu a ceny
1. V Stripe Dashboard jdi na **Products** → **Add Product**
2. Vytvoř produkt:
   - **Name**: Notch Gold
   - **Description**: Premium subscription for Notch app
3. Přidej cenu:
   - **Pricing model**: Recurring
   - **Price**: 199 CZK
   - **Billing period**: Monthly
   - **Free trial**: 7 days
4. Zkopíruj **Price ID** (začíná `price_...`)

### 1.3 Získání API klíčů
1. V Stripe Dashboard jdi na **Developers** → **API keys**
2. Zkopíruj:
   - **Publishable key** (začíná `pk_test_...` pro test, `pk_live_...` pro produkci)
   - **Secret key** (začíná `sk_test_...` pro test, `sk_live_...` pro produkci)

### 1.4 Nastavení Webhooku
1. V Stripe Dashboard jdi na **Developers** → **Webhooks**
2. Klikni na **Add endpoint**
3. Zadej URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Vyber události:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Zkopíruj **Signing secret** (začíná `whsec_...`)

## 2. Supabase Setup

### 2.1 Spuštění databázové migrace
```bash
# Připoj se k Supabase projektu
supabase link --project-ref your-project-ref

# Spusť migraci
supabase db push
```

Nebo manuálně v Supabase SQL Editor:
1. Otevři `db/migrations/16_stripe_subscriptions.sql`
2. Zkopíruj a spusť SQL v Supabase Dashboard → SQL Editor

### 2.2 Nasazení Edge Functions

```bash
# Nasaď všechny Edge Functions
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy cancel-subscription
supabase functions deploy reactivate-subscription
```

### 2.3 Nastavení Environment Variables

V Supabase Dashboard → Edge Functions → Settings, nastav:

```bash
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
APP_URL=https://your-app-url.com
```

**DŮLEŽITÉ**: Nikdy nepoužívej `sk_live_` klíče v development prostředí!

## 3. Frontend Configuration

### 3.1 Lokální development (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PRICE_ID=price_test_your_price_id
```

### 3.2 Production (Vercel Environment Variables)
V Vercel Dashboard → Settings → Environment Variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PRICE_ID=price_live_your_price_id
```

## 4. Testování

### 4.1 Lokální testování webhooků
```bash
# Nainstaluj Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Přihlaš se
stripe login

# Přesměruj webhookuky na lokální Edge Function
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook

# V novém terminálu spusť test platbu
stripe trigger checkout.session.completed
```

### 4.2 Test scénáře

#### Úspěšná platba
1. Otevři aplikaci
2. Klikni na "Aktivovat Gold"
3. Použij testovací kartu: `4242 4242 4242 4242`
4. Datum: jakékoliv budoucí
5. CVC: jakékoliv 3 číslice
6. Ověř, že:
   - Webhook byl přijat
   - Záznam v `subscriptions` byl vytvořen
   - `profiles.is_premium` je `TRUE`
   - UI zobrazuje Gold status

#### Zrušení předplatného
1. V aplikaci jdi na Správa předplatného
2. Klikni "Zrušit automatické obnovení"
3. Potvrď v retention modalu
4. Ověř, že:
   - `subscriptions.cancel_at_period_end` je `TRUE`
   - UI zobrazuje "KONČÍ" status
   - Premium funkce stále fungují

#### Obnovení předplatného
1. Po zrušení klikni "Obnovit předplatné"
2. Ověř, že:
   - `subscriptions.cancel_at_period_end` je `FALSE`
   - UI zobrazuje "AKTIVNÍ" status

## 5. Monitoring

### 5.1 Stripe Dashboard
- **Payments**: Sleduj úspěšné platby
- **Subscriptions**: Aktivní předplatné
- **Webhooks**: Úspěšnost webhook eventů

### 5.2 Supabase Dashboard
- **Table Editor**: Kontroluj `subscriptions` a `customers` tabulky
- **Logs**: Sleduj Edge Function logy

### 5.3 Error Handling
Běžné chyby:
- **Invalid webhook signature**: Zkontroluj `STRIPE_WEBHOOK_SECRET`
- **User not found**: Ujisti se, že `client_reference_id` je správně nastaveno
- **Subscription not created**: Zkontroluj webhook events v Stripe Dashboard

## 6. Security Checklist

- [ ] Stripe Secret Keys jsou uloženy pouze v Supabase Edge Functions (ne ve frontend kódu)
- [ ] Webhook signature je vždy validována
- [ ] RLS policies jsou aktivní na `customers` a `subscriptions` tabulkách
- [ ] Production používá `sk_live_` a `pk_live_` klíče
- [ ] Test environment používá `sk_test_` a `pk_test_` klíče
- [ ] APP_URL je správně nastavena pro production

## 7. Go Live

1. **Aktivuj Stripe účet** v production modu
2. **Nahraď test klíče** za live klíče ve všech prostředích
3. **Aktualizuj webhook URL** na production Edge Function
4. **Otestuj celý flow** s reálnou kartou (můžeš ihned zrušit)
5. **Monitoruj první platby** v Stripe Dashboard

## Podpora

- Stripe dokumentace: https://stripe.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Notch RFC: `.agent/implementation_plans/payments_rfc.md`
