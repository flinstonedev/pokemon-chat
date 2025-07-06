"use client";

import {
    ThreadPrimitive,
    MessagePrimitive,
    ComposerPrimitive,
} from "@assistant-ui/react";

// Custom blinking loading indicator component
function BlinkingLoadingIndicator() {
    return (
        <div className="flex items-center justify-center py-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full blink-dot" />
        </div>
    );
}

// Simple Message component without incorrect tool handling
function Message() {
    return (
        <MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">

            <div className="col-start-2 row-start-1 max-w-xl break-words">
                <MessagePrimitive.If user>
                    <div className="rounded-3xl bg-purple-800 px-5 py-2.5 text-white">
                        <MessagePrimitive.Content />
                    </div>
                </MessagePrimitive.If>

                <MessagePrimitive.If assistant>
                    <div className="rounded-3xl bg-gray-700 px-5 py-2.5 text-white">
                        <MessagePrimitive.Content components={{ Empty: BlinkingLoadingIndicator }} />
                    </div>
                </MessagePrimitive.If>
            </div>

            <MessagePrimitive.If user>
                <div className="col-start-1 row-start-1 mr-3 mt-2.5 flex justify-end">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-800 text-white">
                        👤
                    </div>
                </div>
            </MessagePrimitive.If>

            <MessagePrimitive.If assistant>
                <div className="col-start-1 row-start-1 mr-3 mt-2.5 flex justify-end">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-white">
                        🤖
                    </div>
                </div>
            </MessagePrimitive.If>
        </MessagePrimitive.Root>
    );
}

export function Thread() {
    return (
        <ThreadPrimitive.Root className="flex h-full flex-col bg-gray-800 text-white">
            <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 pt-8">
                <ThreadPrimitive.Empty>
                    <div className="flex h-full flex-col items-center justify-center space-y-4">
                        <div className="rounded-full bg-gray-700 p-4">
                            <div className="h-8 w-8 text-blue-400 flex items-center justify-center">🤖</div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-white">Talk to the Pokemon API!</h3>
                            <p className="text-sm text-gray-400">
                                Ask the Pokemon API anything you want!
                            </p>
                            <p className="text-xs text-orange-400 mt-2">
                                Powered by QuerySculptor MCP Server
                            </p>
                        </div>
                    </div>
                </ThreadPrimitive.Empty>

                <ThreadPrimitive.Messages components={{ Message }} />
            </ThreadPrimitive.Viewport>

            <div className="border-t border-gray-700 bg-gray-800 p-4">
                <ComposerPrimitive.Root className="focus-within:border-blue-500 flex w-full items-center rounded-lg border border-gray-600 bg-gray-900 pl-4 shadow-sm">
                    <ComposerPrimitive.Input
                        autoFocus
                        placeholder="Ask me about the Pokemon API GraphQL schemas, queries, or anything else..."
                        className="placeholder:text-gray-500 h-12 max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-white outline-none focus:ring-0"
                    />
                    <ComposerPrimitive.Send asChild>
                        <button className="m-2.5 h-9 px-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center text-sm font-medium transition-colors">
                            ➤
                            <span className="sr-only">Send</span>
                        </button>
                    </ComposerPrimitive.Send>
                </ComposerPrimitive.Root>
            </div>
        </ThreadPrimitive.Root>
    );
} 
