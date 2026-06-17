import { create } from "zustand";
import type { AgentExecutionResult } from "@/lib/agents/types";

interface ExecutionStore {
  results: Record<string, AgentExecutionResult>;
  selectedTaskId: string | null;
  setResult: (taskId: string, result: AgentExecutionResult) => void;
  selectTask: (id: string | null) => void;
  clearResults: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  results: {},
  selectedTaskId: null,

  setResult: (taskId, result) =>
    set((s) => ({ results: { ...s.results, [taskId]: result } })),

  selectTask: (selectedTaskId) => set({ selectedTaskId }),

  clearResults: () => set({ results: {}, selectedTaskId: null }),
}));
