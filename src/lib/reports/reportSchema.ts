import type { OperationReport } from "@/lib/artifacts/types";
import type { Task } from "@/types";
import type { WorkspaceArtifact } from "@/lib/artifacts/types";

// ─── Validation ───────────────────────────────────────────────────────────────

export type ReportValidationOutcome =
  | { valid: true; data: OperationReport }
  | { valid: false; errors: string[] };

export function validateReport(input: unknown): ReportValidationOutcome {
  const errors: string[] = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Report must be a JSON object"] };
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.title !== "string" || !raw.title.trim())
    errors.push("title must be a non-empty string");
  if (typeof raw.summary !== "string" || !raw.summary.trim())
    errors.push("summary must be a non-empty string");
  if (typeof raw.markdown !== "string" || raw.markdown.length < 50)
    errors.push("markdown must be a string with at least 50 characters");
  if (!Array.isArray(raw.warnings))
    errors.push("warnings must be an array");
  else if ((raw.warnings as unknown[]).some((w) => typeof w !== "string"))
    errors.push("all warnings must be strings");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: raw as unknown as OperationReport };
}

// ─── Repair ───────────────────────────────────────────────────────────────────

export function repairReport(input: unknown, operationName: string): OperationReport {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Cannot repair non-object report response");
  }

  const raw = input as Record<string, unknown>;

  return {
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title
        : `${operationName} — Operation Report`,
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary
        : `Operation "${operationName}" completed.`,
    markdown:
      typeof raw.markdown === "string" && raw.markdown.length > 10
        ? raw.markdown
        : `# ${operationName}\n\nOperation completed.`,
    warnings: Array.isArray(raw.warnings)
      ? (raw.warnings as unknown[]).filter((w): w is string => typeof w === "string")
      : ["Response required structural repair."],
  };
}

// ─── Fallback (deterministic, no LLM) ────────────────────────────────────────

export function generateFallbackReport(
  objective: string,
  operationName: string,
  tasks: Task[],
  artifacts: WorkspaceArtifact[]
): OperationReport {
  const completed = tasks.filter((t) => t.status === "completed").length;
  const failed = tasks.filter((t) => t.status === "failed").length;

  // Group artifacts by agent role
  const byRole: Record<string, WorkspaceArtifact[]> = {};
  for (const a of artifacts) {
    (byRole[a.agentRole] ??= []).push(a);
  }

  const lines: string[] = [];

  lines.push(`# ${operationName}`);
  lines.push("");
  lines.push(
    `**Status:** ${failed === 0 ? "Completed" : "Completed with Issues"} | **Tasks:** ${completed}/${tasks.length} | **Artifacts:** ${artifacts.length}`
  );
  lines.push("");

  lines.push("## Executive Summary");
  lines.push("");
  lines.push(
    `Operation "${operationName}" executed ${tasks.length} tasks with ${completed} successful completions${failed > 0 ? ` and ${failed} failure(s)` : ""}. ` +
      `A total of ${artifacts.length} artifact${artifacts.length !== 1 ? "s" : ""} were produced across all agent work sessions. ` +
      `${failed === 0 ? "All agents completed their assigned tasks without incident." : "Some tasks encountered issues — see Warnings section below."}`
  );
  lines.push("");

  lines.push("## Objective");
  lines.push("");
  lines.push(objective);
  lines.push("");

  lines.push("## Task Execution Summary");
  lines.push("");
  lines.push("| # | Task | Agent | Status |");
  lines.push("|---|------|-------|--------|");
  for (const t of tasks) {
    const symbol = t.status === "completed" ? "✓" : t.status === "failed" ? "✗" : "○";
    lines.push(
      `| ${t.order + 1} | ${t.title} | ${t.assignedAgentId ?? "—"} | ${symbol} ${t.status} |`
    );
  }
  lines.push("");

  lines.push("## Agent Contributions");
  lines.push("");
  for (const [role, roleArtifacts] of Object.entries(byRole)) {
    lines.push(`### ${role}`);
    lines.push(`Produced ${roleArtifacts.length} artifact${roleArtifacts.length !== 1 ? "s" : ""}:`);
    for (const a of roleArtifacts) {
      lines.push(`- **${a.title}** [${a.type}]`);
    }
    lines.push("");
  }
  if (Object.keys(byRole).length === 0) {
    lines.push("No artifacts were produced by agents.");
    lines.push("");
  }

  if (artifacts.length > 0) {
    lines.push("## Artifacts Produced");
    lines.push("");
    for (const a of artifacts) {
      const preview = a.content.length > 300 ? a.content.slice(0, 300) + "..." : a.content;
      lines.push(`### ${a.title}`);
      lines.push(`*Type: ${a.type} · Agent: ${a.agentRole}*`);
      lines.push("");
      lines.push(preview);
      lines.push("");
    }
  }

  const reportWarnings: string[] = [];

  lines.push("## Warnings & Issues");
  lines.push("");
  if (failed === 0) {
    lines.push("No issues detected.");
  } else {
    for (const t of tasks.filter((t) => t.status === "failed")) {
      const msg = `Task "${t.title}" reported failure`;
      lines.push(`- ${msg}`);
      reportWarnings.push(msg);
    }
  }
  lines.push("");

  lines.push("## Recommended Next Steps");
  lines.push("");
  lines.push("1. Review the artifacts produced and validate them against the original objective");
  if (failed > 0) {
    lines.push("2. Re-examine and retry the failed tasks with revised parameters");
    lines.push("3. Conduct a follow-up review pass to fill any gaps");
    lines.push("4. Document findings and integrate outputs into a production plan");
    lines.push("5. Schedule a follow-up operation to address unresolved items");
  } else {
    lines.push("2. Conduct a final human review of all produced artifacts");
    lines.push("3. Integrate the artifacts into your production workflow");
    lines.push("4. Run a validation operation to verify completeness");
    lines.push("5. Archive this operation report for future reference");
  }
  lines.push("");

  lines.push("---");
  lines.push(
    "*Generated by NeuralFoundry Agent Factory (fallback mode — AI provider unavailable)*"
  );

  return {
    title: `${operationName} — Operation Report`,
    summary:
      `Operation "${operationName}" completed ${completed}/${tasks.length} tasks. ` +
      `${artifacts.length} artifact${artifacts.length !== 1 ? "s" : ""} produced. ` +
      (failed > 0 ? `${failed} task(s) reported issues.` : "All tasks nominal."),
    markdown: lines.join("\n"),
    warnings: [
      "Generated via local fallback (AI provider unavailable)",
      ...reportWarnings,
    ],
  };
}
