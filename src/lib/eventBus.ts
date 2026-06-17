type Handler = (payload?: unknown) => void;

class EventBus {
  private listeners: Map<string, Set<Handler>> = new Map();

  on(event: string, handler: Handler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, payload?: unknown): void {
    this.listeners.get(event)?.forEach((h) => h(payload));
  }

  off(event: string, handler: Handler): void {
    this.listeners.get(event)?.delete(handler);
  }
}

export const eventBus = new EventBus();

export const BUS_EVENTS = {
  AGENT_MOVE: "agent:move",
  AGENT_ARRIVED: "agent:arrived",
  TASK_PROGRESS: "task:progress",
  SIM_RESET: "sim:reset",
} as const;
