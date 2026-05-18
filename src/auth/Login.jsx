import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "./AuthContext.jsx";

const C = {
  red: "#D50032", redDk: "#B0002A", ink: "#132229", shell: "#F4F5F4",
  line: "rgba(19,34,41,0.12)", sub: "#5B6A70", faint: "#93A0A4",
};

export default function Login() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState("signin"); // signin | reset
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // If already authenticated (either just-signed-in via onAuthStateChange or
  // navigated here while logged in), bounce to the dashboard. replace: true
  // keeps /login out of the back-button history.
  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) throw error;
        setMsg("Check your email for a reset link.");
      }
    } catch (err) {
      setMsg(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.shell, display: "grid", placeItems: "center",
      padding: 20, fontFamily: "system-ui, sans-serif", color: C.ink,
    }}>
      <form onSubmit={submit} style={{
        background: "#fff", borderRadius: 18, padding: 32, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(19,34,41,0.10)", border: `1px solid ${C.line}`,
      }}>
        <div style={{ fontSize: 11, letterSpacing: ".22em", color: C.red, fontWeight: 700 }}>
          MILE MARKER
        </div>
        <h1 style={{ fontSize: 26, margin: "6px 0 4px", letterSpacing: ".01em" }}>
          {mode === "signin" ? "Sign in" : "Reset password"}
        </h1>
        <p style={{ fontSize: 13, color: C.sub, marginTop: 0 }}>
          {mode === "signin"
            ? "Use the email your mentor or admin invited you with."
            : "We'll email you a reset link."}
        </p>

        <label style={lbl}>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          style={inp} autoComplete="email" />

        {mode === "signin" && (
          <>
            <label style={lbl}>Password</label>
            <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
              style={inp} autoComplete="current-password" />
          </>
        )}

        <button type="submit" disabled={busy} style={{
          width: "100%", marginTop: 22, padding: "11px 16px", borderRadius: 9,
          background: C.red, color: "#fff", border: "none", fontWeight: 700, fontSize: 14,
          cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
        }}>
          {busy ? "…" : mode === "signin" ? "Sign in" : "Send reset link"}
        </button>

        <button type="button" onClick={() => setMode(mode === "signin" ? "reset" : "signin")}
          style={{
            display: "block", marginTop: 14, background: "transparent", border: "none",
            color: C.sub, fontSize: 13, cursor: "pointer", padding: 0,
          }}>
          {mode === "signin" ? "Forgot password?" : "Back to sign in"}
        </button>

        {msg && <div style={{ marginTop: 14, fontSize: 13, color: C.redDk }}>{msg}</div>}

        <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${C.line}`,
          fontSize: 11.5, color: C.faint, letterSpacing: ".02em" }}>
          Invite-only. No public signup. Equilibrium Retreat · A ministry of Men of Iron.
        </div>
      </form>
    </div>
  );
}

const lbl = { fontSize: 12.5, fontWeight: 600, color: "#5B6A70", marginTop: 14, display: "block" };
const inp = {
  width: "100%", marginTop: 6, padding: "10px 13px", borderRadius: 9,
  border: "1.5px solid rgba(19,34,41,0.12)", background: "#FBFBFB",
  fontSize: 14, color: "#132229", outline: "none", boxSizing: "border-box",
};
