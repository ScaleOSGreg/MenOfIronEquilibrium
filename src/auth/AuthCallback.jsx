import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

// Handles the redirect from an invite email or password reset.
// Supabase puts a session in the URL fragment; the client auto-detects it.
// If the user has no password yet (invite flow) we prompt for one.

export default function AuthCallback() {
  const nav = useNavigate();
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // Supabase's createClient with detectSessionInUrl: true strips the URL
    // hash before this effect runs, so reading `window.location.hash` to find
    // type=invite|recovery is racy and usually empty. Instead: the only ways
    // to legitimately land on /auth/callback are invite-accept and
    // password-reset, both of which need the user to set a password. So if
    // we have a session here, always prompt. (A "skip" link could be added
    // later if a non-password-needing flow is introduced.)
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setMsg("Link expired. Ask your mentor to resend the invite.");
        return;
      }
      setNeedsPassword(true);
    });
  }, [nav]);

  async function setPassword(e) {
    e.preventDefault();
    if (pw.length < 8) { setMsg("Use at least 8 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setMsg(error.message); return; }
    nav("/", { replace: true });
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center",
      background: "#F4F5F4", padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", padding: 32, borderRadius: 18, maxWidth: 420, width: "100%",
        border: "1px solid rgba(19,34,41,0.12)" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>Set your password</h1>
        {needsPassword ? (
          <form onSubmit={setPassword}>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="At least 8 characters" autoComplete="new-password"
              style={{ width: "100%", padding: "10px 13px", borderRadius: 9,
                border: "1.5px solid rgba(19,34,41,0.12)", fontSize: 14, boxSizing: "border-box" }} />
            <button type="submit" style={{
              marginTop: 14, width: "100%", padding: "11px 16px", borderRadius: 9,
              background: "#D50032", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer",
            }}>Save and continue</button>
          </form>
        ) : (
          <p style={{ color: "#5B6A70", fontSize: 14 }}>{msg || "Loading…"}</p>
        )}
        {msg && needsPassword && <div style={{ color: "#B0002A", fontSize: 13, marginTop: 10 }}>{msg}</div>}
      </div>
    </div>
  );
}
