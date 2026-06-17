import type { Task } from "@/types";
import type { GraphTask, TaskGraph } from "./taskGraphSchema";
import { nanoid } from "@/lib/nanoid";

// ─── Static Mappings ──────────────────────────────────────────────────────────

const ROLE_TO_AGENT_ID: Record<string, string> = {
  Planner: "planner",
  Researcher: "researcher",
  Builder: "builder",
  Reviewer: "reviewer",
};

const STATION_NAME_TO_ID: Record<string, string> = {
  "Command Core": "command-core",
  "Planning Terminal": "planning-terminal",
  "Data Nexus": "data-nexus",
  "Fabrication Bay": "fabrication-bay",
  "QA Station": "qa-station",
};

const COMPLEXITY_TO_DURATION_MS: Record<string, number> = {
  low: 4000,
  medium: 6000,
  high: 8000,
};

// ─── Adapters ─────────────────────────────────────────────────────────────────

export function graphTaskToSimTask(graphTask: GraphTask, order: number): Task {
  return {
    id: nanoid(),
    title: graphTask.title,
    description: graphTask.description,
    assignedAgentId: ROLE_TO_AGENT_ID[graphTask.agentRole] ?? "planner",
    stationId: STATION_NAME_TO_ID[graphTask.station] ?? "command-core",
    progress: 0,
    status: "queued",
    durationMs: COMPLEXITY_TO_DURATION_MS[graphTask.estimatedComplexity] ?? 5000,
    order,
    dependencies: graphTask.dependencies,
  };
}

export function taskGraphToSimTasks(graph: TaskGraph): Task[] {
  return graph.tasks.map((t, i) => graphTaskToSimTask(t, i));
}
