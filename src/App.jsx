import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import Login from "./auth/Login.jsx";
import AuthCallback from "./auth/AuthCallback.jsx";
import MileMarker from "./MileMarker.jsx";

function Gate({ children }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center",
        background: "#F4F5F4", color: "#5B6A70", fontFamily: "system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
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
