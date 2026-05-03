// ─── Types ────────────────────────────────────────────────────────────────────

export type ModelProvider = "openai" | "claude" | "deepseek";

export type ModelId =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "claude-sonnet-4-6"
  | "deepseek-chat"
  | "deepseek-reasoner";

export type TaskType =
  | "email-summarization"
  | "action-detection"
  | "reply-generation"
  | "delegation-draft"
  | "brief-generation"
  | "expert-advice"
  | "structured-output";

export type RouterMode = "smart" | "manual" | "cost-saver";

export interface ModelConfig {
  id: ModelId;
  provider: ModelProvider;
  displayName: string;
  contextWindow: number;
  costPerMTokIn: number;  // USD per million input tokens
  costPerMTokOut: number; // USD per million output tokens
  color: string;
  strengths: string[];
}

export interface AIResponse {
  content: string;
  model: ModelId;
  provider: ModelProvider;
  taskType: TaskType;
  latencyMs: number;
  isMock: boolean;
}

export interface RouterConfig {
  mode: RouterMode;
  manualModel: ModelId;
  apiKeys: Partial<Record<ModelProvider, string>>;
}

// ─── Model registry ───────────────────────────────────────────────────────────

export const MODELS: Record<ModelId, ModelConfig> = {
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
    contextWindow: 128000,
    costPerMTokIn: 2.5,
    costPerMTokOut: 10.0,
    color: "#10b981",
    strengths: ["structured-output", "function-calling", "reasoning"],
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o Mini",
    contextWindow: 128000,
    costPerMTokIn: 0.15,
    costPerMTokOut: 0.6,
    color: "#34d399",
    strengths: ["cost-efficient", "fast", "structured-output"],
  },
  "claude-sonnet-4-6": {
    id: "claude-sonnet-4-6",
    provider: "claude",
    displayName: "Claude Sonnet",
    contextWindow: 200000,
    costPerMTokIn: 3.0,
    costPerMTokOut: 15.0,
    color: "#f97316",
    strengths: ["long-context", "nuanced-writing", "executive-briefs", "reasoning"],
  },
  "deepseek-chat": {
    id: "deepseek-chat",
    provider: "deepseek",
    displayName: "DeepSeek Chat",
    contextWindow: 64000,
    costPerMTokIn: 0.014,
    costPerMTokOut: 0.28,
    color: "#3b82f6",
    strengths: ["cost-efficient", "summarization", "extraction"],
  },
  "deepseek-reasoner": {
    id: "deepseek-reasoner",
    provider: "deepseek",
    displayName: "DeepSeek R1",
    contextWindow: 64000,
    costPerMTokIn: 0.55,
    costPerMTokOut: 2.19,
    color: "#60a5fa",
    strengths: ["reasoning", "analysis", "structured-output"],
  },
};

export const PROVIDERS_BY_COST: ModelId[] = [
  "deepseek-chat",
  "gpt-4o-mini",
  "deepseek-reasoner",
  "claude-sonnet-4-6",
  "gpt-4o",
];

// ─── Smart routing table ──────────────────────────────────────────────────────

const SMART_ROUTE: Record<TaskType, ModelId> = {
  "email-summarization": "deepseek-chat",       // cheap, fast extraction
  "action-detection":    "deepseek-chat",       // cheap classification
  "reply-generation":    "claude-sonnet-4-6",   // nuanced writing
  "delegation-draft":    "claude-sonnet-4-6",   // professional tone
  "brief-generation":    "claude-sonnet-4-6",   // long-context structured output
  "expert-advice":       "claude-sonnet-4-6",   // nuanced persona reasoning
  "structured-output":   "gpt-4o",              // reliable JSON / structure
};

export function resolveModel(taskType: TaskType, config: RouterConfig): ModelId {
  if (config.mode === "manual") return config.manualModel;
  if (config.mode === "cost-saver") return "deepseek-chat";
  return SMART_ROUTE[taskType];
}

// ─── Real API callers (swap mock → real by setting env vars) ─────────────────

