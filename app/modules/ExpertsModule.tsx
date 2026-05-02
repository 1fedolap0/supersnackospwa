"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import type { ExpertConversation, ExpertMessage } from "../lib/types";
import { useExpertConversations } from "../store/useStore";
import { expertPersonas, getExpertResponse } from "../lib/mockAI";

const EXPERTS = Object.entries(expertPersonas).map(([id, p]) => ({ id, ...p }));

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

interface ChatBubbleProps {
  message: ExpertMessage;
  expertColor: string;
  expertAvatar: string;
}

function ChatBubble({ message, expertColor, expertAvatar }: ChatBubbleProps) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
          style={{ background: `${expertColor}20`, border: `1px solid ${expertColor}40` }}
        >
          {expertAvatar}
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={
            isUser
              ? { background: "var(--orange)", color: "white", borderBottomRightRadius: "4px" }
              : { background: "var(--navy-600)", color: "var(--text-secondary)", border: "1px solid var(--border-light)", borderBottomLeftRadius: "4px" }
          }
        >
          {message.content}
        </div>
        <span className="text-[10px] px-1" style={{ color: "var(--text-muted)" }}>{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

function ExpertChat({ expertId, onClear }: { expertId: string; onClear: () => void }) {
  const [conversations, setConversations] = useExpertConversations();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const expert = expertPersonas[expertId];

  const convo = conversations.find((c) => c.expertId === expertId);
  const messages = convo?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setThinking(true);

    const userMsg: ExpertMessage = { role: "user", content: text, timestamp: new Date().toISOString() };

    setConversations((prev) => {
      const existing = prev.find((c) => c.expertId === expertId);
      if (existing) {
        return prev.map((c) =>
          c.expertId === expertId ? { ...c, messages: [...c.messages, userMsg] } : c
        );
      }
      return [...prev, { expertId, messages: [userMsg] }];
    });

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const reply: ExpertMessage = {
      role: "expert",
      content: getExpertResponse(expertId, text),
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.expertId === expertId ? { ...c, messages: [...c.messages, reply] } : c
      )
    );
    setThinking(false);
  };

  const clearConvo = () => {
    setConversations((prev) => prev.filter((c) => c.expertId !== expertId));
    onClear();
  };

  const STARTER_PROMPTS = [
    "What should I prioritise this week?",
    "How should I structure the CEO briefing?",
    "What are the biggest risks I should flag?",
    "How do I handle a difficult stakeholder situation?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${expert.color}15`, border: `1px solid ${expert.color}30` }}
          >
            {expert.avatar}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{expert.name}</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{expert.role}</p>
          </div>
        </div>
        <button
          onClick={clearConvo}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <Trash2 size={11} />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center pt-8 pb-4 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: `${expert.color}15`, border: `1px solid ${expert.color}30` }}
            >
              {expert.avatar}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Ask {expert.name} anything
              </p>
              <p className="text-xs leading-relaxed max-w-xs" style={{ color: "var(--text-muted)" }}>
                Get expert advice from the {expert.role}&apos;s perspective.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); }}
                  className="text-left text-xs px-3 py-2.5 rounded-lg border transition-all hover:border-orange-500/30 hover:bg-orange-500/5"
                  style={{ background: "var(--navy-700)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            message={msg}
            expertColor={expert.color}
            expertAvatar={expert.avatar}
          />
        ))}

        {thinking && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
              style={{ background: `${expert.color}20`, border: `1px solid ${expert.color}40` }}
            >
              {expert.avatar}
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5" style={{ background: "var(--navy-600)", border: "1px solid var(--border-light)" }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: expert.color, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={`Ask ${expert.name} for advice...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="flex-1 text-sm rounded-xl px-4 py-3 outline-none transition-all"
            style={{
              background: "var(--navy-600)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || thinking}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--orange)", color: "white" }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExpertsModule() {
  const [activeExpert, setActiveExpert] = useState<string>("ceo");
  const [conversations] = useExpertConversations();

  return (
    <div className="flex h-full">
      {/* Expert list */}
      <div
        className="w-16 md:w-56 shrink-0 border-r flex flex-col"
        style={{ background: "var(--navy-800)", borderColor: "var(--border)" }}
      >
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="hidden md:block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>AI Experts</p>
          <div className="md:hidden flex justify-center">
            <Sparkles size={16} style={{ color: "var(--orange)" }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {EXPERTS.map((expert) => {
            const isActive = activeExpert === expert.id;
            const hasMessages = conversations.find((c) => c.expertId === expert.id)?.messages.length ?? 0;
            return (
              <button
                key={expert.id}
                onClick={() => setActiveExpert(expert.id)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all relative"
                style={{
                  background: isActive ? `${expert.color}10` : "transparent",
                  color: isActive ? expert.color : "var(--text-secondary)",
                }}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: expert.color }} />
                )}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `${expert.color}15`, border: `1px solid ${expert.color}30` }}
                >
                  {expert.avatar}
                </div>
                <div className="hidden md:block text-left flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{expert.name}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{expert.role.replace("Chief ", "").replace(" Officer", "")}</p>
                </div>
                {hasMessages > 0 && (
                  <span
                    className="hidden md:flex text-[9px] font-bold w-4 h-4 rounded-full items-center justify-center shrink-0"
                    style={{ background: `${expert.color}30`, color: expert.color }}
                  >
                    {hasMessages > 9 ? "9+" : hasMessages}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <ExpertChat key={activeExpert} expertId={activeExpert} onClear={() => {}} />
      </div>
    </div>
  );
}
