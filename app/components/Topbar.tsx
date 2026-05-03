"use client";

import { useState } from "react";
import { Search, Plus, Sparkles } from "lucide-react";

const MODULE_TITLES: Record<string, string> = {
  inbox: "Inbox Intelligence",
  trips: "Trip Command Center",
  tasks: "Task & Follow-up Tracker",
  briefs: "Executive Brief Generator",
  experts: "AI Experts Panel",
};

interface TopbarProps {
  activeModule: string;
  onQuickAdd: () => void;
  onOpenIntelligence: () => void;
  intelligenceCount: number;
  criticalCount: number;
}

export function Topbar({ activeModule, onQuickAdd, onOpenIntelligence, intelligenceCount, criticalCount }: TopbarProps) {
  const [search, setSearch] = useState("");

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 border-b shrink-0"
      style={{ background: "var(--navy-800)", borderColor: "var(--border)" }}
    >
      {/* Title */}
      <div className="hidden md:block">
        <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {MODULE_TITLES[activeModule] ?? activeModule}
        </h1>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm rounded-lg pl-8 pr-4 py-1.5 w-48 outline-none focus:w-64 transition-all"
          style={{
            background: "var(--navy-600)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Intelligence button */}
      <button
        onClick={onOpenIntelligence}
        className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
        style={{
          background: criticalCount > 0 ? "rgba(220,38,38,0.15)" : "var(--navy-600)",
          border: `1px solid ${criticalCount > 0 ? "rgba(220,38,38,0.4)" : "var(--border-light)"}`,
          color: criticalCount > 0 ? "#ef4444" : "var(--text-secondary)",
        }}
      >
        <Sparkles size={14} className={criticalCount > 0 ? "animate-pulse" : ""} />
        <span className="hidden sm:block">AI Feed</span>
        {intelligenceCount > 0 && (
          <span
            className="flex items-center justify-center text-[10px] font-bold w-5 h-5 rounded-full"
            style={{
              background: criticalCount > 0 ? "#dc2626" : "var(--orange)",
              color: "white",
            }}
          >
            {intelligenceCount > 9 ? "9+" : intelligenceCount}
          </span>
        )}
      </button>

      {/* Quick Add */}
      <button
        onClick={onQuickAdd}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
        style={{ background: "var(--orange)", color: "white" }}
      >
        <Plus size={14} />
        <span className="hidden sm:block">Quick Add</span>
      </button>
    </header>
  );
}
