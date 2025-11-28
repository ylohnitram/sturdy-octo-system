
import { supabase } from './supabaseClient';
import { Subscription } from '../types';

/**
 * Payment Service - Stripe Integration
 * Connects to Stripe via Supabase Edge Functions for secure payment processing
 */

export interface CheckoutSessionResponse {
  url: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  current_period_end?: string;
}

/**
 * Creates a Stripe Checkout Session for subscription purchase
 * @param priceId - Stripe Price ID for the subscription plan
 * @returns Checkout session URL to redirect user to
 */
export const createCheckoutSession = async (priceId: string): Promise<CheckoutSessionResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { price_id: priceId },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned');
    }

    return { url: data.url };
  } catch (err) {
    console.error('createCheckoutSession error:', err);
    throw err;
  }
};

/**
 * Cancels the user's subscription at the end of the current billing period
 * User retains access until period end
 */
export const cancelSubscription = async (): Promise<CancelSubscriptionResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('cancel-subscription');

    if (error) {
      console.error('Error canceling subscription:', error);
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return data;
  } catch (err) {
    console.error('cancelSubscription error:', err);
    throw err;
  }
};

/**
 * Reactivates a subscription that was scheduled for cancellation
 */
export const reactivateSubscription = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('reactivate-subscription');

    if (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error(error.message || 'Failed to reactivate subscription');
    }

    return data;
  } catch (err) {
    console.error('reactivateSubscription error:', err);
    throw err;
  }
};

/**
 * Fetches the user's current subscription status
 */
export const getUserSubscription = async (): Promise<Subscription | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return null;
      }
      throw error;
    }

    return data;
  } catch (err) {
    console.error('getUserSubscription error:', err);
    return null;
  }
};

