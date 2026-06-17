import { create } from "zustand";
import type { GameEvent, EventType } from "@/types";
import { nanoid } from "@/lib/nanoid";

interface EventStore {
  events: GameEvent[];
  addEvent: (type: EventType, message: string, meta?: { agentId?: string; taskId?: string }) => void;
  clearEvents: () => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],

  addEvent: (type, message, meta = {}) => {
    const event: GameEvent = {
      id: nanoid(),
      type,
      message,
      timestamp: Date.now(),
      ...meta,
    };
    set((s) => ({ events: [event, ...s.events].slice(0, 200) }));
  },

  clearEvents: () => set({ events: [] }),
}));
