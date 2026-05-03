"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Star, UserCheck, Archive, ChevronRight, Sparkles, Mail, RefreshCw, Loader2, FileText } from "lucide-react";
import type { Email } from "../lib/types";
import { useEmails, useVIPAddresses } from "../store/useStore";
import { PriorityBadge, ActionBadge, VIPBadge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { GmailAuth, type GmailAuthState } from "../components/GmailAuth";
import { generateDelegationEmail } from "../lib/mockAI";
import { fetchInbox, transformGmailMessage } from "../lib/gmail";
import { mockEmails } from "../lib/mockData";
import { preGenerateReplies, type ReplyDraft } from "../lib/orchestrator";

type InboxView = "priority" | "all";

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Email Card ───────────────────────────────────────────────────────────────

interface EmailCardProps {
  email: Email;
  selected: boolean;
  onClick: () => void;
  onToggleVIP: () => void;
  onMarkRead: () => void;
  hasDraft?: boolean;
}

function EmailCard({ email, selected, onClick, onToggleVIP, onMarkRead, hasDraft }: EmailCardProps) {
  return (
    <button
      onClick={() => { onClick(); onMarkRead(); }}
      className={`w-full text-left px-4 py-3.5 border-b transition-all flex gap-3 hover:bg-white/[0.02] ${selected ? "bg-orange-500/5 border-l-2 border-l-orange-500" : "border-transparent"}`}
      style={{ borderBottomColor: "var(--border)" }}
    >
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-sm truncate ${email.read ? "font-medium" : "font-bold"}`}
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
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <ActionBadge action={email.action} />
          <PriorityBadge priority={email.priority} />
          {hasDraft && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.15)", color: "var(--orange)", border: "1px solid rgba(249,115,22,0.3)" }}>
              <FileText size={9} />
              Draft ready
            </span>
          )}
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

// ─── Email Detail ─────────────────────────────────────────────────────────────

interface EmailDetailProps {
  email: Email;
  draft?: ReplyDraft;
  onClose: () => void;
  onDelegate: () => void;
}

function EmailDetail({ email, draft, onClose, onDelegate }: EmailDetailProps) {
  const [showDraft, setShowDraft] = useState(!!draft);
  const copied = useRef(false);

  const copyDraft = () => {
    if (draft) {
      navigator.clipboard?.writeText(draft.draft).catch(() => {});
      copied.current = true;
    }
  };

  return (
    <div className="h-full flex flex-col">
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

      {/* Pre-generated draft (proactive) */}
      {draft && (
        <div className="mx-6 mt-3 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(249,115,22,0.2)" }}>
          <button
            onClick={() => setShowDraft((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/5"
            style={{ background: "rgba(249,115,22,0.08)" }}
          >
            <div className="flex items-center gap-2">
              <FileText size={12} style={{ color: "var(--orange)" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--orange)" }}>
                AI Draft Ready
              </span>
            </div>
            <ChevronRight size={12} className={`transition-transform ${showDraft ? "rotate-90" : ""}`} style={{ color: "var(--orange)" }} />
          </button>
          {showDraft && (
            <div className="px-4 py-3" style={{ background: "var(--navy-700)" }}>
              <pre className="text-xs leading-6 whitespace-pre-wrap font-sans mb-3" style={{ color: "var(--text-secondary)" }}>
                {draft.draft}
              </pre>
              <button
                onClick={copyDraft}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-110"
                style={{ background: "var(--orange)", color: "white" }}
              >
                Copy Draft
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <pre className="text-sm leading-7 whitespace-pre-wrap font-sans" style={{ color: "var(--text-secondary)" }}>
          {email.body}
        </pre>
      </div>

      <div className="px-6 py-4 border-t flex gap-3 flex-wrap" style={{ borderColor: "var(--border)" }}>
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

// ─── Main Module ──────────────────────────────────────────────────────────────

export function InboxModule() {
  const [storedEmails, setStoredEmails] = useEmails();
  const [vipAddresses, setVipAddresses] = useVIPAddresses();

  const [view, setView] = useState<InboxView>("priority");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [delegateModal, setDelegateModal] = useState<Email | null>(null);
  const [authState, setAuthState] = useState<GmailAuthState>({ status: "disconnected" });
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "error">("idle");
  const [fetchError, setFetchError] = useState("");
  const [usingGmail, setUsingGmail] = useState(false);
  const [drafts, setDrafts] = useState<ReplyDraft[]>([]);

  // Emails shown: real gmail emails when connected, else mock
  const [gmailEmails, setGmailEmails] = useState<Email[]>([]);
  const emails = usingGmail ? gmailEmails : storedEmails;

  // Pre-generate reply drafts whenever email list changes
  useEffect(() => {
    setDrafts(preGenerateReplies(emails));
  }, [emails]);

  // Derived VIP set from persisted addresses
  const vipSet = new Set(vipAddresses.map((a) => a.toLowerCase()));

  // Apply VIP from persistent addresses to displayed emails
  const displayEmails = emails.map((e) => ({
    ...e,
    isVIP: vipSet.has(e.from.toLowerCase()) || vipSet.has((e.from + " " + e.subject).toLowerCase()),
  }));

  const vipEmails = displayEmails.filter((e) => e.isVIP);
  const filtered = view === "priority" ? vipEmails : displayEmails;
  const selected = displayEmails.find((e) => e.id === selectedId) ?? null;
  const unread = displayEmails.filter((e) => !e.read).length;

  const handleAuthChange = useCallback(async (state: GmailAuthState) => {
    setAuthState(state);
    if (state.status === "connected") {
      setFetchState("loading");
      try {
        const msgs = await fetchInbox(state.token, 30);
        const transformed = msgs.map((m) => transformGmailMessage(m, vipSet));
        setGmailEmails(transformed);
        setDrafts(preGenerateReplies(transformed));
        setUsingGmail(true);
        setFetchState("idle");
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to fetch emails");
        setFetchState("error");
      }
    } else {
      setUsingGmail(false);
      setGmailEmails([]);
      setFetchState("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    if (authState.status !== "connected") return;
    setFetchState("loading");
    setFetchError("");
    try {
      const msgs = await fetchInbox(authState.token, 30);
      const transformed = msgs.map((m) => transformGmailMessage(m, vipSet));
      setGmailEmails(transformed);
      setDrafts(preGenerateReplies(transformed));
      setFetchState("idle");
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to refresh");
      setFetchState("error");
    }
  };

  const toggleVIP = (email: Email) => {
    const key = email.from.toLowerCase();
    setVipAddresses((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
    // Also update mock emails in localStorage if not using Gmail
    if (!usingGmail) {
      setStoredEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, isVIP: !e.isVIP } : e))
      );
    } else {
      setGmailEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, isVIP: !e.isVIP } : e))
      );
    }
  };

  const markRead = (id: string) => {
    if (usingGmail) {
      setGmailEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
    } else {
      setStoredEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Auth banner */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0" style={{ background: "var(--navy-800)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <GmailAuth authState={authState} onAuthChange={handleAuthChange} />
          {fetchState === "loading" && (
            <div className="flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" style={{ color: "var(--orange)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Fetching emails…</span>
            </div>
          )}
          {fetchState === "error" && (
            <span className="text-xs" style={{ color: "#ef4444" }}>{fetchError}</span>
          )}
          {!usingGmail && authState.status === "disconnected" && (
            <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
              Showing demo data · Connect Gmail for live inbox
            </span>
          )}
        </div>
        {authState.status === "connected" && (
          <button
            onClick={refresh}
            disabled={fetchState === "loading"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5 disabled:opacity-40"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            <RefreshCw size={11} className={fetchState === "loading" ? "animate-spin" : ""} />
            Refresh
          </button>
        )}
      </div>

      {/* Inbox layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* List panel */}
        <div
          className={`flex flex-col border-r ${selected ? "hidden md:flex md:w-80 lg:w-96 shrink-0" : "flex-1"}`}
          style={{ borderColor: "var(--border)" }}
        >
          {/* Tabs */}
          <div className="flex border-b px-4 gap-1 pt-1 shrink-0" style={{ borderColor: "var(--border)" }}>
            {(["priority", "all"] as InboxView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 text-xs font-semibold capitalize transition-all border-b-2 -mb-px`}
                style={{
                  color: view === v ? "var(--orange)" : "var(--text-muted)",
                  borderBottomColor: view === v ? "var(--orange)" : "transparent",
                }}
              >
                {v === "priority"
                  ? `VIP${vipEmails.length > 0 ? ` (${vipEmails.length})` : ""}`
                  : `All${unread > 0 ? ` · ${unread} new` : ""}`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {fetchState === "loading" ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--orange)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading your inbox…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
                <Mail size={32} style={{ color: "var(--text-muted)" }} />
                {view === "priority" ? (
                  <>
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No VIP emails</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Star a sender to tag them as VIP — they&apos;ll appear here
                    </p>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No emails</p>
                )}
              </div>
            ) : (
              filtered.map((email) => (
                <EmailCard
                  key={email.id}
                  email={email}
                  selected={selectedId === email.id}
                  onClick={() => setSelectedId(email.id)}
                  onToggleVIP={() => toggleVIP(email)}
                  onMarkRead={() => markRead(email.id)}
                  hasDraft={drafts.some((d) => d.emailId === email.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
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
                draft={drafts.find((d) => d.emailId === selected.id)}
                onClose={() => setSelectedId(null)}
                onDelegate={() => setDelegateModal(selected)}
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
      </div>

      {/* Delegate Modal */}
      {delegateModal && (
        <Modal title="Delegation Email" onClose={() => setDelegateModal(null)} wide>
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg text-sm leading-7 whitespace-pre-wrap font-mono"
              style={{ background: "var(--navy-600)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              {generateDelegationEmail(delegateModal)}
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI-generated draft · Review and edit before sending</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
                style={{ background: "var(--orange)", color: "white" }}
                onClick={() => {
                  navigator.clipboard?.writeText(generateDelegationEmail(delegateModal)).catch(() => {});
                  setDelegateModal(null);
                }}
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setDelegateModal(null)}
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

// suppress unused import warning — mockEmails used as default fallback via useEmails()
void mockEmails;
