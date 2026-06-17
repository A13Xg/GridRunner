"use client";
import { useRef } from "react";
import { useHistoryStore } from "@/state/historyStore";
import { useEventStore } from "@/state/eventStore";
import { deleteOperation, clearAllOperations } from "@/lib/storage/operationPersistence";
import { exportOperationJSON, importOperationJSON } from "@/lib/storage/exportImport";
import { loadOperation } from "@/lib/storage/operationPersistence";
import { recordToSummary } from "@/lib/storage/types";
import { OperationDetailView } from "./OperationDetailView";
import type { OperationSummary } from "@/lib/storage/types";

const STATUS_COLORS: Record<string, string> = {
  Completed: "text-green-400",
  PartiallyCompleted: "text-amber-400",
  Failed: "text-red-400",
  Running: "text-cyan-400",
  Draft: "text-[#6060a0]",
};

const STATUS_DOTS: Record<string, string> = {
  Completed: "bg-green-400",
  PartiallyCompleted: "bg-amber-400",
  Failed: "bg-red-400",
  Running: "bg-cyan-400 animate-pulse",
  Draft: "bg-[#404060]",
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

function SummaryCard({
  summary,
  onOpen,
  onExport,
  onDelete,
}: {
  summary: OperationSummary;
  onOpen: () => void;
  onExport: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const statusColor = STATUS_COLORS[summary.status] ?? "text-[#6060a0]";
  const dotClass = STATUS_DOTS[summary.status] ?? "bg-[#404060]";

  return (
    <div
      className="border border-[#1a1a3a] hover:border-[#2a2a5a] transition-colors cursor-pointer group"
      onClick={onOpen}
    >
      <div className="p-2">
        <div className="flex items-start gap-2 mb-1">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${dotClass}`} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono text-[#c0c0e0] leading-snug truncate group-hover:text-white transition-colors">
              {summary.operationName || summary.objective}
            </div>
            {summary.operationName && (
              <div className="text-[8px] font-mono text-[#505080] truncate mt-0.5">
                {summary.objective}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3.5">
          <span className={`text-[8px] font-mono ${statusColor}`}>{summary.status}</span>
          <span className="text-[8px] font-mono text-[#303060]">·</span>
          <span className="text-[8px] font-mono text-[#404060]">{summary.taskCount}t</span>
          <span className="text-[8px] font-mono text-[#404060]">{summary.artifactCount}a</span>
          <span className="ml-auto text-[8px] font-mono text-[#303060]">
            {formatDate(summary.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex border-t border-[#0d0d1a]">
        <button
          className="flex-1 py-1 text-[8px] font-mono text-[#404060] hover:text-cyan-400 hover:bg-cyan-400/5 transition-colors tracking-wider"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
        >
          Open
        </button>
        <div className="w-px bg-[#0d0d1a]" />
        <button
          className="flex-1 py-1 text-[8px] font-mono text-[#404060] hover:text-violet-400 hover:bg-violet-400/5 transition-colors tracking-wider"
          onClick={onExport}
        >
          Export
        </button>
        <div className="w-px bg-[#0d0d1a]" />
        <button
          className="flex-1 py-1 text-[8px] font-mono text-[#404060] hover:text-red-400 hover:bg-red-400/5 transition-colors tracking-wider"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function OperationHistoryPanel() {
  const { summaries, isLoaded, selectedOperationId, selectOperation, removeSummary, clearSummaries } =
    useHistoryStore();
  const { addEvent } = useEventStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (selectedOperationId) {
    return <OperationDetailView />;
  }

  async function handleExport(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const record = await loadOperation(id);
    if (record) {
      exportOperationJSON(record);
      addEvent("operation_exported", `Operation exported: "${record.operationName}"`);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const summary = summaries.find((s) => s.id === id);
    const name = summary?.operationName || summary?.objective || id;
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteOperation(id);
    removeSummary(id);
  }

  async function handleClearAll() {
    if (summaries.length === 0) return;
    if (!confirm(`Delete all ${summaries.length} operation records? This cannot be undone.`)) return;
    await clearAllOperations();
    clearSummaries();
    addEvent("history_cleared", "All operation history cleared");
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const result = await importOperationJSON(file);
    if (result.success && result.record) {
      useHistoryStore.getState().addOrUpdateSummary(recordToSummary(result.record));
      addEvent("operation_imported", `Imported: "${result.record.operationName || result.record.objective}"`);
    } else {
      addEvent("system", `Import failed: ${result.error ?? "unknown error"}`);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a] shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        <span className="text-[10px] font-mono tracking-[4px] text-violet-400/80 uppercase">
          History
        </span>
        <span className="ml-auto text-[9px] font-mono text-[#303060]">
          {summaries.length} records
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex gap-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-1.5 text-[9px] font-mono tracking-[1px] border border-[#2a2a5a] text-[#7070a0] hover:text-violet-400 hover:border-violet-400/40 transition-colors uppercase"
        >
          Import JSON
        </button>
        <button
          onClick={handleClearAll}
          disabled={summaries.length === 0}
          className="flex-1 py-1.5 text-[9px] font-mono tracking-[1px] border border-[#2a2a5a] text-[#7070a0] hover:text-red-400 hover:border-red-400/40 transition-colors uppercase disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportChange}
        />
      </div>

      {/* List */}
      {!isLoaded ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <div className="w-3 h-3 border border-violet-400/50 border-t-violet-400 rounded-full animate-spin" />
          <span className="text-[9px] font-mono text-[#303060] tracking-widest">LOADING…</span>
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-[10px] font-mono text-[#303060] tracking-widest mb-1">
            NO HISTORY
          </div>
          <div className="text-[9px] font-mono text-[#252540]">
            Operations are saved automatically
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {summaries.map((summary) => (
            <SummaryCard
              key={summary.id}
              summary={summary}
              onOpen={() => selectOperation(summary.id)}
              onExport={(e) => handleExport(summary.id, e)}
              onDelete={(e) => handleDelete(summary.id, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
