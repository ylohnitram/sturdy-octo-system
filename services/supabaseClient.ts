import { createClient } from '@supabase/supabase-js';
// ------------------------------------------------------------------
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Check your .env file or Vercel settings.');
  console.log('Debug Info:', {
    HasUrl: !!import.meta.env.VITE_SUPABASE_URL,
    HasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    Mode: import.meta.env.MODE,
    BaseUrl: import.meta.env.BASE_URL,
    UrlValue: import.meta.env.VITE_SUPABASE_URL?.substring(0, 20) + '...' // First 20 chars only
  });
}

// Vytvoření klienta - prevent crash if empty
// NOTE: We must provide a valid URL format to avoid "Invalid URL" error during construction
const validUrl = (url: string) => {
  try {
    new URL(url);
    return url;
  } catch (e) {
    return 'https://placeholder.supabase.co';
  }
};

export const supabase = createClient(
  validUrl(SUPABASE_URL),
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'notch-pwa'
      }
    },
    db: {
      schema: 'public'
    },
    // Increase timeout to 60 seconds for slow connections
    realtime: {
      timeout: 60000
    }
  }
);
/**
Realtime funkce pro sledování změn v tabulce uživatelů
*/
export const subscribeToLeaderboard = (callback: (payload: any) => void) => {
  return supabase
    .channel('public:user_stats')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_stats' }, callback)
    .subscribe();
};
/**
Funkce pro kontrolu premium statusu
*/
export const checkPremiumStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();
  if (error) return false;
  return data?.tier === 'PREMIUM';
};