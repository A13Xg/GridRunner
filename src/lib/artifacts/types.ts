// ─── Workspace Artifact ───────────────────────────────────────────────────────

export type WorkspaceArtifactType =
  | "note"
  | "plan"
  | "research"
  | "design"
  | "review"
  | "report";

export interface WorkspaceArtifact {
  id: string;
  taskId: string;
  agentRole: string;
  title: string;
  type: WorkspaceArtifactType;
  content: string;
  createdAt: number;
  tags: string[];
}

// ─── Operation Report ─────────────────────────────────────────────────────────

export interface OperationReport {
  title: string;
  summary: string;
  markdown: string;
  warnings: string[];
}
