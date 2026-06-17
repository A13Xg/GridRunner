import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider, Model, GenerationOptions, LLMResponse, ProviderHealth } from "../types";
import { getModelsByProvider, DEFAULT_MODELS } from "../model-catalog";

export class GeminiProvider implements LLMProvider {
  readonly id = "gemini" as const;
  readonly name = "Google Gemini";
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  getModels(): Model[] {
    return getModelsByProvider("gemini");
  }

  async generateText(prompt: string, options: GenerationOptions = {}): Promise<LLMResponse> {
    const modelId = options.model ?? DEFAULT_MODELS.gemini;
    const start = Date.now();

    const genModel = this.client.getGenerativeModel({
      model: modelId,
      ...(options.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 8192,
        temperature: options.temperature ?? 0.7,
      },
    });

    const result = await genModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      text,
      model: modelId,
      provider: "gemini",
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      durationMs: Date.now() - start,
    };
  }

  async *streamText(prompt: string, options: GenerationOptions = {}): AsyncIterable<string> {
    const modelId = options.model ?? DEFAULT_MODELS.gemini;

    const genModel = this.client.getGenerativeModel({
      model: modelId,
      ...(options.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 8192,
        temperature: options.temperature ?? 0.7,
      },
    });

    const result = await genModel.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async checkHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const model = this.client.getGenerativeModel({ model: "gemini-2.0-flash" });
      await model.generateContent("ping");
      return {
        provider: "gemini",
        healthy: true,
        latencyMs: Date.now() - start,
        checkedAt: Date.now(),
      };
    } catch (err) {
      return {
        provider: "gemini",
        healthy: false,
        error: err instanceof Error ? err.message : String(err),
        checkedAt: Date.now(),
      };
    }
  }
}
