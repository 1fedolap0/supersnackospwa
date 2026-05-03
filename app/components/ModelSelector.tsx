"use client";

import { useState, useRef, useEffect } from "react";
import { Cpu, ChevronDown, Zap, DollarSign, SlidersHorizontal, Check, ExternalLink } from "lucide-react";
import { MODELS, PROVIDERS_BY_COST, getModelBadgeStyle, formatCost } from "../lib/aiRouter";
import type { RouterMode, ModelId } from "../lib/aiRouter";
import { useRouterConfig, useRouterMode, useManualModel } from "../store/useStore";

// Re-export SMART_ROUTE isn't exported — inline the display mapping
const SMART_DISPLAY: { task: string; model: ModelId }[] = [
  { task: "Email summary", model: "deepseek-chat" },
  { task: "Action detection", model: "deepseek-chat" },
  { task: "Reply drafts", model: "claude-sonnet-4-6" },
  { task: "Executive briefs", model: "claude-sonnet-4-6" },
  { task: "Expert advice", model: "claude-sonnet-4-6" },
  { task: "Structured output", model: "gpt-4o" },
];

const MODE_CONFIG: Record<RouterMode, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  smart: {
    label: "Smart",
    icon: <Zap size={12} />,
    color: "#f97316",
    description: "Routes each task to the best model",
  },
  manual: {
    label: "Manual",
    icon: <SlidersHorizontal size={12} />,
    color: "#8b5cf6",
    description: "You choose the model",
  },
  "cost-saver": {
    label: "Cost Saver",
    icon: <DollarSign size={12} />,
    color: "#10b981",
    description: "Always uses the cheapest model",
  },
};

function ModelBadge({ modelId, size = "sm" }: { modelId: ModelId; size?: "xs" | "sm" }) {
  const m = MODELS[modelId];
  const s = getModelBadgeStyle(m.provider);
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"}`}
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {m.displayName}
    </span>
  );
}

export { ModelBadge };

