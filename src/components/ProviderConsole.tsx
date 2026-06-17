"use client";
import { useEffect, useCallback } from "react";
import { useProviderStore } from "@/state/providerStore";
import { useModelStore } from "@/state/modelStore";
import { useLLMStore } from "@/state/llmStore";
import type { ProviderID, ProviderHealth, LLMResponse } from "@/lib/llm/types";

const PROVIDER_LABELS: Record<ProviderID, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
};

const PROVIDER_COLORS: Record<ProviderID, string> = {
  openai: "#00ff41",
  anthropic: "#ff6600",
  gemini: "#4285f4",
};

function HealthDot({ health }: { health: ProviderHealth | null }) {
  if (!health) return <span className="w-1.5 h-1.5 rounded-full bg-[#303060] inline-block" />;
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full inline-block ${health.healthy ? "bg-green-400 animate-pulse" : "bg-red-500"}`}
    />
  );
}

export function ProviderConsole() {
  const { selectedProvider, health, configuredProviders, setSelectedProvider, setHealth, setConfiguredProviders } =
    useProviderStore();
  const { selectedModelId, availableModels, setSelectedModel, setModelsForProvider } = useModelStore();
  const { prompt, response, isLoading, error, setPrompt, setLoading, setResponse, setError, reset } = useLLMStore();

  // Load catalog + configured providers on mount
  useEffect(() => {
    fetch("/api/llm/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "catalog" }),
    })
      .then((r) => r.json())
      .then((data: { providers?: ProviderID[] }) => {
        if (data.providers) {
          setConfiguredProviders(data.providers);
          if (data.providers.length > 0 && !data.providers.includes(selectedProvider)) {
            handleProviderChange(data.providers[0]);
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProviderChange = useCallback(
    (id: ProviderID) => {
      setSelectedProvider(id);
      setModelsForProvider(id);
    },
    [setSelectedProvider, setModelsForProvider]
  );

  const handleHealthCheck = useCallback(async () => {
    const res = await fetch("/api/llm/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "health" }),
    });
    const data = await res.json();
    if (data.health) {
      (data.health as ProviderHealth[]).forEach(setHealth);
    }
  }, [setHealth]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/llm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          provider: selectedProvider,
          model: selectedModelId,
          prompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setResponse(data.result as LLMResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [prompt, isLoading, selectedProvider, selectedModelId, setLoading, setError, setResponse]);

  const activeProviders: ProviderID[] =
    configuredProviders.length > 0
      ? configuredProviders
      : (["openai", "anthropic", "gemini"] as ProviderID[]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-mono tracking-[4px] text-[#404060] uppercase">
          Provider Console
        </div>
        <button
          onClick={handleHealthCheck}
          className="text-[8px] font-mono text-[#404060] hover:text-cyan-400 tracking-widest uppercase transition-colors"
        >
          PING ALL
        </button>
      </div>

      {/* Provider selector */}
      <div className="flex flex-col gap-1">
        <div className="text-[8px] font-mono text-[#303060] tracking-widest uppercase">Provider</div>
        <div className="flex gap-1">
          {(["openai", "anthropic", "gemini"] as ProviderID[]).map((id) => {
            const configured = activeProviders.includes(id);
            const isSelected = selectedProvider === id;
            return (
              <button
                key={id}
                disabled={!configured}
                onClick={() => handleProviderChange(id)}
                className={`flex-1 text-[8px] font-mono py-1 px-1 border tracking-widest uppercase transition-all ${
                  isSelected
                    ? "border-cyan-400/60 text-cyan-400"
                    : configured
                    ? "border-[#1a1a3a] text-[#404060] hover:border-[#303060] hover:text-[#606090]"
                    : "border-[#0a0a20] text-[#202040] cursor-not-allowed"
                }`}
                style={isSelected ? { boxShadow: "0 0 6px rgba(0,255,255,0.15)" } : {}}
              >
                <span className="flex items-center justify-center gap-1">
                  <HealthDot health={health[id]} />
                  {PROVIDER_LABELS[id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model selector */}
      <div className="flex flex-col gap-1">
        <div className="text-[8px] font-mono text-[#303060] tracking-widest uppercase">Model</div>
        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-[#0a0a1a] border border-[#1a1a3a] text-[9px] font-mono text-[#606090] px-2 py-1 focus:outline-none focus:border-cyan-400/40"
          style={{ appearance: "none" }}
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({(m.contextWindow / 1000).toFixed(0)}K ctx)
            </option>
          ))}
        </select>
      </div>

      {/* Provider status */}
      {health[selectedProvider] && (
        <div
          className="text-[8px] font-mono tracking-wide px-2 py-1 border"
          style={{
            borderColor: health[selectedProvider]!.healthy
              ? `${PROVIDER_COLORS[selectedProvider]}40`
              : "#ff000040",
            color: health[selectedProvider]!.healthy
              ? PROVIDER_COLORS[selectedProvider]
              : "#ff4444",
            background: "#05050f",
          }}
        >
          {health[selectedProvider]!.healthy
            ? `ONLINE · ${health[selectedProvider]!.latencyMs}ms`
            : `OFFLINE · ${health[selectedProvider]!.error?.slice(0, 40)}`}
        </div>
      )}

      {/* Prompt input */}
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <div className="text-[8px] font-mono text-[#303060] tracking-widest uppercase">Prompt</div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate();
          }}
          placeholder="Enter prompt… (Ctrl+Enter to execute)"
          disabled={isLoading}
          className="flex-1 min-h-[80px] bg-[#050510] border border-[#1a1a3a] text-[9px] font-mono text-[#808080] p-2 resize-none focus:outline-none focus:border-cyan-400/30 placeholder:text-[#1a1a3a] disabled:opacity-50"
        />
      </div>

      {/* Execute + Reset */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="flex-1 text-[9px] font-mono py-1.5 border border-cyan-400/40 text-cyan-400 tracking-widest uppercase hover:bg-cyan-400/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={!isLoading && prompt.trim() ? { boxShadow: "0 0 8px rgba(0,255,255,0.1)" } : {}}
        >
          {isLoading ? "EXECUTING…" : "EXECUTE"}
        </button>
        <button
          onClick={reset}
          className="text-[9px] font-mono px-3 py-1.5 border border-[#1a1a3a] text-[#404060] tracking-widest uppercase hover:text-[#606090] hover:border-[#303060] transition-all"
        >
          CLR
        </button>
      </div>

      {/* Response / Error viewer */}
      {(response || error) && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="text-[8px] font-mono text-[#303060] tracking-widest uppercase">
              {error ? "Error" : "Response"}
            </div>
            {response && (
              <div className="text-[7px] font-mono text-[#303060] tracking-wide">
                {response.inputTokens}↑ {response.outputTokens}↓ · {response.durationMs}ms
              </div>
            )}
          </div>
          <div
            className="text-[9px] font-mono p-2 border max-h-40 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed"
            style={{
              borderColor: error ? "#ff000030" : "#1a1a3a",
              background: error ? "#0a0005" : "#050510",
              color: error ? "#ff6666" : "#a0a0c0",
            }}
          >
            {error ?? response?.text}
          </div>
        </div>
      )}
    </div>
  );
}
