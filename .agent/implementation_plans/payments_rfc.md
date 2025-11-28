# RFC: Implementace Platební Brány a Správy Předplatného (Notch Gold)

## 1. Architektura a Bezpečnost

Základním kamenem bezpečnosti je **striktní oddělení klientské a serverové logiky**.

*   **Frontend (Client):** React aplikace. **NIKDY** nesmí mít přístup k `STRIPE_SECRET_KEY`. Komunikuje pouze s naším interním API (Supabase Edge Functions).
*   **Backend (Server):** Supabase Edge Functions (Deno/Node.js). Zde jsou uloženy tajné klíče (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) jako environment variables.
*   **Provider:** Stripe.

### Tok dat (Data Flow)
1.  **Frontend** požádá o platbu -> volá **Edge Function** `create-checkout-session`.
2.  **Edge Function** (s tajným klíčem) komunikuje se Stripe API a vrátí `sessionUrl`.
3.  **Frontend** přesměruje uživatele na Stripe.
4.  **Stripe** po zaplacení pošle asynchronní **Webhook** na naši další **Edge Function**.
5.  **Edge Function** (Webhook handler) ověří podpis webhooku (bezpečnost) a zapíše data do **Databáze**.

## 2. Databázové Schéma (Supabase)

Vytvoříme robustní strukturu pro synchronizaci stavu předplatného.

### Tabulka: `subscriptions`
Slouží jako "source of truth" pro stav předplatného v naší aplikaci.
*   `id` (text, PK): Stripe Subscription ID (např. `sub_12345`).
*   `user_id` (uuid, FK): Odkaz na `profiles.id`.
*   `status` (text): `active`, `trialing`, `past_due`, `canceled`, `incomplete`, `incomplete_expired`.
*   `metadata` (jsonb): Pro uložení dalších Stripe metadat.
*   `price_id` (text): ID cenového plánu.
*   `quantity` (integer).
*   `cancel_at_period_end` (boolean): Indikuje, zda uživatel zrušil obnovu.
*   `created` (timestamptz): Datum vytvoření ve Stripe.
*   `current_period_start` (timestamptz).
*   `current_period_end` (timestamptz): Kdy končí aktuální předplacené období.
*   `ended_at` (timestamptz): Kdy předplatné skutečně skončilo.
*   `cancel_at` (timestamptz): Kdy se má předplatné zrušit.
*   `canceled_at` (timestamptz): Kdy uživatel kliknul na zrušit.
*   `trial_start` (timestamptz).
*   `trial_end` (timestamptz).

### Tabulka: `customers` (Volitelné, ale doporučené)
Mapování mezi naším `user_id` a `stripe_customer_id`.
*   `id` (uuid, PK, FK na `profiles.id`).
*   `stripe_customer_id` (text).

## 3. Backend Logic (Supabase Edge Functions)

Všechny funkce běží v zabezpečeném prostředí Supabase.

### A. `create-checkout-session` (API Endpoint)
*   **Vstup:** `price_id`, `user_id` (z auth kontextu).
*   **Logika:**
    1.  Ověří, zda uživatel již nemá aktivní předplatné.
    2.  Najde nebo vytvoří Stripe Customer pro daného uživatele.
    3.  Vytvoří Stripe Checkout Session (mód `subscription`).
    4.  Nastaví `success_url` (zpět do appky) a `cancel_url`.
*   **Výstup:** `{ url: string }` (přesměrovací URL).

### B. `stripe-webhook` (System Endpoint)
*   **Vstup:** Raw body requestu ze Stripe + `Stripe-Signature` header.
*   **Logika:**
    1.  Ověří podpis webhooku pomocí `STRIPE_WEBHOOK_SECRET` (prevence spoofingu).
    2.  Zpracuje eventy:
        *   `checkout.session.completed`: Získá `subscription_id` a `customer_id`, uloží do DB.
        *   `customer.subscription.created`: Vytvoří záznam v `subscriptions`.
        *   `customer.subscription.updated`: Aktualizuje stav (např. při prodloužení, změně plánu, zrušení ke konci období).
        *   `customer.subscription.deleted`: Označí předplatné jako smazané, odebere Premium status.
