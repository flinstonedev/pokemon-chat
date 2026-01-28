import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { Loader2, Send, Database } from "lucide-react";
import { useResults } from "./ResultsProvider";
import { useSettings } from "./SettingsProvider";
import { useState } from "react";
import type { ComponentAgentResponseSchema } from "@/lib/generic-ui-schema";
import { z } from "zod";
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

type ComponentAgentResponse = z.infer<typeof ComponentAgentResponseSchema>;

// Initial prompt to trigger autonomous agent exploration
const INITIAL_PROMPT = `You are a GraphQL Explorer Agent.

MISSION: Explore the provided GraphQL API and build dynamic interfaces.

PHASE 1 - DISCOVERY:
1) Introspect schema to find available Types and Fields.
2) Identify array/list fields (return [Type]).
3) Identify simple object fields.

PHASE 2 - BUILD:
Construct a Component-Based UI for the data.
- Build "Master-Detail" views (List on left, Details on right).
- Build "Dashboards" (Grid of Stats).
- Build "Tables".

Start by introspecting the schema.`;

export function ChatInterface() {
  const { addResult } = useResults();
  const settings = useSettings();
  const [input, setInput] = useState("");
  const [visualizations, setVisualizations] = useState<
    Map<string, ComponentAgentResponse>
  >(new Map());
  const [loadingVisualizations, setLoadingVisualizations] = useState<
    Set<string>
  >(new Set());

  // Function to visualize data
  const visualizeData = async (
    data: Record<string, unknown>,
    messageId: string,
    queryMetadata?: { query: string; variables?: Record<string, unknown> }
  ) => {
    console.log("[visualizeData] Called with:", {
      data,
      messageId,
      queryMetadata,
    });

    // Add to loading set
    setLoadingVisualizations((prev) => new Set(prev).add(messageId));

    try {
      const response = await fetch("/api/visualize-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          queryMetadata,
          provider: settings.uiGeneratorProvider,
          model: settings.uiGeneratorModel,
        }),
      });

      console.log("[visualizeData] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[visualizeData] Error response:", errorText);
        throw new Error("Failed to visualize data");
      }

      const result = await response.json();
      console.log("[visualizeData] Got result:", result);

      setVisualizations((prev) => new Map(prev).set(messageId, result));
    } catch (error) {
      console.error("[visualizeData] Error:", error);
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

      // Process tool calls if they contain data
      if (message.parts) {
        message.parts.forEach((part) => {
          // Check for presentData tool first (preferred method)
          if (
            part.type === "tool-presentData" ||
            (part.type === "tool-result" &&
              "toolName" in part &&
              part.toolName === "presentData") ||
            (part.type === "dynamic-tool" &&
              "toolName" in part &&
              part.toolName === "presentData")
          ) {
            console.log("[ChatInterface] Found presentData tool!");

            try {
              // AI SDK 5.0 uses 'result' instead of 'output'
              const toolOutput =
                "result" in part
                  ? part.result
                  : "output" in part
                    ? part.output
                    : null;

              if (!toolOutput) {
                console.error(
                  "[ChatInterface] presentData tool has no result or output!"
                );
                return;
              }

              const result =
                typeof toolOutput === "string"
                  ? JSON.parse(toolOutput)
                  : toolOutput;

              console.log(
                "[ChatInterface] presentData result:",
                JSON.stringify(result, null, 2)
              );

              if (result?.data) {
                console.log(
                  "[ChatInterface] Triggering visualization from presentData"
                );

                // Extract query metadata if available
                const queryMetadata = result.queryMetadata || undefined;
                console.log("[ChatInterface] Query metadata:", queryMetadata);

                // Add to results context
                addResult({
                  type: "search",
                  data: result.data as Record<string, unknown>,
                  query: "presentData",
                });

                // Visualize the data with UI agent, passing query metadata
                visualizeData(result.data, message.id, queryMetadata);
              } else {
                console.warn(
                  "[ChatInterface] presentData result has no data field:",
                  result
                );
              }
            } catch (error) {
              console.error(
                "[ChatInterface] Error processing presentData:",
                error
              );
            }
          }
          // Fallback: Check for execute-query tool (backward compatibility) or executeGraphQLQuery
          else if (
            (part.type === "dynamic-tool" || part.type.startsWith("tool-")) &&
            "toolName" in part &&
            (part.toolName === "execute-query" ||
              part.toolName === "executeGraphQLQuery") &&
            "output" in part
          ) {
            // For executeGraphQLQuery, we might want to visualize automatically if presentData wasn't called?
            // But the prompt instructs to ALWAYS call presentData.
            // So I will skip this fallback logic for now to keep it clean,
            // unless we think the AI might fail to call presentData.
            // The system prompt is strong about calling presentData.
            // If I keep it, I need generic parsing.
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
            <div className="max-w-2xl text-center">
              <div className="bg-primary bg-gradient-primary mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl">
                <Database className="text-primary-foreground h-10 w-10" />
              </div>
              <h1 className="text-foreground mb-4 text-4xl font-bold">
                GraphQL Chat
              </h1>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Unleash an AI agent to explore ANY GraphQL API and build
                interactive visualizations. The agent will introspect the
                schema, construct complex queries, and generate
                production-quality components.
              </p>
              <button
                onClick={startExploration}
                disabled={isLoading}
                className="bg-primary bg-gradient-primary text-primary-foreground inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-2xl disabled:opacity-50"
              >
                <Database className="h-6 w-6" />
                Start GraphQL Exploration
              </button>
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
                    .filter(
                      (message, index, self) =>
                        // Remove duplicate messages with same ID
                        index === self.findIndex((m) => m.id === message.id)
                    )
                    .map((message) => {
                      // Separate tool parts from text parts
                      // Hide presentData from tool list (it's handled separately)
                      const toolParts = message.parts.filter(
                        (part) =>
                          (part.type === "dynamic-tool" ||
                            part.type.startsWith("tool-")) &&
                          !(
                            "toolName" in part &&
                            part.toolName === "presentData"
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
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
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
                                    {part.type === "text"
                                      ? part.text
                                      : undefined}
                                  </Response>
                                ))}
                              </MessageContent>
                            </Message>
                          )}

                          {/* Render visualization loading indicator */}
                          {loadingVisualizations.has(message.id) && (
                            <div className="border-border/50 bg-card/50 mt-4 flex items-center gap-3 rounded-lg border p-4">
                              <Loader2 className="text-primary h-5 w-5 animate-spin" />
                              <span className="text-muted-foreground text-sm">
                                Generating visualization...
                              </span>
                            </div>
                          )}

                          {/* Render visualization if available */}
                          {visualizations.has(message.id) &&
                            (() => {
                              return (
                                <div className="mt-4">
                                  <InteractiveUIRenderer
                                    modelResponse={
                                      visualizations.get(message.id)!
                                    }
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
                placeholder="Ask me anything..."
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
