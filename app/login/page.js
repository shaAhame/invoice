"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "prime", label: "iDealz Prime" },
  { value: "liberty", label: "iDealz Liberty" },
  { value: "marino", label: "iDealz Marino" },
  { value: "admin", label: "Admin (all branches)" },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("prime");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "40px 16px" }}>
      <div style={card}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>iDealz Invoice Login</h1>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
          Select your branch (or Admin) and enter the password for this device.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={label}>Login as</label>
          <select style={input} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <label style={{ ...label, marginTop: 14 }}>Password</label>
          <input
            style={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />

          {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>{error}</p>}

          <button type="submit" disabled={busy} style={submitBtn}>
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

const card = { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" };
const label = { display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 6 };
const input = { width: "100%", padding: "12px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, boxSizing: "border-box" };
const submitBtn = {
  width: "100%", marginTop: 20, padding: "14px", background: "#111827", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer",
};
