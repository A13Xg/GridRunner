import { create } from "zustand";
import type { WorkspaceArtifact, WorkspaceArtifactType } from "@/lib/artifacts/types";

interface ArtifactStore {
  artifacts: WorkspaceArtifact[];
  selectedArtifactId: string | null;
  typeFilter: WorkspaceArtifactType | null;
  agentFilter: string | null;
  searchQuery: string;
  addArtifact: (artifact: WorkspaceArtifact) => void;
  selectArtifact: (id: string | null) => void;
  setTypeFilter: (type: WorkspaceArtifactType | null) => void;
  setAgentFilter: (role: string | null) => void;
  setSearchQuery: (q: string) => void;
  clearArtifacts: () => void;
}

export const useArtifactStore = create<ArtifactStore>((set) => ({
  artifacts: [],
  selectedArtifactId: null,
  typeFilter: null,
  agentFilter: null,
  searchQuery: "",

  addArtifact: (artifact) =>
    set((s) => ({ artifacts: [...s.artifacts, artifact] })),

  selectArtifact: (selectedArtifactId) => set({ selectedArtifactId }),

  setTypeFilter: (typeFilter) => set({ typeFilter, selectedArtifactId: null }),

  setAgentFilter: (agentFilter) => set({ agentFilter, selectedArtifactId: null }),

  setSearchQuery: (searchQuery) => set({ searchQuery, selectedArtifactId: null }),

  clearArtifacts: () =>
    set({
      artifacts: [],
      selectedArtifactId: null,
      typeFilter: null,
      agentFilter: null,
      searchQuery: "",
    }),
}));
