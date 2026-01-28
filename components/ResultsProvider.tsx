"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface QueryResult {
  id: string;
  type: "list" | "details" | "search" | "error";
  data: Record<string, unknown>;
  query: string;
  timestamp: number;
}

interface ResultsContextType {
  results: QueryResult[];
  addResult: (result: Omit<QueryResult, "id" | "timestamp">) => void;
  clearResults: () => void;
  latestResult: QueryResult | null;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export function ResultsProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<QueryResult[]>([]);

  const addResult = useCallback(
    (result: Omit<QueryResult, "id" | "timestamp">) => {
      const timestamp = Date.now();
      const newResult: QueryResult = {
        ...result,
        id: `${timestamp}-${Math.random().toString(36).substring(2, 11)}`,
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
          return prev;
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
    <ResultsContext.Provider
      value={{ results, addResult, clearResults, latestResult }}
    >
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  const context = useContext(ResultsContext);
  if (context === undefined) {
    throw new Error("useResults must be used within a ResultsProvider");
  }
  return context;
}
