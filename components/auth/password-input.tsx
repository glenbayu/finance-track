"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        aria-label="Kata sandi"
        type={show ? "text" : "password"}
        name="password"
        autoComplete="current-password"
        id="password"
        placeholder="••••••••"
        className="input-base placeholder:[font:inherit]"
        style={{ paddingRight: "2.75rem" }}
        required
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--lk-text-faint)",
          padding: "0.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "0.25rem",
          transition: "color 150ms ease",
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
