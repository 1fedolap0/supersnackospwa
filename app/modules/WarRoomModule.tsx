"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, MessageSquare, Activity, FileText,
  Sparkles, Inbox, CheckSquare, ChevronRight, Star,
  Clock, ArrowRight, Loader2, Zap,
} from "lucide-react";
import { useEmails, useTasks, useRouterConfig } from "../store/useStore";
import { getTaskUrgency } from "../lib/orchestrator";
import { generateAIResponse } from "../lib/aiRouter";
import type { Email, Task } from "../lib/types";

interface Props {
  onNavigate: (module: string) => void;
  onQuickAdd: () => void;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, count, color = "var(--orange)", onViewAll,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  color?: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          {title}
        </h2>
        {count !== undefined && count > 0 && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            {count}
          </span>
        )}
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-[10px] flex items-center gap-0.5 hover:underline transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          View all <ChevronRight size={10} />
        </button>
      )}
    </div>
  );
}

// ─── Row item ─────────────────────────────────────────────────────────────────

function RowItem({
  title, sub, indicatorColor, badge, badgeColor, onClick,
}: {
  title: string;
  sub: string;
  indicatorColor: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group hover:bg-white/5"
      style={{ border: "1px solid var(--border-light)", background: "var(--navy-700)" }}
    >
      <span className="w-1 h-8 rounded-full shrink-0" style={{ background: indicatorColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
      </div>
      {badge && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: `${badgeColor ?? "#f97316"}20`, color: badgeColor ?? "#f97316" }}
        >
          {badge}
        </span>
      )}
      <ChevronRight size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>{label}</p>
  );
}

// ─── Quick Brief ──────────────────────────────────────────────────────────────

