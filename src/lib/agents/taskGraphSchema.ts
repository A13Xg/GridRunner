// ─── Enum Types ───────────────────────────────────────────────────────────────

export type AgentRole = "Planner" | "Researcher" | "Builder" | "Reviewer";

export type StationName =
  | "Command Core"
  | "Planning Terminal"
  | "Data Nexus"
  | "Fabrication Bay"
  | "QA Station";

export type GraphTaskStatus = "Queued" | "InProgress" | "Completed" | "Failed";

export type EstimatedComplexity = "low" | "medium" | "high";

// ─── Allowed Value Sets ───────────────────────────────────────────────────────

export const ALLOWED_AGENT_ROLES: readonly AgentRole[] = [
  "Planner",
  "Researcher",
  "Builder",
  "Reviewer",
] as const;

export const ALLOWED_STATIONS: readonly StationName[] = [
  "Command Core",
  "Planning Terminal",
  "Data Nexus",
  "Fabrication Bay",
  "QA Station",
] as const;

export const ALLOWED_STATUSES: readonly GraphTaskStatus[] = [
  "Queued",
  "InProgress",
  "Completed",
  "Failed",
] as const;

export const ALLOWED_COMPLEXITIES: readonly EstimatedComplexity[] = [
  "low",
  "medium",
  "high",
] as const;

// ─── Schema Types ─────────────────────────────────────────────────────────────

export interface GraphTask {
  id: string;
  title: string;
  description: string;
  agentRole: AgentRole;
  station: StationName;
  estimatedComplexity: EstimatedComplexity;
  dependencies: string[];
  status: GraphTaskStatus;
}

export interface TaskGraph {
  operationName: string;
  summary: string;
  tasks: GraphTask[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationOutcome =
  | { valid: true; data: TaskGraph }
  | { valid: false; errors: string[] };

export function validateTaskGraph(input: unknown): ValidationOutcome {
  const errors: string[] = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Response root must be a JSON object"] };
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.operationName !== "string" || !raw.operationName.trim()) {
    errors.push("operationName must be a non-empty string");
  }
  if (typeof raw.summary !== "string" || !raw.summary.trim()) {
    errors.push("summary must be a non-empty string");
  }
  if (!Array.isArray(raw.tasks)) {
    return { valid: false, errors: [...errors, "tasks must be an array"] };
  }
  if (raw.tasks.length < 1) {
    errors.push("tasks must contain at least 1 task");
  }
  if (raw.tasks.length > 8) {
    errors.push(`tasks must contain at most 8 tasks (got ${raw.tasks.length})`);
  }

  for (let i = 0; i < raw.tasks.length; i++) {
    errors.push(...validateGraphTask(raw.tasks[i], i));
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: raw as unknown as TaskGraph };
}

function validateGraphTask(task: unknown, index: number): string[] {
  const errors: string[] = [];
  const p = `tasks[${index}]`;

  if (!task || typeof task !== "object" || Array.isArray(task)) {
    return [`${p}: must be an object`];
  }

  const t = task as Record<string, unknown>;

  if (typeof t.id !== "string" || !t.id.trim()) {
    errors.push(`${p}.id must be a non-empty string`);
  }
  if (typeof t.title !== "string" || !t.title.trim()) {
    errors.push(`${p}.title must be a non-empty string`);
  }
  if (typeof t.description !== "string" || !t.description.trim()) {
    errors.push(`${p}.description must be a non-empty string`);
  }
  if (!(ALLOWED_AGENT_ROLES as readonly unknown[]).includes(t.agentRole)) {
    errors.push(
      `${p}.agentRole "${t.agentRole}" not allowed. Must be one of: ${ALLOWED_AGENT_ROLES.join(", ")}`
    );
  }
  if (!(ALLOWED_STATIONS as readonly unknown[]).includes(t.station)) {
    errors.push(
      `${p}.station "${t.station}" not allowed. Must be one of: ${ALLOWED_STATIONS.join(", ")}`
    );
  }
  if (!(ALLOWED_COMPLEXITIES as readonly unknown[]).includes(t.estimatedComplexity)) {
    errors.push(
      `${p}.estimatedComplexity "${t.estimatedComplexity}" not allowed. Must be: low, medium, or high`
    );
  }
  if (!Array.isArray(t.dependencies)) {
    errors.push(`${p}.dependencies must be an array`);
  } else if (t.dependencies.some((d: unknown) => typeof d !== "string")) {
    errors.push(`${p}.dependencies must be an array of strings`);
  }
  if (!(ALLOWED_STATUSES as readonly unknown[]).includes(t.status)) {
    errors.push(
      `${p}.status "${t.status}" not allowed. Must be one of: ${ALLOWED_STATUSES.join(", ")}`
    );
  }

  return errors;
}

// ─── Repair ───────────────────────────────────────────────────────────────────

export function repairTaskGraph(input: unknown, objective: string): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { operationName: objective, summary: `Execute: ${objective}`, tasks: [] };
  }

  const raw = input as Record<string, unknown>;

  const operationName =
    typeof raw.operationName === "string" && raw.operationName.trim()
      ? raw.operationName
      : `Operation: ${objective}`;

  const summary =
    typeof raw.summary === "string" && raw.summary.trim()
      ? raw.summary
      : `Structured execution plan for: ${objective}`;

  const rawTasks = Array.isArray(raw.tasks) ? raw.tasks.slice(0, 8) : [];
  const tasks = rawTasks.map((task: unknown, i: number) => repairGraphTask(task, i));

  return { operationName, summary, tasks };
}

