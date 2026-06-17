import { create } from "zustand";
import type { ProviderID, ProviderHealth } from "@/lib/llm/types";

interface ProviderState {
  selectedProvider: ProviderID;
  health: Record<ProviderID, ProviderHealth | null>;
  configuredProviders: ProviderID[];
  setSelectedProvider: (id: ProviderID) => void;
  setHealth: (health: ProviderHealth) => void;
  setConfiguredProviders: (ids: ProviderID[]) => void;
}

export const useProviderStore = create<ProviderState>()((set) => ({
  selectedProvider: "anthropic",
  health: { openai: null, anthropic: null, gemini: null },
  configuredProviders: [],

  setSelectedProvider: (id) => set({ selectedProvider: id }),

  setHealth: (health) =>
    set((s) => ({
      health: { ...s.health, [health.provider]: health },
    })),

  setConfiguredProviders: (ids) => set({ configuredProviders: ids }),
}));
