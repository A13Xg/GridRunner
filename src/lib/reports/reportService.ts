import type { OperationReport } from "@/lib/artifacts/types";
import type { Task } from "@/types";
import type { WorkspaceArtifact } from "@/lib/artifacts/types";
import { generateFallbackReport } from "./reportSchema";

export interface GenerateReportRequest {
  objective: string;
  operationName: string;
  tasks: Task[];
  artifacts: WorkspaceArtifact[];
  provider: string;
  model: string;
}

export interface GenerateReportResult {
  report: OperationReport;
  isFallback: boolean;
}

export async function generateReport(
  request: GenerateReportRequest
): Promise<GenerateReportResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch("/api/reports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({} as Record<string, unknown>));

    if (!res.ok) {
      const msg = (data as { error?: string }).error;
      throw new Error(msg ?? `Report API error: HTTP ${res.status}`);
    }

    return { report: data as OperationReport, isFallback: false };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown error";
    console.warn("[reportService] API failed, generating local fallback:", reason);

    const fallback = generateFallbackReport(
      request.objective,
      request.operationName,
      request.tasks,
      request.artifacts
    );

    return { report: fallback, isFallback: true };
  } finally {
    clearTimeout(timeout);
  }
}
