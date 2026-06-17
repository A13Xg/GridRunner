"use client";
import { useExecutionStore } from "@/state/executionStore";
import { useTaskStore } from "@/state/taskStore";
import { INITIAL_AGENTS } from "@/data/agents";
import { STATIONS } from "@/data/stations";
import { Badge } from "@/components/ui/badge";
import type { Artifact, ArtifactType } from "@/lib/agents/types";
import type { TaskStatus } from "@/types";

const ARTIFACT_ICONS: Record<ArtifactType, string> = {
  note: "○",
  plan: "◆",
  research: "◈",
  design: "◇",
  review: "✦",
};

const AGENT_COLORS: Record<string, string> = {
  planner: "#ff00ff",
  researcher: "#00ff41",
  builder: "#ff6600",
  reviewer: "#ffff00",
};

function statusVariant(status: TaskStatus) {
  if (status === "completed") return "completed" as const;
  if (status === "in_progress") return "in_progress" as const;
  if (status === "failed") return "failed" as const;
  if (status === "skipped") return "skipped" as const;
  return "queued" as const;
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  return (
    <div className="border border-[#1a1a3a] bg-[#0a0a1a]/60 p-2 mt-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-purple-400">
          {ARTIFACT_ICONS[artifact.type] ?? "○"}
        </span>
        <span className="text-[9px] font-mono tracking-widest text-purple-300 uppercase">
          {artifact.type}
        </span>
        <span className="text-[10px] font-mono text-[#a0a0c0] ml-1">{artifact.title}</span>
      </div>
      <p className="text-[9px] font-mono text-[#606090] leading-relaxed whitespace-pre-wrap">
        {artifact.content}
      </p>
    </div>
  );
}

export function TaskInspector() {
  const { results, selectedTaskId, selectTask } = useExecutionStore();
  const tasks = useTaskStore((s) => s.tasks);

  if (!selectedTaskId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a] shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
          <span className="text-[10px] font-mono tracking-[4px] text-purple-400/80 uppercase">
            Inspector
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-mono text-[#303060] tracking-widest">
            SELECT A TASK TO INSPECT
          </span>
        </div>
      </div>
    );
  }

  const task = tasks.find((t) => t.id === selectedTaskId);
  const result = results[selectedTaskId];
  const agent = task?.assignedAgentId ? INITIAL_AGENTS.find((a) => a.id === task.assignedAgentId) : null;
  const station = task ? STATIONS.find((s) => s.id === task.stationId) : null;
  const agentColor = task?.assignedAgentId ? AGENT_COLORS[task.assignedAgentId] ?? "#606080" : "#606080";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a] shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
        <span className="text-[10px] font-mono tracking-[4px] text-purple-400/80 uppercase">
          Inspector
        </span>
        <button
          onClick={() => selectTask(null)}
          className="ml-auto text-[9px] font-mono text-[#303060] hover:text-cyan-400 transition-colors"
        >
          [close]
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 space-y-3">
        {/* Task meta */}
        {task ? (
          <div className="border border-[#1a1a3a] bg-[#0a0a1a]/60 p-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-mono text-[#c0c0e0] font-semibold tracking-wider">
                {task.title.toUpperCase()}
              </span>
              <Badge variant={statusVariant(task.status)}>
                {task.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-[9px] font-mono text-[#606090] leading-relaxed mb-2">
              {task.description}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {agent && (
                <span className="text-[9px] font-mono" style={{ color: agentColor }}>
                  {agent.name}
                </span>
              )}
              {station && (
                <span className="text-[9px] font-mono text-[#404070]">@ {station.name}</span>
              )}
              {task.progress > 0 && (
                <span className="text-[9px] font-mono text-[#404070]">{task.progress}%</span>
              )}
            </div>
            {task.dependencies && task.dependencies.length > 0 && (
              <div className="mt-1.5">
                <span className="text-[8px] font-mono text-[#303060] tracking-widest uppercase">
                  Deps:{" "}
                </span>
                <span className="text-[8px] font-mono text-[#505070]">
                  {task.dependencies.join(", ")}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[9px] font-mono text-[#303060]">Task not found.</div>
        )}

        {/* Execution result */}
        {result ? (
          <>
            {/* Summary */}
            <div>
              <div className="text-[9px] font-mono tracking-[3px] text-[#404060] uppercase mb-1">
                Summary
              </div>
              <p className="text-[10px] font-mono text-[#a0a0c0] leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Details */}
            {result.details.length > 0 && (
              <div>
                <div className="text-[9px] font-mono tracking-[3px] text-[#404060] uppercase mb-1">
                  Details
                </div>
                <ul className="space-y-1">
                  {result.details.map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[10px] font-mono text-cyan-400/60 shrink-0">›</span>
                      <span className="text-[9px] font-mono text-[#808090] leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Artifacts */}
            {result.artifacts.length > 0 && (
              <div>
                <div className="text-[9px] font-mono tracking-[3px] text-[#404060] uppercase mb-1">
                  Artifacts ({result.artifacts.length})
                </div>
                {result.artifacts.map((a, i) => (
                  <ArtifactCard key={i} artifact={a} />
                ))}
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div>
                <div className="text-[9px] font-mono tracking-[3px] text-amber-400/70 uppercase mb-1">
                  Warnings
                </div>
                <ul className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[10px] font-mono text-amber-400 shrink-0">⚠</span>
                      <span className="text-[9px] font-mono text-amber-300/70 leading-relaxed">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          task && task.status !== "queued" && (
            <div className="text-[9px] font-mono text-[#303060] tracking-widest">
              EXECUTION IN PROGRESS...
            </div>
          )
        )}
      </div>
    </div>
  );
}
