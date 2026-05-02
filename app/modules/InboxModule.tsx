"use client";

import { useState } from "react";
import { Star, Reply, UserCheck, Archive, ChevronRight, Sparkles, Mail } from "lucide-react";
import type { Email } from "../lib/types";
import { useEmails } from "../store/useStore";
import { PriorityBadge, ActionBadge, VIPBadge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { generateEmailReply, generateDelegationEmail } from "../lib/mockAI";

type InboxView = "priority" | "all";

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface EmailCardProps {
  email: Email;
  selected: boolean;
  onClick: () => void;
  onToggleVIP: () => void;
  onMarkRead: () => void;
}

function EmailCard({ email, selected, onClick, onToggleVIP, onMarkRead }: EmailCardProps) {
  return (
    <button
      onClick={() => { onClick(); onMarkRead(); }}
      className={`w-full text-left px-4 py-3.5 border-b transition-all flex gap-3 hover:bg-white/[0.02] ${selected ? "bg-orange-500/5 border-l-2 border-l-orange-500" : "border-transparent"}`}
      style={{ borderBottomColor: "var(--border)" }}
    >
      {/* Unread dot */}
      <div className="flex flex-col items-center gap-2 mt-1 shrink-0">
        <div
          className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${email.read ? "opacity-0" : "opacity-100"}`}
          style={{ background: "var(--orange)" }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVIP(); }}
          className="transition-colors"
          style={{ color: email.isVIP ? "#f97316" : "var(--text-muted)" }}
        >
          <Star size={12} fill={email.isVIP ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-sm font-semibold truncate ${email.read ? "" : "font-bold"}`}
              style={{ color: email.read ? "var(--text-secondary)" : "var(--text-primary)" }}
            >
              {email.from}
            </span>
            {email.isVIP && <VIPBadge />}
            {email.fromRole && (
              <span className="text-[10px] hidden sm:block" style={{ color: "var(--text-muted)" }}>
                {email.fromRole}
              </span>
            )}
          </div>
          <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
            {formatTime(email.timestamp)}
          </span>
        </div>
        <p className="text-xs font-medium mb-1 truncate" style={{ color: "var(--text-secondary)" }}>
          {email.subject}
        </p>
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {email.summary}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <ActionBadge action={email.action} />
          <PriorityBadge priority={email.priority} />
          {email.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--navy-500)", color: "var(--text-muted)" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

interface EmailDetailProps {
  email: Email;
  onClose: () => void;
  onReply: () => void;
  onDelegate: () => void;
}

function EmailDetail({ email, onClose, onReply, onDelegate }: EmailDetailProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              {email.subject}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{email.from}</span>
              {email.fromRole && <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {email.fromRole}</span>}
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {formatTime(email.timestamp)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {email.isVIP && <VIPBadge />}
            <ActionBadge action={email.action} />
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="mx-6 mt-4 p-4 rounded-lg" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={12} style={{ color: "var(--orange)" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--orange)" }}>AI Summary</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{email.summary}</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <pre className="text-sm leading-7 whitespace-pre-wrap font-sans" style={{ color: "var(--text-secondary)" }}>
          {email.body}
        </pre>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t flex gap-3 flex-wrap" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onReply}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: "var(--orange)", color: "white" }}
        >
          <Sparkles size={14} />
          Generate Reply with AI
        </button>
        <button
          onClick={onDelegate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-white/10"
          style={{ background: "var(--navy-500)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
        >
          <UserCheck size={14} />
          Delegate via Email
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
          style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
        >
          <Archive size={14} />
          Archive
        </button>
      </div>
    </div>
  );
}

export function InboxModule() {
  const [emails, setEmails] = useEmails();
  const [view, setView] = useState<InboxView>("priority");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiModal, setAiModal] = useState<{ type: "reply" | "delegate"; email: Email } | null>(null);

  const filtered = view === "priority"
    ? emails.filter((e) => e.isVIP || e.priority === "high")
    : emails;

  const selected = emails.find((e) => e.id === selectedId) ?? null;

  const toggleVIP = (id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, isVIP: !e.isVIP } : e)));
  };

  const markRead = (id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  };

  const unread = emails.filter((e) => !e.read).length;

  return (
    <div className="flex h-full">
      {/* List panel */}
      <div
        className={`flex flex-col border-r ${selected ? "hidden md:flex md:w-80 lg:w-96 shrink-0" : "flex-1"}`}
        style={{ borderColor: "var(--border)" }}
      >
        {/* Tabs */}
        <div className="flex border-b px-4 gap-1 pt-1" style={{ borderColor: "var(--border)" }}>
          {(["priority", "all"] as InboxView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 text-xs font-semibold capitalize transition-all border-b-2 -mb-px ${view === v ? "border-orange-500 text-orange-400" : "border-transparent"}`}
              style={{ color: view === v ? "var(--orange)" : "var(--text-muted)" }}
            >
              {v === "priority" ? `Priority${unread > 0 ? ` (${unread})` : ""}` : "All Mail"}
            </button>
          ))}
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Mail size={32} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No emails here</p>
            </div>
          )}
          {filtered.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              selected={selectedId === email.id}
              onClick={() => setSelectedId(email.id)}
              onToggleVIP={() => toggleVIP(email.id)}
              onMarkRead={() => markRead(email.id)}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected ? (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Mobile back */}
          <div className="md:hidden flex items-center px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1 text-sm"
              style={{ color: "var(--orange)" }}
            >
              <ChevronRight size={14} className="rotate-180" />
              Back
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EmailDetail
              email={selected}
              onClose={() => setSelectedId(null)}
              onReply={() => setAiModal({ type: "reply", email: selected })}
              onDelegate={() => setAiModal({ type: "delegate", email: selected })}
            />
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <Mail size={48} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select an email to read</p>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {aiModal && (
        <Modal
          title={aiModal.type === "reply" ? "AI-Generated Reply" : "Delegation Email"}
          onClose={() => setAiModal(null)}
          wide
        >
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg text-sm leading-7 whitespace-pre-wrap font-mono"
              style={{ background: "var(--navy-600)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              {aiModal.type === "reply"
                ? generateEmailReply(aiModal.email)
                : generateDelegationEmail(aiModal.email)}
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI-generated draft · Review and edit before sending
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
                style={{ background: "var(--orange)", color: "white" }}
                onClick={() => setAiModal(null)}
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setAiModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
