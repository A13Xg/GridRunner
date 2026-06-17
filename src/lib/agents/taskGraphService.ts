import type { TaskGraph } from "./taskGraphSchema";

export interface PlanRequest {
  objective: string;
  provider: string;
  model: string;
}

export interface PlanResult extends TaskGraph {
  _repaired?: boolean;
}

export async function fetchTaskGraph(request: PlanRequest): Promise<PlanResult> {
  const res = await fetch("/api/agents/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await res.json().catch(() => ({} as Record<string, unknown>));

  if (!res.ok) {
    const msg = (data as { error?: string }).error;
    throw new Error(msg ?? `Planning API error: HTTP ${res.status}`);
  }

  return data as PlanResult;
}