function repairGraphTask(task: unknown, index: number): Record<string, unknown> {
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    return defaultTask(index);
  }

  const t = task as Record<string, unknown>;

  const id =
    typeof t.id === "string" && t.id.trim() ? t.id : `task-${index + 1}`;
  const title =
    typeof t.title === "string" && t.title.trim() ? t.title : `Task ${index + 1}`;
  const description =
    typeof t.description === "string" && t.description.trim()
      ? t.description
      : `Execute task ${index + 1}`;

  const agentRole =
    coerceAgentRole(t.agentRole) ??
    ALLOWED_AGENT_ROLES[index % ALLOWED_AGENT_ROLES.length];

  const station =
    coerceStation(t.station) ??
    ALLOWED_STATIONS[index % ALLOWED_STATIONS.length];

  const estimatedComplexity = coerceComplexity(t.estimatedComplexity) ?? "medium";

  const dependencies = Array.isArray(t.dependencies)
    ? (t.dependencies as unknown[]).filter(
        (d): d is string => typeof d === "string"
      )
    : [];

  const status = coerceStatus(t.status) ?? "Queued";

  return {
    id,
    title,
    description,
    agentRole,
    station,
    estimatedComplexity,
    dependencies,
    status,
  };
}

function coerceAgentRole(value: unknown): AgentRole | null {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase().trim();
  for (const role of ALLOWED_AGENT_ROLES) {
    if (role.toLowerCase() === lower) return role;
  }
  if (lower.includes("plan")) return "Planner";
  if (lower.includes("research") || lower.includes("analys") || lower.includes("data"))
    return "Researcher";
  if (
    lower.includes("build") ||
    lower.includes("develop") ||
    lower.includes("engineer") ||
    lower.includes("implement")
  )
    return "Builder";
  if (lower.includes("review") || lower.includes("qa") || lower.includes("test") || lower.includes("quality"))
    return "Reviewer";
  return null;
}

function coerceStation(value: unknown): StationName | null {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase().trim();
  for (const s of ALLOWED_STATIONS) {
    if (s.toLowerCase() === lower) return s;
  }
  if (lower.includes("command") || lower.includes("core")) return "Command Core";
  if (lower.includes("plan")) return "Planning Terminal";
  if (lower.includes("data") || lower.includes("nexus") || lower.includes("research"))
    return "Data Nexus";
  if (
    lower.includes("fabricat") ||
    lower.includes("build") ||
    lower.includes("bay") ||
    lower.includes("construct")
  )
    return "Fabrication Bay";
  if (
    lower.includes("qa") ||
    lower.includes("quality") ||
    lower.includes("review") ||
    lower.includes("test")
  )
    return "QA Station";
  return null;
}

function coerceComplexity(value: unknown): EstimatedComplexity | null {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase().trim();
  if (lower === "low" || lower === "simple" || lower === "easy" || lower === "trivial")
    return "low";
  if (lower === "medium" || lower === "moderate" || lower === "normal" || lower === "average")
    return "medium";
  if (
    lower === "high" ||
    lower === "complex" ||
    lower === "hard" ||
    lower === "difficult" ||
    lower === "advanced"
  )
    return "high";
  return null;
}

function coerceStatus(value: unknown): GraphTaskStatus | null {
  if (typeof value !== "string") return "Queued";
  const lower = value.toLowerCase().trim();
  for (const s of ALLOWED_STATUSES) {
    if (s.toLowerCase() === lower) return s;
  }
  return "Queued";
}

function defaultTask(index: number): Record<string, unknown> {
  return {
    id: `task-${index + 1}`,
    title: `Task ${index + 1}`,
    description: `Execute step ${index + 1} of the operation`,
    agentRole: ALLOWED_AGENT_ROLES[index % ALLOWED_AGENT_ROLES.length],
    station: ALLOWED_STATIONS[index % ALLOWED_STATIONS.length],
    estimatedComplexity: "medium",
    dependencies: index === 0 ? [] : [`task-${index}`],
    status: "Queued",
  };
}
