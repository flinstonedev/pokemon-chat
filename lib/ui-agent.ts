import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { z, type ZodSchema } from "zod";
import { ComponentAgentResponseSchema } from "./generic-ui-schema";

const DEFAULT_SYSTEM_PROMPT = "You are a generic UI builder.";
const DEFAULT_SCHEMA = ComponentAgentResponseSchema;

export type LLMProviderType = typeof openai | typeof anthropic;

export interface LLMConfig {
  provider?: LLMProviderType; // e.g., openai, anthropic, etc.
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  useChat?: boolean; // Force chat API instead of responses API (needed for ZAI)
}

export interface AgentConfig<TSchema extends ZodSchema> {
  systemPrompt?: string;
  schema?: TSchema;
  llm?: LLMConfig;
}

const DEFAULT_LLM_CONFIG: LLMConfig = {
  model: "gpt-4o-mini",
  temperature: 0.7,
};

/**
 * Generate structured UI response using AI SDK v5
 * Compatible with Vercel AI SDK 5.x
 */
export async function respond<TSchema extends ZodSchema>(
  userPrompt: string,
  config?: AgentConfig<TSchema>
): Promise<z.infer<TSchema>> {
  const systemPrompt = config?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const schema = (config?.schema ?? DEFAULT_SCHEMA) as TSchema;
  const llmConfig = { ...DEFAULT_LLM_CONFIG, ...config?.llm };

  // Resolve the model
  const provider = llmConfig.provider ?? openai;
  const modelName = llmConfig.model ?? "gpt-4o-mini";

  try {
    // Use generateObject from AI SDK v5
    let modelInstance;

    // Check if provider is a string (Vercel model registry format like "openai:gpt-4o")
    if (typeof provider === "string") {
      // For string-based model identifiers, use directly
      modelInstance = provider;
    } else {
      // For provider objects, call as function
      // Force chat API if useChat is true (needed for ZAI and other providers that don't support Responses API)
      modelInstance = llmConfig.useChat
        ? provider.chat(modelName)
        : provider(modelName);
    }

    const result = await generateObject({
      model: modelInstance,
      schema: schema,
      prompt: userPrompt,
      system: systemPrompt,
      temperature: llmConfig.temperature,
      maxTokens: llmConfig.maxTokens,
      topP: llmConfig.topP,
    });

    return result.object as z.infer<TSchema>;
  } catch (err) {
    console.error("Error generating response:", err);
    throw err;
  }
}

/**
 * Create an agent with persistent configuration
 */
export function createAgent<TSchema extends ZodSchema>(
  config?: AgentConfig<TSchema>
) {
  return {
    respond: (userPrompt: string) => respond(userPrompt, config),
    getConfig: () => config,
  };
}
