"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LLMProvider = "openai" | "anthropic" | "zai" | "local" | "vercel";
export type ChatModel =
  | "gpt-4o-mini"
  | "gpt-5-mini"
  | "claude-sonnet-4-5-20250929"
  | "claude-haiku-4-5-20251001"
  | "glm-4.6"
  | "local-model"
  | "claude-3-5-haiku-20241022"
  | "moonshotai/kimi-k2-turbo";
export type UIGeneratorModel =
  | "gpt-5-mini"
  | "claude-sonnet-4-5-20250929"
  | "claude-haiku-4-5-20251001"
  | "glm-4.6"
  | "local-model"
  | "claude-3-5-haiku-20241022"
  | "moonshotai/kimi-k2-turbo";

export interface SettingsContextType {
  chatProvider: LLMProvider;
  chatModel: ChatModel;
  uiGeneratorProvider: LLMProvider;
  uiGeneratorModel: UIGeneratorModel;
  setChatProvider: (provider: LLMProvider) => void;
  setChatModel: (model: ChatModel) => void;
  setUIGeneratorProvider: (provider: LLMProvider) => void;
  setUIGeneratorModel: (model: UIGeneratorModel) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const STORAGE_KEY = "pokemon-chat-settings";

const DEFAULT_SETTINGS = {
  chatProvider: "openai" as const,
  chatModel: "gpt-4o-mini" as const,
  uiGeneratorProvider: "openai" as const,
  uiGeneratorModel: "gpt-5-mini" as const,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<{
    chatProvider: LLMProvider;
    chatModel: ChatModel;
    uiGeneratorProvider: LLMProvider;
    uiGeneratorModel: UIGeneratorModel;
  }>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (error) {
          console.error("Failed to parse settings:", error);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateSettings = (
    updates: Partial<{
      chatProvider: LLMProvider;
      chatModel: ChatModel;
      uiGeneratorProvider: LLMProvider;
      uiGeneratorModel: UIGeneratorModel;
    }>
  ) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }
  };

  const value: SettingsContextType = {
    chatProvider: settings.chatProvider,
    chatModel: settings.chatModel,
    uiGeneratorProvider: settings.uiGeneratorProvider,
    uiGeneratorModel: settings.uiGeneratorModel,
    setChatProvider: (provider: LLMProvider) =>
      updateSettings({ chatProvider: provider }),
    setChatModel: (model: ChatModel) => updateSettings({ chatModel: model }),
    setUIGeneratorProvider: (provider: LLMProvider) =>
      updateSettings({ uiGeneratorProvider: provider }),
    setUIGeneratorModel: (model: UIGeneratorModel) =>
      updateSettings({ uiGeneratorModel: model }),
  };

  // Don't render children until settings are loaded to prevent hydration mismatch
  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
