"use client";

import type { ExplorationSuggestion } from "@/lib/pokemon-ui-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface ExplorationSuggestionsProps {
  suggestions: ExplorationSuggestion[];
  onSelect: (suggestion: ExplorationSuggestion) => void;
  loading?: boolean;
  errors?: string[];
}

export function ExplorationSuggestions({
  suggestions,
  onSelect,
  loading = false,
  errors = [],
}: ExplorationSuggestionsProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Exploring the Pokemon GraphQL API...
        </p>
      </div>
    );
  }

  if (errors.length > 0 && suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="text-destructive mb-2 text-lg font-semibold">
          Exploration Failed
        </div>
        <div className="text-muted-foreground space-y-1 text-sm">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="text-muted-foreground text-sm">
          No exploration suggestions available
        </p>
      </div>
    );
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "beginner":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "advanced":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="text-primary h-5 w-5" />
        <h2 className="text-foreground text-xl font-semibold">
          Explore Pokemon Data
        </h2>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">
        Choose a component to explore the Pokemon GraphQL API:
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion, index) => (
          <Card
            key={index}
            className="border-border/50 bg-card/50 hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
            onClick={() => onSelect(suggestion)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                <Badge
                  className={getComplexityColor(suggestion.complexity)}
                  variant="outline"
                >
                  {suggestion.complexity}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {suggestion.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                {suggestion.tags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="mb-4 text-xs">
                <span className="text-muted-foreground">Component:</span>{" "}
                <span className="text-foreground font-mono">
                  {suggestion.componentType}
                </span>
              </div>
              <Button className="w-full" variant="outline" size="sm">
                Create Component
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="mb-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
            Warnings:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-yellow-600 dark:text-yellow-500">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
