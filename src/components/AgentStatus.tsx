"use client";
import { useAgentStore } from "@/state/agentStore";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/types";

const SHAPE_ICONS: Record<Agent["shape"], string> = {
  square: "■",
  circle: "●",
  triangle: "▲",
  hexagon: "⬡",
};

function AgentRow({ agent }: { agent: Agent }) {
  const isActive = agent.state === "working" || agent.state === "moving";

  return (
    <div
      className={`flex items-center gap-2 py-1.5 px-2 border-b border-[#0d0d20] last:border-0 transition-all ${
        isActive ? "bg-[#0a0a18]" : ""
      }`}
    >
      <span
        className={`text-sm ${agent.state === "working" ? "working-pulse" : ""}`}
        style={{ color: agent.colorHex }}
      >
        {SHAPE_ICONS[agent.shape]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-mono font-semibold tracking-wider"
            style={{ color: agent.colorHex }}
          >
            {agent.name.toUpperCase()}
          </span>
        </div>
        <div className="text-[9px] font-mono text-[#404068] tracking-wide">
          {agent.role}
        </div>
      </div>
      <Badge variant={agent.state as Parameters<typeof Badge>[0]["variant"]}>
        {agent.state}
      </Badge>
    </div>
  );
}

export function AgentStatus() {
  const agents = useAgentStore((s) => s.agents);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a]">
        <div className="w-1.5 h-1.5 rounded-full bg-magenta-400 bg-[#ff00ff]" />
        <span className="text-[10px] font-mono tracking-[4px] text-[#ff00ff]/80 uppercase">
          Agents
        </span>
      </div>
      <div className="mt-1">
        {agents.map((a) => (
          <AgentRow key={a.id} agent={a} />
        ))}
      </div>
    </div>
  );
}
