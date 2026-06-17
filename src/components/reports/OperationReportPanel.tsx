"use client";
import { useCallback } from "react";
import { useReportStore } from "@/state/reportStore";
import { useSimulationStore } from "@/state/simulationStore";

function downloadMarkdown(markdown: string, title: string) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const filename = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  a.download = `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyMarkdown(markdown: string): Promise<void> {
  return navigator.clipboard.writeText(markdown);
}

export function OperationReportPanel() {
  const { report, status, error } = useReportStore();
  const operationName = useSimulationStore((s) => s.operationName || s.objective);

  const handleCopy = useCallback(async () => {
    if (!report) return;
    await copyMarkdown(report.markdown).catch(() => {});
  }, [report]);

  const handleDownload = useCallback(() => {
    if (!report) return;
    downloadMarkdown(report.markdown, report.title || operationName || "report");
  }, [report, operationName]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a] shrink-0">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            status === "completed"
              ? "bg-green-400"
              : status === "generating"
              ? "bg-cyan-400 animate-pulse"
              : status === "fallback"
              ? "bg-amber-400"
              : status === "failed"
              ? "bg-red-400"
              : "bg-[#303060]"
          }`}
        />
        <span className="text-[10px] font-mono tracking-[4px] text-emerald-400/80 uppercase">
          Report
        </span>
        <span className="ml-auto text-[9px] font-mono text-[#303060] uppercase tracking-widest">
          {status === "idle" && "IDLE"}
          {status === "generating" && "GENERATING..."}
          {status === "completed" && "READY"}
          {status === "fallback" && "FALLBACK"}
          {status === "failed" && "FAILED"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mt-2 min-h-0">
        {status === "idle" && (
          <div className="flex items-center justify-center h-full">
            <span className="text-[10px] font-mono text-[#303060] tracking-widest text-center leading-relaxed">
              REPORT WILL GENERATE AUTOMATICALLY WHEN OPERATION COMPLETES
            </span>
          </div>
        )}

        {status === "generating" && (
          <div className="flex items-center justify-center h-full gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-400/70 tracking-widest">
              SYNTHESIZING REPORT...
            </span>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span className="text-[10px] font-mono text-red-400 tracking-widest">
              GENERATION FAILED
            </span>
            {error && (
              <span className="text-[9px] font-mono text-[#505070] text-center">
                {error}
              </span>
            )}
          </div>
        )}

        {(status === "completed" || status === "fallback") && report && (
          <div className="space-y-3">
            {/* Fallback badge */}
            {status === "fallback" && (
              <div className="border border-amber-400/40 bg-amber-400/5 px-2 py-1.5">
                <span className="text-[9px] font-mono text-amber-400 tracking-widest">
                  ⚠ FALLBACK MODE — AI provider unavailable
                </span>
              </div>
            )}

            {/* Title + summary */}
            <div className="border border-[#1a1a3a] bg-[#0a0a1a]/60 p-2">
              <div className="text-[11px] font-mono text-[#c0c0e0] font-semibold mb-1 leading-snug">
                {report.title}
              </div>
              <p className="text-[9px] font-mono text-[#808090] leading-relaxed">
                {report.summary}
              </p>
            </div>

            {/* Warnings */}
            {report.warnings.filter(w => !w.toLowerCase().includes("fallback")).length > 0 && (
              <div>
                <div className="text-[8px] font-mono tracking-[3px] text-amber-400/70 uppercase mb-1">
                  Warnings
                </div>
                {report.warnings
                  .filter(w => !w.toLowerCase().includes("fallback"))
                  .map((w, i) => (
                    <div key={i} className="flex gap-1.5 py-0.5">
                      <span className="text-amber-400 text-[9px]">⚠</span>
                      <span className="text-[9px] font-mono text-amber-300/70">{w}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Markdown preview */}
            <div>
              <div className="text-[8px] font-mono tracking-[3px] text-[#404060] uppercase mb-1">
                Markdown Report
              </div>
              <div className="border border-[#1a1a3a] bg-[#050510] p-2 max-h-64 overflow-y-auto">
                <pre className="text-[8px] font-mono text-[#606080] leading-relaxed whitespace-pre-wrap break-words">
                  {report.markdown}
                </pre>
              </div>
            </div>

            {/* Export actions */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="flex-1 text-[9px] font-mono tracking-widest uppercase py-1.5 border border-[#1a1a3a] text-[#404060] hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
              >
                Copy MD
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 text-[9px] font-mono tracking-widest uppercase py-1.5 border border-[#1a1a3a] text-[#404060] hover:border-emerald-400/40 hover:text-emerald-400 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
