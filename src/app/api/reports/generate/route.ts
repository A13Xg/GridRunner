import { NextRequest, NextResponse } from "next/server";
import type { ProviderID } from "@/lib/llm/types";
import { generateText } from "@/lib/llm/service";
import { buildReportSystemPrompt, buildReportUserMessage } from "@/lib/reports/reportPrompt";
import {
  validateReport,
  repairReport,
  generateFallbackReport,
} from "@/lib/reports/reportSchema";
import type { Task } from "@/types";
import type { WorkspaceArtifact } from "@/lib/artifacts/types";

export const runtime = "nodejs";

const KNOWN_PROVIDERS: readonly ProviderID[] = ["openai", "anthropic", "gemini"];

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
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

  const { objective, operationName, tasks, artifacts, provider, model } = body;

  if (!objective || typeof objective !== "string")
    return NextResponse.json({ error: "Missing required field: objective" }, { status: 400 });
  if (!operationName || typeof operationName !== "string")
    return NextResponse.json({ error: "Missing required field: operationName" }, { status: 400 });
  if (!Array.isArray(tasks))
    return NextResponse.json({ error: "tasks must be an array" }, { status: 400 });
  if (!Array.isArray(artifacts))
    return NextResponse.json({ error: "artifacts must be an array" }, { status: 400 });
  if (!provider || typeof provider !== "string")
    return NextResponse.json({ error: "Missing required field: provider" }, { status: 400 });
  if (!(KNOWN_PROVIDERS as readonly string[]).includes(provider))
    return NextResponse.json({ error: `Unknown provider "${provider}"` }, { status: 400 });

  const taskList = tasks as Task[];
  const artifactList = artifacts as WorkspaceArtifact[];
  const opName = (operationName as string).trim() || "Operation";

  const systemPrompt = buildReportSystemPrompt();
  const userMessage = buildReportUserMessage({
    objective: (objective as string).trim(),
    operationName: opName,
    tasks: taskList,
    artifacts: artifactList,
  });

  // ── LLM call ─────────────────────────────────────────────────────────────────
  let rawText: string;
  try {
    const result = await generateText(provider as ProviderID, userMessage, {
      model: typeof model === "string" ? model : undefined,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.3,
    });
    rawText = result.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reports/generate] LLM call failed:", message);
    return NextResponse.json(
      generateFallbackReport(objective as string, opName, taskList, artifactList)
    );
  }

  // ── JSON parse ───────────────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJSON(rawText));
  } catch {
    console.error("[reports/generate] JSON parse failed. Raw:", rawText.slice(0, 400));
    return NextResponse.json(
      generateFallbackReport(objective as string, opName, taskList, artifactList)
    );
  }

  // ── Validation ────────────────────────────────────────────────────────────────
  const firstPass = validateReport(parsed);
  if (firstPass.valid) return NextResponse.json(firstPass.data);

  // ── Repair ────────────────────────────────────────────────────────────────────
  console.warn("[reports/generate] Validation failed, repairing:", firstPass.errors);
  try {
    const repaired = repairReport(parsed, opName);
    const secondPass = validateReport(repaired);
    if (secondPass.valid) {
      console.log("[reports/generate] Repair succeeded");
      return NextResponse.json(secondPass.data);
    }
  } catch {
    // fall through to deterministic fallback
  }

  console.error("[reports/generate] Repair failed, using deterministic fallback");
  return NextResponse.json(
    generateFallbackReport(objective as string, opName, taskList, artifactList)
  );
}
