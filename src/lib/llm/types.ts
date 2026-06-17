export type ProviderID = "openai" | "anthropic" | "gemini";

export interface Model {
  id: string;
  name: string;
  provider: ProviderID;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsThinking: boolean;
  inputCostPer1M: number;
  outputCostPer1M: number;
}

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  text: string;
  model: string;
  provider: ProviderID;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export interface ProviderHealth {
  provider: ProviderID;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: number;
}

export interface LLMProvider {
  readonly id: ProviderID;
  readonly name: string;
  getModels(): Model[];
  generateText(prompt: string, options?: GenerationOptions): Promise<LLMResponse>;
  streamText(prompt: string, options?: GenerationOptions): AsyncIterable<string>;
  checkHealth(): Promise<ProviderHealth>;
}

export type LLMLogLevel = "info" | "warn" | "error";

export interface LLMLogEntry {
  level: LLMLogLevel;
  event: string;
  provider?: ProviderID;
  model?: string;
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}
