import { useCallback, useRef } from "react";
import { useAgentStore } from "@/state/agentStore";
import { useTaskStore } from "@/state/taskStore";
import { useEventStore } from "@/state/eventStore";
import { useSimulationStore } from "@/state/simulationStore";
import { useProviderStore } from "@/state/providerStore";
import { useModelStore } from "@/state/modelStore";
import { useExecutionStore } from "@/state/executionStore";
import { useArtifactStore } from "@/state/artifactStore";
import { useReportStore } from "@/state/reportStore";
import { useAgentProfileStore } from "@/state/agentProfileStore";
import { useHistoryStore } from "@/state/historyStore";
import { generateTasks } from "@/data/tasks";
import { fetchTaskGraph } from "@/lib/agents/taskGraphService";
import { taskGraphToSimTasks } from "@/lib/agents/taskGraph";
import { executeTask } from "@/lib/agents/executionService";
import { collectArtifactsFromResult } from "@/lib/artifacts/artifactService";
import { generateReport } from "@/lib/reports/reportService";
import { getAgentRole } from "@/lib/agents/agentRegistry";
import { isProfileValid } from "@/lib/agents/profileValidation";
import { saveOperation } from "@/lib/storage/operationPersistence";
import { recordToSummary } from "@/lib/storage/types";
import { nanoid } from "@/lib/nanoid";
import type { AgentExecutionResult } from "@/lib/agents/types";
import type { AgentRole } from "@/lib/agents/taskGraphSchema";
import type { OperationRecord } from "@/lib/storage/types";
import { getStation } from "@/data/stations";
import { eventBus, BUS_EVENTS } from "@/lib/eventBus";

const MOVE_DURATION = 2000;
const PROGRESS_TICK = 100;

