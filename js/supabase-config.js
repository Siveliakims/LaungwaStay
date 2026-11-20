// Browser-safe Supabase project settings.
// Use only the publishable/anon key here. Never use a secret or service_role key.
export const SUPABASE_URL = "https://wuoxrokjpkbaslejdjzr.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_stIEv0xUKH8CXmKkh8dKWA_LSOOboWE";
export const isSupabaseConfigured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR-ANON");
