import type { Task } from "@/types";
import { nanoid } from "@/lib/nanoid";

interface WorkflowTemplate {
  title: string;
  description: string;
  agentId: string;
  stationId: string;
  durationMs: number;
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    title: "Planning",
    description: "Define scope, milestones, and resource allocation",
    agentId: "planner",
    stationId: "planning-terminal",
    durationMs: 5000,
  },
  {
    title: "Research",
    description: "Gather requirements, data sources, and technical specs",
    agentId: "researcher",
    stationId: "data-nexus",
    durationMs: 6000,
  },
  {
    title: "Build",
    description: "Fabricate and assemble core components",
    agentId: "builder",
    stationId: "fabrication-bay",
    durationMs: 7000,
  },
  {
    title: "Review",
    description: "Quality assurance, validation, and sign-off",
    agentId: "reviewer",
    stationId: "qa-station",
    durationMs: 5000,
  },
];

export function generateTasks(objective: string): Task[] {
  return WORKFLOW_TEMPLATES.map((tpl, i) => ({
    id: nanoid(),
    title: tpl.title,
    description: `${tpl.description} for: "${objective}"`,
    assignedAgentId: tpl.agentId,
    stationId: tpl.stationId,
    progress: 0,
    status: "queued" as const,
    durationMs: tpl.durationMs,
    order: i,
  }));
}
