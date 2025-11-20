import { createClient } from '@supabase/supabase-js';
// ------------------------------------------------------------------
// KONFIGURACE SUPABASE
// Údaje doplněny na základě tvého projektu (ciwvtqyhdxjnuywjswkp)
// ------------------------------------------------------------------
const SUPABASE_URL = 'https://ciwvtqyhdxjnuywjswkp.supabase.co';
// Toto je tvůj public anon key, který jsi poslal
const SUPABASE_ANON_KEY = 'sb_publishable_H6Pj37PdVvMNlTiXa0Fpzg_TKvjDhvd';
// Vytvoření klienta
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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