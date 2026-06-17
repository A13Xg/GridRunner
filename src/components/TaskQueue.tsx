"use client";
import { useTaskStore } from "@/state/taskStore";
import { useAgentStore } from "@/state/agentStore";
import { useExecutionStore } from "@/state/executionStore";
import { INITIAL_AGENTS } from "@/data/agents";
import { STATIONS } from "@/data/stations";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskStatus } from "@/types";

const AGENT_COLORS: Record<string, string> = {
  planner: "#ff00ff",
  researcher: "#00ff41",
  builder: "#ff6600",
  reviewer: "#ffff00",
};

function statusVariant(status: TaskStatus) {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  if (status === "failed") return "failed";
  if (status === "skipped") return "skipped";
  return "queued";
}

function TaskCard({
  task,
  isActive,
  hasResult,
  isSelected,
  onClick,
}: {
  task: Task;
  isActive: boolean;
  hasResult: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const agent = INITIAL_AGENTS.find((a) => a.id === task.assignedAgentId);
  const station = STATIONS.find((s) => s.id === task.stationId);
  const agentColor = task.assignedAgentId ? AGENT_COLORS[task.assignedAgentId] : "#606080";

  const borderClass = isSelected
    ? "border-cyan-400 shadow-[0_0_12px_rgba(0,255,255,0.2)]"
    : isActive
    ? "border-cyan-400/60 bg-cyan-400/5 shadow-[0_0_8px_rgba(0,255,255,0.1)]"
    : task.status === "completed"
    ? "border-[#1a3a1a] bg-[#0a1a0a]/50"
    : task.status === "failed"
    ? "border-red-500/40 bg-red-500/5"
    : task.status === "skipped"
    ? "border-[#1a1a30] bg-[#0a0a18]/50 opacity-60"
    : "border-[#1a1a3a] bg-[#0a0a1a]/50";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border px-3 py-2 transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-400/5 cursor-pointer ${borderClass}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#303060]">
            T{String(task.order + 1).padStart(2, "0")}
          </span>
          <span className="text-[11px] font-mono text-[#c0c0e0] tracking-wider font-semibold">
            {task.title.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasResult && (
            <span
              className="text-[8px] text-purple-400 leading-none"
              title="Execution result available"
            >
              ◈
            </span>
          )}
          <Badge variant={statusVariant(task.status)}>
            {task.status === "in_progress" ? "ACTIVE" : task.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {agent && (
            <span
              className="text-[9px] font-mono tracking-widest"
              style={{ color: agentColor }}
            >
              {agent.name.toUpperCase()}
            </span>
          )}
          {station && (
            <span className="text-[9px] font-mono text-[#404070] tracking-wide">
              @ {station.name}
            </span>
          )}
        </div>

        {task.status !== "queued" && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-[#111122] relative overflow-hidden">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${task.progress}%`,
                  backgroundColor:
                    task.status === "completed"
                      ? "#00ff41"
                      : task.status === "failed"
                      ? "#ff4444"
                      : "#00ffff",
                  boxShadow:
                    task.status === "completed"
                      ? "0 0 4px rgba(0,255,65,0.6)"
                      : task.status === "failed"
                      ? "0 0 4px rgba(255,68,68,0.6)"
                      : "0 0 4px rgba(0,255,255,0.6)",
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#404070] w-7 text-right">
              {task.progress}%
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export function TaskQueue() {
  const tasks = useTaskStore((s) => s.tasks);
  const agents = useAgentStore((s) => s.agents);
  const { results, selectedTaskId, selectTask } = useExecutionStore();

  const activeTaskIds = new Set(agents.map((a) => a.currentTaskId).filter(Boolean));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a] shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-400/80" />
        <span className="text-[10px] font-mono tracking-[4px] text-orange-400/80 uppercase">
          Task Queue
        </span>
        <span className="ml-auto text-[9px] font-mono text-[#303060]">
          {tasks.filter((t) => t.status === "completed").length}/
        {tasks.filter((t) => t.status !== "skipped").length} done
        </span>
        {selectedTaskId && (
          <button
            onClick={() => selectTask(null)}
            className="text-[9px] font-mono text-[#303060] hover:text-cyan-400 transition-colors"
          >
            [clear]
          </button>
        )}
      </div>

      <div className="flex-1 overflow-x-auto mt-2">
        {tasks.length === 0 ? (
          <div className="text-[10px] font-mono text-[#303060] tracking-widest pt-4 text-center">
            NO TASKS QUEUED
          </div>
        ) : (
          <div className="flex gap-3 min-w-max pb-2">
            {tasks.map((task) => (
              <div key={task.id} className="w-60 shrink-0">
                <TaskCard
                  task={task}
                  isActive={activeTaskIds.has(task.id)}
                  hasResult={!!results[task.id]}
                  isSelected={selectedTaskId === task.id}
                  onClick={() => selectTask(selectedTaskId === task.id ? null : task.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
