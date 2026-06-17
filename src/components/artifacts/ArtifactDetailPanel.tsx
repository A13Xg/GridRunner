"use client";
import type { WorkspaceArtifact, WorkspaceArtifactType } from "@/lib/artifacts/types";

const TYPE_ICONS: Record<WorkspaceArtifactType, string> = {
  note: "○",
  plan: "◆",
  research: "◈",
  design: "◇",
  review: "✦",
  report: "◉",
};

const TYPE_COLORS: Record<WorkspaceArtifactType, string> = {
  note: "text-[#6060a0]",
  plan: "text-violet-400",
  research: "text-cyan-400",
  design: "text-orange-400",
  review: "text-yellow-400",
  report: "text-emerald-400",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

interface ArtifactDetailPanelProps {
  artifact: WorkspaceArtifact;
  onBack: () => void;
}

export function ArtifactDetailPanel({ artifact, onBack }: ArtifactDetailPanelProps) {
  const icon = TYPE_ICONS[artifact.type];
  const color = TYPE_COLORS[artifact.type];

  return (
    <div className="flex flex-col h-full">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[9px] font-mono text-[#404070] hover:text-cyan-400 transition-colors mb-3 self-start"
      >
        <span>←</span>
        <span>BACK TO WORKSPACE</span>
      </button>

      {/* Title */}
      <div className="border-b border-[#1a1a3a] pb-2 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm ${color}`}>{icon}</span>
          <span className="text-[11px] font-mono text-[#c0c0e0] font-semibold tracking-wider">
            {artifact.title}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <span className={`text-[9px] font-mono tracking-widest uppercase ${color}`}>
            {artifact.type}
          </span>
          <span className="text-[9px] font-mono text-[#404070]">by {artifact.agentRole}</span>
          <span className="text-[9px] font-mono text-[#303060]">{formatTime(artifact.createdAt)}</span>
        </div>
        {artifact.tags.length > 0 && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {artifact.tags.map((tag) => (
              <span
                key={tag}
                className="text-[8px] font-mono text-[#404060] border border-[#1a1a3a] px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <pre className="text-[9px] font-mono text-[#909090] leading-relaxed whitespace-pre-wrap break-words">
          {artifact.content}
        </pre>
      </div>
    </div>
  );
}
