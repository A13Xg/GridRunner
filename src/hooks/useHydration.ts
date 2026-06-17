import { useEffect, useState } from "react";
import { useProviderStore } from "@/state/providerStore";
import { useModelStore } from "@/state/modelStore";
import { useAgentProfileStore } from "@/state/agentProfileStore";
import { useHistoryStore } from "@/state/historyStore";
import { markStaleRunningAsFailed } from "@/lib/storage/operationPersistence";
import { loadStoredSettings } from "@/lib/storage/profilePersistence";
import type { ProviderID } from "@/lib/llm/types";

const KNOWN_PROVIDERS: ProviderID[] = ["openai", "anthropic", "gemini"];

export function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await markStaleRunningAsFailed();
        const settings = await loadStoredSettings();

        if (cancelled) return;

        if (settings.selectedProvider && KNOWN_PROVIDERS.includes(settings.selectedProvider)) {
          // Set provider, then re-init available models list, then override selected model
          useProviderStore.getState().setSelectedProvider(settings.selectedProvider);
          useModelStore.getState().setModelsForProvider(settings.selectedProvider);
        }

        if (settings.selectedModelId) {
          useModelStore.getState().setSelectedModel(settings.selectedModelId);
        }

        if (settings.agentProfiles) {
          useAgentProfileStore.getState().overwriteProfiles(settings.agentProfiles);
        }

        await useHistoryStore.getState().loadSummaries();
      } catch (err) {
        console.error("[hydration] Failed:", err);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return isHydrated;
}
