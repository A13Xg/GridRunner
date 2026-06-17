import { create } from "zustand";
import type { AgentProfile, AgentProfileMap } from "@/lib/agents/profileTypes";
import type { AgentRole } from "@/lib/agents/taskGraphSchema";
import { DEFAULT_PROFILES } from "@/lib/agents/defaultProfiles";

interface AgentProfileStore {
  profiles: AgentProfileMap;
  getProfile: (role: AgentRole) => AgentProfile;
  updateProfile: (role: AgentRole, updates: Partial<Omit<AgentProfile, "id" | "role">>) => void;
  resetProfile: (role: AgentRole) => void;
  resetAll: () => void;
  overwriteProfiles: (profiles: AgentProfileMap) => void;
}

export const useAgentProfileStore = create<AgentProfileStore>((set, get) => ({
  profiles: { ...DEFAULT_PROFILES },

  getProfile: (role) => get().profiles[role],

  updateProfile: (role, updates) =>
    set((s) => ({
      profiles: {
        ...s.profiles,
        [role]: { ...s.profiles[role], ...updates },
      },
    })),

  resetProfile: (role) =>
    set((s) => ({
      profiles: {
        ...s.profiles,
        [role]: { ...DEFAULT_PROFILES[role] },
      },
    })),

  resetAll: () => set({ profiles: { ...DEFAULT_PROFILES } }),

  overwriteProfiles: (profiles) => set({ profiles: { ...profiles } }),
}));
