import type { LLMProvider, ProviderID } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { GeminiProvider } from "./providers/gemini";

function requireEnv(key: string): string | undefined {
  return process.env[key];
}

export function buildRegistry(): Map<ProviderID, LLMProvider> {
  const registry = new Map<ProviderID, LLMProvider>();

  const openaiKey = requireEnv("OPENAI_API_KEY");
  if (openaiKey) {
    registry.set("openai", new OpenAIProvider(openaiKey));
  }

  const anthropicKey = requireEnv("ANTHROPIC_API_KEY");
  if (anthropicKey) {
    registry.set("anthropic", new AnthropicProvider(anthropicKey));
  }

  const geminiKey = requireEnv("GOOGLE_GEMINI_API_KEY");
  if (geminiKey) {
    registry.set("gemini", new GeminiProvider(geminiKey));
  }

  return registry;
}

let _registry: Map<ProviderID, LLMProvider> | null = null;

export function getRegistry(): Map<ProviderID, LLMProvider> {
  if (!_registry) _registry = buildRegistry();
  return _registry;
}

export function getProvider(id: ProviderID): LLMProvider {
  const registry = getRegistry();
  const provider = registry.get(id);
  if (!provider) {
    throw new Error(`Provider "${id}" is not configured. Set the corresponding API key environment variable.`);
  }
  return provider;
}

export function getAvailableProviderIds(): ProviderID[] {
  return Array.from(getRegistry().keys());
}
