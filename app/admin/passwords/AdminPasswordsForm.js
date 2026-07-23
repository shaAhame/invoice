"use client";

import { useState } from "react";
import LogoutButton from "../../components/LogoutButton";

const ROLES = [
  { key: "admin", label: "Admin (all branches)" },
  { key: "prime", label: "iDealz Prime" },
  { key: "liberty", label: "iDealz Liberty" },
  { key: "marino", label: "iDealz Marino" },
];

export default function AdminPasswordsForm() {
  const [values, setValues] = useState({});
  const [status, setStatus] = useState({});

  const handleChange = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const handleUpdate = async (key) => {
    const newPassword = values[key] || "";
    if (newPassword.length < 4) {
      setStatus((s) => ({ ...s, [key]: { type: "error", msg: "Enter at least 4 characters." } }));
      return;
    }
    setStatus((s) => ({ ...s, [key]: { type: "busy" } }));
    try {
      const res = await fetch("/api/admin/passwords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey: key, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setStatus((s) => ({ ...s, [key]: { type: "success", msg: "Password updated — takes effect immediately." } }));
      setValues((v) => ({ ...v, [key]: "" }));
    } catch (e) {
      setStatus((s) => ({ ...s, [key]: { type: "error", msg: e.message } }));
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "16px" }}>
      <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Manage Passwords</h1>
        <div className="header-actions" style={{ display: "flex", gap: 10 }}>
          <a href="/" style={{ fontSize: 14, color: "#2563eb" }}>← Back</a>
          <LogoutButton />
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
        Changing a password here takes effect immediately — no redeploy needed.
        Devices already logged in stay logged in until they log out.
      </p>

      {ROLES.map((r) => (
        <div key={r.key} style={card}>
          <label style={label}>{r.label}</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="password"
              style={input}
              placeholder="New password"
              value={values[r.key] || ""}
              onChange={(e) => handleChange(r.key, e.target.value)}
            />
            <button
              onClick={() => handleUpdate(r.key)}
              style={btn}
              disabled={status[r.key]?.type === "busy"}
            >
              {status[r.key]?.type === "busy" ? "Saving..." : "Update"}
            </button>
          </div>
          {status[r.key]?.type === "success" && (
            <p style={{ color: "#059669", fontSize: 13, marginTop: 6 }}>{status[r.key].msg}</p>
          )}
          {status[r.key]?.type === "error" && (
            <p style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>{status[r.key].msg}</p>
          )}
        </div>
      ))}
    </main>
  );
}

const card = { background: "#fff", borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const label = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 };
const input = { flex: 1, minWidth: 180, padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 16, boxSizing: "border-box" };
const btn = { padding: "10px 16px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" };
