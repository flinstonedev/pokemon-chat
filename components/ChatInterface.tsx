"use client";

import { useChat } from "ai/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Wrench, CheckCircle, AlertCircle } from "lucide-react";
import { usePokemonResults } from "./PokemonResultsProvider";

export function ChatInterface() {
  const { addResult } = usePokemonResults();

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // Process tool calls if they contain Pokemon data
      if (message.toolInvocations) {
        message.toolInvocations.forEach((invocation) => {
          if (invocation.toolName === "execute-query" && 'result' in invocation && invocation.result) {
            try {
              const result = typeof invocation.result === 'string'
                ? JSON.parse(invocation.result)
                : invocation.result;

              if (result && typeof result === 'object' && 'data' in result) {
                addResult({
                  type: 'search',
                  data: result.data as Record<string, unknown>,
                  query: JSON.stringify(invocation.args),
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

  const renderToolCall = (invocation: { toolCallId?: string; toolName: string; args: unknown; result?: unknown; state: string }) => {
    const isComplete = invocation.state === "result";
    const hasError = invocation.state === "error";

    return (
      <div key={invocation.toolCallId || Math.random()} className="mb-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">{invocation.toolName}</span>
          {isComplete && <CheckCircle className="w-4 h-4 text-green-400" />}
          {hasError && <AlertCircle className="w-4 h-4 text-red-400" />}
          {invocation.state === "call" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
        </div>

        {invocation.args != null && (
          <details className="mb-2">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              Parameters
            </summary>
            <pre className="mt-1 text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto">
              {JSON.stringify(invocation.args, null, 2)}
            </pre>
          </details>
        )}

        {invocation.result != null && (
          <details>
            <summary className="text-xs text-green-400 cursor-pointer hover:text-green-300">
              Result
            </summary>
            <pre className="mt-1 text-xs text-green-300 bg-gray-900 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
              {typeof invocation.result === 'string'
                ? invocation.result
                : JSON.stringify(invocation.result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`flex gap-3 max-w-[80%] ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}>
                <div className="flex-shrink-0">
                  {message.role === "user" ? (
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {message.toolInvocations && message.toolInvocations.length > 0 && (
                    <div className="space-y-2">
                      {message.toolInvocations.map((invocation) =>
                        renderToolCall(invocation)
                      )}
                    </div>
                  )}

                  {message.content && (
                    <Card className={`${
                      message.role === "user"
                        ? "bg-purple-900 border-purple-700"
                        : "bg-gray-800 border-gray-700"
                    }`}>
                      <CardContent className="p-3">
                        <p className="text-sm text-white whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-3">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about Pokemon..."
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}