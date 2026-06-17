"use client";
import { useState } from "react";
import { useAgentProfileStore } from "@/state/agentProfileStore";
import { useEventStore } from "@/state/eventStore";
import { isProfileValid } from "@/lib/agents/profileValidation";
import { AgentProfileEditor } from "./AgentProfileEditor";
import type { AgentRole } from "@/lib/agents/taskGraphSchema";

const ALL_ROLES: AgentRole[] = ["Planner", "Researcher", "Builder", "Reviewer"];

const ROLE_ICONS: Record<AgentRole, string> = {
  Planner: "◆",
  Researcher: "◈",
  Builder: "◇",
  Reviewer: "✦",
};

const ROLE_COLORS: Record<AgentRole, string> = {
  Planner: "text-violet-400",
  Researcher: "text-cyan-400",
  Builder: "text-orange-400",
  Reviewer: "text-yellow-400",
};

export function AgentProfilePanel() {
  const { profiles, resetAll } = useAgentProfileStore();
  const addEvent = useEventStore((s) => s.addEvent);
  const [editingRole, setEditingRole] = useState<AgentRole | null>(null);

  if (editingRole) {
    return (
      <AgentProfileEditor
        role={editingRole}
        onBack={() => setEditingRole(null)}
      />
    );
  }

  function handleResetAll() {
    resetAll();
    addEvent("agent_profile_reset", "All agent profiles reset to defaults");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a] shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60" />
        <span className="text-[10px] font-mono tracking-[4px] text-violet-400/80 uppercase">
          Agent Profiles
        </span>
        <button
          onClick={handleResetAll}
          className="ml-auto text-[8px] font-mono text-[#303060] hover:text-amber-400 transition-colors tracking-widest"
        >
          Reset All
        </button>
      </div>

      {/* Profile cards */}
      <div className="flex-1 overflow-y-auto mt-2 space-y-2 min-h-0">
        {ALL_ROLES.map((role) => {
          const profile = profiles[role];
          const valid = isProfileValid(profile);
          const icon = ROLE_ICONS[role];
          const color = ROLE_COLORS[role];
          const isModified =
            profile.provider !== "anthropic" ||
            profile.model !== "claude-opus-4-8" ||
            !profile.enabled;

          return (
            <button
              key={role}
              onClick={() => setEditingRole(role)}
              className="w-full text-left border border-[#1a1a3a] bg-[#0a0a1a]/50 hover:border-cyan-400/40 hover:bg-cyan-400/5 p-2.5 transition-all group"
            >
              {/* Role header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${color}`}>{icon}</span>
                  <span className="text-[10px] font-mono text-[#c0c0e0] font-semibold tracking-wider">
                    {role.toUpperCase()}
                  </span>
                  {isModified && (
                    <span className="text-[7px] font-mono text-amber-400/60">MODIFIED</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!valid && (
                    <span className="text-[8px] font-mono text-red-400">⚠ INVALID</span>
                  )}
                  <span
                    className={`text-[8px] font-mono tracking-widest ${
                      profile.enabled ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {profile.enabled ? "ON" : "OFF"}
                  </span>
                </div>
              </div>

              {/* Settings summary */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="text-[8px] font-mono text-[#404070]">{profile.provider}</span>
                <span className="text-[8px] font-mono text-[#303060]">{profile.model}</span>
                <span className="text-[8px] font-mono text-[#303060]">
                  temp {profile.temperature.toFixed(2)}
                </span>
                <span className="text-[8px] font-mono text-[#303060]">
                  {profile.maxTokens.toLocaleString()} tok
                </span>
              </div>

              {/* Instructions preview */}
              <p className="text-[8px] font-mono text-[#404060] mt-1 leading-relaxed line-clamp-1 group-hover:text-[#505070] transition-colors">
                {profile.systemInstructions.split("\n")[0]}
              </p>
            </button>
          );
        })}

        {/* Info note */}
        <div className="border border-[#111130] bg-[#050510]/60 p-2 mt-1">
          <p className="text-[8px] font-mono text-[#303060] leading-relaxed">
            Profile settings are applied per-task during execution. Disabled agents will have
            their tasks marked as skipped. Instructions are appended to the base role prompt.
          </p>
        </div>
      </div>
    </div>
  );
}
