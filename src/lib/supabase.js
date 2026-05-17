import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

if (!url || !key) {
  // Fail loud at dev time. In production a missing env var would silently
  // talk to a wrong project — the single most common Netlify+Vite gotcha.
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY. " +
      "Copy .env.example to .env.local and fill in your Supabase project."
  );
}

export const supabase = createClient(url ?? "", key ?? "", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
