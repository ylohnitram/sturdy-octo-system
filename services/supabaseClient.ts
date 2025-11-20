import { createClient } from '@supabase/supabase-js';
// ------------------------------------------------------------------
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Check your .env file or Vercel settings.');
}

// Vytvoření klienta - prevent crash if empty
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
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
    .from('user_stats')
    .select('is_premium')
    .eq('user_id', userId)
    .single();
  if (error) return false;
  return data?.is_premium || false;
};