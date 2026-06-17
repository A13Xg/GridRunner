import { getDB } from "./db";
import type { AgentProfileMap } from "@/lib/agents/profileTypes";
import type { ProviderID } from "@/lib/llm/types";

const KEY_PROVIDER = "selectedProvider";
const KEY_MODEL = "selectedModelId";
const KEY_PROFILES = "agentProfiles";

export async function saveProviderSettings(
  selectedProvider: string,
  selectedModelId: string
): Promise<void> {
  try {
    const db = getDB();
    await db.settings.bulkPut([
      { key: KEY_PROVIDER, value: selectedProvider },
      { key: KEY_MODEL, value: selectedModelId },
    ]);
  } catch (err) {
    console.warn("[storage] saveProviderSettings failed:", err);
  }
}

export async function saveAgentProfiles(profiles: AgentProfileMap): Promise<void> {
  try {
    await getDB().settings.put({ key: KEY_PROFILES, value: profiles });
  } catch (err) {
    console.warn("[storage] saveAgentProfiles failed:", err);
  }
}

export interface StoredSettings {
  selectedProvider: ProviderID | null;
  selectedModelId: string | null;
  agentProfiles: AgentProfileMap | null;
}

export async function loadStoredSettings(): Promise<StoredSettings> {
  try {
    const db = getDB();
    const [providerRow, modelRow, profilesRow] = await Promise.all([
      db.settings.get(KEY_PROVIDER),
      db.settings.get(KEY_MODEL),
      db.settings.get(KEY_PROFILES),
    ]);
    return {
      selectedProvider: (providerRow?.value as ProviderID) ?? null,
      selectedModelId: (modelRow?.value as string) ?? null,
      agentProfiles: (profilesRow?.value as AgentProfileMap) ?? null,
    };
  } catch (err) {
    console.warn("[storage] loadStoredSettings failed:", err);
    return { selectedProvider: null, selectedModelId: null, agentProfiles: null };
  }
}