export function useSimulation() {
  const agentStore = useAgentStore();
  const taskStore = useTaskStore();
  const { addEvent, clearEvents } = useEventStore();
  const simStore = useSimulationStore();
  const executionStore = useExecutionStore();
  const artifactStore = useArtifactStore();
  const reportStore = useReportStore();
  const agentProfileStore = useAgentProfileStore();
  const historyStore = useHistoryStore();
  const selectedProvider = useProviderStore((s) => s.selectedProvider);
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const abortRef = useRef(false);
  const priorOutputsRef = useRef<AgentExecutionResult[]>([]);
  const operationIdRef = useRef<string>("");
  const operationCreatedAtRef = useRef<number>(0);

  const delay = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (abortRef.current) reject(new Error("aborted"));
        else resolve();
      }, ms);
    });

  const runProgressAnimation = useCallback(
    async (taskId: string, agentId: string, durationMs: number, targetPct: number) => {
      const ticks = Math.max(1, Math.floor((durationMs * (targetPct / 100)) / PROGRESS_TICK));
      for (let i = 1; i <= ticks; i++) {
        await delay(PROGRESS_TICK);
        if (abortRef.current) return;
        const progress = Math.round((i / ticks) * targetPct);
        taskStore.setTaskProgress(taskId, progress);
        eventBus.emit(BUS_EVENTS.TASK_PROGRESS, { agentId, taskId, progress });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [taskStore]
  );

  const runTask = useCallback(
    async (taskId: string, objective: string) => {
      const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
      if (!task || !task.assignedAgentId) return;

      const station = getStation(task.stationId);
      if (!station) return;

      const agentId = task.assignedAgentId;
      const agent = useAgentStore.getState().agents.find((a) => a.id === agentId);
      if (!agent) return;

      // ── Resolve agent profile ─────────────────────────────────────────────────
      const agentRole = getAgentRole(agentId) as AgentRole;
      const profile = useAgentProfileStore.getState().getProfile(agentRole);

      // Handle disabled agent
      if (!profile.enabled) {
        taskStore.setTaskStatus(taskId, "skipped");
        addEvent(
          "agent_disabled",
          `Agent "${profile.displayName}" [${agentRole}] is disabled — task "${task.title}" skipped`,
          { agentId, taskId }
        );
        return;
      }

      // Warn if profile is invalid but still proceed with fallback settings
      if (!isProfileValid(profile)) {
        addEvent(
          "system",
          `Warning: Profile for "${agentRole}" has validation errors — using profile values anyway`,
          { agentId, taskId }
        );
      }

      // ── Move to station ──────────────────────────────────────────────────────
      taskStore.setTaskStatus(taskId, "in_progress");
      agentStore.setAgentTask(agentId, taskId, task.stationId);
      agentStore.setAgentState(agentId, "moving");
      agentStore.setAgentTarget(agentId, station.position);

      addEvent("task_started", `Task "${task.title}" started`, { agentId, taskId });
      addEvent("agent_moving", `${agent.name} moving to ${station.name}`, { agentId, taskId });

      eventBus.emit(BUS_EVENTS.AGENT_MOVE, {
        agentId,
        target: station.position,
        duration: MOVE_DURATION,
      });

      await delay(MOVE_DURATION + 200);
      if (abortRef.current) return;

      agentStore.setAgentState(agentId, "working");
      addEvent("agent_arrived", `${agent.name} arrived at ${station.name}`, { agentId, taskId });

      // ── Apply profile + execute ───────────────────────────────────────────────
      addEvent(
        "agent_settings_applied",
        `${agentRole}: ${profile.provider}/${profile.model} temp=${profile.temperature.toFixed(2)} tokens=${profile.maxTokens}`,
        { agentId, taskId }
      );
      addEvent("agent_execution_started", `${agent.name} executing: "${task.title}"`, {
        agentId,
        taskId,
      });

      const priorOutputs = [...priorOutputsRef.current];

      const executionPromise = executeTask({
        task,
        objective,
        provider: profile.provider,
        model: profile.model,
        priorOutputs,
        temperature: profile.temperature,
        maxTokens: profile.maxTokens,
        systemInstructions: profile.systemInstructions,
      });

      const animationPromise = runProgressAnimation(taskId, agentId, task.durationMs, 90).catch(
        () => {}
      );

      const [executionResult] = await Promise.all([executionPromise, animationPromise]);
      if (abortRef.current) return;

      // ── Store result + collect artifacts ─────────────────────────────────────
      executionStore.setResult(taskId, executionResult);
      priorOutputsRef.current = [...priorOutputsRef.current, executionResult];

      const workspaceArtifacts = collectArtifactsFromResult(executionResult, task);
      for (const wa of workspaceArtifacts) {
        artifactStore.addArtifact(wa);
        addEvent("artifact_added", `Artifact "${wa.title}" [${wa.type}] added to workspace`, {
          agentId,
          taskId,
        });
      }

      const executionFailed = executionResult.status === "Failed";

      if (executionFailed) {
        addEvent("agent_execution_failed", `${agent.name}: execution returned Failed`, {
          agentId,
          taskId,
        });
        if (executionResult.warnings.length > 0) {
          addEvent("system", `Warning: ${executionResult.warnings[0]}`, { agentId, taskId });
        }
      } else {
        addEvent(
          "agent_execution_completed",
          `${agent.name}: ${executionResult.summary.slice(0, 120)}`,
          { agentId, taskId }
        );
      }

      // ── Finish progress → 100% ───────────────────────────────────────────────
      taskStore.setTaskProgress(taskId, 100);
      eventBus.emit(BUS_EVENTS.TASK_PROGRESS, { agentId, taskId, progress: 100 });

      taskStore.setTaskStatus(taskId, executionFailed ? "failed" : "completed");
      agentStore.setAgentState(agentId, "completed");
      agentStore.setAgentTask(agentId, null, null);
      agentStore.setAgentTarget(agentId, null);

      if (!executionFailed) {
        addEvent("task_completed", `Task "${task.title}" completed by ${agent.name}`, {
          agentId,
          taskId,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      agentStore,
      taskStore,
      addEvent,
      executionStore,
      artifactStore,
      agentProfileStore,
      runProgressAnimation,
    ]
  );

  const startOperation = useCallback(
    async (objective: string) => {
      if (!objective.trim()) return;
      abortRef.current = false;
      priorOutputsRef.current = [];
      operationIdRef.current = nanoid();
      operationCreatedAtRef.current = Date.now();

      // Reset all stores
      clearEvents();
      agentStore.resetAgents();
      taskStore.resetTasks();
      executionStore.clearResults();
      artifactStore.clearArtifacts();
      reportStore.clearReport();
      eventBus.emit(BUS_EVENTS.SIM_RESET);
      simStore.setObjective(objective);
      simStore.setOperationName("");
      simStore.setStatus("idle");

      // ── AI Planning Phase ────────────────────────────────────────────────────
      simStore.setPlanningStatus("planning");
      addEvent(
        "ai_planning_started",
        `AI planning: "${objective}" via ${selectedProvider}/${selectedModelId}`
      );

      let tasks = generateTasks(objective);
      let operationLabel = objective;

      try {
        const graph = await fetchTaskGraph({
          objective,
          provider: selectedProvider,
          model: selectedModelId,
        });

        if (abortRef.current) return;

        tasks = taskGraphToSimTasks(graph);
        operationLabel = graph.operationName;
        simStore.setOperationName(graph.operationName);
        simStore.setPlanningStatus("ready");

        if (graph._repaired) {
          addEvent(
            "ai_planning_completed",
            `Plan generated (repaired): "${graph.operationName}" — ${tasks.length} tasks`
          );
          addEvent("system", "Warning: model response required structural repair");
        } else {
          addEvent(
            "ai_planning_completed",
            `Plan generated: "${graph.operationName}" — ${tasks.length} tasks`
          );
        }
        if (graph.summary) addEvent("system", `Summary: ${graph.summary}`);
      } catch (err) {
        if (abortRef.current) return;
        const reason = err instanceof Error ? err.message : "Unknown error";
        simStore.setPlanningStatus("fallback");
        addEvent("ai_planning_failed", `AI planning failed: ${reason}`);
        addEvent("ai_fallback_used", `Using mock task graph (${tasks.length} tasks)`);
      }

      if (abortRef.current) return;

      // ── Simulation Phase ─────────────────────────────────────────────────────
      taskStore.setTasks(tasks);
      simStore.setStatus("running");
      simStore.setCurrentTaskIndex(0);
      addEvent("operation_started", `Operation started: "${operationLabel}"`);

      // Save "Running" record so history survives a crash
      const runningRecord: OperationRecord = {
        id: operationIdRef.current,
        operationName: operationLabel,
        objective,
        status: "Running",
        createdAt: operationCreatedAtRef.current,
        completedAt: null,
        provider: selectedProvider,
        model: selectedModelId,
        tasks,
        artifacts: [],
        executionResults: {},
        report: null,
        events: [],
        agentProfilesSnapshot: { ...useAgentProfileStore.getState().profiles },
      };
      void saveOperation(runningRecord).then(() => {
        historyStore.addOrUpdateSummary(recordToSummary(runningRecord));
        addEvent("operation_saved", `Operation "${operationLabel}" saved to history [Running]`);
      });

      for (let i = 0; i < tasks.length; i++) {
        if (abortRef.current) break;
        simStore.setCurrentTaskIndex(i);
        await runTask(tasks[i].id, objective);
        if (abortRef.current) break;
        await delay(600).catch(() => {});
      }

      if (abortRef.current) return;

      // ── Operation Complete ───────────────────────────────────────────────────
      simStore.setStatus("completed");
      addEvent("operation_completed", `Operation "${operationLabel}" — ALL SYSTEMS NOMINAL`);

      // ── Report Generation ────────────────────────────────────────────────────
      const allTasks = useTaskStore.getState().tasks;
      const allArtifacts = useArtifactStore.getState().artifacts;

      reportStore.setStatus("generating");
      addEvent("report_generation_started", `Synthesizing report for "${operationLabel}"`);

      const { report, isFallback } = await generateReport({
        objective,
        operationName: operationLabel,
        tasks: allTasks,
        artifacts: allArtifacts,
        provider: selectedProvider,
        model: selectedModelId,
      });

      if (abortRef.current) return;

      reportStore.setReport(report);
      reportStore.setStatus(isFallback ? "fallback" : "completed");

      if (isFallback) {
        addEvent("report_fallback_used", "Deterministic fallback report generated");
      } else {
        addEvent("report_generation_completed", `Report "${report.title}" ready`);
      }

      // Save completed record to history
      const finalTasks = useTaskStore.getState().tasks;
      const finalArtifacts = useArtifactStore.getState().artifacts;
      const finalResults = useExecutionStore.getState().results;
      const finalEvents = useEventStore.getState().events;
      const completedAt = Date.now();
      const hasFailures = finalTasks.some((t) => t.status === "failed");
      const completedRecord: OperationRecord = {
        id: operationIdRef.current,
        operationName: operationLabel,
        objective,
        status: hasFailures ? "PartiallyCompleted" : "Completed",
        createdAt: operationCreatedAtRef.current,
        completedAt,
        provider: selectedProvider,
        model: selectedModelId,
        tasks: finalTasks,
        artifacts: finalArtifacts,
        executionResults: finalResults,
        report,
        events: finalEvents,
        agentProfilesSnapshot: { ...useAgentProfileStore.getState().profiles },
      };
      await saveOperation(completedRecord);
      historyStore.addOrUpdateSummary(recordToSummary(completedRecord));
      addEvent("operation_saved", `Operation "${operationLabel}" saved to history [${completedRecord.status}]`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      agentStore,
      taskStore,
      simStore,
      executionStore,
      artifactStore,
      reportStore,
      agentProfileStore,
      historyStore,
      addEvent,
      clearEvents,
      runTask,
      selectedProvider,
      selectedModelId,
    ]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    priorOutputsRef.current = [];
    clearEvents();
    agentStore.resetAgents();
    taskStore.resetTasks();
    executionStore.clearResults();
    artifactStore.clearArtifacts();
    reportStore.clearReport();
    simStore.reset();
    eventBus.emit(BUS_EVENTS.SIM_RESET);
    addEvent("system", "System reset. Awaiting new objective.");
  }, [
    agentStore,
    taskStore,
    simStore,
    executionStore,
    artifactStore,
    reportStore,
    clearEvents,
    addEvent,
  ]);

  return { startOperation, reset };
}
