"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, User, Bot, Wrench, MessageSquare, Plus } from "lucide-react";

interface ToolCall {
    id: string;
    name: string;
    arguments: string;
}

interface Message {
    _id: Id<"messages">;
    _creationTime: number;
    role: "user" | "assistant" | "tool";
    content?: string;
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

export default function ChatInterface() {
    const { user } = useUser();
    const [currentThreadId, setCurrentThreadId] = useState<Id<"threads"> | null>(null);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Queries and mutations
    const threads: ChatThread[] | undefined = useQuery(api.chat.getUserThreads,
        user ? { userId: user.id } : "skip"
    );
    const messages: Message[] | undefined = useQuery(api.chat.getThreadMessages,
        currentThreadId ? { threadId: currentThreadId } : "skip"
    );
    const createThread = useMutation(api.chat.createThread);
    const sendMessage = useAction(api.ai.sendMessage);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
            await sendMessage({
                threadId: currentThreadId,
                userId: user.id,
                content: messageText,
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            setInput(messageText); // Restore input on error
        } finally {
            setIsLoading(false);
        }
    };

    const renderToolResult = (content: string, toolName: string) => {
        try {
            const result = JSON.parse(content);

            if (toolName === "getWeatherInformation") {
                return (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="text-blue-600 font-medium">Weather in {result.city}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Condition: <span className="font-medium">{result.condition}</span></div>
                            <div>Temperature: <span className="font-medium">{result.temperature}°C</span></div>
                            <div>Humidity: <span className="font-medium">{result.humidity}%</span></div>
                            <div>Wind: <span className="font-medium">{result.windSpeed} km/h</span></div>
                        </div>
                    </div>
                );
            }

            if (toolName === "calculateMath") {
                return (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-green-600 font-medium mb-1">Math Calculation</div>
                        <div className="text-sm">
                            <div>Expression: <code className="bg-green-100 px-1 rounded">{result.expression}</code></div>
                            <div>Result: <span className="font-medium text-lg">{result.result}</span></div>
                        </div>
                    </div>
                );
            }

            if (toolName === "searchDatabase") {
                return (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-purple-600 font-medium mb-2">Database Search</div>
                        <div className="text-sm mb-2">
                            <div>Query: <span className="font-medium">"{result.query}"</span></div>
                            <div>Category: <span className="font-medium">{result.category}</span></div>
                            <div>Results: <span className="font-medium">{result.count} found</span></div>
                        </div>
                        {result.results.length > 0 && (
                            <div className="space-y-1">
                                {result.results.map((item: any, idx: number) => (
                                    <div key={idx} className="text-xs bg-purple-100 p-2 rounded">
                                        {JSON.stringify(item)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }

            // Default JSON display
            return (
                <div className="p-2 bg-gray-50 rounded text-gray-800 text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                </div>
            );
        } catch {
            return (
                <div className="p-2 bg-gray-50 rounded text-gray-800 text-sm">
                    {content}
                </div>
            );
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="w-96">
                    <CardContent className="p-6 text-center">
                        <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Please sign in to start chatting</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen max-w-7xl mx-auto">
            {/* Sidebar - Thread List */}
            <div className="w-80 border-r bg-card">
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
                            className={`p-3 border-b cursor-pointer hover:bg-accent transition-colors ${currentThreadId === thread._id ? "bg-accent border-accent-foreground/20" : ""
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-medium text-sm truncate">{thread.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
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
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="w-6 h-6" />
                                AI Assistant with Tools
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col p-0">
                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages?.length === 0 && (
                                    <div className="text-center py-8">
                                        <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-muted-foreground mb-4">Start a conversation! I can help with weather, calculations, database searches, and more.</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <Badge variant="secondary">Weather Info</Badge>
                                            <Badge variant="secondary">Math Calculations</Badge>
                                            <Badge variant="secondary">Database Search</Badge>
                                        </div>
                                    </div>
                                )}

                                {messages?.map((message: Message) => (
                                    <div key={message._id} className="space-y-2">
                                        {/* Message Header */}
                                        <div className="flex items-center gap-2">
                                            {message.role === "user" ? (
                                                <User className="w-5 h-5" />
                                            ) : message.role === "tool" ? (
                                                <Wrench className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <Bot className="w-5 h-5" />
                                            )}
                                            <span className="font-medium capitalize text-sm">
                                                {message.role === "tool" ? `${message.toolName} Tool` : message.role}
                                            </span>
                                        </div>

                                        {/* Message Content */}
                                        {message.content && (
                                            <div className="ml-7 p-3 rounded-lg bg-muted max-w-3xl">
                                                <div className="whitespace-pre-wrap">{message.content}</div>
                                            </div>
                                        )}

                                        {/* Tool Calls */}
                                        {message.toolCalls?.map((toolCall: ToolCall) => (
                                            <div key={toolCall.id} className="ml-7 max-w-3xl">
                                                <Card className="border-l-4 border-l-blue-500">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Wrench className="w-4 h-4" />
                                                            <span className="font-medium text-sm">{toolCall.name}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                executing
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            <strong>Parameters:</strong>
                                                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                                                {JSON.stringify(JSON.parse(toolCall.arguments), null, 2)}
                                                            </pre>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ))}

                                        {/* Tool Results */}
                                        {message.role === "tool" && message.content && message.toolName && (
                                            <div className="ml-7 max-w-3xl">
                                                {renderToolResult(message.content, message.toolName)}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Bot className="w-5 h-5" />
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <div className="border-t p-4">
                                <form onSubmit={handleSubmit} className="flex gap-2">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask me anything... Try: 'What's the weather in Paris?' or 'Calculate 15 * 23'"
                                        disabled={isLoading}
                                        className="flex-1"
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
                                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h2 className="text-2xl font-bold mb-2">Welcome to AI Chat</h2>
                                <p className="text-muted-foreground mb-4">Select a conversation or start a new one</p>
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