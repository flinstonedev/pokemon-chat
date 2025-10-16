"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { ChatInterface } from "../components/ChatInterface";
import { PokemonResultsProvider } from "../components/PokemonResultsProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Ensure this page is always dynamically rendered so auth state and Clerk
// components don't mismatch between server and client during hydration.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <div className="bg-background relative flex flex-1 items-center justify-center">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <div className="bg-card border-border max-w-md rounded-2xl border p-8 text-center shadow-2xl">
            <div className="bg-primary bg-gradient-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
              <Bot className="text-primary-foreground h-8 w-8" />
            </div>
            <h1 className="text-foreground mb-4 text-3xl font-bold">
              Pokemon Chat with MCP Tools
            </h1>
            <p className="text-muted-foreground mb-6">
              Experience QuerySculptor capabilities with the{" "}
              <a
                href="https://graphql-pokeapi.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                Pokemon API
              </a>
            </p>
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <button className="bg-primary bg-gradient-primary text-primary-foreground transform rounded-lg px-8 py-3 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:opacity-90">
                Sign In to Try it Out!
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="bg-background flex h-screen flex-col">
          {/* Header */}
          <div className="bg-card border-border flex-shrink-0 border-b shadow-lg">
            <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
              <div>
                <h1 className="text-primary text-2xl font-bold">
                  Pokemon Chat with MCP Tools
                </h1>
                <p className="text-muted-foreground text-sm">
                  Powered by QuerySculptor MCP Server
                </p>
              </div>
              <div className="flex items-center gap-4">
                <SettingsPanel />
                <ThemeToggle />
                <ClerkLoading>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </ClerkLoading>
                <ClerkLoaded>
                  <UserButton afterSignOutUrl="/" />
                </ClerkLoaded>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <PokemonResultsProvider>
              <ChatInterface />
            </PokemonResultsProvider>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
