import { create } from "zustand";
import type { SimulationStatus } from "@/types";

export type PlanningStatus = "idle" | "planning" | "ready" | "fallback" | "error";

interface SimulationStore {
  status: SimulationStatus;
  objective: string;
  currentTaskIndex: number;
  planningStatus: PlanningStatus;
  operationName: string;
  setObjective: (objective: string) => void;
  setStatus: (status: SimulationStatus) => void;
  setCurrentTaskIndex: (index: number) => void;
  setPlanningStatus: (status: PlanningStatus) => void;
  setOperationName: (name: string) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  status: "idle",
  objective: "",
  currentTaskIndex: -1,
  planningStatus: "idle",
  operationName: "",

  setObjective: (objective) => set({ objective }),
  setStatus: (status) => set({ status }),
  setCurrentTaskIndex: (currentTaskIndex) => set({ currentTaskIndex }),
  setPlanningStatus: (planningStatus) => set({ planningStatus }),
  setOperationName: (operationName) => set({ operationName }),

  reset: () =>
    set({
      status: "idle",
      objective: "",
      currentTaskIndex: -1,
      planningStatus: "idle",
      operationName: "",
    }),
}));
