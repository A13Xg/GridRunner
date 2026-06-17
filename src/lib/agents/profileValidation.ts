import { getModel, getModelsByProvider } from "@/lib/llm/model-catalog";
import type { AgentProfile, ProfileValidationErrors, ProfileValidationResult } from "./profileTypes";
import {
  TEMPERATURE_MIN,
  TEMPERATURE_MAX,
  MAX_TOKENS_MIN,
  MAX_TOKENS_MAX,
  SYSTEM_INSTRUCTIONS_MIN_LENGTH,
} from "./profileTypes";
import { ALLOWED_AGENT_ROLES } from "./taskGraphSchema";

const KNOWN_PROVIDERS = ["openai", "anthropic", "gemini"] as const;

export function validateProfile(profile: AgentProfile): ProfileValidationResult {
  const errors: ProfileValidationErrors = {};

  // Provider
  if (!(KNOWN_PROVIDERS as readonly string[]).includes(profile.provider)) {
    errors.provider = `Unknown provider "${profile.provider}". Allowed: ${KNOWN_PROVIDERS.join(", ")}`;
  }

  // Model — must exist in catalog for this provider
  const catalogEntry = getModel(profile.model);
  if (!catalogEntry) {
    errors.model = `Model "${profile.model}" is not in the model catalog`;
  } else if (catalogEntry.provider !== profile.provider) {
    const available = getModelsByProvider(profile.provider).map((m) => m.id);
    errors.model = `Model "${profile.model}" belongs to ${catalogEntry.provider}, not ${profile.provider}. Available: ${available.join(", ")}`;
  }

  // Temperature
  if (
    typeof profile.temperature !== "number" ||
    profile.temperature < TEMPERATURE_MIN ||
    profile.temperature > TEMPERATURE_MAX
  ) {
    errors.temperature = `Temperature must be between ${TEMPERATURE_MIN} and ${TEMPERATURE_MAX}`;
  }

  // Max tokens
  if (
    typeof profile.maxTokens !== "number" ||
    !Number.isInteger(profile.maxTokens) ||
    profile.maxTokens < MAX_TOKENS_MIN ||
    profile.maxTokens > MAX_TOKENS_MAX
  ) {
    errors.maxTokens = `Max tokens must be an integer between ${MAX_TOKENS_MIN} and ${MAX_TOKENS_MAX}`;
  }

  // System instructions
  if (
    typeof profile.systemInstructions !== "string" ||
    profile.systemInstructions.trim().length < SYSTEM_INSTRUCTIONS_MIN_LENGTH
  ) {
    errors.systemInstructions = `Instructions must be at least ${SYSTEM_INSTRUCTIONS_MIN_LENGTH} characters`;
  }

  // Role — informational, profiles are always keyed by role so this mainly guards programmatic misuse
  if (!(ALLOWED_AGENT_ROLES as readonly string[]).includes(profile.role)) {
    // Not a user-facing error — don't add to errors object, just log
    console.warn(`[profileValidation] Unknown role "${profile.role}"`);
  }

  if (Object.keys(errors).length === 0) return { valid: true };
  return { valid: false, errors };
}

export function isProfileValid(profile: AgentProfile): boolean {
  return validateProfile(profile).valid;
}
