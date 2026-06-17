import type { AgentRole } from "./taskGraphSchema";
import type { ProviderID } from "@/lib/llm/types";

// ─── Agent Registry ───────────────────────────────────────────────────────────

export interface AgentDefinition {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  defaultProvider: ProviderID;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
}

// ─── Execution Schema ─────────────────────────────────────────────────────────

export type ArtifactType = "note" | "plan" | "research" | "design" | "review";

export type ExecutionStatus = "Completed" | "Failed";

export interface Artifact {
  title: string;
  type: ArtifactType;
  content: string;
}

export interface AgentExecutionResult {
  taskId: string;
  agentRole: string;
  status: ExecutionStatus;
  summary: string;
  details: string[];
  artifacts: Artifact[];
  warnings: string[];
}
