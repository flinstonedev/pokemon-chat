"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { Loader2, Send, Bot } from "lucide-react";
import { usePokemonResults } from "./PokemonResultsProvider";
import { useSettings } from "./SettingsProvider";
import { useState, useEffect } from "react";
import type { PokemonAgentResponse } from "@/lib/pokemon-ui-schema";
import { InteractiveUIRenderer } from "./InteractiveUIRenderer";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

// Initial prompt to trigger autonomous agent exploration
const INITIAL_PROMPT = `You are an autonomous Pokemon UI agent with Query Sculptor tools.

MISSION: Explore the Pokemon GraphQL API and propose DIVERSE, COMPLEX component options for the user to choose from.

⚠️ IMPORTANT: DO NOT build components yet - just PROPOSE them!

PHASE 1 - COMPREHENSIVE SCHEMA DISCOVERY:
1) Introspect ALL entity types thoroughly:
   - Root query fields and what they return
   - ALL types: Pokemon, Move, Ability, Type, Generation, EvolutionChain, Item, Berry, Location, etc.
   - Nested fields within each type (go DEEP - 2-3 levels)
   - Arguments available on each field
   - Relationships between entities

2) Map out RICH DATA OPPORTUNITIES:
   - Which queries return nested/related data?
   - What fields have interesting sub-fields? (e.g., pokemon.abilities[].ability.effect)
   - What computed/derived data exists? (stats, damage_relations, effectiveness)
   - What filtering/sorting is available?
   - Where can you JOIN multiple entity types in one query?

PHASE 2 - PROPOSE COMPONENT OPTIONS (5-8 diverse proposals):

For EACH proposed component, describe:
1. **Component Name** - Clear, descriptive name
2. **What it does** - What analytical question it answers or exploration it enables
3. **Data complexity** - What nested data, relationships, or analytics it includes
4. **Component type** - Which UI component type would be used (comparison-grid, filter-panel, chart-view, matrix-view, detail-panel, etc.)
5. **Why it's valuable** - What insights users would gain

🎯 COMPONENT COMPLEXITY REQUIREMENTS - Each proposal must have AT LEAST 2 of:
- Multiple related entities in ONE query (joins/nested data)
- Comparison/analytical capabilities (stats, effectiveness, rankings)
- Rich nested data structures (abilities + effects, moves + power + type)
- Interactive filtering with multiple criteria
- Data aggregation or computed insights
- Relationship traversal (evolution chains, type interactions)

🚫 FORBIDDEN PROPOSALS:
- Simple paginated lists with just names and IDs
- Single-level queries without nested data
- Components without interactive variables
- Duplicate functionality

PHASE 3 - PRESENT OPTIONS TO USER:

After introspection and analysis, present your proposals in a clear, numbered list format.

Then ask: "Which component would you like me to build first? (Choose a number or ask me to build multiple)"

DO NOT BUILD ANYTHING YET - wait for the user's selection!

START NOW: 
1. Introspect the API deeply
2. Analyze what complex components are possible
3. Propose 5-8 diverse, analytical component options
4. Ask the user which to build!`;

