// Supabase Edge Function: create-checkout-session
// Creates a Stripe Checkout Session for subscription purchase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get user from auth header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify JWT and get user
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            throw new Error('Invalid authentication token');
        }

        const { price_id } = await req.json();

        if (!price_id) {
            throw new Error('Missing price_id parameter');
        }

        // Check if user already has an active subscription
        const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('id, status')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .single();

        if (existingSubscription) {
            return new Response(
                JSON.stringify({ error: 'User already has an active subscription' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Find or create Stripe customer
        let stripeCustomerId: string;

        const { data: customerRecord } = await supabase
            .from('customers')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (customerRecord) {
            stripeCustomerId = customerRecord.stripe_customer_id;
        } else {
            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: user.id,
                },
            });

            stripeCustomerId = customer.id;

            // Store customer mapping
            await supabase
                .from('customers')
                .insert({
                    id: user.id,
                    stripe_customer_id: stripeCustomerId,
                });
        }

        // Get app URL from environment or use default
        const appUrl = Deno.env.get('APP_URL') || 'https://notch.app';

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            client_reference_id: user.id,
            line_items: [
                {
                    price: price_id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${appUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${appUrl}?canceled=true`,
            subscription_data: {
                trial_period_days: 7, // 7 days free trial
                metadata: {
                    user_id: user.id,
                },
            },
        });

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (err) {
        console.error('Error creating checkout session:', err);
        return new Response(
            JSON.stringify({ error: err.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