export function ModelSelector() {
  const [config, setConfig] = useRouterConfig();
  const [mode, setMode] = useRouterMode();
  const [manualModel, setManualModel] = useManualModel();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"mode" | "keys">("mode");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) setTimeout(() => window.addEventListener("mousedown", handler), 0);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const currentMode = MODE_CONFIG[mode];
  const effectiveModel = mode === "manual"
    ? MODELS[manualModel]
    : mode === "cost-saver"
    ? MODELS["deepseek-chat"]
    : null; // smart varies by task

  const saveKey = (provider: "openai" | "claude" | "deepseek", value: string) => {
    setConfig((c) => ({
      ...c,
      apiKeys: { ...c.apiKeys, [provider]: value.trim() || undefined },
    }));
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
        style={{
          background: "var(--navy-600)",
          border: `1px solid ${currentMode.color}40`,
          color: "var(--text-secondary)",
        }}
      >
        <Cpu size={12} style={{ color: currentMode.color }} />
        <span style={{ color: currentMode.color }}>{currentMode.label}</span>
        {effectiveModel && (
          <>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <ModelBadge modelId={effectiveModel.id} size="xs" />
          </>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: "var(--navy-700)", border: "1px solid var(--border-light)" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={13} style={{ color: "var(--orange)" }} />
              <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>AI Model Router</p>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{currentMode.description}</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {(["mode", "keys"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-xs font-semibold capitalize transition-colors"
                style={{
                  color: tab === t ? "var(--orange)" : "var(--text-muted)",
                  borderBottom: `2px solid ${tab === t ? "var(--orange)" : "transparent"}`,
                  background: "transparent",
                }}
              >
                {t === "keys" ? "API Keys" : "Mode"}
              </button>
            ))}
          </div>

          {tab === "mode" && (
            <div className="p-3 space-y-2">
              {/* Mode selector */}
              {(Object.entries(MODE_CONFIG) as [RouterMode, typeof MODE_CONFIG[RouterMode]][]).map(([m, cfg]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                  style={{
                    background: mode === m ? `${cfg.color}10` : "var(--navy-600)",
                    border: `1px solid ${mode === m ? `${cfg.color}40` : "var(--border)"}`,
                  }}
                >
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: mode === m ? cfg.color : "var(--text-secondary)" }}>
                      {cfg.label}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{cfg.description}</p>
                  </div>
                  {mode === m && <Check size={12} style={{ color: cfg.color }} />}
                </button>
              ))}

              {/* Manual model picker */}
              {mode === "manual" && (
                <div className="pt-1 space-y-1.5">
                  <p className="text-[10px] font-semibold px-1" style={{ color: "var(--text-muted)" }}>SELECT MODEL</p>
                  <div className="grid grid-cols-1 gap-1">
                    {(Object.values(MODELS)).map((m) => {
                      const s = getModelBadgeStyle(m.provider);
                      return (
                        <button
                          key={m.id}
                          onClick={() => setManualModel(m.id)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                          style={{
                            background: manualModel === m.id ? `${s.color}10` : "var(--navy-600)",
                            border: `1px solid ${manualModel === m.id ? s.border : "var(--border)"}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                            <span className="text-xs font-medium" style={{ color: manualModel === m.id ? s.color : "var(--text-secondary)" }}>
                              {m.displayName}
                            </span>
                            <span className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>
                              {m.provider}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                              {formatCost(m)}/req
                            </span>
                            {manualModel === m.id && <Check size={11} style={{ color: s.color }} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Smart mode routing preview */}
              {mode === "smart" && (
                <div className="pt-1">
                  <p className="text-[10px] font-semibold px-1 mb-1.5" style={{ color: "var(--text-muted)" }}>ROUTING TABLE</p>
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    {SMART_DISPLAY.map(({ task, model: modelId }, i) => (
                      <div
                        key={task}
                        className="flex items-center justify-between px-3 py-1.5"
                        style={{
                          borderTop: i > 0 ? "1px solid var(--border)" : "none",
                          background: "var(--navy-600)",
                        }}
                      >
                        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{task}</span>
                        <ModelBadge modelId={modelId} size="xs" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost saver info */}
              {mode === "cost-saver" && (
                <div className="pt-1">
                  <p className="text-[10px] font-semibold px-1 mb-1.5" style={{ color: "var(--text-muted)" }}>COST RANKING (CHEAPEST → PRICIEST)</p>
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    {PROVIDERS_BY_COST.map((modelId, i) => {
                      const m = MODELS[modelId];
                      const s = getModelBadgeStyle(m.provider);
                      return (
                        <div
                          key={modelId}
                          className="flex items-center gap-2 px-3 py-1.5"
                          style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", background: i === 0 ? `${s.color}08` : "var(--navy-600)" }}
                        >
                          <span className="text-[10px] w-4 font-bold" style={{ color: i === 0 ? s.color : "var(--text-muted)" }}>
                            {i + 1}.
                          </span>
                          <ModelBadge modelId={modelId} size="xs" />
                          <span className="text-[10px] ml-auto" style={{ color: "var(--text-muted)" }}>
                            {formatCost(m)}/req
                          </span>
                          {i === 0 && (
                            <span className="text-[9px] font-bold" style={{ color: s.color }}>ACTIVE</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "keys" && (
            <div className="p-4 space-y-3">
              <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Without keys, all responses are mocked. Keys are stored in localStorage only.
              </p>
              {(["openai", "claude", "deepseek"] as const).map((provider) => {
                const s = getModelBadgeStyle(provider);
                const label = provider === "claude" ? "Anthropic (Claude)" : provider === "openai" ? "OpenAI" : "DeepSeek";
                const placeholder = provider === "openai" ? "sk-..." : provider === "claude" ? "sk-ant-..." : "sk-...";
                const docsUrl = provider === "openai"
                  ? "https://platform.openai.com/api-keys"
                  : provider === "claude"
                  ? "https://console.anthropic.com/settings/keys"
                  : "https://platform.deepseek.com/api_keys";
                return (
                  <div key={provider}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: s.color }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                        {label}
                      </label>
                      <a href={docsUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[9px] flex items-center gap-0.5 hover:underline"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Get key <ExternalLink size={8} />
                      </a>
                    </div>
                    <input
                      type="password"
                      placeholder={placeholder}
                      defaultValue={config.apiKeys[provider] ?? ""}
                      onBlur={(e) => saveKey(provider, e.target.value)}
                      className="w-full text-xs rounded-lg px-3 py-2 outline-none font-mono"
                      style={{
                        background: "var(--navy-600)",
                        border: `1px solid ${config.apiKeys[provider] ? s.border : "var(--border)"}`,
                        color: "var(--text-secondary)",
                      }}
                    />
                  </div>
                );
              })}
              <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                ⚠ Keys stored in browser localStorage. Use a backend proxy for production.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact attribution badge shown on AI outputs
export function ModelAttributionBadge({
  provider,
  modelId,
  isMock,
  latencyMs,
}: {
  provider: ModelProvider;
  modelId: ModelId;
  isMock?: boolean;
  latencyMs?: number;
}) {
  const s = getModelBadgeStyle(provider);
  const m = MODELS[modelId];
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      title={`${m.displayName} · ${isMock ? "mock response" : "live"} · ${latencyMs ?? 0}ms`}
    >
      <Cpu size={8} />
      {m.displayName}
      {isMock && " ·mock"}
    </span>
  );
}

// Need to import ModelProvider for the badge component
import type { ModelProvider } from "../lib/aiRouter";
