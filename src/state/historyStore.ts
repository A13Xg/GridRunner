import { create } from "zustand";
import type { OperationSummary } from "@/lib/storage/types";
import { loadAllSummaries } from "@/lib/storage/operationPersistence";

interface HistoryStore {
  summaries: OperationSummary[];
  isLoaded: boolean;
  selectedOperationId: string | null;
  loadSummaries: () => Promise<void>;
  addOrUpdateSummary: (summary: OperationSummary) => void;
  removeSummary: (id: string) => void;
  clearSummaries: () => void;
  selectOperation: (id: string | null) => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  summaries: [],
  isLoaded: false,
  selectedOperationId: null,

  loadSummaries: async () => {
    try {
      const summaries = await loadAllSummaries();
      set({ summaries, isLoaded: true });
    } catch (err) {
      console.error("[historyStore] loadSummaries failed:", err);
      set({ isLoaded: true });
    }
  },

  addOrUpdateSummary: (summary) =>
    set((s) => {
      const idx = s.summaries.findIndex((op) => op.id === summary.id);
      if (idx === -1) return { summaries: [summary, ...s.summaries] };
      const updated = [...s.summaries];
      updated[idx] = summary;
      return { summaries: updated };
    }),

  removeSummary: (id) =>
    set((s) => ({ summaries: s.summaries.filter((op) => op.id !== id) })),

  clearSummaries: () => set({ summaries: [], isLoaded: get().isLoaded }),

  selectOperation: (selectedOperationId) => set({ selectedOperationId }),
}));
