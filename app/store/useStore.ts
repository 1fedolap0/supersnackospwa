"use client";

import { useState, useEffect, useCallback } from "react";
import type { Email, Trip, Task, Brief, ExpertConversation } from "../lib/types";
import type { RouterConfig, RouterMode, ModelId } from "../lib/aiRouter";
import { mockEmails, mockTrips, mockTasks, mockBrief } from "../lib/mockData";

function useLocalStorage<T>(key: string, initial: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setState(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, [key]);

  const set = useCallback(
    (val: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
        if (hydrated) {
          try {
            localStorage.setItem(key, JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    },
    [key, hydrated]
  );

  return [state, set];
}

export function useEmails() {
  return useLocalStorage<Email[]>("ssos_emails", mockEmails);
}

// Persists VIP email addresses across sessions and data sources
export function useVIPAddresses() {
  return useLocalStorage<string[]>(
    "ssos_vip_addresses",
    mockEmails.filter((e) => e.isVIP).map((e) => e.from.toLowerCase())
  );
}

export function useTrips() {
  return useLocalStorage<Trip[]>("ssos_trips", mockTrips);
}

export function useTasks() {
  return useLocalStorage<Task[]>("ssos_tasks", mockTasks);
}

export function useBriefs() {
  return useLocalStorage<Brief[]>("ssos_briefs", [mockBrief]);
}

export function useExpertConversations() {
  return useLocalStorage<ExpertConversation[]>("ssos_expert_convos", []);
}

export function useActiveModule() {
  const [module, setModule] = useState<string>("inbox");
  return [module, setModule] as const;
}

const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  mode: "smart",
  manualModel: "claude-sonnet-4-6",
  apiKeys: {},
};

export function useRouterConfig() {
  return useLocalStorage<RouterConfig>("ssos_router_config", DEFAULT_ROUTER_CONFIG);
}

// Convenience hook — read-only resolved mode + model label for display
export function useRouterMode(): [RouterMode, (mode: RouterMode) => void] {
  const [config, setConfig] = useRouterConfig();
  const setMode = useCallback(
    (mode: RouterMode) => setConfig((c) => ({ ...c, mode })),
    [setConfig]
  );
  return [config.mode, setMode];
}

export function useManualModel(): [ModelId, (m: ModelId) => void] {
  const [config, setConfig] = useRouterConfig();
  const setModel = useCallback(
    (manualModel: ModelId) => setConfig((c) => ({ ...c, manualModel })),
    [setConfig]
  );
  return [config.manualModel, setModel];
}
