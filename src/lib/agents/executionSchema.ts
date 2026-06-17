import type { AgentExecutionResult, Artifact, ArtifactType, ExecutionStatus } from "./types";

const ALLOWED_STATUSES: readonly ExecutionStatus[] = ["Completed", "Failed"];
const ALLOWED_ARTIFACT_TYPES: readonly ArtifactType[] = [
  "note",
  "plan",
  "research",
  "design",
  "review",
];

// ─── Validation ───────────────────────────────────────────────────────────────

export type ExecutionValidationOutcome =
  | { valid: true; data: AgentExecutionResult }
  | { valid: false; errors: string[] };

export function validateExecutionResult(input: unknown): ExecutionValidationOutcome {
  const errors: string[] = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Result must be a JSON object"] };
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.taskId !== "string") errors.push("taskId must be a string");
  if (typeof raw.agentRole !== "string" || !raw.agentRole.trim())
    errors.push("agentRole must be a non-empty string");
  if (!(ALLOWED_STATUSES as readonly unknown[]).includes(raw.status))
    errors.push(`status must be "Completed" or "Failed", got "${raw.status}"`);
  if (typeof raw.summary !== "string" || !raw.summary.trim())
    errors.push("summary must be a non-empty string");

  if (!Array.isArray(raw.details)) {
    errors.push("details must be an array");
  } else if ((raw.details as unknown[]).some((d) => typeof d !== "string")) {
    errors.push("all details entries must be strings");
  }

  if (!Array.isArray(raw.artifacts)) {
    errors.push("artifacts must be an array");
  } else {
    for (let i = 0; i < (raw.artifacts as unknown[]).length; i++) {
      errors.push(...validateArtifact((raw.artifacts as unknown[])[i], i));
    }
  }

  if (!Array.isArray(raw.warnings)) {
    errors.push("warnings must be an array");
  } else if ((raw.warnings as unknown[]).some((w) => typeof w !== "string")) {
    errors.push("all warnings entries must be strings");
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: raw as unknown as AgentExecutionResult };
}

function validateArtifact(artifact: unknown, index: number): string[] {
  const errors: string[] = [];
  const p = `artifacts[${index}]`;

  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    return [`${p}: must be an object`];
  }

  const a = artifact as Record<string, unknown>;
  if (typeof a.title !== "string" || !a.title.trim())
    errors.push(`${p}.title must be a non-empty string`);
  if (!(ALLOWED_ARTIFACT_TYPES as readonly unknown[]).includes(a.type))
    errors.push(`${p}.type "${a.type}" not allowed. Must be: ${ALLOWED_ARTIFACT_TYPES.join(", ")}`);
  if (typeof a.content !== "string" || !a.content.trim())
    errors.push(`${p}.content must be a non-empty string`);

  return errors;
}

// ─── Repair ───────────────────────────────────────────────────────────────────

export function repairExecutionResult(
  input: unknown,
  taskId: string,
  agentRole: string
): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return createFallbackResult(taskId, agentRole, "non-object response");
  }

  const raw = input as Record<string, unknown>;

  const repairedId =
    typeof raw.taskId === "string" && raw.taskId.trim() ? raw.taskId : taskId;
  const repairedRole =
    typeof raw.agentRole === "string" && raw.agentRole.trim() ? raw.agentRole : agentRole;
  const status: ExecutionStatus =
    raw.status === "Completed" || raw.status === "Failed" ? raw.status : "Completed";
  const summary =
    typeof raw.summary === "string" && raw.summary.trim()
      ? raw.summary
      : "Task executed with partial output.";

  const details = Array.isArray(raw.details)
    ? (raw.details as unknown[])
        .filter((d): d is string => typeof d === "string")
        .slice(0, 10)
    : ["Task processed."];

  const artifacts = Array.isArray(raw.artifacts)
    ? (raw.artifacts as unknown[])
        .map((a, i) => repairArtifact(a, i, agentRole))
        .filter((a): a is Artifact => a !== null)
    : [];

  const warnings = Array.isArray(raw.warnings)
    ? (raw.warnings as unknown[]).filter((w): w is string => typeof w === "string")
    : [];

  warnings.push("Response required structural repair.");

  return {
    taskId: repairedId,
    agentRole: repairedRole,
    status,
    summary,
    details,
    artifacts,
    warnings,
  };
}

function repairArtifact(
  artifact: unknown,
  index: number,
  agentRole: string
): Artifact | null {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return null;

  const a = artifact as Record<string, unknown>;
  const title =
    typeof a.title === "string" && a.title.trim()
      ? a.title
      : `${agentRole} Output ${index + 1}`;
  const type = coerceArtifactType(a.type) ?? defaultArtifactType(agentRole);
  const content =
    typeof a.content === "string" && a.content.trim()
      ? a.content
      : "Content unavailable.";

  return { title, type, content };
}

function coerceArtifactType(value: unknown): ArtifactType | null {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase().trim();
  if ((ALLOWED_ARTIFACT_TYPES as readonly string[]).includes(lower))
    return lower as ArtifactType;
  if (lower.includes("plan")) return "plan";
  if (lower.includes("research") || lower.includes("data")) return "research";
  if (lower.includes("design") || lower.includes("arch")) return "design";
  if (lower.includes("review") || lower.includes("qa")) return "review";
  return "note";
}

function defaultArtifactType(agentRole: string): ArtifactType {
  const map: Record<string, ArtifactType> = {
    Planner: "plan",
    Researcher: "research",
    Builder: "design",
    Reviewer: "review",
  };
  return map[agentRole] ?? "note";
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

export function createFallbackResult(
  taskId: string,
  agentRole: string,
  reason?: string
): AgentExecutionResult {
  const artType = defaultArtifactType(agentRole);
  return {
    taskId,
    agentRole,
    status: "Completed",
    summary: `${agentRole} task completed in stub mode (AI output unavailable).`,
    details: [
      "Agent processed the task without AI-generated output.",
      reason ? `Reason: ${reason}` : "AI provider was unavailable.",
      "This is a simulation stub — production execution would yield real output.",
    ],
    artifacts: [
      {
        title: `${agentRole} Stub`,
        type: artType,
        content: `This ${agentRole.toLowerCase()} task ran in stub mode because the AI provider was unavailable${reason ? ` (${reason})` : ""}. In a live environment, this agent would produce detailed ${artType} content specific to the task objective.`,
      },
    ],
    warnings: [
      reason ? `Stub output used: ${reason}` : "Stub output used: AI provider unavailable.",
    ],
  };
}
