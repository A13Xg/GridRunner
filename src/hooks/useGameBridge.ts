import { useEffect, useRef } from "react";
import { eventBus, BUS_EVENTS } from "@/lib/eventBus";
import type { Vec2 } from "@/types";

interface MovePayload {
  agentId: string;
  target: Vec2;
  duration: number;
}

interface ProgressPayload {
  agentId: string;
  taskId: string;
  progress: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SceneRef = React.MutableRefObject<any | null>;

export function useGameBridge(sceneRef: SceneRef) {
  const cleanupRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const offMove = eventBus.on(BUS_EVENTS.AGENT_MOVE, (payload) => {
      const { agentId, target, duration } = payload as MovePayload;
      sceneRef.current?.events.emit("agent:move", { agentId, target, duration });
    });

    const offProgress = eventBus.on(BUS_EVENTS.TASK_PROGRESS, (payload) => {
      const { agentId, progress } = payload as ProgressPayload;
      sceneRef.current?.events.emit("task:progress", { agentId, progress });
    });

    const offReset = eventBus.on(BUS_EVENTS.SIM_RESET, () => {
      sceneRef.current?.events.emit("sim:reset");
    });

    cleanupRef.current = [offMove, offProgress, offReset];
    return () => cleanupRef.current.forEach((f) => f());
  }, [sceneRef]);
}
