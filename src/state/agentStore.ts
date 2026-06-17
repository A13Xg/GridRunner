import { create } from "zustand";
import type { Agent, AgentState, Vec2 } from "@/types";
import { INITIAL_AGENTS } from "@/data/agents";

interface AgentStore {
  agents: Agent[];
  setAgentState: (id: string, state: AgentState) => void;
  setAgentPosition: (id: string, position: Vec2) => void;
  setAgentTarget: (id: string, target: Vec2 | null) => void;
  setAgentTask: (id: string, taskId: string | null, stationId: string | null) => void;
  resetAgents: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: INITIAL_AGENTS.map((a) => ({ ...a })),

  setAgentState: (id, state) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, state } : a)),
    })),

  setAgentPosition: (id, position) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, position } : a)),
    })),

  setAgentTarget: (id, targetPosition) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, targetPosition } : a)),
    })),

  setAgentTask: (id, currentTaskId, currentStationId) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, currentTaskId, currentStationId } : a
      ),
    })),

  resetAgents: () =>
    set({ agents: INITIAL_AGENTS.map((a) => ({ ...a })) }),
}));
