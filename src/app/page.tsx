"use client";
import { useState, useEffect } from "react";
import { GameCanvas } from "@/components/GameCanvas";
import { ObjectiveInput } from "@/components/ObjectiveInput";
import { EventLog } from "@/components/EventLog";
import { TaskQueue } from "@/components/TaskQueue";
import { AgentStatus } from "@/components/AgentStatus";
import { ProviderConsole } from "@/components/ProviderConsole";
import { TaskInspector } from "@/components/TaskInspector";
import { ArtifactWorkspace } from "@/components/artifacts/ArtifactWorkspace";
import { OperationReportPanel } from "@/components/reports/OperationReportPanel";
import { AgentProfilePanel } from "@/components/agents/AgentProfilePanel";
import { OperationHistoryPanel } from "@/components/history/OperationHistoryPanel";
import { useExecutionStore } from "@/state/executionStore";
import { useReportStore } from "@/state/reportStore";
import { useProviderStore } from "@/state/providerStore";
import { useModelStore } from "@/state/modelStore";
import { useAgentProfileStore } from "@/state/agentProfileStore";
import { useHydration } from "@/hooks/useHydration";
import { saveProviderSettings, saveAgentProfiles } from "@/lib/storage/profilePersistence";

type RightTab = "events" | "inspector" | "artifacts" | "report" | "agents" | "history" | "llm";

export default function Home() {
  const [rightTab, setRightTab] = useState<RightTab>("events");
  const selectedTaskId = useExecutionStore((s) => s.selectedTaskId);
  const reportStatus = useReportStore((s) => s.status);
  const selectedProvider = useProviderStore((s) => s.selectedProvider);
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const profiles = useAgentProfileStore((s) => s.profiles);
  const isHydrated = useHydration();

  // Auto-switch to Inspector when a task is selected
  useEffect(() => {
    if (selectedTaskId) setRightTab("inspector");
  }, [selectedTaskId]);

  // Auto-switch to Report when generation completes
  useEffect(() => {
    if (reportStatus === "completed" || reportStatus === "fallback") {
      setRightTab("report");
    }
  }, [reportStatus]);

  // Persist provider/model settings on change (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    void saveProviderSettings(selectedProvider, selectedModelId);
  }, [isHydrated, selectedProvider, selectedModelId]);

  // Persist agent profiles on change (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    void saveAgentProfiles(profiles);
  }, [isHydrated, profiles]);

  const TABS: { id: RightTab; label: string }[] = [
    { id: "events", label: "Log" },
    { id: "inspector", label: "Task" },
    { id: "artifacts", label: "Files" },
    { id: "report", label: "Rep" },
    { id: "agents", label: "Agt" },
    { id: "history", label: "Hist" },
    { id: "llm", label: "LLM" },
  ];

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: "#050510", overflow: "hidden" }}
    >
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-[#1a1a3a] px-4 py-2 flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-6 h-6 border-2 border-cyan-400 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-mono tracking-[6px] text-cyan-400 uppercase">
              NeuralFoundry
            </div>
            <div className="text-[8px] font-mono text-[#303060] tracking-[3px] uppercase">
              Agent Orchestration ∷ v0.6
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-[#1a1a3a]" />

        {/* Objective input */}
        <div className="flex-1">
          <ObjectiveInput />
        </div>

        {/* Status indicators */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-mono text-[#404060] tracking-widest">SYS ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
            <span className="text-[9px] font-mono text-[#404060] tracking-widest">NET SECURE</span>
          </div>
        </div>
      </header>

      {/* ── Main body ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left panel: Agent status ── */}
        <aside className="shrink-0 w-52 border-r border-[#1a1a3a] flex flex-col p-3 gap-3 overflow-y-auto">
          <AgentStatus />

          <div className="border-t border-[#1a1a3a]" />

          {/* Station legend */}
          <div>
            <div className="text-[9px] font-mono tracking-[4px] text-[#404060] uppercase mb-2">
              Stations
            </div>
            {[
              { name: "Command Core", color: "#00ffff" },
              { name: "Planning Terminal", color: "#ff00ff" },
              { name: "Data Nexus", color: "#00ff41" },
              { name: "Fabrication Bay", color: "#ff6600" },
              { name: "QA Station", color: "#ffff00" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-2 py-0.5">
                <div
                  className="w-2 h-2 shrink-0"
                  style={{ background: s.color, opacity: 0.7 }}
                />
                <span className="text-[9px] font-mono text-[#606090] tracking-wide">
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Center: Factory View ── */}
        <main className="flex-1 min-w-0 relative">
          <GameCanvas />
        </main>

        {/* ── Right panel: 5 tabs ── */}
        <aside className="shrink-0 w-80 border-l border-[#1a1a3a] flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[#1a1a3a] shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className={`flex-1 text-[7px] font-mono tracking-[1px] uppercase py-1.5 transition-colors border-b ${
                  rightTab === tab.id
                    ? "text-cyan-400 border-cyan-400/60"
                    : "text-[#303060] border-transparent hover:text-[#505080]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0 p-3 overflow-y-auto">
            {rightTab === "events" && <EventLog />}
            {rightTab === "inspector" && <TaskInspector />}
            {rightTab === "artifacts" && <ArtifactWorkspace />}
            {rightTab === "report" && <OperationReportPanel />}
            {rightTab === "agents" && <AgentProfilePanel />}
            {rightTab === "llm" && <ProviderConsole />}
          </div>
        </aside>
      </div>

      {/* ── Footer: Task Queue ── */}
      <footer
        className="shrink-0 border-t border-[#1a1a3a] px-4 py-2"
        style={{ height: "100px" }}
      >
        <TaskQueue />
      </footer>
    </div>
  );
}
