"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSimulationStore } from "@/state/simulationStore";
import { useSimulation } from "@/hooks/useSimulation";

const EXAMPLE_OBJECTIVES = [
  "Build a weather app",
  "Design a REST API",
  "Create a data pipeline",
  "Deploy a microservice",
];

const PLANNING_STATUS_CONFIG = {
  idle: null,
  planning: { label: "PLANNING WITH AI", color: "text-violet-400", pulse: true },
  ready: { label: "PLAN GENERATED", color: "text-violet-300", pulse: false },
  fallback: { label: "FALLBACK USED", color: "text-amber-400", pulse: false },
  error: { label: "PLAN FAILED", color: "text-red-400", pulse: false },
} as const;

export function ObjectiveInput() {
  const [value, setValue] = useState("");
  const status = useSimulationStore((s) => s.status);
  const planningStatus = useSimulationStore((s) => s.planningStatus);
  const { startOperation, reset } = useSimulation();

  const isPlanning = planningStatus === "planning";
  const isRunning = status === "running";
  const isActive = isPlanning || isRunning;

  const handleStart = () => {
    if (!value.trim() || isActive) return;
    startOperation(value.trim());
  };

  const handleReset = () => {
    reset();
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleStart();
  };

  const planningConfig = PLANNING_STATUS_CONFIG[planningStatus];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono tracking-[4px] text-cyan-400/60 uppercase whitespace-nowrap">
          Objective
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/20 to-transparent" />

        {/* Planning / Simulation status indicator */}
        {isPlanning && (
          <span className="text-[10px] font-mono text-violet-400 tracking-widest animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
            PLANNING WITH AI
          </span>
        )}
        {isRunning && (
          <span className="text-[10px] font-mono text-cyan-400 tracking-widest flex items-center gap-1.5">
            <span className="cursor-blink">█</span> RUNNING
          </span>
        )}
        {!isActive && planningConfig && (
          <span
            className={`text-[10px] font-mono tracking-widest ${planningConfig.color} ${planningConfig.pulse ? "animate-pulse" : ""}`}
          >
            {planningConfig.label}
          </span>
        )}
        {!isActive && status === "completed" && !planningConfig && (
          <span className="text-[10px] font-mono text-green-400 tracking-widest">
            ✓ COMPLETE
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ENTER OPERATION OBJECTIVE..."
          disabled={isActive}
          className="flex-1"
        />
        <Button
          variant="neon"
          onClick={handleStart}
          disabled={!value.trim() || isActive}
          className="min-w-[160px]"
        >
          {isPlanning ? "PLANNING..." : isRunning ? "RUNNING..." : "Start Operation"}
        </Button>
        <Button
          variant="ghost"
          onClick={handleReset}
          disabled={status === "idle" && planningStatus === "idle"}
          className="min-w-[80px] text-[10px]"
        >
          Reset
        </Button>
      </div>

      {/* Example objectives — only show when fully idle */}
      {!isActive && status === "idle" && planningStatus === "idle" && (
        <div className="flex gap-2 flex-wrap">
          {EXAMPLE_OBJECTIVES.map((ex) => (
            <button
              key={ex}
              onClick={() => setValue(ex)}
              className="text-[9px] font-mono text-[#4040a0] hover:text-cyan-400/70 tracking-widest uppercase transition-colors border border-[#1a1a30] hover:border-cyan-400/20 px-2 py-0.5"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
