"use client";

import {
    ThreadPrimitive,
    MessagePrimitive,
    ComposerPrimitive,
    ActionBarPrimitive,
} from "@assistant-ui/react";

// Simple Message component without incorrect tool handling
function Message() {
    return (
        <MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">
            <ActionBarPrimitive.Root
                hideWhenRunning
                autohide="not-last"
                className="col-start-1 mr-3 mt-2.5 flex flex-col items-end"
            >
                <ActionBarPrimitive.Edit asChild>
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
                        Edit
                    </button>
                </ActionBarPrimitive.Edit>
            </ActionBarPrimitive.Root>

            <div className="col-start-2 row-start-1 max-w-xl break-words">
                <MessagePrimitive.If user>
                    <div className="rounded-3xl bg-blue-500 px-5 py-2.5 text-white">
                        <MessagePrimitive.Content />
                    </div>
                </MessagePrimitive.If>

                <MessagePrimitive.If assistant>
                    <div className="rounded-3xl bg-gray-100 px-5 py-2.5 text-gray-900">
                        <MessagePrimitive.Content />
                    </div>
                </MessagePrimitive.If>
            </div>

            <MessagePrimitive.If user>
                <div className="col-start-1 row-start-1 mr-3 mt-2.5 flex justify-end">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                        👤
                    </div>
                </div>
            </MessagePrimitive.If>

            <MessagePrimitive.If assistant>
                <div className="col-start-1 row-start-1 mr-3 mt-2.5 flex justify-end">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white">
                        🤖
                    </div>
                </div>
            </MessagePrimitive.If>
        </MessagePrimitive.Root>
    );
}

export function Thread() {
    return (
        <ThreadPrimitive.Root className="flex h-full flex-col bg-white">
            <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 pt-8">
                <ThreadPrimitive.Empty>
                    <div className="flex h-full flex-col items-center justify-center space-y-4">
                        <div className="rounded-full bg-blue-100 p-4">
                            <div className="h-8 w-8 text-blue-600">🤖</div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Welcome to Assistant UI Chat</h3>
                            <p className="text-sm text-gray-600">
                                This is a functional chat interface using Assistant UI primitives with MCP tools!
                            </p>
                            <p className="text-xs text-orange-600 mt-2">
                                🔧 QueryArtisan GraphQL tools available for advanced operations
                            </p>
                        </div>
                    </div>
                </ThreadPrimitive.Empty>

                <ThreadPrimitive.Messages components={{ Message }} />
            </ThreadPrimitive.Viewport>

            <div className="border-t bg-white p-4">
                <ComposerPrimitive.Root className="focus-within:border-blue-500 flex w-full items-center rounded-lg border bg-white pl-4 shadow-sm">
                    <ComposerPrimitive.Input
                        autoFocus
                        placeholder="Ask me about GraphQL, schemas, queries, or anything else..."
                        className="placeholder:text-gray-400 h-12 max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-0"
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
