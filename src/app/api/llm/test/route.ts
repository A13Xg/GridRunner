import { NextRequest, NextResponse } from "next/server";
import type { ProviderID, GenerationOptions } from "@/lib/llm/types";
import { generateText, checkAllProviderHealth, getConfiguredProviders } from "@/lib/llm/service";
import { getModelsByProvider } from "@/lib/llm/model-catalog";

export const runtime = "nodejs";

interface TestRequest {
  action: "generate" | "health" | "catalog";
  provider?: ProviderID;
  model?: string;
  prompt?: string;
  options?: GenerationOptions;
}

export async function POST(req: NextRequest) {
  let body: TestRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, provider, prompt, options } = body;

  if (!action) {
    return NextResponse.json({ error: "Missing required field: action" }, { status: 400 });
  }

  try {
    if (action === "catalog") {
      const providers = getConfiguredProviders();
      const catalog = Object.fromEntries(
        providers.map((id) => [id, getModelsByProvider(id)])
      );
      return NextResponse.json({ providers, catalog });
    }

    if (action === "health") {
      const results = await checkAllProviderHealth();
      return NextResponse.json({ health: results });
    }

    if (action === "generate") {
      if (!provider) {
        return NextResponse.json({ error: "Missing required field: provider" }, { status: 400 });
      }
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return NextResponse.json({ error: "Missing required field: prompt" }, { status: 400 });
      }

      const mergedOptions: GenerationOptions = { ...options };
      if (body.model) mergedOptions.model = body.model;

      const result = await generateText(provider, prompt.trim(), mergedOptions);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = classifyErrorStatus(message);
    return NextResponse.json({ error: message }, { status });
  }
}

function classifyErrorStatus(message: string): number {
  const lower = message.toLowerCase();
  if (lower.includes("not configured") || lower.includes("api key")) return 503;
  if (lower.includes("authentication") || lower.includes("unauthorized") || lower.includes("invalid api key")) return 401;
  if (lower.includes("rate limit") || lower.includes("too many requests")) return 429;
  if (lower.includes("timeout") || lower.includes("network")) return 504;
  return 500;
}
