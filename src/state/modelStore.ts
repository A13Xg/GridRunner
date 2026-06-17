import { create } from "zustand";
import type { Model } from "@/lib/llm/types";
import { MODEL_CATALOG, DEFAULT_MODELS } from "@/lib/llm/model-catalog";

interface ModelState {
  selectedModelId: string;
  availableModels: Model[];
  setSelectedModel: (modelId: string) => void;
  setModelsForProvider: (providerId: string) => void;
}

export const useModelStore = create<ModelState>()((set) => ({
  selectedModelId: DEFAULT_MODELS.anthropic,
  availableModels: MODEL_CATALOG.filter((m) => m.provider === "anthropic"),

  setSelectedModel: (modelId) => set({ selectedModelId: modelId }),

  setModelsForProvider: (providerId) => {
    const models = MODEL_CATALOG.filter((m) => m.provider === providerId);
    const defaultId = DEFAULT_MODELS[providerId] ?? models[0]?.id ?? "";
    set({ availableModels: models, selectedModelId: defaultId });
  },
}));
