import type { Model } from "./types";

export const MODEL_CATALOG: Model[] = [
  // ── OpenAI ──────────────────────────────────────────────────────────────
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsThinking: false,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsThinking: false,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
  },
  {
    id: "o3",
    name: "o3",
    provider: "openai",
    contextWindow: 200_000,
    supportsStreaming: true,
    supportsThinking: true,
    inputCostPer1M: 10,
    outputCostPer1M: 40,
  },
  {
    id: "o4-mini",
    name: "o4-mini",
    provider: "openai",
    contextWindow: 200_000,
    supportsStreaming: true,
    supportsThinking: true,
    inputCostPer1M: 1.1,
    outputCostPer1M: 4.4,
  },

  // ── Anthropic ────────────────────────────────────────────────────────────
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    contextWindow: 1_000_000,
    supportsStreaming: true,
    supportsThinking: true,
    inputCostPer1M: 5,
    outputCostPer1M: 25,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    contextWindow: 1_000_000,
    supportsStreaming: true,
    supportsThinking: true,
    inputCostPer1M: 3,
    outputCostPer1M: 15,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    contextWindow: 200_000,
    supportsStreaming: true,
    supportsThinking: false,
    inputCostPer1M: 1,
    outputCostPer1M: 5,
  },

  // ── Google Gemini ────────────────────────────────────────────────────────
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    contextWindow: 1_000_000,
    supportsStreaming: true,
    supportsThinking: false,
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.4,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    contextWindow: 1_000_000,
    supportsStreaming: true,
    supportsThinking: true,
    inputCostPer1M: 0.3,
    outputCostPer1M: 2.5,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    contextWindow: 2_000_000,
    supportsStreaming: true,
    supportsThinking: true,
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
  },
];

export function getModelsByProvider(providerId: string): Model[] {
  return MODEL_CATALOG.filter((m) => m.provider === providerId);
}

export function getModel(modelId: string): Model | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}

export const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-opus-4-8",
  gemini: "gemini-2.5-flash",
};
