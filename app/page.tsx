"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { Thread } from "../components/assistant-ui/Thread";
import { AllMCPToolUIs } from "../components/assistant-ui/MCPToolUIs";

// Simple Assistant UI Chat Component
function SimpleAssistantUIChat() {
  return (
    <div className="bg-gray-900 text-white h-full">
      <div className="max-w-4xl mx-auto p-4 h-full">
        {/* Functional Assistant UI Thread */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden h-full">
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
    <>
      <SignedOut>
        <div className="flex-1 flex items-center justify-center bg-gray-900">
          <div className="text-center bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md border border-gray-700">
            <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              QuerySculptor Assistant Pokemon API Chat Demo
            </h1>
            <p className="text-gray-400 mb-6">
              Experience QuerySculptor capabilities with the{" "}
              <a
                href="https://graphql-pokeapi.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Pokemon API
              </a>
            </p>
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg transform hover:scale-105">
                Sign In to Try it Out!
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="h-screen flex flex-col bg-gray-900">
          {/* Header */}
          <div className="bg-gray-800 shadow-lg border-b border-gray-700 flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Query Artisan Chat Pokemon API Demo
                </h1>
                <p className="text-sm text-gray-400">
                  Powered by QuerySculptor MCP Server • Talk to the Pokemon API!
                </p>
              </div>
              <div className="flex items-center gap-4">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>

          {/* Assistant UI Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <MyRuntimeProvider>
              <SimpleAssistantUIChat />
            </MyRuntimeProvider>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
