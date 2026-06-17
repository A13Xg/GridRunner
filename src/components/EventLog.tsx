"use client";
import { useEventStore } from "@/state/eventStore";
import type { GameEvent, EventType } from "@/types";

const EVENT_COLORS: Record<EventType, string> = {
  system: "text-[#6060a0]",
  operation_started: "text-cyan-400",
  operation_completed: "text-green-400",
  task_started: "text-cyan-300",
  task_completed: "text-green-300",
  agent_moving: "text-yellow-400",
  agent_arrived: "text-orange-400",
  ai_planning_started: "text-violet-400",
  ai_planning_completed: "text-violet-300",
  ai_planning_failed: "text-red-400",
  ai_fallback_used: "text-amber-400",
  agent_execution_started: "text-blue-400",
  agent_execution_completed: "text-emerald-400",
  agent_execution_failed: "text-red-500",
  artifact_created: "text-purple-400",
  artifact_added: "text-purple-300",
  report_generation_started: "text-emerald-400",
  report_generation_completed: "text-green-400",
  report_generation_failed: "text-red-400",
  report_fallback_used: "text-amber-400",
  agent_profile_updated: "text-violet-300",
  agent_profile_reset: "text-amber-300",
  agent_disabled: "text-red-400",
  agent_settings_applied: "text-[#6060a0]",
  operation_saved: "text-[#6060a0]",
  operation_loaded: "text-cyan-300",
  operation_exported: "text-violet-300",
  operation_imported: "text-violet-300",
  history_cleared: "text-amber-400",
};

const EVENT_ICONS: Record<EventType, string> = {
  system: "○",
  operation_started: "◈",
  operation_completed: "◉",
  task_started: "▷",
  task_completed: "✓",
  agent_moving: "→",
  agent_arrived: "◎",
  ai_planning_started: "◆",
  ai_planning_completed: "◇",
  ai_planning_failed: "✗",
  ai_fallback_used: "⚠",
  agent_execution_started: "►",
  agent_execution_completed: "✦",
  agent_execution_failed: "⊗",
  artifact_created: "◫",
  artifact_added: "◫",
  report_generation_started: "◈",
  report_generation_completed: "◉",
  report_generation_failed: "✗",
  report_fallback_used: "⚠",
  agent_profile_updated: "◆",
  agent_profile_reset: "↺",
  agent_disabled: "⊗",
  agent_settings_applied: "○",
  operation_saved: "◫",
  operation_loaded: "◈",
  operation_exported: "↗",
  operation_imported: "↙",
  history_cleared: "⊘",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function EventRow({ event }: { event: GameEvent }) {
  const color = EVENT_COLORS[event.type];
  const icon = EVENT_ICONS[event.type];
  return (
    <div className="flex gap-2 py-1 border-b border-[#0d0d20] last:border-0 group">
      <span className="text-[9px] font-mono text-[#303060] whitespace-nowrap pt-0.5">
        {formatTime(event.timestamp)}
      </span>
      <span className={`text-[10px] font-mono ${color} shrink-0`}>{icon}</span>
      <span className="text-[10px] font-mono text-[#a0a0c0] leading-relaxed group-hover:text-[#c0c0e0] transition-colors">
        {event.message}
      </span>
    </div>
  );
}

export function EventLog() {
  const events = useEventStore((s) => s.events);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a] shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-mono tracking-[4px] text-cyan-400/80 uppercase">
          Event Log
        </span>
        <span className="ml-auto text-[9px] font-mono text-[#303060]">
          {events.length} entries
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 space-y-0">
        {events.length === 0 ? (
          <div className="text-[10px] font-mono text-[#303060] tracking-widest pt-4 text-center">
            AWAITING INPUT<span className="cursor-blink">_</span>
          </div>
        ) : (
          events.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
