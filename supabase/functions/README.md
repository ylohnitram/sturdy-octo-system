# Supabase Edge Functions

This directory contains Deno-based Edge Functions for secure server-side operations.

## Functions

### 1. `stripe-webhook`
**Purpose**: Handles Stripe webhook events for subscription management

**Events Handled**:
- `checkout.session.completed` - Creates customer mapping
- `customer.subscription.created` - Creates subscription record
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as canceled

**Security**: Validates webhook signature using `STRIPE_WEBHOOK_SECRET`

**Environment Variables**:
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)

### 2. `create-checkout-session`
**Purpose**: Creates a Stripe Checkout Session for subscription purchase

**Input** (JSON body):
```json
{
  "price_id": "price_..."
}
```

**Output**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Authentication**: Requires valid JWT in `Authorization` header

**Logic**:
1. Verifies user authentication
2. Checks for existing active subscription
3. Finds or creates Stripe customer
4. Creates checkout session with 7-day trial
5. Returns checkout URL

### 3. `cancel-subscription`
**Purpose**: Cancels subscription at period end (user keeps access until billing period ends)

**Authentication**: Requires valid JWT in `Authorization` header

**Output**:
```json
{
  "success": true,
  "message": "Subscription will be canceled at period end",
  "current_period_end": "2025-12-24T00:00:00Z"
}
```

### 4. `reactivate-subscription`
**Purpose**: Reactivates a subscription that was scheduled for cancellation

**Authentication**: Requires valid JWT in `Authorization` header

**Output**:
```json
{
  "success": true,
  "message": "Subscription reactivated successfully"
}
```

## Local Development

### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Install Deno (if not already installed)
# Windows: scoop install deno
# Mac: brew install deno
```

### Running Locally
```bash
# Start Supabase local development
supabase start

# Serve functions locally
supabase functions serve

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"price_id":"price_test_..."}'
```

### Testing Webhooks Locally
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
```

## Deployment

### Deploy All Functions
```bash
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy cancel-subscription
supabase functions deploy reactivate-subscription
```

### Deploy Single Function
```bash
supabase functions deploy stripe-webhook
```

### Set Environment Variables
```bash
# Via Supabase Dashboard
# Settings → Edge Functions → Add secret

# Or via CLI
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=https://your-app.com
```

## Security Notes

⚠️ **CRITICAL SECURITY RULES**:

1. **Never expose secret keys in frontend code**
   - `STRIPE_SECRET_KEY` must ONLY exist in Edge Functions
   - Frontend only uses `VITE_STRIPE_PRICE_ID` (public price ID)

2. **Always validate webhook signatures**
   - The `stripe-webhook` function validates every request
   - Prevents spoofing and unauthorized access

3. **Use service role key carefully**
   - Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
   - This is necessary for webhook handler to write to DB
   - Never expose this key to the frontend

4. **Authentication required**
   - All user-facing functions verify JWT tokens
   - Ensures users can only manage their own subscriptions

## Monitoring

### View Logs
```bash
# Via Supabase Dashboard
# Edge Functions → Select function → Logs

# Or via CLI
supabase functions logs stripe-webhook
```

### Common Issues

**Webhook signature validation fails**
- Check that `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Ensure webhook endpoint URL is correct

**User not found in database**
- Verify `client_reference_id` is set in checkout session
- Check that user exists in `profiles` table

**Subscription not updating**
- Check webhook events in Stripe Dashboard
- Verify RLS policies allow service role to write

## TypeScript Support

Edge Functions use Deno, which has built-in TypeScript support. No compilation needed!

The lint errors you see in your IDE are expected - these files run in Deno, not Node.js.

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Deno Documentation](https://deno.land/manual)