export function ChatInterface() {
  const { addResult } = usePokemonResults();
  const settings = useSettings();
  const [input, setInput] = useState("");
  const [visualizations, setVisualizations] = useState<
    Map<string, PokemonAgentResponse>
  >(new Map());
  const [loadingVisualizations, setLoadingVisualizations] = useState<
    Set<string>
  >(new Set());

  // Function to visualize Pokemon data
  const visualizePokemonData = async (
    data: Record<string, unknown>,
    messageId: string,
    queryMetadata?: { query: string; variables?: Record<string, unknown> }
  ) => {
    console.log("[visualizePokemonData] Called with:", {
      data,
      messageId,
      queryMetadata,
    });

    // Add to loading set
    setLoadingVisualizations((prev) => new Set(prev).add(messageId));

    try {
      const response = await fetch("/api/visualize-pokemon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          queryMetadata,
          provider: settings.uiGeneratorProvider,
          model: settings.uiGeneratorModel,
        }),
      });

      console.log("[visualizePokemonData] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[visualizePokemonData] Error response:", errorText);
        throw new Error("Failed to visualize Pokemon data");
      }

      const result = await response.json();
      console.log("[visualizePokemonData] Got result:", result);

      setVisualizations((prev) => new Map(prev).set(messageId, result));
      console.log("[visualizePokemonData] Updated visualizations map");
    } catch (error) {
      console.error("[visualizePokemonData] Error:", error);
    } finally {
      // Remove from loading set
      setLoadingVisualizations((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  };

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        provider: settings.chatProvider,
        model: settings.chatModel,
      },
    }),
    onFinish: ({ message }) => {
      console.log("[ChatInterface] onFinish called", {
        messageId: message.id,
        partsCount: message.parts?.length || 0,
      });

      // Process tool calls if they contain Pokemon data
      if (message.parts) {
        message.parts.forEach((part, index) => {
          // Only log parts that might be tool results
          if (part.type.includes("tool")) {
            console.log(`[ChatInterface] Tool part ${index}:`, {
              type: part.type,
              toolName: "toolName" in part ? part.toolName : "N/A",
              hasOutput: "output" in part,
              hasResult: "result" in part,
            });
            console.log(`[ChatInterface] Full part ${index}:`, JSON.stringify(part, null, 2));
          }

          // Check for presentPokemonData tool first (preferred method)
          // AI SDK 5.0 custom tools use type: "tool-<toolname>" format
          if (
            part.type === "tool-presentPokemonData" ||
            (part.type === "tool-result" && "toolName" in part && part.toolName === "presentPokemonData") ||
            (part.type === "dynamic-tool" && "toolName" in part && part.toolName === "presentPokemonData")
          ) {
            console.log("[ChatInterface] Found presentPokemonData tool!");

            try {
              // AI SDK 5.0 uses 'result' instead of 'output'
              const toolOutput = "result" in part ? part.result : ("output" in part ? part.output : null);

              if (!toolOutput) {
                console.error("[ChatInterface] presentPokemonData tool has no result or output!");
                return;
              }

              const result =
                typeof toolOutput === "string"
                  ? JSON.parse(toolOutput)
                  : toolOutput;

              console.log("[ChatInterface] presentPokemonData result:", JSON.stringify(result, null, 2));

              if (result?.data) {
                console.log(
                  "[ChatInterface] Triggering visualization from presentPokemonData"
                );

                // Extract query metadata if available
                const queryMetadata = result.queryMetadata || undefined;
                console.log(
                  "[ChatInterface] Query metadata:",
                  queryMetadata
                );

                // Add to results context
                addResult({
                  type: "search",
                  data: result.data as Record<string, unknown>,
                  query: "presentPokemonData",
                });

                // Visualize the Pokemon data with UI agent, passing query metadata
                visualizePokemonData(result.data, message.id, queryMetadata);
              } else {
                console.warn("[ChatInterface] presentPokemonData result has no data field:", result);
              }
            } catch (error) {
              console.error(
                "[ChatInterface] Error processing presentPokemonData:",
                error
              );
            }
          }
          // Fallback: Check for execute-query tool (backward compatibility)
          else if (
            (part.type === "dynamic-tool" || part.type.startsWith("tool-")) &&
            "toolName" in part &&
            part.toolName === "execute-query" &&
            "output" in part
          ) {
            console.log("[ChatInterface] Found execute-query tool!");

            try {
              let result =
                typeof part.output === "string"
                  ? JSON.parse(part.output)
                  : part.output;

              console.log("[ChatInterface] Initial parsed result:", result);

              // Handle nested content structure from MCP tools
              if (result?.content?.[0]?.text) {
                console.log("[ChatInterface] Found content.text, parsing...");
                const innerData = JSON.parse(result.content[0].text);
                console.log("[ChatInterface] Parsed inner data:", innerData);
                result = innerData;
              }

              // Now extract the actual Pokemon data
              let pokemonData = null;

              if (result?.data?.data) {
                // Structure: { data: { data: { pokemon: {...} } } }
                pokemonData = result.data.data;
                console.log("[ChatInterface] Found data.data:", pokemonData);
              } else if (result?.data) {
                // Structure: { data: { pokemon: {...} } }
                pokemonData = result.data;
                console.log("[ChatInterface] Found data:", pokemonData);
              }

              if (pokemonData) {
                console.log(
                  "[ChatInterface] Triggering visualization with:",
                  pokemonData
                );

                // Extract query metadata - MCP stores it in result.data.queryString
                let queryMetadata;

                // Option 1: Check result.data.queryString (MCP execute-query format)
                if (result?.data?.queryString) {
                  console.log(
                    "[ChatInterface] ✅ Found query in result.data.queryString"
                  );

                  // Extract variables from result.data if available
                  let variables = result.data.variables || {};

                  // If query has default values like $limit: Int = 20, extract them
                  if (Object.keys(variables).length === 0) {
                    const limitMatch = result.data.queryString.match(/\$limit:\s*Int\s*=\s*(\d+)/);
                    const offsetMatch = result.data.queryString.match(/\$offset:\s*Int\s*=\s*(\d+)/);
                    if (limitMatch || offsetMatch) {
                      variables = {
                        limit: limitMatch ? parseInt(limitMatch[1]) : 20,
                        offset: offsetMatch ? parseInt(offsetMatch[1]) : 0,
                      };
                      console.log(
                        "[ChatInterface] Extracted default variables from query:",
                        variables
                      );
                    }
                  }

                  queryMetadata = {
                    query: result.data.queryString,
                    variables,
                  };
                  console.log(
                    "[ChatInterface] Extracted queryMetadata:",
                    queryMetadata
                  );
                }

                // Option 2: Check result.metadata (alternative format)
                if (!queryMetadata && result?.metadata) {
                  console.log(
                    "[ChatInterface] Checking metadata:",
                    result.metadata
                  );
                  if (result.metadata.query || result.metadata.queryString) {
                    queryMetadata = {
                      query: result.metadata.query || result.metadata.queryString,
                      variables: result.metadata.variables || {},
                    };
                    console.log(
                      "[ChatInterface] Extracted queryMetadata from metadata:",
                      queryMetadata
                    );
                  }
                }

                // Option 3: Fallback to tool input (legacy)
                if (!queryMetadata && "input" in part && part.input) {
                  console.log(
                    "[ChatInterface] Trying tool input as fallback:",
                    part.input
                  );
                  const input =
                    typeof part.input === "string"
                      ? JSON.parse(part.input)
                      : part.input;
                  if (input.query) {
                    queryMetadata = {
                      query: input.query,
                      variables: input.variables || {},
                    };
                    console.log(
                      "[ChatInterface] Extracted queryMetadata from input:",
                      queryMetadata
                    );
                  }
                }

                if (!queryMetadata) {
                  console.warn(
                    "[ChatInterface] ⚠️ No query metadata found - will generate static UI"
                  );
                }

                // Add to results context
                addResult({
                  type: "search",
                  data: pokemonData as Record<string, unknown>,
                  query: JSON.stringify("input" in part ? part.input : {}),
                });

                // Visualize the Pokemon data with UI agent
                visualizePokemonData(pokemonData, message.id, queryMetadata);
              } else {
                console.log(
                  "[ChatInterface] No Pokemon data found in result:",
                  result
                );
              }
            } catch (error) {
              console.error(
                "[ChatInterface] Error processing tool output:",
                error
              );
            }
          }
        });
      }
    },
    onError: () => {
      // Error handling
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Handler to start exploration
  const startExploration = () => {
    sendMessage({ text: INITIAL_PROMPT });
  };

  return (
    <div className="bg-gradient-surface flex h-full">
      {/* Left section - Chat */}
      <div className="border-border/50 flex flex-1 flex-col border-r">
        {/* Welcome screen with exploration button */}
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <div className="text-center max-w-2xl">
              <div className="bg-primary bg-gradient-primary mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl">
                <Bot className="text-primary-foreground h-10 w-10" />
              </div>
              <h1 className="text-foreground mb-4 text-4xl font-bold">
                Pokemon GraphQL Explorer
              </h1>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Unleash an AI agent to explore the Pokemon GraphQL API and build
                interactive visualizations. The agent will introspect the schema,
                construct complex queries, and generate multiple production-quality
                components for browsing Pokemon, moves, abilities, types, and more.
              </p>
              <button
                onClick={startExploration}
                disabled={isLoading}
                className="bg-primary bg-gradient-primary text-primary-foreground hover:shadow-2xl disabled:opacity-50 inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105"
              >
                <Bot className="h-6 w-6" />
                Start GraphQL Exploration
              </button>
              <p className="text-muted-foreground mt-6 text-sm">
                The agent will build 5-7+ diverse interactive components
              </p>
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <Conversation className="h-full">
              <ConversationContent className="p-6">
                <div className="mx-auto max-w-4xl">
                  {messages
                    .filter((message, index, self) => 
                      // Remove duplicate messages with same ID
                      index === self.findIndex((m) => m.id === message.id)
                    )
                    .map((message) => {
                    // Separate tool parts from text parts
                    // Hide presentPokemonData from tool list (it's handled separately)
                    const toolParts = message.parts.filter(
                      (part) =>
                        (part.type === "dynamic-tool" ||
                          part.type.startsWith("tool-")) &&
                        !(
                          "toolName" in part &&
                          part.toolName === "presentPokemonData"
                        )
                    );
                    const textParts = message.parts.filter(
                      (part) => part.type === "text"
                    );

                    return (
                      <div key={message.id} className="mb-6">
                        {/* Render tool calls separately without MessageContent wrapper */}
                        {toolParts.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {toolParts.map((part, index) => {
                              const toolPart = part as ToolUIPart;
                              const toolName =
                                "toolName" in toolPart
                                  ? String(toolPart.toolName)
                                  : "tool";
                              const displayName = toolName
                                .split("-")
                                .map(
                                  (word: string) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ");

                              return (
                                <Tool
                                  key={`${message.id}-tool-${index}`}
                                  defaultOpen={false}
                                >
                                  <ToolHeader
                                    title={displayName}
                                    type={toolPart.type}
                                    state={toolPart.state}
                                  />
                                  <ToolContent>
                                    <ToolInput input={toolPart.input} />
                                    <ToolOutput
                                      output={toolPart.output}
                                      errorText={toolPart.errorText}
                                    />
                                  </ToolContent>
                                </Tool>
                              );
                            })}
                          </div>
                        )}

                        {/* Render text response in MessageContent */}
                        {textParts.length > 0 && (
                          <Message from={message.role}>
                            <MessageContent>
                              {textParts.map((part, index) => (
                                <Response key={`${message.id}-text-${index}`}>
                                  {part.type === "text" ? part.text : null}
                                </Response>
                              ))}
                            </MessageContent>
                          </Message>
                        )}

                        {/* Render Pokemon visualization loading indicator */}
                        {loadingVisualizations.has(message.id) && (
                          <div className="border-border/50 bg-card/50 mt-4 flex items-center gap-3 rounded-lg border p-4">
                            <Loader2 className="text-primary h-5 w-5 animate-spin" />
                            <span className="text-muted-foreground text-sm">
                              Generating visualization...
                            </span>
                          </div>
                        )}

                        {/* Render Pokemon visualization if available */}
                        {visualizations.has(message.id) &&
                          (() => {
                            console.log(
                              "[Render] Rendering visualization for message:",
                              message.id,
                              visualizations.get(message.id)
                            );
                            return (
                              <div className="mt-4">
                                <InteractiveUIRenderer
                                  elements={visualizations.get(message.id)!.ui}
                                />
                              </div>
                            );
                          })()}
                      </div>
                    );
                  })}
                  {isLoading && (
                    <Message from="assistant">
                      <MessageContent>
                        <div className="text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </MessageContent>
                    </Message>
                  )}
                </div>
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>
        )}

        <div className="border-border/50 bg-surface-2 border-t p-6 backdrop-blur-md">
          <div className="mx-auto max-w-4xl">
            <PromptInput
              onSubmit={(message) => {
                if (message.text && message.text.trim()) {
                  sendMessage({ text: message.text });
                  setInput("");
                }
              }}
              className="border-border/50 bg-surface-1 focus-within:ring-primary/50 focus-within:border-primary/50 rounded-xl focus-within:ring-2"
            >
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Ask me anything about Pokemon..."
                disabled={isLoading}
                className="text-foreground placeholder-muted-foreground min-h-[6rem] py-3"
              />
              <PromptInputSubmit
                status={isLoading ? "streaming" : "ready"}
                disabled={isLoading || !input.trim()}
                className="bg-primary bg-gradient-primary text-primary-foreground mr-2 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </PromptInputSubmit>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
