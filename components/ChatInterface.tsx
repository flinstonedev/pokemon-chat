"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Wrench, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { usePokemonResults } from "./PokemonResultsProvider";
import { useState } from "react";

export function ChatInterface() {
  const { addResult } = usePokemonResults();
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: ({ message }) => {
      console.log('onFinish message:', message);
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
            } catch (error) {
              console.error('Error processing tool result:', error);
            }
          }
        });
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  const isLoading = status === 'streaming';

  const renderToolCall = (part: { type: string; toolName?: string; input?: unknown; output?: unknown; state?: string }) => {
    // Check if it's a tool part (dynamic-tool or tool-*)
    if (part.type !== 'dynamic-tool' && !part.type.startsWith('tool-')) return null;

    const isComplete = part.state === "output-available";
    const hasError = part.state === "output-error";

    return (
      <div key={Math.random()} className="mb-2 p-4 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-1.5 rounded-lg ${isComplete ? 'bg-green-500/20' : hasError ? 'bg-red-500/20' : 'bg-blue-500/20'
            }`}>
            <Wrench className={`w-4 h-4 ${isComplete ? 'text-green-400' : hasError ? 'text-red-400' : 'text-blue-400'
              }`} />
          </div>
          <span className="text-sm font-semibold text-gray-200">{part.toolName}</span>
          <div className="flex-1"></div>
          {isComplete && (
            <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              <span>Complete</span>
            </div>
          )}
          {hasError && (
            <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              <span>Error</span>
            </div>
          )}
          {part.state === "input-available" && (
            <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Running</span>
            </div>
          )}
        </div>

        {part.input != null && (
          <details className="mb-2 group">
            <summary className="text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-300 flex items-center gap-1 transition-colors">
              <span>Parameters</span>
              <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
            </summary>
            <pre className="mt-2 text-xs text-gray-300 bg-black/30 p-3 rounded-lg overflow-x-auto border border-gray-700/30">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </details>
        )}

        {part.output != null && (
          <details className="group">
            <summary className="text-xs font-medium text-green-400 cursor-pointer hover:text-green-300 flex items-center gap-1 transition-colors">
              <span>Result</span>
              <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
            </summary>
            <pre className="mt-2 text-xs text-green-300 bg-black/30 p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto border border-green-700/20">
              {typeof part.output === 'string'
                ? part.output
                : JSON.stringify(part.output, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950">
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Pokemon Chat Assistant</h2>
              <p className="text-gray-400 max-w-md">
                Ask me anything about Pokemon! I can help you explore the Pokemon API using GraphQL queries.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div className={`flex gap-4 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}>
                <div className="flex-shrink-0 mt-1">
                  {message.role === "user" ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  {message.parts && message.parts.length > 0 && (
                    <div className="space-y-2">
                      {message.parts.map((part, index) => {
                        console.log('Part type:', part.type, 'Part:', part);
                        if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
                          return renderToolCall(part);
                        } else if (part.type === 'text') {
                          return (
                            <div key={`${message.id}-${index}`} className={`rounded-2xl p-4 ${message.role === "user"
                                ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg"
                                : "bg-gray-800/80 backdrop-blur-sm text-gray-100 border border-gray-700/50 shadow-xl"
                              }`}>
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                                {part.text}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about Pokemon..."
                className="w-full bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 pr-12 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
