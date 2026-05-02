"use client";

import type { Priority } from "../lib/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    high: "bg-red-900/40 text-red-400 border border-red-800/40",
    medium: "bg-yellow-900/30 text-yellow-400 border border-yellow-800/30",
    low: "bg-slate-800 text-slate-400 border border-slate-700",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    Reply: "bg-orange-900/40 text-orange-400 border border-orange-800/40",
    Delegate: "bg-blue-900/40 text-blue-400 border border-blue-800/40",
    "No Action": "bg-slate-800 text-slate-500 border border-slate-700",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[action] || styles["No Action"]}`}>
      {action}
    </span>
  );
}

export function VIPBadge() {
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
      VIP
    </span>
  );
}
