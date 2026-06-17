import { create } from "zustand";
import type { OperationReport } from "@/lib/artifacts/types";

export type ReportStatus = "idle" | "generating" | "completed" | "fallback" | "failed";

interface ReportStore {
  report: OperationReport | null;
  status: ReportStatus;
  error: string | null;
  setReport: (report: OperationReport) => void;
  setStatus: (status: ReportStatus) => void;
  setError: (error: string | null) => void;
  clearReport: () => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  report: null,
  status: "idle",
  error: null,

  setReport: (report) => set({ report }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  clearReport: () => set({ report: null, status: "idle", error: null }),
}));
