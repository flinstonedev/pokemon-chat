# Anthropic Provider Support

This document describes the new Anthropic provider integration for the Pokemon Chat application.

## Overview

The application now supports both OpenAI and Anthropic as LLM providers for:

1. **Chat Agent** - Conversational responses to user queries
2. **UI Generator Agent** - Visualizing Pokemon data with AI-generated UI layouts

## Features

### Settings Panel

A new settings UI allows users to configure which LLM provider to use for each agent:

- **Chat Agent Provider**: OpenAI (GPT-4o, GPT-4o Mini) or Anthropic (Claude Opus, Claude Sonnet)
- **UI Generator Provider**: OpenAI (GPT-4o Mini) or Anthropic (Claude Haiku, Claude Sonnet)

Settings are persisted locally in the browser's localStorage and take effect immediately for new messages.

### Access Settings

Click the **Settings** button (⚙️ icon) in the header to open the settings panel.

## Architecture

### New Components

**`components/SettingsProvider.tsx`**

- React Context for managing LLM provider settings globally
- Handles loading/saving settings from localStorage
- Provides `useSettings()` hook for accessing settings throughout the app

**`components/SettingsPanel.tsx`**

- UI component for the settings modal
- Dropdown selectors for provider and model selection
- Automatically updates available models based on selected provider

### Updated APIs

**`/app/api/chat/route.ts`**

- Now accepts `provider` and `model` parameters in the request body
- Routes requests to the appropriate LLM provider (OpenAI or Anthropic)

**`/app/api/visualize-pokemon/route.ts`**

- Now accepts `provider` and `model` parameters in the request body
- Uses the specified provider to generate Pokemon UI layouts

**`lib/ui-agent.ts`**

- Updated to support both OpenAI and Anthropic providers
- Dynamically selects the appropriate provider based on configuration

### Integration

**`app/layout.tsx`**

- Wrapped with `SettingsProvider` to enable settings context throughout the app

**`components/ChatInterface.tsx`**

- Integrated `SettingsPanel` button in the header
- Passes current provider/model settings to API calls
- Respects user provider preferences for all requests

## Environment Variables

No additional environment variables are required. The Anthropic API key should be set in the `ANTHROPIC_API_KEY` environment variable (handled by the @ai-sdk/anthropic package).

## Dependencies Added

- `@ai-sdk/anthropic@^2.0.31` - Anthropic AI SDK provider integration

## Available Models

### Chat Agent

- **OpenAI**: GPT-4o, GPT-4o Mini
- **Anthropic**: Claude Opus, Claude Sonnet

### UI Generator Agent

- **OpenAI**: GPT-4o Mini
- **Anthropic**: Claude Haiku, Claude Sonnet

## Usage Example

Users can switch providers through the UI:

1. Click Settings (⚙️) button in the header
2. Choose provider and model for "Chat Agent"
3. Choose provider and model for "UI Generator Agent"
4. Click outside the modal or close button to save
5. New messages will use the selected providers

## TypeScript Support

Full TypeScript support with proper typing for:

- Provider types: `LLMProvider = "openai" | "anthropic"`
- Chat models: `ChatModel = "gpt-4o" | "gpt-4o-mini" | "claude-opus" | "claude-sonnet"`
- UI Generator models: `UIGeneratorModel = "gpt-4o-mini" | "claude-haiku" | "claude-sonnet"`

## Notes

- Settings are stored per browser/device
- Provider selection does not affect existing messages (only new messages)
- Each agent (chat and UI generator) can use different providers independently
- The application maintains full backward compatibility with the default OpenAI configuration
