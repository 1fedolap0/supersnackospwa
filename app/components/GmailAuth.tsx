"use client";

import { useState } from "react";
import { LogIn, LogOut, Mail, Loader2, AlertCircle } from "lucide-react";
import { loadGIS, requestGmailToken, revokeGmailToken, fetchUserEmail } from "../lib/gmail";

export type GmailAuthState =
  | { status: "disconnected" }
  | { status: "loading" }
  | { status: "connected"; token: string; email: string }
  | { status: "error"; message: string };

interface GmailAuthProps {
  authState: GmailAuthState;
  onAuthChange: (state: GmailAuthState) => void;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GmailAuth({ authState, onAuthChange }: GmailAuthProps) {
  const [hover, setHover] = useState(false);

  const connect = async () => {
    if (!CLIENT_ID) {
      onAuthChange({ status: "error", message: "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set." });
      return;
    }
    onAuthChange({ status: "loading" });
    try {
      await loadGIS();
      const token = await requestGmailToken(CLIENT_ID);
      const email = await fetchUserEmail(token);
      onAuthChange({ status: "connected", token, email });
    } catch (err) {
      onAuthChange({
        status: "error",
        message: err instanceof Error ? err.message : "Authentication failed",
      });
    }
  };

  const disconnect = () => {
    if (authState.status === "connected") revokeGmailToken(authState.token);
    onAuthChange({ status: "disconnected" });
  };

  if (authState.status === "connected") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#10b981" }}
          />
          <span className="text-xs font-medium hidden sm:block" style={{ color: "var(--text-secondary)" }}>
            {authState.email}
          </span>
        </div>
        <button
          onClick={disconnect}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: hover ? "rgba(239,68,68,0.1)" : "var(--navy-500)",
            color: hover ? "#ef4444" : "var(--text-muted)",
            border: `1px solid ${hover ? "rgba(239,68,68,0.3)" : "var(--border-light)"}`,
          }}
        >
          <LogOut size={11} />
          Disconnect
        </button>
      </div>
    );
  }

  if (authState.status === "loading") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--navy-500)", border: "1px solid var(--border-light)" }}>
        <Loader2 size={12} className="animate-spin" style={{ color: "var(--orange)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Connecting…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {authState.status === "error" && (
        <div className="flex items-center gap-1.5" title={authState.message}>
          <AlertCircle size={12} style={{ color: "#ef4444" }} />
          <span className="text-xs hidden sm:block" style={{ color: "#ef4444" }}>
            {authState.message.length > 40 ? authState.message.slice(0, 40) + "…" : authState.message}
          </span>
        </div>
      )}
      <button
        onClick={connect}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
        style={{ background: "var(--navy-500)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
      >
        <Mail size={12} style={{ color: "var(--orange)" }} />
        <LogIn size={11} />
        Connect Gmail
      </button>
    </div>
  );
}
