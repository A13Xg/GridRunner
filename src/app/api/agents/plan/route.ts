import { NextRequest, NextResponse } from "next/server";
import type { ProviderID } from "@/lib/llm/types";
import { generateText } from "@/lib/llm/service";
import { buildTaskGraphSystemPrompt } from "@/lib/agents/taskGraphPrompt";
import { validateTaskGraph, repairTaskGraph } from "@/lib/agents/taskGraphSchema";

export const runtime = "nodejs";

function extractJSON(text: string): string {
  // Strip markdown code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Locate outermost JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);

  return text.trim();
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { objective, provider, model } = body;

  if (!objective || typeof objective !== "string" || !objective.trim()) {
    return NextResponse.json({ error: "Missing required field: objective" }, { status: 400 });
  }

  if (!provider || typeof provider !== "string") {
    return NextResponse.json({ error: "Missing required field: provider" }, { status: 400 });
  }

  // Validate provider is a known ProviderID
  const knownProviders: ProviderID[] = ["openai", "anthropic", "gemini"];
  if (!knownProviders.includes(provider as ProviderID)) {
    return NextResponse.json(
      { error: `Unknown provider "${provider}". Must be one of: ${knownProviders.join(", ")}` },
      { status: 400 }
    );
  }

  const systemPrompt = buildTaskGraphSystemPrompt();
  const trimmedObjective = (objective as string).trim();

  // ── Step 1: LLM call ────────────────────────────────────────────────────────
  let rawText: string;
  try {
    const result = await generateText(provider as ProviderID, trimmedObjective, {
      model: typeof model === "string" ? model : undefined,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.3,
    });
    rawText = result.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agents/plan] LLM call failed:", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }

  // ── Step 2: Parse JSON ──────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    const jsonStr = extractJSON(rawText);
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error(
      "[agents/plan] JSON parse failed:",
      parseErr instanceof Error ? parseErr.message : parseErr,
      "\nRaw (first 500 chars):",
      rawText.slice(0, 500)
    );
    return NextResponse.json(
      { error: "Provider returned a non-JSON response", detail: "parse_failed" },
      { status: 422 }
    );
  }

  // ── Step 3: Validate ────────────────────────────────────────────────────────
  const firstPass = validateTaskGraph(parsed);
  if (firstPass.valid) {
    return NextResponse.json(firstPass.data);
  }

  // ── Step 4: Repair pass ─────────────────────────────────────────────────────
  console.warn(
    "[agents/plan] Validation failed, attempting structural repair. Errors:",
    firstPass.errors
  );
  const repaired = repairTaskGraph(parsed, trimmedObjective);
  const secondPass = validateTaskGraph(repaired);

  if (secondPass.valid) {
    console.log("[agents/plan] Repair succeeded");
    return NextResponse.json({ ...secondPass.data, _repaired: true });
  }

  // ── Step 5: Repair failed — let client fall back ────────────────────────────
  console.error("[agents/plan] Repair failed. Remaining errors:", secondPass.errors);
  return NextResponse.json(
    {
      error: "Task graph validation failed after repair attempt",
      details: secondPass.errors,
    },
    { status: 422 }
  );
}
