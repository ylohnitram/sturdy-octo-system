-- Migration: Stripe Subscriptions and Customers
-- Creates tables for managing Stripe subscriptions and customer mappings

-- Table: customers
-- Maps Notch users to Stripe customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: subscriptions
-- Stores subscription state synchronized from Stripe
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY, -- Stripe Subscription ID (e.g., sub_12345)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired')),
  metadata JSONB DEFAULT '{}'::jsonb,
  price_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);

-- RLS Policies: Users can only read their own subscription data
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own customer record
CREATE POLICY "Users can read own customer record"
  ON customers FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on customers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Sync is_premium based on active subscription
-- This function updates the profiles.is_premium field based on subscription status
CREATE OR REPLACE FUNCTION sync_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update is_premium to TRUE if subscription is active or trialing
  IF NEW.status IN ('active', 'trialing') THEN
    UPDATE profiles
    SET is_premium = TRUE
    WHERE id = NEW.user_id;
  -- Update is_premium to FALSE if subscription ended or canceled
  ELSIF NEW.status IN ('canceled', 'incomplete_expired') OR NEW.ended_at IS NOT NULL THEN
    UPDATE profiles
    SET is_premium = FALSE
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-sync premium status when subscription changes
CREATE TRIGGER sync_premium_on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_premium_status();

-- Grant permissions for service role (used by Edge Functions)
GRANT ALL ON customers TO service_role;
GRANT ALL ON subscriptions TO service_role;

COMMENT ON TABLE customers IS 'Maps Notch users to Stripe customer IDs';
COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription state as source of truth';
COMMENT ON FUNCTION sync_premium_status() IS 'Automatically updates profiles.is_premium based on subscription status';
