"use client";
import { useArtifactStore } from "@/state/artifactStore";
import { ArtifactDetailPanel } from "./ArtifactDetailPanel";
import type { WorkspaceArtifactType } from "@/lib/artifacts/types";

const ALL_TYPES: WorkspaceArtifactType[] = [
  "note",
  "plan",
  "research",
  "design",
  "review",
  "report",
];

const TYPE_ICONS: Record<WorkspaceArtifactType, string> = {
  note: "○",
  plan: "◆",
  research: "◈",
  design: "◇",
  review: "✦",
  report: "◉",
};

const TYPE_COLORS: Record<WorkspaceArtifactType, string> = {
  note: "text-[#6060a0]",
  plan: "text-violet-400",
  research: "text-cyan-400",
  design: "text-orange-400",
  review: "text-yellow-400",
  report: "text-emerald-400",
};

const AGENT_ROLES = ["Planner", "Researcher", "Builder", "Reviewer"];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function highlight(text: string, query: string): string {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(Math.max(0, idx - 20), idx + query.length + 80);
}

export function ArtifactWorkspace() {
  const {
    artifacts,
    selectedArtifactId,
    typeFilter,
    agentFilter,
    searchQuery,
    selectArtifact,
    setTypeFilter,
    setAgentFilter,
    setSearchQuery,
  } = useArtifactStore();

  const selectedArtifact = selectedArtifactId
    ? artifacts.find((a) => a.id === selectedArtifactId)
    : null;

  // Show detail view when an artifact is selected
  if (selectedArtifact) {
    return (
      <ArtifactDetailPanel
        artifact={selectedArtifact}
        onBack={() => selectArtifact(null)}
      />
    );
  }

  // Filter
  const filtered = artifacts.filter((a) => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (agentFilter && a.agentRole !== agentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#1a1a3a] shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
        <span className="text-[10px] font-mono tracking-[4px] text-purple-400/80 uppercase">
          Workspace
        </span>
        <span className="ml-auto text-[9px] font-mono text-[#303060]">
          {filtered.length}/{artifacts.length}
        </span>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-1 flex-wrap shrink-0">
        <button
          onClick={() => setTypeFilter(null)}
          className={`text-[8px] font-mono px-1.5 py-0.5 border transition-colors ${
            typeFilter === null
              ? "border-cyan-400/60 text-cyan-400 bg-cyan-400/10"
              : "border-[#1a1a3a] text-[#404060] hover:text-[#606090]"
          }`}
        >
          ALL
        </button>
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            className={`text-[8px] font-mono px-1.5 py-0.5 border transition-colors ${
              typeFilter === t
                ? `border-current bg-current/10 ${TYPE_COLORS[t]}`
                : "border-[#1a1a3a] text-[#404060] hover:text-[#606090]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Agent filter */}
      <div className="flex gap-1 flex-wrap shrink-0">
        <button
          onClick={() => setAgentFilter(null)}
          className={`text-[8px] font-mono px-1.5 py-0.5 border transition-colors ${
            agentFilter === null
              ? "border-cyan-400/60 text-cyan-400 bg-cyan-400/10"
              : "border-[#1a1a3a] text-[#404060] hover:text-[#606090]"
          }`}
        >
          ALL AGENTS
        </button>
        {AGENT_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setAgentFilter(agentFilter === role ? null : role)}
            className={`text-[8px] font-mono px-1.5 py-0.5 border transition-colors ${
              agentFilter === role
                ? "border-cyan-400/60 text-cyan-400 bg-cyan-400/10"
                : "border-[#1a1a3a] text-[#404060] hover:text-[#606090]"
            }`}
          >
            {role.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="shrink-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH ARTIFACTS..."
          className="w-full bg-transparent border border-[#1a1a3a] text-[9px] font-mono text-[#a0a0c0] placeholder-[#303060] px-2 py-1.5 focus:outline-none focus:border-cyan-400/40 tracking-widest"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {artifacts.length === 0 ? (
          <div className="text-[10px] font-mono text-[#303060] tracking-widest pt-4 text-center">
            NO ARTIFACTS YET
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-[10px] font-mono text-[#303060] tracking-widest pt-4 text-center">
            NO MATCHES
          </div>
        ) : (
          filtered.map((artifact) => {
            const color = TYPE_COLORS[artifact.type];
            const icon = TYPE_ICONS[artifact.type];
            const snippet = searchQuery
              ? highlight(artifact.content, searchQuery)
              : artifact.content.slice(0, 100);

            return (
              <button
                key={artifact.id}
                onClick={() => selectArtifact(artifact.id)}
                className="w-full text-left border border-[#1a1a3a] bg-[#0a0a1a]/50 hover:border-cyan-400/40 hover:bg-cyan-400/5 p-2 transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] ${color} shrink-0`}>{icon}</span>
                  <span className="text-[10px] font-mono text-[#c0c0e0] font-semibold tracking-wide truncate flex-1">
                    {artifact.title}
                  </span>
                  <span className="text-[8px] font-mono text-[#303060] shrink-0">
                    {formatTime(artifact.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-mono tracking-widest uppercase ${color}`}>
                    {artifact.type}
                  </span>
                  <span className="text-[8px] font-mono text-[#404070]">
                    {artifact.agentRole}
                  </span>
                </div>
                <p className="text-[8px] font-mono text-[#505070] leading-relaxed line-clamp-2 group-hover:text-[#606090] transition-colors">
                  {snippet}
                  {artifact.content.length > 100 && !searchQuery ? "..." : ""}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
