
import { supabase } from './supabaseClient';

export const validateInviteCode = async (code: string): Promise<boolean> => {
  const normalizedCode = code.trim().toUpperCase();

  try {
    // 1. Check against Database (Beta Codes table)
    const { data, error } = await supabase
      .from('beta_codes')
      .select('code, is_claimed')
      .eq('code', normalizedCode)
      .single();

    if (data && !data.is_claimed) {
      // Optional: Mark as claimed immediately or let AuthView handle it?
      // For now, we just validate existence. Ideally, we claim it after successful registration.
      return true;
    }

    // 2. Check Master/Hardcoded codes (Fallback for your campaign)
    const MASTER_CODES = ['LOV-ZACINA', 'NOTCH-TIKTOK', 'SKALP-START'];
    if (MASTER_CODES.includes(normalizedCode)) {
      return true;
    }

    // 3. Check User Generated Invites (Stored in user_stats table)
    // This logic would check if any user has this invite_code and invites_left > 0
    const { data: userData } = await supabase
      .from('user_stats')
      .select('user_id, invites_left')
      .eq('invite_code', normalizedCode)
      .gt('invites_left', 0)
      .single();

    if (userData) {
      return true;
    }

    return false;

  } catch (err) {
    console.error('Error validating code:', err);
    return false;
  }
};

export const joinWaitlist = async (email: string): Promise<boolean> => {
  console.log(`Odesílám ${email} na waitlist...`);
  
  try {
    const response = await fetch('https://notch-waitlist.mholy1983.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      // Fallback if worker is not yet deployed or fails
      return true;
    }

    return true;
  } catch (error) {
    console.error('Waitlist error:', error);
    return true;
  }
};
