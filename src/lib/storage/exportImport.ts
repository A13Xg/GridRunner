import type { OperationRecord } from "./types";
import { saveOperation } from "./operationPersistence";

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportEnvelope {
  schemaVersion: 1;
  exportedAt: string;
  operation: OperationRecord;
}

export function exportOperationJSON(record: OperationRecord): void {
  const envelope: ExportEnvelope = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    operation: record,
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (record.operationName || record.objective)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  a.download = `nf-${safeName}-${record.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  record?: OperationRecord;
  error?: string;
}

export async function importOperationJSON(file: File): Promise<ImportResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { success: false, error: "Could not read file" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { success: false, error: "File is not valid JSON" };
  }

  const validation = validateEnvelope(parsed);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const record = (parsed as ExportEnvelope).operation;

  // Ensure required fields have defaults for forward-compat
  const normalised: OperationRecord = {
    id: record.id,
    operationName: record.operationName ?? "",
    objective: record.objective ?? "",
    status: record.status ?? "Completed",
    createdAt: record.createdAt,
    completedAt: record.completedAt ?? null,
    provider: record.provider ?? "",
    model: record.model ?? "",
    tasks: Array.isArray(record.tasks) ? record.tasks : [],
    artifacts: Array.isArray(record.artifacts) ? record.artifacts : [],
    executionResults: record.executionResults ?? {},
    report: record.report ?? null,
    events: Array.isArray(record.events) ? record.events : [],
    agentProfilesSnapshot: record.agentProfilesSnapshot ?? ({} as OperationRecord["agentProfilesSnapshot"]),
  };

  try {
    await saveOperation(normalised);
    return { success: true, record: normalised };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Database write failed" };
  }
}

function validateEnvelope(data: unknown): { valid: boolean; reason?: string } {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, reason: "Not a JSON object" };
  }
  const d = data as Record<string, unknown>;
  if (d.schemaVersion !== 1) {
    return { valid: false, reason: `Unsupported schema version: ${String(d.schemaVersion)}` };
  }
  if (!d.operation || typeof d.operation !== "object" || Array.isArray(d.operation)) {
    return { valid: false, reason: "Missing or invalid 'operation' field" };
  }
  const op = d.operation as Record<string, unknown>;
  if (typeof op.id !== "string" || !op.id) {
    return { valid: false, reason: "operation.id must be a non-empty string" };
  }
  if (typeof op.objective !== "string") {
    return { valid: false, reason: "operation.objective must be a string" };
  }
  if (typeof op.createdAt !== "number") {
    return { valid: false, reason: "operation.createdAt must be a number" };
  }
  if (!Array.isArray(op.tasks)) {
    return { valid: false, reason: "operation.tasks must be an array" };
  }
  return { valid: true };
}
