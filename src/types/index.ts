// ─── Agent ───────────────────────────────────────────────────────────────────

export type AgentShape = "square" | "circle" | "triangle" | "hexagon";

export type AgentState = "idle" | "moving" | "working" | "completed";

export interface Agent {
  id: string;
  name: string;
  role: string;
  shape: AgentShape;
  color: number; // Phaser hex color
  colorHex: string; // CSS hex color
  position: Vec2;
  targetPosition: Vec2 | null;
  state: AgentState;
  currentTaskId: string | null;
  currentStationId: string | null;
}

// ─── Station ─────────────────────────────────────────────────────────────────

export type StationShape = "rectangle" | "hexagon" | "octagon" | "diamond" | "cross";

export interface Station {
  id: string;
  name: string;
  shape: StationShape;
  color: number;
  colorHex: string;
  position: Vec2;
  size: number;
}

// ─── Task ────────────────────────────────────────────────────────────────────

export type TaskStatus = "queued" | "in_progress" | "completed" | "failed" | "skipped";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgentId: string | null;
  stationId: string;
  progress: number; // 0–100
  status: TaskStatus;
  durationMs: number;
  order: number;
  dependencies?: string[];
}

// ─── Event ───────────────────────────────────────────────────────────────────

export type EventType =
  | "operation_started"
  | "task_started"
  | "agent_moving"
  | "agent_arrived"
  | "task_completed"
  | "operation_completed"
  | "system"
  | "ai_planning_started"
  | "ai_planning_completed"
  | "ai_planning_failed"
  | "ai_fallback_used"
  | "agent_execution_started"
  | "agent_execution_completed"
  | "agent_execution_failed"
  | "artifact_created"
  | "artifact_added"
  | "report_generation_started"
  | "report_generation_completed"
  | "report_generation_failed"
  | "report_fallback_used"
  | "agent_profile_updated"
  | "agent_profile_reset"
  | "agent_disabled"
  | "agent_settings_applied"
  | "operation_saved"
  | "operation_loaded"
  | "operation_exported"
  | "operation_imported"
  | "history_cleared";

export interface GameEvent {
  id: string;
  type: EventType;
  message: string;
  agentId?: string;
  taskId?: string;
  timestamp: number;
}

// ─── Simulation ───────────────────────────────────────────────────────────────

export type SimulationStatus = "idle" | "running" | "completed";

export interface SimulationState {
  status: SimulationStatus;
  objective: string;
  currentTaskIndex: number;
  startedAt: number | null;
}

// ─── Util ────────────────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}
