"use client";

import { useState } from "react";
import { Search, Plus, Bell } from "lucide-react";

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
}

export function Topbar({ activeModule, onQuickAdd }: TopbarProps) {
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

      {/* Spacer */}
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

      {/* Notifications */}
      <button
        className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
        style={{ color: "var(--text-secondary)" }}
      >
        <Bell size={16} />
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--orange)" }}
        />
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
