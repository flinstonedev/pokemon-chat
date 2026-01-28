"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LLMProvider = "openai" | "anthropic" | "zai" | "local" | "vercel";

// Support multiple model formats: direct API models, Vercel AI format, etc.
export type ChatModel = string;
export type UIGeneratorModel = string;

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
const CURRENT_VERSION = "3"; // Increment this when defaults change

const DEFAULT_SETTINGS = {
  chatProvider: "openai" as const,
  chatModel: "gpt-4o" as const, // Use a reliable model
  uiGeneratorProvider: "openai" as const,
  uiGeneratorModel: "gpt-4o" as const,
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
