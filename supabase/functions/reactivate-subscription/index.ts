// Supabase Edge Function: reactivate-subscription
// Reactivates a subscription that was set to cancel at period end

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

        // Find user's subscription that's set to cancel
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('id, status, cancel_at_period_end')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .eq('cancel_at_period_end', true)
            .single();

        if (!subscription) {
            return new Response(
                JSON.stringify({ error: 'No subscription scheduled for cancellation found' }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Reactivate subscription by removing cancel_at_period_end flag
        await stripe.subscriptions.update(
            subscription.id,
            {
                cancel_at_period_end: false,
            }
        );

        // Update local database
        await supabase
            .from('subscriptions')
            .update({
                cancel_at_period_end: false,
                cancel_at: null,
            })
            .eq('id', subscription.id);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Subscription reactivated successfully',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (err) {
        console.error('Error reactivating subscription:', err);
        return new Response(
            JSON.stringify({ error: err.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
