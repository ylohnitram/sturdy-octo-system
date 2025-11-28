// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events for subscription management
// CRITICAL: Validates webhook signature to prevent spoofing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return new Response(
            JSON.stringify({ error: 'Missing stripe-signature header' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Get raw body for signature verification
        const body = await req.text();

        // Verify webhook signature (CRITICAL for security)
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            webhookSecret
        );

        console.log(`Processing webhook event: ${event.type}`);

        // Initialize Supabase client with service role (bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                // Store customer mapping
                if (session.customer && session.client_reference_id) {
                    await supabase
                        .from('customers')
                        .upsert({
                            id: session.client_reference_id, // user_id
                            stripe_customer_id: session.customer as string,
                        });
                }

                console.log(`Checkout completed for customer: ${session.customer}`);
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                // Find user_id from customer mapping
                const { data: customer } = await supabase
                    .from('customers')
                    .select('id')
                    .eq('stripe_customer_id', subscription.customer as string)
                    .single();

                if (!customer) {
                    console.error(`Customer not found for subscription: ${subscription.id}`);
                    break;
                }

                // Upsert subscription data
                await supabase
                    .from('subscriptions')
                    .upsert({
                        id: subscription.id,
                        user_id: customer.id,
                        status: subscription.status,
                        metadata: subscription.metadata,
                        price_id: subscription.items.data[0]?.price.id || '',
                        quantity: subscription.items.data[0]?.quantity || 1,
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        created: new Date(subscription.created * 1000).toISOString(),
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
                        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
                        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
                        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                    });

                console.log(`Subscription ${event.type} for user: ${customer.id}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                // Mark subscription as canceled and set ended_at
                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'canceled',
                        ended_at: new Date().toISOString(),
                    })
                    .eq('id', subscription.id);

                console.log(`Subscription deleted: ${subscription.id}`);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(
            JSON.stringify({ received: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('Webhook error:', err);
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
