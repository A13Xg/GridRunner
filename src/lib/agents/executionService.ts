import type { AgentExecutionResult } from "./types";
import { createFallbackResult } from "./executionSchema";
import type { Task } from "@/types";

export interface ExecuteTaskRequest {
  task: Task;
  objective: string;
  provider: string;
  model: string;
  priorOutputs?: AgentExecutionResult[];
  // Profile overrides — applied server-side
  temperature?: number;
  maxTokens?: number;
  systemInstructions?: string;
}

export async function executeTask(request: ExecuteTaskRequest): Promise<AgentExecutionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50_000);

  try {
    const res = await fetch("/api/agents/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({} as Record<string, unknown>));

    if (!res.ok) {
      const msg = (data as { error?: string }).error;
      throw new Error(msg ?? `Execution API error: HTTP ${res.status}`);
    }

    return data as AgentExecutionResult;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return createFallbackResult(
        request.task.id,
        request.task.assignedAgentId ?? "agent",
        "execution timed out after 50s"
      );
    }
    return createFallbackResult(
      request.task.id,
      request.task.assignedAgentId ?? "agent",
      err instanceof Error ? err.message : "network error"
    );
  } finally {
    clearTimeout(timeout);
  }
}
