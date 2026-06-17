import { create } from "zustand";
import type { LLMResponse } from "@/lib/llm/types";

interface LLMState {
  prompt: string;
  response: LLMResponse | null;
  isLoading: boolean;
  error: string | null;
  setPrompt: (prompt: string) => void;
  setLoading: (loading: boolean) => void;
  setResponse: (response: LLMResponse) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLLMStore = create<LLMState>()((set) => ({
  prompt: "",
  response: null,
  isLoading: false,
  error: null,

  setPrompt: (prompt) => set({ prompt }),
  setLoading: (isLoading) => set({ isLoading }),
  setResponse: (response) => set({ response, error: null }),
  setError: (error) => set({ error, response: null }),
  reset: () => set({ prompt: "", response: null, isLoading: false, error: null }),
}));
