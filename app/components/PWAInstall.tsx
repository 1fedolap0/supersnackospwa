"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!prompt || dismissed) return null;

  const install = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl"
      style={{ background: "var(--navy-700)", border: "1px solid var(--border-light)" }}
    >
      <Download size={14} style={{ color: "var(--orange)" }} />
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Install Supersnack OS</p>
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Add to your home screen</p>
      </div>
      <button
        onClick={install}
        className="text-xs px-3 py-1.5 rounded-lg font-semibold hover:brightness-110 transition-all"
        style={{ background: "var(--orange)", color: "white" }}
      >
        Install
      </button>
      <button onClick={() => setDismissed(true)} className="p-1 hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
        <X size={12} />
      </button>
    </div>
  );
}
