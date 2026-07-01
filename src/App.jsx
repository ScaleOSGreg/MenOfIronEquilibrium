import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, signOut } from "./auth/AuthContext.jsx";
import Login from "./auth/Login.jsx";
import AuthCallback from "./auth/AuthCallback.jsx";
import MileMarker from "./MileMarker.jsx";

function Inactive() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center",
      background: "#F4F5F4", padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", padding: 32, borderRadius: 18, maxWidth: 420, width: "100%",
        border: "1px solid rgba(19,34,41,0.12)", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: ".22em", color: "#D50032", fontWeight: 700 }}>
          MILE MARKER
        </div>
        <h1 style={{ fontSize: 22, margin: "8px 0 12px", color: "#132229" }}>Account inactive</h1>
        <p style={{ color: "#5B6A70", fontSize: 14, lineHeight: 1.5 }}>
          Your account has been suspended. Reach out to your admin if you believe this is in error.
        </p>
        <button onClick={() => signOut().then(() => window.location.assign("/login"))}
          style={{ marginTop: 22, padding: "10px 18px", borderRadius: 9,
            background: "#132229", color: "#fff", border: "none", fontWeight: 600,
            fontSize: 13, cursor: "pointer" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function Gate({ children }) {
  const { session, profile, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center",
        background: "#F4F5F4", color: "#5B6A70", fontFamily: "system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.deleted_at) return <Inactive />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/team/:personId" element={<Gate><MileMarker initialView="team" /></Gate>} />
        <Route path="/team" element={<Gate><MileMarker initialView="team" /></Gate>} />
        <Route path="/" element={<Gate><MileMarker /></Gate>} />
      </Routes>
    </AuthProvider>
  );
}