function QuickBrief({ emails, tasks }: { emails: Email[]; tasks: Task[] }) {
  const [generated, setGenerated] = useState<{ updates: string[]; risks: string[]; nextSteps: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [routerConfig] = useRouterConfig();

  // Derive brief from live data
  const auto = useMemo(() => {
    const updates = emails
      .filter((e) => !e.read)
      .slice(0, 4)
      .map((e) => e.summary || e.subject);

    const risks = [
      ...emails.filter((e) => !e.read && e.priority === "high").map((e) => `High-priority email from ${e.from}: ${e.subject}`),
      ...tasks.filter((t) => {
        const u = getTaskUrgency(t);
        return u.level === "critical" || u.level === "overdue";
      }).map((t) => `Task overdue: ${t.title}`),
    ].slice(0, 3);

    const nextSteps = tasks
      .filter((t) => t.status === "todo" || t.status === "inprogress")
      .slice(0, 4)
      .map((t) => t.title);

    return { updates, risks, nextSteps };
  }, [emails, tasks]);

  const display = generated ?? auto;

  const generate = async () => {
    setLoading(true);
    const context = [
      "UNREAD EMAILS:",
      ...emails.filter((e) => !e.read).slice(0, 6).map((e) => `- ${e.from}: ${e.subject} — ${e.summary}`),
      "\nOPEN TASKS:",
      ...tasks.filter((t) => t.status !== "done").slice(0, 6).map((t) => `- [${t.priority}] ${t.title}`),
    ].join("\n");

    const prompt = `You are an executive chief of staff. Based on the current situation, produce a concise executive brief.\n\n${context}\n\nRespond ONLY in this format:\n## Key Updates\n• [point]\n• [point]\n\n## Risks\n• [point]\n\n## Next Steps\n• [point]\n• [point]`;

    const response = await generateAIResponse("brief-generation", prompt, routerConfig);

    const extract = (header: string) =>
      (response.content.match(new RegExp(`##\\s*${header}[\\s\\S]*?(?=\\n##|$)`, "i"))?.[0] ?? "")
        .split("\n").slice(1).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

    setGenerated({
      updates: extract("Key Updates"),
      risks: extract("Risks"),
      nextSteps: extract("Next Steps"),
    });
    setLoading(false);
  };

  const briefRow = (items: string[], color: string) =>
    items.length === 0 ? (
      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>None</p>
    ) : (
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
            <p className="text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>{item}</p>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: "var(--navy-700)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={13} style={{ color: "var(--orange)" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Quick Brief</span>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "rgba(249,115,22,0.15)", color: "var(--orange)" }}
        >
          {loading ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
          {loading ? "Generating…" : "AI Generate"}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Key Updates</p>
          {briefRow(display.updates, "#f97316")}
        </div>
        <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Risks</p>
          {briefRow(display.risks, "#ef4444")}
        </div>
        <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Next Steps</p>
          {briefRow(display.nextSteps, "#10b981")}
        </div>
      </div>
    </div>
  );
}

// ─── Main module ──────────────────────────────────────────────────────────────

export function WarRoomModule({ onNavigate, onQuickAdd }: Props) {
  const [emails] = useEmails();
  const [tasks] = useTasks();

  // Critical Now: VIP unread + high-priority reply unread + overdue/critical tasks
  const criticalEmails = useMemo(
    () => emails.filter((e) => !e.read && (e.isVIP || (e.priority === "high" && e.action === "Reply"))),
    [emails]
  );
  const criticalTasks = useMemo(
    () => tasks.filter((t) => {
      const u = getTaskUrgency(t);
      return u.level === "critical" || u.level === "overdue";
    }),
    [tasks]
  );

  // Decisions Needed: unread Reply emails that aren't in Critical Now
  const decisionEmails = useMemo(
    () => emails.filter((e) => !e.read && e.action === "Reply" && !e.isVIP && e.priority !== "high"),
    [emails]
  );
  // High-priority todo tasks not overdue
  const decisionTasks = useMemo(
    () => tasks.filter((t) => {
      const u = getTaskUrgency(t);
      return t.status === "todo" && t.priority === "high" && u.level === "none";
    }),
    [tasks]
  );

  // Active Threads: in-progress tasks + delegate emails
  const activeThreadTasks = useMemo(
    () => tasks.filter((t) => t.status === "inprogress"),
    [tasks]
  );
  const delegateEmails = useMemo(
    () => emails.filter((e) => !e.read && e.action === "Delegate"),
    [emails]
  );

  const criticalCount = criticalEmails.length + criticalTasks.length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>War Room</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {criticalCount > 0 && (
                <span className="ml-2 font-semibold" style={{ color: "#ef4444" }}>
                  · {criticalCount} critical item{criticalCount !== 1 ? "s" : ""} need attention
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Generate CEO Brief", icon: <FileText size={14} />, color: "#f97316", action: () => onNavigate("briefs") },
            { label: "Summarize Inbox", icon: <Inbox size={14} />, color: "#3b82f6", action: () => onNavigate("inbox") },
            { label: "Prepare for Meeting", icon: <CheckSquare size={14} />, color: "#10b981", action: onQuickAdd },
          ].map(({ label, icon, color, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all hover:brightness-110 active:scale-95"
              style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
            >
              {icon}
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left: Critical Now + Decisions + Active Threads */}
          <div className="md:col-span-2 space-y-6">

            {/* A. Critical Now */}
            <section>
              <SectionHeader
                icon={<AlertTriangle size={13} />}
                title="Critical Now"
                count={criticalCount}
                color="#ef4444"
                onViewAll={criticalCount > 0 ? () => onNavigate("inbox") : undefined}
              />
              <div className="space-y-2">
                {criticalEmails.map((e) => (
                  <RowItem
                    key={e.id}
                    title={e.subject}
                    sub={`${e.from}${e.fromRole ? ` · ${e.fromRole}` : ""} · ${e.action}`}
                    indicatorColor="#ef4444"
                    badge={e.isVIP ? "VIP" : "High"}
                    badgeColor={e.isVIP ? "#f97316" : "#ef4444"}
                    onClick={() => onNavigate("inbox")}
                  />
                ))}
                {criticalTasks.map((t) => {
                  const u = getTaskUrgency(t);
                  return (
                    <RowItem
                      key={t.id}
                      title={t.title}
                      sub={`${t.assignee || "Unassigned"} · ${u.label}`}
                      indicatorColor={u.color}
                      badge={u.label}
                      badgeColor={u.color}
                      onClick={() => onNavigate("tasks")}
                    />
                  );
                })}
                {criticalCount === 0 && <EmptyState label="No critical items — all clear." />}
              </div>
            </section>

            {/* B. Decisions Needed */}
            <section>
              <SectionHeader
                icon={<MessageSquare size={13} />}
                title="Decisions Needed"
                count={decisionEmails.length + decisionTasks.length}
                color="#3b82f6"
                onViewAll={() => onNavigate("inbox")}
              />
              <div className="space-y-2">
                {decisionEmails.slice(0, 4).map((e) => (
                  <RowItem
                    key={e.id}
                    title={e.subject}
                    sub={`From ${e.from} · Reply needed`}
                    indicatorColor="#3b82f6"
                    badge="Reply"
                    badgeColor="#3b82f6"
                    onClick={() => onNavigate("inbox")}
                  />
                ))}
                {decisionTasks.slice(0, 3).map((t) => (
                  <RowItem
                    key={t.id}
                    title={t.title}
                    sub={`${t.assignee || "Unassigned"} · High priority`}
                    indicatorColor="#3b82f6"
                    badge="Todo"
                    badgeColor="#3b82f6"
                    onClick={() => onNavigate("tasks")}
                  />
                ))}
                {decisionEmails.length === 0 && decisionTasks.length === 0 && (
                  <EmptyState label="No pending decisions." />
                )}
              </div>
            </section>

            {/* C. Active Threads */}
            <section>
              <SectionHeader
                icon={<Activity size={13} />}
                title="Active Threads"
                count={activeThreadTasks.length + delegateEmails.length}
                color="#8b5cf6"
                onViewAll={() => onNavigate("tasks")}
              />
              <div className="space-y-2">
                {activeThreadTasks.slice(0, 3).map((t) => (
                  <RowItem
                    key={t.id}
                    title={t.title}
                    sub={`${t.assignee || "Unassigned"} · In progress`}
                    indicatorColor="#8b5cf6"
                    badge="Active"
                    badgeColor="#8b5cf6"
                    onClick={() => onNavigate("tasks")}
                  />
                ))}
                {delegateEmails.slice(0, 3).map((e) => (
                  <RowItem
                    key={e.id}
                    title={e.subject}
                    sub={`From ${e.from} · Awaiting delegation`}
                    indicatorColor="#8b5cf6"
                    badge="Delegate"
                    badgeColor="#8b5cf6"
                    onClick={() => onNavigate("inbox")}
                  />
                ))}
                {activeThreadTasks.length === 0 && delegateEmails.length === 0 && (
                  <EmptyState label="No active threads." />
                )}
              </div>
            </section>
          </div>

          {/* Right: Quick Brief */}
          <div className="space-y-4">
            <QuickBrief emails={emails} tasks={tasks} />

            {/* Today's summary stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Unread", value: emails.filter((e) => !e.read).length, color: "#f97316", icon: <Inbox size={12} /> },
                { label: "Open Tasks", value: tasks.filter((t) => t.status !== "done").length, color: "#3b82f6", icon: <CheckSquare size={12} /> },
                { label: "VIP Emails", value: emails.filter((e) => e.isVIP && !e.read).length, color: "#eab308", icon: <Zap size={12} /> },
                { label: "Overdue", value: tasks.filter((t) => { const u = getTaskUrgency(t); return u.level !== "none"; }).length, color: "#ef4444", icon: <Clock size={12} /> },
              ].map(({ label, value, color, icon }) => (
                <div
                  key={label}
                  className="rounded-lg p-3 flex flex-col gap-1"
                  style={{ background: "var(--navy-700)", border: "1px solid var(--border-light)" }}
                >
                  <div className="flex items-center gap-1.5" style={{ color }}>
                    {icon}
                    <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
