import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

const Ctx = createContext({ session: null, profile: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) setProfile(null);
    });
    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("id, full_name, role, group_id, photo_url, deleted_at")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile(data ?? null);
      });
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  return <Ctx.Provider value={{ session, profile, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

export async function signOut() {
  await supabase.auth.signOut();
}
