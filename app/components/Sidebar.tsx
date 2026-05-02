"use client";

import { Inbox, Plane, CheckSquare, FileText, Users } from "lucide-react";

const NAV = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "trips", label: "Trips", icon: Plane },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "briefs", label: "Briefs", icon: FileText },
  { id: "experts", label: "Experts", icon: Users },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  unreadCount?: number;
}

export function Sidebar({ active, onNavigate, unreadCount = 0 }: SidebarProps) {
  return (
    <aside
      className="flex flex-col w-16 md:w-56 shrink-0 border-r h-full"
      style={{ background: "var(--navy-800)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "var(--orange)", color: "white" }}
        >
          S
        </div>
        <div className="hidden md:block overflow-hidden">
          <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-primary)" }}>Supersnack OS</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Chief of Staff Edition</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 mx-0 transition-all text-sm font-medium group relative`}
              style={{
                color: isActive ? "var(--orange)" : "var(--text-secondary)",
                background: isActive ? "rgba(249,115,22,0.08)" : "transparent",
              }}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                  style={{ background: "var(--orange)" }}
                />
              )}
              <Icon size={16} className="shrink-0" />
              <span className="hidden md:block">{label}</span>
              {id === "inbox" && unreadCount > 0 && (
                <span
                  className="hidden md:flex ml-auto text-[10px] font-bold w-5 h-5 rounded-full items-center justify-center"
                  style={{ background: "var(--orange)", color: "white" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="hidden md:block">
          <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Signed in as</p>
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-secondary)" }}>Chief of Staff</p>
        </div>
        <div className="md:hidden w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] font-bold text-orange-400">
          CS
        </div>
      </div>
    </aside>
  );
}
