"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { Thread } from "../../components/assistant-ui/Thread";
import { AllMCPToolUIs } from "../../components/assistant-ui/MCPToolUIs";

// Simple Assistant UI Chat Component
function SimpleAssistantUIChat() {
    return (
        <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-4xl mx-auto p-4 h-full flex flex-col">
                {/* Header with clear Assistant UI branding */}
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        🎯 Assistant UI Chat Demo
                    </h1>
                    <p className="text-sm text-gray-600">
                        Functional chat using Assistant UI primitives • Vercel AI SDK • Claude • MCP Tools
                    </p>
                </div>

                {/* Functional Assistant UI Thread */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
                    <Thread />
                </div>

                {/* Register all MCP tool UIs */}
                {AllMCPToolUIs.map((ToolUI, index) => (
                    <ToolUI key={index} />
                ))}
            </div>
        </div>
    );
}

export default function AssistantUIPage() {
    return (
        <div className="min-h-screen">
            <SignedOut>
                <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
                    <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
                        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Assistant UI Demo
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Experience the new Assistant UI chat interface with modern styling and MCP tools
                        </p>
                        <SignInButton mode="modal">
                            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
                                Sign In to Try Assistant UI
                            </button>
                        </SignInButton>
                    </div>
                </div>
            </SignedOut>

            <SignedIn>
                <div className="h-screen flex flex-col bg-gray-50">
                    {/* Header */}
                    <div className="bg-white shadow-sm border-b">
                        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Assistant UI Demo
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Powered by Assistant UI • MCP Tools • Different from original!
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <a
                                    href="/"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    ← Back to Original Chat
                                </a>
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </div>
                    </div>

                    {/* Assistant UI Chat Interface */}
                    <div className="flex-1">
                        <MyRuntimeProvider>
                            <SimpleAssistantUIChat />
                        </MyRuntimeProvider>
                    </div>
                </div>
            </SignedIn>
        </div>
    );
} 