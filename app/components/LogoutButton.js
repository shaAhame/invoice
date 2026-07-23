"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ style }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button onClick={handleLogout} style={style || defaultStyle}>
      Logout
    </button>
  );
}

const defaultStyle = {
  background: "none",
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "8px 14px",
  fontSize: 13,
  cursor: "pointer",
};
