import type { AgentDefinition } from "./types";

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  planner: {
    id: "planner",
    name: "Planner",
    role: "Planner",
    description: "Strategic planning, scope definition, and requirements clarification.",
    defaultProvider: "anthropic",
    defaultModel: "claude-opus-4-8",
    temperature: 0.4,
    maxTokens: 2048,
  },
  researcher: {
    id: "researcher",
    name: "Researcher",
    role: "Researcher",
    description: "Information discovery, analysis planning, and source identification.",
    defaultProvider: "anthropic",
    defaultModel: "claude-opus-4-8",
    temperature: 0.3,
    maxTokens: 2048,
  },
  builder: {
    id: "builder",
    name: "Builder",
    role: "Builder",
    description: "Implementation planning, architecture design, and build sequencing.",
    defaultProvider: "anthropic",
    defaultModel: "claude-opus-4-8",
    temperature: 0.3,
    maxTokens: 2048,
  },
  reviewer: {
    id: "reviewer",
    name: "Reviewer",
    role: "Reviewer",
    description: "Quality assurance, gap analysis, risk identification, and synthesis.",
    defaultProvider: "anthropic",
    defaultModel: "claude-opus-4-8",
    temperature: 0.2,
    maxTokens: 2048,
  },
};

export function getAgentDefinition(agentId: string): AgentDefinition | undefined {
  return AGENT_REGISTRY[agentId.toLowerCase()];
}

export function getAgentRole(agentId: string): string {
  const def = AGENT_REGISTRY[agentId.toLowerCase()];
  if (def) return def.role;
  // Capitalise by convention as fallback
  return agentId.charAt(0).toUpperCase() + agentId.slice(1);
}
