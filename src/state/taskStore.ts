import { create } from "zustand";
import type { Task, TaskStatus } from "@/types";

interface TaskStore {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  setTaskProgress: (id: string, progress: number) => void;
  resetTasks: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  setTaskStatus: (id, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              progress:
                status === "completed"
                  ? 100
                  : status === "failed"
                  ? t.progress
                  : t.progress,
            }
          : t
      ),
    })),

  setTaskProgress: (id, progress) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, progress } : t)),
    })),

  resetTasks: () => set({ tasks: [] }),
}));
