"use client";
import { useState, useEffect } from "react";
import { useAgentProfileStore } from "@/state/agentProfileStore";
import { useEventStore } from "@/state/eventStore";
import { validateProfile } from "@/lib/agents/profileValidation";
import { DEFAULT_PROFILES } from "@/lib/agents/defaultProfiles";
import { getModelsByProvider, DEFAULT_MODELS } from "@/lib/llm/model-catalog";
import type { AgentRole } from "@/lib/agents/taskGraphSchema";
import type { ProviderID } from "@/lib/llm/types";

const PROVIDERS: ProviderID[] = ["openai", "anthropic", "gemini"];

const TEMP_PRESETS = [
  { label: "Precise", value: 0.0 },
  { label: "Careful", value: 0.2 },
  { label: "Balanced", value: 0.4 },
  { label: "Creative", value: 0.7 },
  { label: "Wild", value: 1.0 },
];

interface AgentProfileEditorProps {
  role: AgentRole;
  onBack: () => void;
}

export function AgentProfileEditor({ role, onBack }: AgentProfileEditorProps) {
  const { profiles, updateProfile, resetProfile } = useAgentProfileStore();
  const addEvent = useEventStore((s) => s.addEvent);
  const profile = profiles[role];

  // Local draft state — edits committed to store on change
  const [draft, setDraft] = useState({ ...profile });
  const [instructionsDraft, setInstructionsDraft] = useState(profile.systemInstructions);

  // Sync draft if profile changes externally (e.g. reset)
  useEffect(() => {
    setDraft({ ...profiles[role] });
    setInstructionsDraft(profiles[role].systemInstructions);
  }, [profiles, role]);

  const availableModels = getModelsByProvider(draft.provider);
  const validation = validateProfile({ ...draft, systemInstructions: instructionsDraft });
  const errors = validation.valid ? {} : validation.errors;

  function commit<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    updateProfile(role, { [key]: value });
    addEvent("agent_profile_updated", `Profile "${role}" updated: ${String(key)} changed`);
  }

  function handleProviderChange(provider: ProviderID) {
    const models = getModelsByProvider(provider);
    const defaultModel = DEFAULT_MODELS[provider] ?? models[0]?.id ?? "";
    const validModel = models.some((m) => m.id === draft.model) ? draft.model : defaultModel;
    const next = { ...draft, provider, model: validModel };
    setDraft(next);
    updateProfile(role, { provider, model: validModel });
    addEvent("agent_profile_updated", `Profile "${role}" updated: provider → ${provider}`);
  }

  function commitInstructions() {
    const trimmed = instructionsDraft.trim();
    updateProfile(role, { systemInstructions: trimmed });
    setDraft((d) => ({ ...d, systemInstructions: trimmed }));
    addEvent("agent_profile_updated", `Profile "${role}" updated: systemInstructions`);
  }

  function handleReset() {
    resetProfile(role);
    addEvent("agent_profile_reset", `Profile "${role}" reset to defaults`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[9px] font-mono text-[#404070] hover:text-cyan-400 transition-colors mb-3 self-start"
      >
        <span>←</span>
        <span>BACK TO PROFILES</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1a1a3a] mb-3">
        <div>
          <span className="text-[11px] font-mono text-[#c0c0e0] font-semibold tracking-wider">
            {profile.displayName.toUpperCase()}
          </span>
          <p className="text-[9px] font-mono text-[#404070] mt-0.5">{profile.description}</p>
        </div>
        {/* Enable toggle */}
        <button
          onClick={() => commit("enabled", !draft.enabled)}
          className={`text-[9px] font-mono tracking-widest px-2 py-1 border transition-colors ${
            draft.enabled
              ? "border-green-400/60 text-green-400 bg-green-400/5"
              : "border-red-500/40 text-red-400 bg-red-500/5"
          }`}
        >
          {draft.enabled ? "ENABLED" : "DISABLED"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {/* Provider */}
        <div>
          <label className="block text-[8px] font-mono text-[#404060] tracking-[3px] uppercase mb-1">
            Provider
          </label>
          <div className="flex gap-1">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`flex-1 text-[8px] font-mono py-1 border transition-colors ${
                  draft.provider === p
                    ? "border-cyan-400/60 text-cyan-400 bg-cyan-400/5"
                    : "border-[#1a1a3a] text-[#404060] hover:text-[#606090]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {errors.provider && (
            <p className="text-[8px] font-mono text-red-400 mt-0.5">{errors.provider}</p>
          )}
        </div>

        {/* Model */}
        <div>
          <label className="block text-[8px] font-mono text-[#404060] tracking-[3px] uppercase mb-1">
            Model
          </label>
          <select
            value={draft.model}
            onChange={(e) => commit("model", e.target.value)}
            className="w-full bg-[#0a0a1a] border border-[#1a1a3a] text-[9px] font-mono text-[#a0a0c0] px-2 py-1.5 focus:outline-none focus:border-cyan-400/40 appearance-none"
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {errors.model && (
            <p className="text-[8px] font-mono text-red-400 mt-0.5">{errors.model}</p>
          )}
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[8px] font-mono text-[#404060] tracking-[3px] uppercase">
              Temperature
            </label>
            <span className="text-[9px] font-mono text-cyan-400">{draft.temperature.toFixed(2)}</span>
          </div>
          <div className="flex gap-1 mb-1.5">
            {TEMP_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => commit("temperature", p.value)}
                className={`flex-1 text-[7px] font-mono py-0.5 border transition-colors ${
                  draft.temperature === p.value
                    ? "border-cyan-400/60 text-cyan-400"
                    : "border-[#111130] text-[#303060] hover:text-[#505080]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.temperature}
            onChange={(e) => commit("temperature", parseFloat(e.target.value))}
            className="w-full h-0.5 appearance-none bg-[#1a1a3a] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
          />
          {errors.temperature && (
            <p className="text-[8px] font-mono text-red-400 mt-0.5">{errors.temperature}</p>
          )}
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[8px] font-mono text-[#404060] tracking-[3px] uppercase">
              Max Tokens
            </label>
            <span className="text-[9px] font-mono text-cyan-400">{draft.maxTokens.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={256}
            max={8192}
            step={256}
            value={draft.maxTokens}
            onChange={(e) => commit("maxTokens", parseInt(e.target.value, 10))}
            className="w-full h-0.5 appearance-none bg-[#1a1a3a] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
          />
          <div className="flex justify-between text-[7px] font-mono text-[#303060] mt-0.5">
            <span>256</span>
            <span>8192</span>
          </div>
          {errors.maxTokens && (
            <p className="text-[8px] font-mono text-red-400">{errors.maxTokens}</p>
          )}
        </div>

        {/* System Instructions */}
        <div>
          <label className="block text-[8px] font-mono text-[#404060] tracking-[3px] uppercase mb-1">
            Behavior Instructions
          </label>
          <textarea
            value={instructionsDraft}
            onChange={(e) => setInstructionsDraft(e.target.value)}
            onBlur={commitInstructions}
            rows={5}
            className="w-full bg-[#050510] border border-[#1a1a3a] text-[9px] font-mono text-[#a0a0c0] px-2 py-1.5 focus:outline-none focus:border-cyan-400/40 resize-none leading-relaxed placeholder-[#303060]"
            placeholder="Enter agent behavior instructions..."
          />
          {errors.systemInstructions && (
            <p className="text-[8px] font-mono text-red-400 mt-0.5">{errors.systemInstructions}</p>
          )}
          <p className="text-[7px] font-mono text-[#303060] mt-0.5">
            {instructionsDraft.trim().length} chars — appended to base role prompt
          </p>
        </div>

        {/* Actions */}
        <div className="pt-1 border-t border-[#1a1a3a]">
          <button
            onClick={handleReset}
            className="w-full text-[8px] font-mono tracking-widest uppercase py-1.5 border border-[#1a1a3a] text-[#404060] hover:border-amber-400/40 hover:text-amber-400 transition-colors"
          >
            Reset to Default
          </button>
          {!validation.valid && (
            <p className="text-[8px] font-mono text-red-400/70 mt-1.5 text-center">
              {Object.keys(errors).length} validation error(s) — profile will not be used
            </p>
          )}
        </div>

        {/* Default comparison */}
        {JSON.stringify({
          provider: draft.provider,
          model: draft.model,
          temperature: draft.temperature,
          maxTokens: draft.maxTokens,
          enabled: draft.enabled,
        }) !==
          JSON.stringify({
            provider: DEFAULT_PROFILES[role].provider,
            model: DEFAULT_PROFILES[role].model,
            temperature: DEFAULT_PROFILES[role].temperature,
            maxTokens: DEFAULT_PROFILES[role].maxTokens,
            enabled: DEFAULT_PROFILES[role].enabled,
          }) && (
          <p className="text-[7px] font-mono text-amber-400/60 text-center">
            ⚠ Modified from default
          </p>
        )}
      </div>
    </div>
  );
}
