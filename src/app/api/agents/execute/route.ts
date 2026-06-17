import { NextRequest, NextResponse } from "next/server";
import type { ProviderID } from "@/lib/llm/types";
import { generateText } from "@/lib/llm/service";
import {
  getExecutionSystemPrompt,
  buildExecutionUserMessage,
} from "@/lib/agents/executionPrompt";
import {
  validateExecutionResult,
  repairExecutionResult,
  createFallbackResult,
} from "@/lib/agents/executionSchema";
import { getAgentRole } from "@/lib/agents/agentRegistry";
import type { Task } from "@/types";
import type { AgentExecutionResult } from "@/lib/agents/types";

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

  const { task, objective, provider, model, priorOutputs } = body;

  if (!task || typeof task !== "object" || Array.isArray(task)) {
    return NextResponse.json({ error: "Missing required field: task" }, { status: 400 });
  }
  if (!objective || typeof objective !== "string") {
    return NextResponse.json({ error: "Missing required field: objective" }, { status: 400 });
  }
  if (!provider || typeof provider !== "string") {
    return NextResponse.json({ error: "Missing required field: provider" }, { status: 400 });
  }
  if (!(KNOWN_PROVIDERS as readonly string[]).includes(provider)) {
    return NextResponse.json({ error: `Unknown provider "${provider}"` }, { status: 400 });
  }

  const taskObj = task as Task;
  const agentId = taskObj.assignedAgentId ?? "planner";
  const agentRole = getAgentRole(agentId);
  const priorArr = Array.isArray(priorOutputs)
    ? (priorOutputs as AgentExecutionResult[])
    : [];

  // ── Profile settings from request ────────────────────────────────────────────
  const reqTemperature = typeof body.temperature === "number" ? body.temperature : 0.4;
  const reqMaxTokens = typeof body.maxTokens === "number" ? body.maxTokens : 2048;
  const reqInstructions =
    typeof body.systemInstructions === "string" ? body.systemInstructions.trim() : "";

  const baseSystemPrompt = getExecutionSystemPrompt(agentRole);
  const systemPrompt = reqInstructions
    ? `${baseSystemPrompt}\n\n════════════════════════════\nAGENT BEHAVIOR PROFILE\n════════════════════════════\n${reqInstructions}`
    : baseSystemPrompt;

  const userMessage = buildExecutionUserMessage({
    objective: (objective as string).trim(),
    taskTitle: taskObj.title,
    taskDescription: taskObj.description,
    agentRole,
    priorOutputs: priorArr,
  });

  // ── LLM call ────────────────────────────────────────────────────────────────
  let rawText: string;
  try {
    const result = await generateText(provider as ProviderID, userMessage, {
      model: typeof model === "string" ? model : undefined,
      systemPrompt,
      maxTokens: reqMaxTokens,
      temperature: reqTemperature,
    });
    rawText = result.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agents/execute] LLM call failed:", message);
    return NextResponse.json(createFallbackResult(taskObj.id, agentRole, message));
  }

  // ── JSON parse ───────────────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJSON(rawText));
  } catch {
    console.error("[agents/execute] JSON parse failed. Raw:", rawText.slice(0, 400));
    return NextResponse.json(
      createFallbackResult(taskObj.id, agentRole, "non-JSON response from model")
    );
  }

  // Inject missing id/role before validation
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const p = parsed as Record<string, unknown>;
    if (!p.taskId || p.taskId === "") p.taskId = taskObj.id;
    if (!p.agentRole || p.agentRole === "") p.agentRole = agentRole;
  }

  // ── First validation pass ────────────────────────────────────────────────────
  const firstPass = validateExecutionResult(parsed);
  if (firstPass.valid) {
    return NextResponse.json(firstPass.data);
  }

  // ── Repair pass ──────────────────────────────────────────────────────────────
  console.warn("[agents/execute] Validation failed, repairing:", firstPass.errors);
  const repaired = repairExecutionResult(parsed, taskObj.id, agentRole);
  const secondPass = validateExecutionResult(repaired);

  if (secondPass.valid) {
    console.log("[agents/execute] Repair succeeded");
    return NextResponse.json(secondPass.data);
  }

  // ── Structural fallback ──────────────────────────────────────────────────────
  console.error("[agents/execute] Repair failed:", secondPass.errors);
  return NextResponse.json(
    createFallbackResult(taskObj.id, agentRole, "validation failed after repair")
  );
}
