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
  | "moonshotai/kimi-k2-turbo"
  | "openai/gpt-5-nano"
  | "openai/gpt-5-mini"
  | "google/gemini-2.5-pro"
  | "xai/grok-4-fast-reasoning"
  | "anthropic/claude-haiku-4.5";
export type UIGeneratorModel =
  | "gpt-5-mini"
  | "claude-sonnet-4-5-20250929"
  | "claude-haiku-4-5-20251001"
  | "glm-4.6"
  | "local-model"
  | "claude-3-5-haiku-20241022"
  | "moonshotai/kimi-k2-turbo"
  | "openai/gpt-5-nano"
  | "openai/gpt-5-mini"
  | "google/gemini-2.5-pro"
  | "xai/grok-4-fast-reasoning"
  | "anthropic/claude-haiku-4.5";

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
const SETTINGS_VERSION_KEY = "pokemon-chat-settings-version";
const CURRENT_VERSION = "2"; // Increment this when defaults change

const DEFAULT_SETTINGS = {
  chatProvider: "vercel" as const,
  chatModel: "anthropic/claude-haiku-4.5" as const,
  uiGeneratorProvider: "vercel" as const,
  uiGeneratorModel: "anthropic/claude-haiku-4.5" as const,
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
      const storedVersion = localStorage.getItem(SETTINGS_VERSION_KEY);
      let finalSettings = DEFAULT_SETTINGS;

      // Check if we need to migrate to new version
      const needsMigration = storedVersion !== CURRENT_VERSION;

      if (stored && !needsMigration) {
        try {
          const parsed = JSON.parse(stored);
          // Only merge if no migration needed and settings exist
          finalSettings = { ...DEFAULT_SETTINGS, ...parsed };
        } catch (error) {
          console.error("Failed to parse settings:", error);
          // If parsing fails, use defaults
          finalSettings = DEFAULT_SETTINGS;
        }
      } else if (needsMigration) {
        // Migration: reset to new defaults
        console.log("Migrating settings to version", CURRENT_VERSION);
        finalSettings = DEFAULT_SETTINGS;
      }

      // Save the final settings and version to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSettings));
      localStorage.setItem(SETTINGS_VERSION_KEY, CURRENT_VERSION);
      setSettings(finalSettings);
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
