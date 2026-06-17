"use client";
import { useState, useEffect, useCallback } from "react";
import { useHistoryStore } from "@/state/historyStore";
import { useTaskStore } from "@/state/taskStore";
import { useArtifactStore } from "@/state/artifactStore";
import { useExecutionStore } from "@/state/executionStore";
import { useReportStore } from "@/state/reportStore";
import { useEventStore } from "@/state/eventStore";
import { useSimulationStore } from "@/state/simulationStore";
import { loadOperation, deleteOperation } from "@/lib/storage/operationPersistence";
import { exportOperationJSON } from "@/lib/storage/exportImport";
import { recordToSummary } from "@/lib/storage/types";
import type { OperationRecord } from "@/lib/storage/types";

const STATUS_COLORS: Record<string, string> = {
  Completed: "text-green-400",
  PartiallyCompleted: "text-amber-400",
  Failed: "text-red-400",
  Running: "text-cyan-400",
  Draft: "text-[#6060a0]",
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OperationDetailView() {
  const { selectedOperationId, selectOperation, removeSummary } = useHistoryStore();
  const [record, setRecord] = useState<OperationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedOperationId) return;
    setLoading(true);
    setRecord(null);
    loadOperation(selectedOperationId).then((r) => {
      setRecord(r ?? null);
      setLoading(false);
    });
  }, [selectedOperationId]);

  const handleRestore = useCallback(() => {
    if (!record) return;

    // Restore task store
    useTaskStore.setState({ tasks: record.tasks });

    // Restore artifacts
    const { clearArtifacts, addArtifact } = useArtifactStore.getState();
    clearArtifacts();
    record.artifacts.forEach((a) => addArtifact(a));

    // Restore execution results
    const execStore = useExecutionStore.getState();
    execStore.clearResults();
    Object.entries(record.executionResults).forEach(([taskId, result]) => {
      execStore.setResult(taskId, result);
    });

    // Restore report
    const rptStore = useReportStore.getState();
    if (record.report) {
      rptStore.setReport(record.report);
      rptStore.setStatus("completed");
    } else {
      rptStore.clearReport();
    }

    // Restore events, then prepend a "loaded" notice
    useEventStore.setState({ events: record.events });
    useEventStore
      .getState()
      .addEvent("operation_loaded", `Operation "${record.operationName}" restored from history`);

    // Restore simulation meta
    useSimulationStore.setState({
      objective: record.objective,
      operationName: record.operationName,
      status: "completed",
      currentTaskIndex: Math.max(0, record.tasks.length - 1),
      planningStatus: "ready",
    });

    selectOperation(null);
  }, [record, selectOperation]);

  const handleExport = useCallback(() => {
    if (record) exportOperationJSON(record);
  }, [record]);

  const handleDelete = useCallback(async () => {
    if (!record) return;
    if (!confirm(`Delete operation "${record.operationName}"? This cannot be undone.`)) return;
    await deleteOperation(record.id);
    removeSummary(record.id);
    selectOperation(null);
  }, [record, removeSummary, selectOperation]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2">
        <div className="w-4 h-4 border border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-[9px] font-mono text-[#303060] tracking-widest">LOADING…</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <span className="text-[10px] font-mono text-red-400">Record not found</span>
        <button
          onClick={() => selectOperation(null)}
          className="mt-3 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 tracking-wider"
        >
          ← Back
        </button>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[record.status] ?? "text-[#6060a0]";
  const summary = recordToSummary(record);

  return (
    <div className="flex flex-col gap-3">
      {/* Back */}
      <button
        onClick={() => selectOperation(null)}
        className="flex items-center gap-1.5 text-[9px] font-mono text-[#505080] hover:text-cyan-400 transition-colors self-start"
      >
        <span>←</span>
        <span className="tracking-wider">HISTORY</span>
      </button>

      {/* Header */}
      <div className="border border-[#1a1a3a] p-2.5 rounded">
        <div className="text-[10px] font-mono text-[#c0c0e0] leading-snug mb-1">
          {record.operationName || record.objective}
        </div>
        {record.operationName && (
          <div className="text-[9px] font-mono text-[#505080] leading-relaxed mb-2">
            {record.objective}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[9px] font-mono ${statusColor} tracking-wider`}>
            {record.status.toUpperCase()}
          </span>
          <span className="text-[9px] font-mono text-[#404060]">
            {formatDate(record.createdAt)}
          </span>
          <span className="text-[9px] font-mono text-[#404060]">
            {record.provider}/{record.model}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Tasks", value: summary.taskCount },
          { label: "Artifacts", value: summary.artifactCount },
          { label: "Events", value: record.events.length },
        ].map(({ label, value }) => (
          <div key={label} className="border border-[#1a1a3a] p-1.5 text-center">
            <div className="text-[14px] font-mono text-cyan-400">{value}</div>
            <div className="text-[8px] font-mono text-[#404060] tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleRestore}
          className="w-full py-2 text-[10px] font-mono tracking-[2px] border border-cyan-400/50 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 transition-colors uppercase"
        >
          Restore to Workspace
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={handleExport}
            className="flex-1 py-1.5 text-[9px] font-mono tracking-[1px] border border-[#2a2a5a] text-[#7070a0] hover:text-[#a0a0d0] hover:border-[#4a4a8a] transition-colors uppercase"
          >
            Export JSON
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-1.5 text-[9px] font-mono tracking-[1px] border border-[#2a2a5a] text-[#7070a0] hover:text-red-400 hover:border-red-400/40 transition-colors uppercase"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tasks */}
      {record.tasks.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-[#404060] tracking-[3px] uppercase mb-1.5">
            Tasks
          </div>
          <div className="flex flex-col gap-1">
            {record.tasks.map((task) => {
              const taskStatusColor =
                task.status === "completed"
                  ? "text-green-400"
                  : task.status === "failed"
                    ? "text-red-400"
                    : task.status === "skipped"
                      ? "text-[#505080]"
                      : "text-[#7070a0]";
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-2 border-b border-[#0d0d20] py-1 last:border-0"
                >
                  <span className={`text-[9px] font-mono ${taskStatusColor} shrink-0 pt-0.5`}>
                    {task.status === "completed"
                      ? "✓"
                      : task.status === "failed"
                        ? "✗"
                        : task.status === "skipped"
                          ? "—"
                          : "○"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-mono text-[#a0a0c0] truncate">{task.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report summary */}
      {record.report && (
        <div>
          <div className="text-[9px] font-mono text-[#404060] tracking-[3px] uppercase mb-1.5">
            Report
          </div>
          <div className="border border-[#1a1a3a] p-2 text-[9px] font-mono text-[#808090] leading-relaxed">
            {record.report.summary.slice(0, 300)}
            {record.report.summary.length > 300 && "…"}
          </div>
        </div>
      )}
    </div>
  );
}
