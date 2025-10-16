"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { Loader2, Send, Bot } from "lucide-react";
import { usePokemonResults } from "./PokemonResultsProvider";
import { useState } from "react";
import type { PokemonAgentResponse } from "@/lib/pokemon-ui-schema";
import { PokemonUIRenderer } from "./PokemonUIRenderer";
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

export function ChatInterface() {
  const { addResult } = usePokemonResults();
  const [input, setInput] = useState("");
  const [visualizations, setVisualizations] = useState<
    Map<string, PokemonAgentResponse>
  >(new Map());

  // Function to visualize Pokemon data
  const visualizePokemonData = async (
    data: Record<string, unknown>,
    messageId: string
  ) => {
    console.log("[visualizePokemonData] Called with:", { data, messageId });

    try {
      const response = await fetch("/api/visualize-pokemon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
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
    }
  };

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: ({ message }) => {
      console.log("[ChatInterface] onFinish called", {
        messageId: message.id,
        partsCount: message.parts?.length || 0,
      });

      // Process tool calls if they contain Pokemon data
      if (message.parts) {
        message.parts.forEach((part, index) => {
          console.log(`[ChatInterface] Processing part ${index}:`, {
            type: part.type,
            toolName: "toolName" in part ? part.toolName : undefined,
            hasOutput: "output" in part,
          });

          // Check for presentPokemonData tool first (preferred method)
          if (
            (part.type === "dynamic-tool" || part.type.startsWith("tool-")) &&
            "toolName" in part &&
            part.toolName === "presentPokemonData" &&
            "output" in part
          ) {
            console.log("[ChatInterface] Found presentPokemonData tool!");

            try {
              const result =
                typeof part.output === "string"
                  ? JSON.parse(part.output)
                  : part.output;

              console.log("[ChatInterface] presentPokemonData result:", result);

              if (result?.data) {
                console.log(
                  "[ChatInterface] Triggering visualization from presentPokemonData"
                );

                // Add to results context
                addResult({
                  type: "search",
                  data: result.data as Record<string, unknown>,
                  query: "presentPokemonData",
                });

                // Visualize the Pokemon data with UI agent
                visualizePokemonData(result.data, message.id);
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

                // Add to results context
                addResult({
                  type: "search",
                  data: pokemonData as Record<string, unknown>,
                  query: JSON.stringify("input" in part ? part.input : {}),
                });

                // Visualize the Pokemon data with UI agent
                visualizePokemonData(pokemonData, message.id);
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

  return (
    <div className="bg-gradient-surface flex h-full">
      {/* Left section - Chat */}
      <div className="border-border/50 flex flex-1 flex-col border-r">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="bg-primary bg-gradient-primary mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
              <Bot className="text-primary-foreground h-8 w-8" />
            </div>
            <h2 className="text-foreground mb-2 text-2xl font-bold">
              Pokemon Chat Assistant
            </h2>
            <p className="text-muted-foreground max-w-md">
              Ask me anything about Pokemon! I can help you explore the Pokemon
              API using GraphQL queries.
            </p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <Conversation className="h-full">
              <ConversationContent className="p-6">
                <div className="mx-auto max-w-4xl">
                  {messages.map((message) => {
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
                                <PokemonUIRenderer
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
