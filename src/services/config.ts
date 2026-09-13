const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
export const appConfig = {
  demoMode: process.env.EXPO_PUBLIC_DEMO_MODE !== 'false',
  supabase: url && anonKey ? { url, anonKey } : null,
  // The authenticated remote adapter is intentionally not activated by merely setting keys.
  repositoryMode: 'local' as const,
};
