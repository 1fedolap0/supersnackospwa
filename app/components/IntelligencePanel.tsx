"use client";

import { useEffect, useRef } from "react";
import { X, Zap, AlertTriangle, Mail, Plane, Clock, ChevronRight, Sparkles } from "lucide-react";
import type { IntelligenceItem } from "../lib/orchestrator";

const URGENCY_STYLES: Record<string, { bg: string; border: string; dot: string; icon: React.ReactNode }> = {
  critical: {
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.25)",
    dot: "#dc2626",
    icon: <AlertTriangle size={13} color="#dc2626" />,
  },
  high: {
    bg: "rgba(249,115,22,0.07)",
    border: "rgba(249,115,22,0.2)",
    dot: "#f97316",
    icon: <Zap size={13} color="#f97316" />,
  },
  medium: {
    bg: "rgba(234,179,8,0.06)",
    border: "rgba(234,179,8,0.2)",
    dot: "#eab308",
    icon: <Clock size={13} color="#eab308" />,
  },
  low: {
    bg: "rgba(99,102,241,0.06)",
    border: "rgba(99,102,241,0.15)",
    dot: "#6366f1",
    icon: <Sparkles size={13} color="#6366f1" />,
  },
};

const MODULE_ICON: Record<string, React.ReactNode> = {
  inbox: <Mail size={11} />,
  trips: <Plane size={11} />,
  tasks: <Clock size={11} />,
};

interface IntelligencePanelProps {
  items: IntelligenceItem[];
  onClose: () => void;
  onNavigate: (module: string, entityId?: string) => void;
}

export function IntelligencePanel({ items, onClose, onNavigate }: IntelligencePanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => window.addEventListener("mousedown", handler), 0);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  const critical = items.filter((i) => i.urgency === "critical");
  const high = items.filter((i) => i.urgency === "high");
  const medium = items.filter((i) => i.urgency === "medium");

  const sections = [
    { label: "Critical", items: critical, color: "#dc2626" },
    { label: "Needs Attention", items: high, color: "#f97316" },
    { label: "For Your Awareness", items: medium, color: "#eab308" },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        className="relative z-10 w-full max-w-sm h-full flex flex-col shadow-2xl overflow-hidden"
        style={{ background: "var(--navy-800)", borderLeft: "1px solid var(--border-light)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)" }}>
              <Sparkles size={14} style={{ color: "var(--orange)" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Intelligence Feed</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {items.length} item{items.length !== 1 ? "s" : ""} need{items.length === 1 ? "s" : ""} your attention
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <Sparkles size={20} style={{ color: "#10b981" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>All clear</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No urgent items right now</p>
            </div>
          )}

          {sections.map((section) => (
            <div key={section.label}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: section.color }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: section.color }}>
                  {section.label}
                </p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${section.color}20`, color: section.color }}>
                  {section.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const s = URGENCY_STYLES[item.urgency] ?? URGENCY_STYLES.low;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate(item.module ?? "inbox", item.entityId); onClose(); }}
                      className="w-full text-left p-3.5 rounded-xl transition-all group hover:scale-[1.01]"
                      style={{ background: s.bg, border: `1px solid ${s.border}` }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="shrink-0 mt-0.5">{s.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-tight mb-1 truncate" style={{ color: "var(--text-primary)" }}>
                            {item.title}
                          </p>
                          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {item.detail}
                          </p>
                          {item.action && item.module && (
                            <div className="flex items-center gap-1 mt-2">
                              <span style={{ color: "var(--text-muted)" }}>{MODULE_ICON[item.module]}</span>
                              <span className="text-[10px] font-semibold" style={{ color: s.dot }}>
                                {item.action}
                              </span>
                              <ChevronRight size={9} style={{ color: s.dot }} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
            Updated {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}
