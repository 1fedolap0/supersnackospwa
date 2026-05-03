"use client";

import { useState } from "react";
import { LogIn, LogOut, Mail, Loader2, AlertCircle, X, ExternalLink } from "lucide-react";
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
const MISSING_CLIENT_ID = !CLIENT_ID || CLIENT_ID === "your-client-id-here.apps.googleusercontent.com";

function SetupGuide({ onClose }: { onClose: () => void }) {
  const steps = [
    { n: 1, text: "Go to Google Cloud Console", href: "https://console.cloud.google.com/" },
    { n: 2, text: 'Enable the Gmail API (APIs & Services → Enable APIs → "Gmail API")', href: null },
    { n: 3, text: "Create OAuth credentials: Web application type", href: null },
    {
      n: 4,
      text: `Add authorized JavaScript origin: ${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}`,
      href: null,
    },
    { n: 5, text: "Copy the Client ID into .env.local as NEXT_PUBLIC_GOOGLE_CLIENT_ID", href: null },
    { n: 6, text: "Restart the dev server (npm run dev)", href: null },
  ];

  return (
    <div
      className="absolute top-full left-0 mt-2 z-50 w-80 rounded-xl shadow-2xl p-4"
      style={{ background: "var(--navy-700)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Gmail Setup Required</p>
        <button onClick={onClose} className="p-0.5 hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
          <X size={13} />
        </button>
      </div>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Add <code className="px-1 py-0.5 rounded text-[11px]" style={{ background: "var(--navy-500)", color: "var(--orange)" }}>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to{" "}
        <code className="px-1 py-0.5 rounded text-[11px]" style={{ background: "var(--navy-500)", color: "var(--text-secondary)" }}>.env.local</code>, then restart.
      </p>
      <ol className="space-y-2">
        {steps.map(({ n, text, href }) => (
          <li key={n} className="flex items-start gap-2">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5"
              style={{ background: "rgba(249,115,22,0.2)", color: "var(--orange)" }}
            >
              {n}
            </span>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] leading-relaxed flex items-center gap-1 hover:underline"
                style={{ color: "var(--orange)" }}
              >
                {text} <ExternalLink size={9} />
              </a>
            ) : (
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{text}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function GmailAuth({ authState, onAuthChange }: GmailAuthProps) {
  const [hover, setHover] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const connect = async () => {
    if (MISSING_CLIENT_ID) {
      setShowGuide(true);
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
          <div className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
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
    <div className="relative flex items-center gap-2">
      {authState.status === "error" && (
        <div className="flex items-center gap-1.5">
          <AlertCircle size={12} style={{ color: "#ef4444" }} />
          <span className="text-xs hidden sm:block" style={{ color: "#ef4444" }}>
            {authState.message.length > 50 ? authState.message.slice(0, 50) + "…" : authState.message}
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

      {showGuide && <SetupGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
