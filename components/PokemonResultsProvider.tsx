"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface PokemonResult {
  id: string;
  type: "list" | "details" | "search" | "error";
  data: Record<string, unknown>;
  query: string;
  timestamp: number;
}

interface PokemonResultsContextType {
  results: PokemonResult[];
  addResult: (result: Omit<PokemonResult, "id" | "timestamp">) => void;
  clearResults: () => void;
  latestResult: PokemonResult | null;
}

const PokemonResultsContext = createContext<
  PokemonResultsContextType | undefined
>(undefined);

export function PokemonResultsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [results, setResults] = useState<PokemonResult[]>([]);

  const addResult = useCallback(
    (result: Omit<PokemonResult, "id" | "timestamp">) => {
      const timestamp = Date.now();
      const newResult: PokemonResult = {
        ...result,
        id: `${timestamp}-${Math.random().toString(36).substring(2, 11)}`, // More unique ID
        timestamp,
      };

      // Avoid duplicates by checking if we already have a very similar result
      setResults((prev) => {
        const isDuplicate = prev.some(
          (existing) =>
            existing.query === newResult.query &&
            Math.abs(existing.timestamp - newResult.timestamp) < 1000 // Within 1 second
        );

        if (isDuplicate) {
          return prev; // Don't add duplicate
        }

        return [newResult, ...prev.slice(0, 9)]; // Keep last 10 results
      });
    },
    []
  );

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  const latestResult = results[0] || null;

  return (
    <PokemonResultsContext.Provider
      value={{ results, addResult, clearResults, latestResult }}
    >
      {children}
    </PokemonResultsContext.Provider>
  );
}

export function usePokemonResults() {
  const context = useContext(PokemonResultsContext);
  if (context === undefined) {
    throw new Error(
      "usePokemonResults must be used within a PokemonResultsProvider"
    );
  }
  return context;
}
