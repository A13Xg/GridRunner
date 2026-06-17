import OpenAI from "openai";
import type { LLMProvider, Model, GenerationOptions, LLMResponse, ProviderHealth } from "../types";
import { getModelsByProvider, DEFAULT_MODELS } from "../model-catalog";

export class OpenAIProvider implements LLMProvider {
  readonly id = "openai" as const;
  readonly name = "OpenAI";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  getModels(): Model[] {
    return getModelsByProvider("openai");
  }

  async generateText(prompt: string, options: GenerationOptions = {}): Promise<LLMResponse> {
    const model = options.model ?? DEFAULT_MODELS.openai;
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      messages: [
        ...(options.systemPrompt
          ? [{ role: "system" as const, content: options.systemPrompt }]
          : []),
        { role: "user" as const, content: prompt },
      ],
    });

    const choice = response.choices[0];
    return {
      text: choice.message.content ?? "",
      model,
      provider: "openai",
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      durationMs: Date.now() - start,
    };
  }

  async *streamText(prompt: string, options: GenerationOptions = {}): AsyncIterable<string> {
    const model = options.model ?? DEFAULT_MODELS.openai;

    const stream = await this.client.chat.completions.create({
      model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
      messages: [
        ...(options.systemPrompt
          ? [{ role: "system" as const, content: options.systemPrompt }]
          : []),
        { role: "user" as const, content: prompt },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.models.list();
      return {
        provider: "openai",
        healthy: true,
        latencyMs: Date.now() - start,
        checkedAt: Date.now(),
      };
    } catch (err) {
      return {
        provider: "openai",
        healthy: false,
        error: err instanceof Error ? err.message : String(err),
        checkedAt: Date.now(),
      };
    }
  }
}