async function callOpenAI(model: ModelId, prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

async function callClaude(model: ModelId, prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { content: { text: string }[] };
  return data.content[0]?.text ?? "";
}

// DeepSeek uses the OpenAI-compatible API
async function callDeepSeek(model: ModelId, prompt: string, apiKey: string): Promise<string> {
  const modelName = model === "deepseek-reasoner" ? "deepseek-reasoner" : "deepseek-chat";
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// ─── Mock responses ───────────────────────────────────────────────────────────

function mockResponse(taskType: TaskType, prompt: string, model: ModelId): string {
  const short = prompt.slice(0, 120);

  const templates: Record<TaskType, (p: string) => string> = {
    "email-summarization": (p) =>
      `Key points extracted: The message requests attention on ${p.includes("board") ? "board-related matters" : p.includes("budget") ? "financial/budget items" : "the highlighted matter"}. Action may be required before end of week.`,

    "action-detection": () => "Reply",

    "reply-generation": (p) =>
      `Thank you for your message. I've reviewed the details carefully and will coordinate the necessary next steps. I'll follow up with a confirmed plan by end of day.\n\nBest regards,\n[Chief of Staff]`,

    "delegation-draft": (p) =>
      `Hi [Colleague],\n\nPlease find the below for your action. Context: ${p.slice(0, 80)}...\n\nKindly action by [DATE] and revert with an update.\n\nBest,\n[Chief of Staff]`,

    "brief-generation": (p) => {
      const lines = p.split("\n").filter((l) => l.trim()).slice(0, 6);
      return [
        "## Key Updates",
        ...lines.slice(0, 3).map((l) => `• ${l.replace(/^[-•*]\s*/, "").trim()}`),
        "\n## Decisions Required",
        "• Review and confirm prioritisation of items above",
        "• Assign owners to any unowned action items",
        "\n## Risks",
        "• Time-sensitive items require same-day response",
        "\n## Next Steps",
        "• Distribute this brief to relevant stakeholders",
        "• Schedule decision-making session within 24 hours",
      ].join("\n");
    },

    "expert-advice": (p) =>
      `From my perspective, the key consideration here is strategic alignment and execution clarity. ${p.includes("risk") ? "On the risk dimension: quantify it, assign ownership, and set a clear review cadence." : "The priority is to ensure all stakeholders have clarity on the desired outcome before committing resources."} I'd recommend starting with a clear problem statement and working backwards to the solution. What specific outcome are you optimising for?`,

    "structured-output": (p) =>
      JSON.stringify({
        summary: p.slice(0, 80),
        action: "Reply",
        priority: "high",
        tags: ["auto-generated"],
      }, null, 2),
  };

  return `[${MODELS[model].displayName}] ${templates[taskType]?.(short) ?? "Response generated."}`;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

const API_KEYS: Partial<Record<ModelProvider, string>> = {
  openai:   process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  claude:   process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
  deepseek: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
};

export async function generateAIResponse(
  taskType: TaskType,
  prompt: string,
  config: RouterConfig
): Promise<AIResponse> {
  const start = Date.now();
  const modelId = resolveModel(taskType, config);
  const model = MODELS[modelId];
  const apiKey = config.apiKeys[model.provider] ?? API_KEYS[model.provider] ?? "";

  let content: string;
  let isMock = false;

  if (apiKey) {
    try {
      if (model.provider === "openai") content = await callOpenAI(modelId, prompt, apiKey);
      else if (model.provider === "claude") content = await callClaude(modelId, prompt, apiKey);
      else content = await callDeepSeek(modelId, prompt, apiKey);
    } catch (err) {
      // Fall back to mock on API failure
      console.warn(`[AI Router] ${model.provider} failed, using mock:`, err);
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
      content = mockResponse(taskType, prompt, modelId);
      isMock = true;
    }
  } else {
    // No API key — use mock with realistic latency
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
    content = mockResponse(taskType, prompt, modelId);
    isMock = true;
  }

  return {
    content,
    model: modelId,
    provider: model.provider,
    taskType,
    latencyMs: Date.now() - start,
    isMock,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getModelBadgeStyle(provider: ModelProvider) {
  const styles: Record<ModelProvider, { bg: string; color: string; border: string }> = {
    openai:   { bg: "rgba(16,185,129,0.1)",  color: "#10b981", border: "rgba(16,185,129,0.25)" },
    claude:   { bg: "rgba(249,115,22,0.1)",  color: "#f97316", border: "rgba(249,115,22,0.25)" },
    deepseek: { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  };
  return styles[provider];
}

export function formatCost(model: ModelConfig, inputTokens = 500, outputTokens = 300): string {
  const cost = (model.costPerMTokIn * inputTokens + model.costPerMTokOut * outputTokens) / 1_000_000;
  if (cost < 0.0001) return "<$0.0001";
  return `$${cost.toFixed(4)}`;
}
