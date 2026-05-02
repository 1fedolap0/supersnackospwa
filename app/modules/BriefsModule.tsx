"use client";

import { useState } from "react";
import { Sparkles, FileText, Plus, Trash2, ChevronRight, AlertTriangle, CheckCircle, ArrowRight, Zap } from "lucide-react";
import type { Brief } from "../lib/types";
import { useBriefs } from "../store/useStore";
import { generateBriefFromNotes } from "../lib/mockAI";
import { Modal } from "../components/Modal";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function BriefCard({ brief, onClick, onDelete }: { brief: Brief; onClick: () => void; onDelete: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border transition-all hover:border-orange-500/30 hover:bg-orange-500/5 group"
      style={{ background: "var(--navy-700)", borderColor: "var(--border-light)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <FileText size={14} style={{ color: "var(--orange)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate mb-1" style={{ color: "var(--text-primary)" }}>{brief.title}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(brief.createdAt)}</p>
            <div className="flex gap-3 mt-2">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{brief.keyUpdates.length} updates</span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{brief.decisionsRequired.length} decisions</span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{brief.risks.length} risks</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-900/30 transition-all"
            style={{ color: "var(--text-muted)" }}
          >
            <Trash2 size={12} />
          </button>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    </button>
  );
}

function BriefDetail({ brief }: { brief: Brief }) {
  const sections = [
    {
      title: "Key Updates",
      icon: <Zap size={13} style={{ color: "#f97316" }} />,
      items: brief.keyUpdates,
      color: "#f97316",
    },
    {
      title: "Decisions Required",
      icon: <CheckCircle size={13} style={{ color: "#3b82f6" }} />,
      items: brief.decisionsRequired,
      color: "#3b82f6",
    },
    {
      title: "Risks",
      icon: <AlertTriangle size={13} style={{ color: "#ef4444" }} />,
      items: brief.risks,
      color: "#ef4444",
    },
    {
      title: "Next Steps",
      icon: <ArrowRight size={13} style={{ color: "#10b981" }} />,
      items: brief.nextSteps,
      color: "#10b981",
    },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6 pb-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <FileText size={18} style={{ color: "var(--orange)" }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{brief.title}</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(brief.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((sec) => (
          <div key={sec.title} className="p-5 rounded-xl" style={{ background: "var(--navy-700)", border: "1px solid var(--border-light)" }}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              {sec.icon}
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{sec.title}</h3>
            </div>
            <ul className="space-y-2.5">
              {sec.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: sec.color }} />
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneratorForm({ onGenerate, onClose }: { onGenerate: (brief: Brief) => void; onClose: () => void }) {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");

  const generate = () => {
    const generated = generateBriefFromNotes(notes);
    const brief: Brief = {
      id: Date.now().toString(),
      rawInput: notes,
      createdAt: new Date().toISOString(),
      ...generated,
      title: title || generated.title,
    };
    onGenerate(brief);
    onClose();
  };

  const inputStyle = {
    background: "var(--navy-600)",
    border: "1px solid var(--border-light)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
    outline: "none",
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Brief Title (optional)</label>
        <input style={inputStyle} placeholder="e.g. Weekly Executive Brief – May 2026" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Raw Notes / Emails *</label>
        <textarea
          style={{ ...inputStyle, minHeight: "200px", resize: "vertical" }}
          placeholder={"Paste your raw meeting notes, emails, or updates here...\n\nExamples:\n- Q3 board deck needs sign-off by Thursday\n- CFO reporting 8% budget overrun in April\n- Platform migration on track for May 15\n- New competitor raised $40M Series B"}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI will structure your input into key updates, decisions, risks, and next steps.</p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={generate}
          disabled={!notes.trim()}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: "var(--orange)", color: "white" }}
        >
          <Sparkles size={14} />
          Generate Executive Brief
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function BriefsModule() {
  const [briefs, setBriefs] = useBriefs();
  const [selected, setSelected] = useState<Brief | null>(briefs[0] ?? null);
  const [showGenerator, setShowGenerator] = useState(false);

  const addBrief = (brief: Brief) => {
    setBriefs((p) => [brief, ...p]);
    setSelected(brief);
  };

  const deleteBrief = (id: string) => {
    setBriefs((p) => p.filter((b) => b.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div
        className={`flex flex-col border-r ${selected ? "hidden md:flex md:w-80 shrink-0" : "flex-1"}`}
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Executive Briefs</h2>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{ background: "var(--orange)", color: "white" }}
          >
            <Plus size={12} />
            New Brief
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {briefs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <FileText size={32} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No briefs yet</p>
              <button
                onClick={() => setShowGenerator(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold hover:brightness-110 transition-all"
                style={{ background: "var(--orange)", color: "white" }}
              >
                Generate First Brief
              </button>
            </div>
          )}
          {briefs.map((b) => (
            <BriefCard
              key={b.id}
              brief={b}
              onClick={() => setSelected(b)}
              onDelete={() => deleteBrief(b.id)}
            />
          ))}
        </div>
      </div>

      {/* Detail */}
      {selected ? (
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="md:hidden flex items-center px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm" style={{ color: "var(--orange)" }}>
              <ChevronRight size={14} className="rotate-180" />Back
            </button>
          </div>
          <BriefDetail brief={selected} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <FileText size={48} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>Select a brief or generate a new one</p>
            <button
              onClick={() => setShowGenerator(true)}
              className="text-sm px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition-all flex items-center gap-2 mx-auto"
              style={{ background: "var(--orange)", color: "white" }}
            >
              <Sparkles size={14} />
              Generate Brief
            </button>
          </div>
        </div>
      )}

      {showGenerator && (
        <Modal title="Generate Executive Brief" onClose={() => setShowGenerator(false)} wide>
          <GeneratorForm onGenerate={addBrief} onClose={() => setShowGenerator(false)} />
        </Modal>
      )}
    </div>
  );
}
