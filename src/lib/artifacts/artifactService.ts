import { nanoid } from "@/lib/nanoid";
import type { WorkspaceArtifact, WorkspaceArtifactType } from "./types";
import type { AgentExecutionResult } from "@/lib/agents/types";
import type { Task } from "@/types";

export function collectArtifactsFromResult(
  result: AgentExecutionResult,
  task: Task
): WorkspaceArtifact[] {
  return result.artifacts.map((a) => ({
    id: nanoid(),
    taskId: task.id,
    agentRole: result.agentRole,
    title: a.title,
    type: a.type as WorkspaceArtifactType,
    content: a.content,
    createdAt: Date.now(),
    tags: [a.type, result.agentRole.toLowerCase()],
  }));
}
