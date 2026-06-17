import { getDB } from "./db";
import type { OperationRecord, OperationSummary } from "./types";
import { recordToSummary } from "./types";

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveOperation(record: OperationRecord): Promise<void> {
  try {
    await getDB().operations.put(record);
  } catch (err) {
    console.warn("[storage] saveOperation failed:", err);
  }
}

export async function deleteOperation(id: string): Promise<void> {
  try {
    await getDB().operations.delete(id);
  } catch (err) {
    console.warn("[storage] deleteOperation failed:", err);
  }
}

export async function clearAllOperations(): Promise<void> {
  try {
    await getDB().operations.clear();
  } catch (err) {
    console.warn("[storage] clearAllOperations failed:", err);
  }
}

// Mark any stale "Running" records from a prior session as Failed
export async function markStaleRunningAsFailed(): Promise<void> {
  try {
    await getDB().operations.where("status").equals("Running").modify({ status: "Failed" });
  } catch (err) {
    console.warn("[storage] markStaleRunningAsFailed failed:", err);
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function loadOperation(id: string): Promise<OperationRecord | undefined> {
  try {
    return await getDB().operations.get(id);
  } catch (err) {
    console.warn("[storage] loadOperation failed:", err);
    return undefined;
  }
}

export async function loadAllSummaries(): Promise<OperationSummary[]> {
  try {
    const records = await getDB().operations.orderBy("createdAt").reverse().toArray();
    return records.map(recordToSummary);
  } catch (err) {
    console.warn("[storage] loadAllSummaries failed:", err);
    return [];
  }
}
