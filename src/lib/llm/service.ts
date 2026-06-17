import type { ProviderID, GenerationOptions, LLMResponse, ProviderHealth, LLMLogEntry } from "./types";
import { getProvider, getAvailableProviderIds } from "./registry";

function log(entry: Omit<LLMLogEntry, "timestamp">): void {
  const full: LLMLogEntry = { ...entry, timestamp: Date.now() };
  const prefix = `[LLM:${full.level.toUpperCase()}] ${full.event}`;
  const meta = Object.entries({
    provider: full.provider,
    model: full.model,
    durationMs: full.durationMs,
    error: full.error,
    ...full.metadata,
  })
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(" ");

  if (full.level === "error") {
    console.error(prefix, meta);
  } else if (full.level === "warn") {
    console.warn(prefix, meta);
  } else {
    console.log(prefix, meta);
  }
}

export async function generateText(
  providerId: ProviderID,
  prompt: string,
  options: GenerationOptions = {}
): Promise<LLMResponse> {
  log({ level: "info", event: "generate.start", provider: providerId, model: options.model });

  try {
    const provider = getProvider(providerId);
    const result = await provider.generateText(prompt, options);

    log({
      level: "info",
      event: "generate.complete",
      provider: providerId,
      model: result.model,
      durationMs: result.durationMs,
      metadata: { inputTokens: result.inputTokens, outputTokens: result.outputTokens },
    });

    return result;
  } catch (err) {
    const error = normalizeError(err);
    log({ level: "error", event: "generate.error", provider: providerId, model: options.model, error: error.message });
    throw error;
  }
}

export async function checkProviderHealth(providerId: ProviderID): Promise<ProviderHealth> {
  log({ level: "info", event: "health.check", provider: providerId });
  try {
    const provider = getProvider(providerId);
    const health = await provider.checkHealth();
    log({
      level: health.healthy ? "info" : "warn",
      event: "health.result",
      provider: providerId,
      durationMs: health.latencyMs,
      error: health.error,
    });
    return health;
  } catch (err) {
    const error = normalizeError(err);
    log({ level: "error", event: "health.error", provider: providerId, error: error.message });
    return {
      provider: providerId,
      healthy: false,
      error: error.message,
      checkedAt: Date.now(),
    };
  }
}

export async function checkAllProviderHealth(): Promise<ProviderHealth[]> {
  const ids = getAvailableProviderIds();
  return Promise.all(ids.map((id) => checkProviderHealth(id)));
}

export function getConfiguredProviders(): ProviderID[] {
  return getAvailableProviderIds();
}

function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}