*   **Bezpečnost:** Kritická. Musí validovat, že request jde skutečně od Stripe.

### C. `create-portal-link` (API Endpoint - Správa)
*   **Vstup:** `user_id`.
*   **Logika:**
    1.  Získá `stripe_customer_id` uživatele.
    2.  Vytvoří session pro **Stripe Customer Portal**.
    3.  Tento portál umožňuje uživateli měnit karty, stahovat faktury a (pokud povolíme) rušit předplatné.
    4.  *Poznámka:* Pro "schované" zrušení můžeme buď použít toto (a nakonfigurovat portál ve Stripe Dashboardu), nebo si napsat vlastní endpoint `cancel-subscription` pro větší kontrolu nad UX.

### D. `cancel-subscription` (Vlastní API Endpoint - Preferované pro UX)
*   **Vstup:** `user_id`.
*   **Logika:**
    1.  Najde aktivní předplatné uživatele.
    2.  Zavolá Stripe API: `stripe.subscriptions.update(sub_id, { cancel_at_period_end: true })`.
    3.  **Nevypíná službu ihned!** Jen nastaví flag, že se nemá obnovit.

## 4. Frontend & UX (Notch UI)

### A. Nákup (Upgrade Flow)
*   **Komponenta:** `PremiumModal`.
*   **Akce:** Volá `supabase.functions.invoke('create-checkout-session')`.
*   **Chování:** Otevře Stripe v novém okně/tabu. Po návratu zobrazí konfety a "Vítej v Gold klubu".

### B. Správa Předplatného (Management)
Umístění: `Nastavení` -> `Předplatné`.

**Stav: Aktivní (Obnovuje se)**
*   Text: "Notch Gold: AKTIVNÍ" (Zeleně).
*   Info: "Další platba: 199 Kč dne 24. 12. 2025".
*   Akce: Tlačítko "Spravovat předplatné" (otevře modal s možnostmi).

**Stav: Zrušeno (Dobíhá)**
*   Text: "Notch Gold: KONČÍ" (Oranžově).
*   Info: "Tvé výhody platí do 24. 12. 2025. Poté budeš převeden na FREE verzi."
*   Akce: Tlačítko "Obnovit předplatné" (zavolá API pro zrušení `cancel_at_period_end`).

### C. UX Zrušení (Retention Flow)
1.  Uživatel klikne na "Spravovat předplatné" -> "Zrušit automatické obnovení".
2.  **Retention Modal:**
    *   "Opravdu to chceš zabalit?"
    *   Výčet benefitů o které přijde.
    *   Tlačítko "Ne, chci si nechat výhody" (Primární).
    *   Tlačítko "Ano, zrušit obnovení" (Sekundární, méně výrazné).
3.  Po potvrzení se zavolá `cancel-subscription`.

## 5. Implementační Plán

1.  **Stripe Setup:**
    *   Registrace Stripe účtu.
    *   Vytvoření Produktu "Notch Gold" a Ceny (Price ID).
    *   Získání API klíčů (Publishable, Secret, Webhook Secret).

2.  **Databáze:**
    *   SQL migrace pro tabulky `customers` a `subscriptions`.
    *   RLS policies (uživatel čte jen svoje).

3.  **Backend (Edge Functions):**
    *   Implementace `stripe-webhook` (priorita 1 - synchronizace).
    *   Implementace `create-checkout-session` (priorita 2 - nákup).
    *   Implementace `cancel-subscription` (priorita 3 - správa).

4.  **Frontend:**
    *   Integrace `SubscriptionContext` (globální stav).
    *   UI pro nákup.
    *   UI pro správu a zrušení.

5.  **Testování:**
    *   Použití Stripe CLI pro simulaci webhooků lokálně.
    *   Testování scénářů: Úspěšná platba, Selhání karty, Zrušení, Obnovení.
