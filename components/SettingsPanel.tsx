"use client";

import { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";
import {
  useSettings,
  type ChatModel,
  type UIGeneratorModel,
} from "./SettingsProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHAT_MODELS = {
  openai: [
    // Commented out - only showing Anthropic providers
    // { value: "gpt-4o-mini" as const, label: "GPT-4o-mini" },
    // { value: "gpt-5-mini" as const, label: "GPT-5-mini" },
  ],
  anthropic: [
    { value: "claude-haiku-4-5-20251001" as const, label: "Claude Haiku 4.5" },
    {
      value: "claude-sonnet-4-5-20250929" as const,
      label: "Claude Sonnet 4.5",
    },
  ],
  zai: [
    // Commented out - only showing Anthropic providers
    // { value: "glm-4.6" as const, label: "GLM-4.6" },
  ],
  local: [
    { value: "local-model" as const, label: "Local Model" },
  ],
  vercel: [
    { value: "claude-3-5-haiku-20241022" as const, label: "Claude 3.5 Haiku" },
    { value: "moonshotai/kimi-k2-turbo" as const, label: "Kimi K2 Turbo" },
  ],
};

const UI_GENERATOR_MODELS = {
  openai: [
    // Commented out - only showing Anthropic providers
    // { value: "gpt-5-mini" as const, label: "GPT-5-mini" }
  ],
  anthropic: [
    { value: "claude-haiku-4-5-20251001" as const, label: "Claude Haiku 4.5" },
    {
      value: "claude-sonnet-4-5-20250929" as const,
      label: "Claude Sonnet 4.5",
    },
  ],
  zai: [
    // Commented out - only showing Anthropic providers
    // { value: "glm-4.6" as const, label: "GLM-4.6" },
  ],
  local: [
    { value: "local-model" as const, label: "Local Model" },
  ],
  vercel: [
    { value: "claude-3-5-haiku-20241022" as const, label: "Claude 3.5 Haiku" },
    { value: "moonshotai/kimi-k2-turbo" as const, label: "Kimi K2 Turbo" },
  ],
};

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    chatProvider,
    chatModel,
    uiGeneratorProvider,
    uiGeneratorModel,
    setChatProvider,
    setChatModel,
    setUIGeneratorProvider,
    setUIGeneratorModel,
  } = useSettings();

  // Auto-select valid model when chat provider changes
  useEffect(() => {
    const availableModels = CHAT_MODELS[chatProvider];
    if (!availableModels.find((m) => m.value === chatModel)) {
      setChatModel(availableModels[0].value);
    }
  }, [chatProvider, chatModel, setChatModel]);

  // Auto-select valid model when UI generator provider changes
  useEffect(() => {
    const availableModels = UI_GENERATOR_MODELS[uiGeneratorProvider];
    if (!availableModels.find((m) => m.value === uiGeneratorModel)) {
      setUIGeneratorModel(availableModels[0].value);
    }
  }, [uiGeneratorProvider, uiGeneratorModel, setUIGeneratorModel]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="border-border/50 bg-surface-1 hover:bg-surface-2 text-foreground rounded-lg border p-2 transition-colors"
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="bg-card border-border/50 fixed inset-0 z-50 flex items-center justify-center border backdrop-blur-sm">
      <div className="bg-surface-2 border-border/50 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border shadow-lg">
        {/* Header */}
        <div className="bg-surface-1 border-border/50 sticky top-0 flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-semibold">Settings</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Chat Agent Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-foreground mb-1 font-semibold">Chat Agent</h3>
              <p className="text-muted-foreground text-sm">
                LLM provider for conversational responses
              </p>
            </div>

            {/* Chat Provider */}
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">
                Provider
              </label>
              <Select
                value={chatProvider}
                onValueChange={(value) =>
                  setChatProvider(value as "openai" | "anthropic" | "zai" | "local" | "vercel")
                }
              >
                <SelectTrigger className="border-border/50 bg-surface-1 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="openai">OpenAI</SelectItem> */}
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  {/* <SelectItem value="zai">ZAI (Zhipu AI)</SelectItem> */}
                  <SelectItem value="local">Local (localhost:1234)</SelectItem>
                  <SelectItem value="vercel">Vercel AI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chat Model */}
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">
                Model
              </label>
              <Select
                value={chatModel}
                onValueChange={(value) => setChatModel(value as ChatModel)}
              >
                <SelectTrigger className="border-border/50 bg-surface-1 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAT_MODELS[chatProvider].map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-border/30 border-t" />

          {/* UI Generator Agent Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-foreground mb-1 font-semibold">
                UI Generator Agent
              </h3>
              <p className="text-muted-foreground text-sm">
                LLM provider for visualizing Pokemon data
              </p>
            </div>

            {/* UI Generator Provider */}
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">
                Provider
              </label>
              <Select
                value={uiGeneratorProvider}
                onValueChange={(value) =>
                  setUIGeneratorProvider(value as "openai" | "anthropic" | "zai" | "local" | "vercel")
                }
              >
                <SelectTrigger className="border-border/50 bg-surface-1 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="openai">OpenAI</SelectItem> */}
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  {/* <SelectItem value="zai">ZAI (Zhipu AI)</SelectItem> */}
                  <SelectItem value="local">Local (localhost:1234)</SelectItem>
                  <SelectItem value="vercel">Vercel AI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* UI Generator Model */}
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">
                Model
              </label>
              <Select
                value={uiGeneratorModel}
                onValueChange={(value) =>
                  setUIGeneratorModel(value as UIGeneratorModel)
                }
              >
                <SelectTrigger className="border-border/50 bg-surface-1 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UI_GENERATOR_MODELS[uiGeneratorProvider].map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info */}
          <div className="bg-surface-1 border-border/30 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">
              Settings are saved locally in your browser. Changes take effect
              immediately for new messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
