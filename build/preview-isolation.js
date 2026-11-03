export function assertPreviewIsolation(env) {
  if (env.VERCEL_ENV !== 'preview') return;
  let ref;
  try { ref = new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0]; } catch { /* Fail below. */ }
  if (!env.PREVIEW_SUPABASE_PROJECT_REF || !env.PRODUCTION_SUPABASE_PROJECT_REF ||
      ref !== env.PREVIEW_SUPABASE_PROJECT_REF || ref === env.PRODUCTION_SUPABASE_PROJECT_REF) {
    throw new Error('Preview deployment blocked: configure a separate Supabase project and its matching public frontend URL/key. Production data must not be used by preview builds.');
  }
}
