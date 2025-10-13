"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { Loader2, Send, Bot } from "lucide-react";
import { usePokemonResults } from "./PokemonResultsProvider";
import { useState } from "react";
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
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

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: ({ message }) => {
      // Process tool calls if they contain Pokemon data
      if (message.parts) {
        message.parts.forEach((part) => {
          if ((part.type === 'dynamic-tool' || part.type.startsWith('tool-')) && 'toolName' in part && part.toolName === 'execute-query' && 'output' in part) {
            try {
              const result = typeof part.output === 'string'
                ? JSON.parse(part.output)
                : part.output;

              if (result && typeof result === 'object' && 'data' in result) {
                addResult({
                  type: 'search',
                  data: result.data as Record<string, unknown>,
                  query: JSON.stringify('input' in part ? part.input : {}),
                });
              }
            } catch {
              // Error handling
            }
          }
        });
      }
    },
    onError: () => {
      // Error handling
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex flex-col h-full bg-gradient-surface">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 shadow-lg">
            <Bot className="w-8 h-8 text-accent-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Pokemon Chat Assistant</h2>
          <p className="text-muted-foreground max-w-md">
            Ask me anything about Pokemon! I can help you explore the Pokemon API using GraphQL queries.
          </p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <Conversation className="h-full">
            <ConversationContent className="p-6">
              <div className="max-w-4xl mx-auto">
                {messages.map((message) => {
                  // Separate tool parts from text parts
                  const toolParts = message.parts.filter(part => 
                    part.type === 'dynamic-tool' || part.type.startsWith('tool-')
                  );
                  const textParts = message.parts.filter(part => 
                    part.type === 'text'
                  );
                  
                  return (
                    <div key={message.id} className="mb-6">
                      {/* Render tool calls separately without MessageContent wrapper */}
                      {toolParts.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {toolParts.map((part, index) => {
                            const toolPart = part as ToolUIPart;
                            const toolName = 'toolName' in toolPart ? String(toolPart.toolName) : 'tool';
                            const displayName = toolName
                              .split('-')
                              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            
                            return (
                              <Tool key={`${message.id}-tool-${index}`} defaultOpen={false}>
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
                                {part.type === 'text' ? part.text : null}
                              </Response>
                            ))}
                          </MessageContent>
                        </Message>
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
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

      <div className="border-t border-border/50 bg-surface-2 backdrop-blur-md p-6">
        <div className="max-w-4xl mx-auto">
          <PromptInput
            onSubmit={(message) => {
              if (message.text && message.text.trim()) {
                sendMessage({ text: message.text });
                setInput('');
              }
            }}
            className="border-border/50 bg-surface-1 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50"
          >
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask me anything about Pokemon..."
              disabled={isLoading}
              className="text-foreground placeholder-muted-foreground min-h-[6rem] py-3"
            />
            <PromptInputSubmit
              status={isLoading ? 'streaming' : 'ready'}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-primary text-primary-foreground shadow-md hover:shadow-lg disabled:opacity-50 mr-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </PromptInputSubmit>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
