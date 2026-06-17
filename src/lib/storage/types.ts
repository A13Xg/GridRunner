import type { Task, GameEvent } from "@/types";
import type { WorkspaceArtifact, OperationReport } from "@/lib/artifacts/types";
import type { AgentExecutionResult } from "@/lib/agents/types";
import type { AgentProfileMap } from "@/lib/agents/profileTypes";

// ─── Operation Status ─────────────────────────────────────────────────────────

export type OperationStatus =
  | "Draft"
  | "Running"
  | "Completed"
  | "Failed"
  | "PartiallyCompleted";

// ─── Full record (stored in IndexedDB) ───────────────────────────────────────

export interface OperationRecord {
  id: string;
  operationName: string;
  objective: string;
  status: OperationStatus;
  createdAt: number;
  completedAt: number | null;
  provider: string;
  model: string;
  tasks: Task[];
  artifacts: WorkspaceArtifact[];
  executionResults: Record<string, AgentExecutionResult>;
  report: OperationReport | null;
  events: GameEvent[];
  agentProfilesSnapshot: AgentProfileMap;
}

// ─── Summary (for history list) ───────────────────────────────────────────────

export interface OperationSummary {
  id: string;
  operationName: string;
  objective: string;
  status: OperationStatus;
  createdAt: number;
  completedAt: number | null;
  taskCount: number;
  artifactCount: number;
}

export function recordToSummary(record: OperationRecord): OperationSummary {
  return {
    id: record.id,
    operationName: record.operationName,
    objective: record.objective,
    status: record.status,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    taskCount: record.tasks.length,
    artifactCount: record.artifacts.length,
  };
}
