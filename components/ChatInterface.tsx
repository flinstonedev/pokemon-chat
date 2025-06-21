"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, User, Bot, Wrench, MessageSquare, Plus, Zap, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Copy, Play, Eye } from "lucide-react";

interface ToolCall {
    id: string;
    name: string;
    arguments: string;
}

type ContentSegment = {
    type: "text";
    content: string;
} | {
    type: "tool_call";
    toolCall: {
        id: string;
        name: string;
        arguments: string;
    };
} | {
    type: "tool_result";
    toolCallId: string;
    content: string;
};

interface Message {
    _id: Id<"messages">;
    _creationTime: number;
    role: "user" | "assistant" | "tool";
    content?: string;
    contentSegments?: ContentSegment[];
    toolCalls?: ToolCall[];
    toolCallId?: string;
    toolName?: string;
    createdAt: number;
}



interface ChatThread {
    _id: Id<"threads">;
    _creationTime: number;
    title: string;
    createdAt: number;
    updatedAt: number;
}

// Inline Tool Call Component - more compact for inline use
function InlineToolCall({
    toolCall,
    toolResult,
    isExecuting,
    index
}: {
    toolCall: ToolCall;
    toolResult?: Message;
    isExecuting: boolean;
    index: number;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedToolId, setCopiedToolId] = useState<string | null>(null);

    const copyToClipboard = async (text: string, toolId: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedToolId(toolId);
        setTimeout(() => setCopiedToolId(null), 2000);
    };

    const hasResult = !!toolResult;

    return (
        <div className="border border-orange-200 rounded-lg bg-orange-50/30 p-3 mb-3">
            {/* Tool Header - Compact */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 bg-orange-100 rounded-full">
                        <span className="text-xs font-bold text-orange-600">{index + 1}</span>
                    </div>
                    <Wrench className="w-3 h-3 text-orange-600" />
                    <span className="font-medium text-sm">{toolCall.name}</span>

                    {/* Status */}
                    {hasResult ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            ✓ completed
                        </Badge>
                    ) : isExecuting ? (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                            <Play className="w-2 h-2 mr-1" />
                            executing
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                            <Clock className="w-2 h-2 mr-1" />
                            pending
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(toolCall.arguments, toolCall.id)}
                        className="h-5 w-5 p-0"
                    >
                        {copiedToolId === toolCall.id ? (
                            <CheckCircle className="w-3 h-3" />
                        ) : (
                            <Copy className="w-3 h-3" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-5 w-5 p-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Tool Description */}
            <p className="text-xs text-gray-600 mb-2">
                {getToolDescription(toolCall.name)}
            </p>

            {/* Quick Result Preview (when collapsed) */}
            {!isExpanded && toolResult && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                    <span className="text-green-600">
                        {getResultSummary(toolResult.content || "", toolCall.name)}
                    </span>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="space-y-2 border-t pt-2">
                    {/* Parameters */}
                    <div>
                        <span className="text-xs font-medium text-gray-700">Parameters:</span>
                        <div className="bg-gray-100 rounded p-2 mt-1">
                            <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(JSON.parse(toolCall.arguments), null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* Result */}
                    {toolResult && (
                        <div>
                            <div className="flex items-center gap-1 mb-1">
                                <Eye className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-medium text-green-700">Result:</span>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded p-2">
                                {renderToolResult(toolResult.content || "", toolCall.name)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Component to render streaming content with inline tool calls in correct order
function StreamingContentFlow({
    message,
    toolResults,
    isStreaming,
    streamingMessageId
}: {
    message: Message;
    toolResults: Message[];
    isStreaming: boolean;
    streamingMessageId: Id<"messages"> | null;
}) {
    return (
        <div className="ml-7 space-y-3">
            {/* If we have content segments, render them in order */}
            {message.contentSegments && message.contentSegments.length > 0 ? (
                message.contentSegments.map((segment, index) => {
                    if (segment.type === "text") {
                        return (
                            <div key={`text-${index}`} className="p-3 rounded-lg bg-gray-100 max-w-3xl">
                                <div className="whitespace-pre-wrap">{segment.content}</div>
                            </div>
                        );
                    } else if (segment.type === "tool_call") {
                        const toolResult = toolResults?.find(result => result.toolCallId === segment.toolCall.id);
                        const isExecuting = isStreaming && !toolResult;

                        return (
                            <InlineToolCall
                                key={`tool-${segment.toolCall.id}`}
                                toolCall={segment.toolCall}
                                toolResult={toolResult}
                                isExecuting={isExecuting}
                                index={index}
                            />
                        );
                    } else if (segment.type === "tool_result") {
                        // Tool results are rendered as part of the tool call, so we skip them here
                        return null;
                    }
                    return null;
                })
            ) : (
                <>
                    {/* Fallback: Show message content */}
                    {message.content && (
                        <div className="p-3 rounded-lg bg-gray-100 max-w-3xl">
                            <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                    )}

                    {/* Fallback: Show tool calls inline after content */}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="space-y-2">
                            {message.toolCalls.map((toolCall, index) => {
                                const toolResult = toolResults?.find(result => result.toolCallId === toolCall.id);
                                const isExecuting = isStreaming && !toolResult;

                                return (
                                    <InlineToolCall
                                        key={toolCall.id}
                                        toolCall={toolCall}
                                        toolResult={toolResult}
                                        isExecuting={isExecuting}
                                        index={index}
                                    />
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// New ToolCallVisualization Component - now uses inline components
function ToolCallVisualization({
    toolCalls,
    toolResults,
    isStreaming
}: {
    toolCalls: ToolCall[];
    toolResults: Message[];
    isStreaming: boolean;
}) {
    if (!toolCalls?.length) return null;

    return (
        <div className="space-y-2">
            {toolCalls.map((toolCall, index) => {
                const toolResult = toolResults?.find(result => result.toolCallId === toolCall.id);
                const isExecuting = isStreaming && !toolResult;

                return (
                    <InlineToolCall
                        key={toolCall.id}
                        toolCall={toolCall}
                        toolResult={toolResult}
                        isExecuting={isExecuting}
                        index={index}
                    />
                );
            })}
        </div>
    );
}

// Helper functions
function getToolDescription(toolName: string): string {
    const descriptions: Record<string, string> = {
        'getWeatherInformation': 'Fetching current weather conditions for the specified location',
        'calculateMath': 'Performing mathematical calculations',
        'searchDatabase': 'Searching through database records',
        'GMAIL_SEND_EMAIL': 'Sending an email via Gmail',
        'LINEAR_CREATE_ISSUE': 'Creating a new issue in Linear',
        // Add more tool descriptions as needed
    };

    return descriptions[toolName] || `Executing ${toolName}`;
}

function getResultSummary(content: string, toolName: string): string {
    try {
        const result = JSON.parse(content);

        if (toolName === 'getWeatherInformation') {
            return `${result.temperature}°C, ${result.condition}`;
        }
        if (toolName === 'calculateMath') {
            return `Result: ${result.result}`;
        }
        if (toolName === 'searchDatabase') {
            return `Found ${result.count} results`;
        }
        if (toolName.includes('GMAIL')) {
            return 'Email sent successfully';
        }
        if (toolName.includes('LINEAR')) {
            return 'Issue created successfully';
        }

        return 'Completed successfully';
    } catch {
        return 'Completed';
    }
}

function renderToolResult(content: string, toolName: string) {
    try {
        const result = JSON.parse(content);

        if (toolName === "getWeatherInformation") {
            return (
                <div className="space-y-2">
                    <div className="font-medium text-green-800">Weather in {result.city}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>🌡️ <span className="font-medium">{result.temperature}°C</span></div>
                        <div>☁️ <span className="font-medium">{result.condition}</span></div>
                        <div>💧 <span className="font-medium">{result.humidity}%</span></div>
                        <div>💨 <span className="font-medium">{result.windSpeed} km/h</span></div>
                    </div>
                </div>
            );
        }

        if (toolName === "calculateMath") {
            return (
                <div className="space-y-2">
                    <div className="font-medium text-green-800">Calculation Result</div>
                    <div className="text-sm">
                        <div>Expression: <code className="bg-green-100 px-1 rounded">{result.expression}</code></div>
                        <div className="text-lg font-bold text-green-800 mt-1">= {result.result}</div>
                    </div>
                </div>
            );
        }

        if (toolName === "searchDatabase") {
            return (
                <div className="space-y-2">
                    <div className="font-medium text-green-800">Database Search Results</div>
                    <div className="text-sm space-y-1">
                        <div>Query: <span className="font-medium">&ldquo;{result.query}&rdquo;</span></div>
                        <div>Category: <span className="font-medium">{result.category}</span></div>
                        <div>Results: <span className="font-medium">{result.count} found</span></div>
                    </div>
                    {result.results?.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {result.results.slice(0, 3).map((item: unknown, idx: number) => (
                                <div key={idx} className="text-xs bg-green-100 p-2 rounded">
                                    {JSON.stringify(item)}
                                </div>
                            ))}
                            {result.results.length > 3 && (
                                <div className="text-xs text-green-600">
                                    ...and {result.results.length - 3} more results
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Default for QueryArtisan, Gmail, Linear, etc.
        return (
            <div className="space-y-2">
                <div className="font-medium text-green-800">
                    {toolName.includes('queryartisan') ? '🔧 QueryArtisan Result' :
                        toolName.includes('GMAIL') ? '📧 Gmail Result' :
                            toolName.includes('LINEAR') ? '📋 Linear Result' :
                                'Tool Result'}
                </div>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto bg-white p-2 rounded border">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
        );
    } catch {
        return (
            <div className="text-sm text-gray-800">
                {content}
            </div>
        );
    }
}

export default function ChatInterface() {
    const { user } = useUser();
    const [currentThreadId, setCurrentThreadId] = useState<Id<"threads"> | null>(null);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [useStreaming, setUseStreaming] = useState(true);
    const [streamingMessageId, setStreamingMessageId] = useState<Id<"messages"> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Queries and mutations
    const threads: ChatThread[] | undefined = useQuery(api.chat.getUserThreads,
        user ? { userId: user.id } : "skip"
    );
    const messages: Message[] | undefined = useQuery(api.chat.getThreadMessages,
        currentThreadId ? { threadId: currentThreadId } : "skip"
    );
    const createThread = useMutation(api.chat.createThread);
    const sendMessage = useAction(api.ai.sendMessage);
    const sendMessageStream = useAction(api.ai.sendMessageStream);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-focus input when thread changes or after sending message
    useEffect(() => {
        if (currentThreadId && !isLoading) {
            inputRef.current?.focus();
        }
    }, [currentThreadId, isLoading]);

    // Create a new thread
    const handleNewThread = async () => {
        if (!user) return;

        const threadId = await createThread({
            userId: user.id,
            title: `Chat ${new Date().toLocaleDateString()}`,
        });
        setCurrentThreadId(threadId);
    };

    // Send a message
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !currentThreadId || !user || isLoading) return;

        setIsLoading(true);
        const messageText = input.trim();
        setInput("");

        try {
            if (useStreaming) {
                const result = await sendMessageStream({
                    threadId: currentThreadId,
                    userId: user.id,
                    content: messageText,
                });
                setStreamingMessageId(result.assistantMessageId);

                // Clear streaming message ID after a delay
                setTimeout(() => setStreamingMessageId(null), 2000);
            } else {
                await sendMessage({
                    threadId: currentThreadId,
                    userId: user.id,
                    content: messageText,
                });
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setInput(messageText); // Restore input on error
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="w-96">
                    <CardContent className="p-6 text-center">
                        <Bot className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-gray-500">Please sign in to start chatting</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen max-w-7xl mx-auto">
            {/* Sidebar - Thread List */}
            <div className="w-80 border-r bg-white">
                <div className="p-4 border-b">
                    <Button onClick={handleNewThread} className="w-full" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Chat
                    </Button>
                </div>

                <div className="overflow-y-auto h-full pb-20">
                    {threads?.map((thread: ChatThread) => (
                        <div
                            key={thread._id}
                            onClick={() => setCurrentThreadId(thread._id)}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-100 transition-colors ${currentThreadId === thread._id ? "bg-blue-50 border-blue-200" : ""
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-gray-500" />
                                <h3 className="font-medium text-sm truncate">{thread.title}</h3>
                            </div>
                            <p className="text-xs text-gray-500">
                                {new Date(thread.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {currentThreadId ? (
                    <Card className="flex-1 flex flex-col border-0 rounded-none">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="w-6 h-6" />
                                    AI Assistant with Tools
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={useStreaming ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setUseStreaming(!useStreaming)}
                                        className="flex items-center gap-2"
                                    >
                                        {useStreaming ? <Zap className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        {useStreaming ? "Streaming" : "Standard"}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col p-0">
                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages?.length === 0 && (
                                    <div className="text-center py-8">
                                        <Bot className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                        <p className="text-gray-500 mb-4">Start a conversation! I can help with weather, calculations, database searches, and more.</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <Badge variant="secondary">Weather Info</Badge>
                                            <Badge variant="secondary">Math Calculations</Badge>
                                            <Badge variant="secondary">Database Search</Badge>
                                            <Badge variant="secondary">QueryArtisan Tools</Badge>
                                            <Badge variant="secondary">Gmail & Linear</Badge>
                                        </div>
                                    </div>
                                )}

                                {messages?.map((message: Message) => {
                                    // Skip tool messages - they'll be rendered inline
                                    if (message.role === "tool") return null;

                                    // Get tool results for this message
                                    const messageToolResults = messages.filter(m =>
                                        m.role === "tool" &&
                                        message.toolCalls?.some(tc => tc.id === m.toolCallId)
                                    );

                                    return (
                                        <div key={message._id} className="space-y-3">
                                            {/* Message Header */}
                                            <div className="flex items-center gap-2">
                                                {message.role === "user" ? (
                                                    <User className="w-5 h-5" />
                                                ) : (
                                                    <Bot className="w-5 h-5" />
                                                )}
                                                <span className="font-medium capitalize text-sm">
                                                    {message.role}
                                                </span>
                                                {/* Streaming indicator */}
                                                {streamingMessageId === message._id && (
                                                    <div className="flex items-center gap-1">
                                                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                                        <span className="text-xs text-blue-600">streaming...</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Content with Inline Tool Calls */}
                                            {message.role === "assistant" ? (
                                                <StreamingContentFlow
                                                    message={message}
                                                    toolResults={messageToolResults}
                                                    isStreaming={streamingMessageId === message._id}
                                                    streamingMessageId={streamingMessageId}
                                                />
                                            ) : message.content ? (
                                                <div className="ml-7 p-3 rounded-lg bg-gray-100 max-w-3xl">
                                                    <div className="whitespace-pre-wrap">{message.content}</div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}

                                {isLoading && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Bot className="w-5 h-5" />
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{useStreaming ? "Streaming response..." : "Thinking..."}</span>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <div className="border-t p-4">
                                <form onSubmit={handleSubmit} className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask me anything... Try: 'What's the weather in Paris?' or 'Calculate 15 * 23'"
                                        disabled={isLoading}
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                    />
                                    <Button type="submit" disabled={isLoading || !input.trim()}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <Card className="w-96">
                            <CardContent className="p-6 text-center">
                                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                <h2 className="text-2xl font-bold mb-2">Welcome to AI Chat</h2>
                                <p className="text-gray-500 mb-4">Select a conversation or start a new one</p>
                                <Button onClick={handleNewThread}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Start New Chat
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
} 