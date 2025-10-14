"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ChatInterface } from "../components/ChatInterface";
import { PokemonResultsProvider } from "../components/PokemonResultsProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bot } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <div className="flex-1 flex items-center justify-center bg-background relative">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <div className="text-center bg-card rounded-2xl shadow-2xl p-8 max-w-md border border-border">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
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
              <button 
                className="px-8 py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition-all shadow-lg transform hover:scale-105 text-primary-foreground"
                style={{ background: 'var(--gradient-primary)' }}
              >
                Sign In to Try it Out!
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="h-screen flex flex-col bg-background">
          {/* Header */}
          <div className="bg-card shadow-lg border-b border-border flex-shrink-0">
            <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
              <div>
                <h1 
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'var(--gradient-primary)' }}
                >
                  Pokemon Chat with MCP Tools
                </h1>
                <p className="text-sm text-muted-foreground">
                  Powered by QuerySculptor MCP Server
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <UserButton afterSignOutUrl="/" />
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