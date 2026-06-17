import type { AgentRole } from "./taskGraphSchema";
import type { ProviderID } from "@/lib/llm/types";

// ─── Agent Profile ────────────────────────────────────────────────────────────

export interface AgentProfile {
  id: AgentRole;
  role: AgentRole;
  displayName: string;
  description: string;
  provider: ProviderID;
  model: string;
  temperature: number;    // 0.0 – 1.0
  maxTokens: number;      // 256 – 8192
  systemInstructions: string;
  enabled: boolean;
}

export type AgentProfileMap = Record<AgentRole, AgentProfile>;

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ProfileValidationErrors {
  provider?: string;
  model?: string;
  temperature?: string;
  maxTokens?: string;
  systemInstructions?: string;
}

export type ProfileValidationResult =
  | { valid: true }
  | { valid: false; errors: ProfileValidationErrors };

// ─── Constants ────────────────────────────────────────────────────────────────

export const TEMPERATURE_MIN = 0;
export const TEMPERATURE_MAX = 1;
export const MAX_TOKENS_MIN = 256;
export const MAX_TOKENS_MAX = 8192;
export const SYSTEM_INSTRUCTIONS_MIN_LENGTH = 10;
