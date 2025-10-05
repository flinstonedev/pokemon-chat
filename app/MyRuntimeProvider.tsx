"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";

export function MyRuntimeProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const runtime = useChatRuntime({
        // Explicitly set the transport to ensure correct endpoint
        transport: new AssistantChatTransport({
            api: "/api/assistant-chat",
        }),
    });

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            {children}
        </AssistantRuntimeProvider>
    );
} 