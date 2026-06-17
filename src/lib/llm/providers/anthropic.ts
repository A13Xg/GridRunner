import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, Model, GenerationOptions, LLMResponse, ProviderHealth } from "../types";
import { getModelsByProvider, DEFAULT_MODELS } from "../model-catalog";

export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic" as const;
  readonly name = "Anthropic";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  getModels(): Model[] {
    return getModelsByProvider("anthropic");
  }

  async generateText(prompt: string, options: GenerationOptions = {}): Promise<LLMResponse> {
    const model = options.model ?? DEFAULT_MODELS.anthropic;
    const start = Date.now();

    const response = await this.client.messages.create({
      model,
      max_tokens: options.maxTokens ?? 16000,
      thinking: { type: "adaptive" },
      ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
      messages: [{ role: "user", content: prompt }],
    });

    const textBlocks = response.content.filter((b) => b.type === "text");
    const text = textBlocks.map((b) => (b as { type: "text"; text: string }).text).join("");

    return {
      text,
      model,
      provider: "anthropic",
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      durationMs: Date.now() - start,
    };
  }

  async *streamText(prompt: string, options: GenerationOptions = {}): AsyncIterable<string> {
    const model = options.model ?? DEFAULT_MODELS.anthropic;

    const stream = this.client.messages.stream({
      model,
      max_tokens: options.maxTokens ?? 16000,
      ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.models.list();
      return {
        provider: "anthropic",
        healthy: true,
        latencyMs: Date.now() - start,
        checkedAt: Date.now(),
      };
    } catch (err) {
      return {
        provider: "anthropic",
        healthy: false,
        error: err instanceof Error ? err.message : String(err),
        checkedAt: Date.now(),
      };
    }
  }
}
