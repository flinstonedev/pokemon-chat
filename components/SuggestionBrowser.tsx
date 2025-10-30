"use client";

/**
 * Suggestion Browser Component
 *
 * Displays discovered UI component suggestions from the exploration agent.
 * Users can browse, filter, and add suggestions to their chat.
 */

import { useState, useEffect } from "react";
import {
  UIComponentSuggestion,
  ExploreQueriesResponse,
  SuggestionCategory,
  SuggestionComplexity,
} from "@/lib/exploration-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Search, Filter, BarChart3, Database } from "lucide-react";

interface SuggestionBrowserProps {
  onAddToChat: (suggestion: UIComponentSuggestion) => void;
}

export function SuggestionBrowser({ onAddToChat }: SuggestionBrowserProps) {
  const [suggestions, setSuggestions] = useState<UIComponentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SuggestionCategory | "all">("all");
  const [complexityFilter, setComplexityFilter] = useState<SuggestionComplexity | "all">("all");

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/explore-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to load suggestions");
        return;
      }

      setSuggestions((data as ExploreQueriesResponse).suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const filteredSuggestions = suggestions.filter((s) => {
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (complexityFilter !== "all" && s.complexity !== complexityFilter) return false;
    return true;
  });

  const getCategoryIcon = (category: SuggestionCategory) => {
    switch (category) {
      case "exploration":
        return <Database className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      case "comparison":
        return <BarChart3 className="h-4 w-4" />;
      case "visualization":
        return <BarChart3 className="h-4 w-4" />;
      case "reference":
        return <Database className="h-4 w-4" />;
    }
  };

  const getComplexityColor = (complexity: SuggestionComplexity) => {
    switch (complexity) {
      case "beginner":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "advanced":
        return "bg-red-500/10 text-red-500 border-red-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Discovering Pokemon data queries...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={loadSuggestions} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Pokemon Data Explorer</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose from {suggestions.length} pre-built queries to explore Pokemon data instantly
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as SuggestionCategory | "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="exploration">Exploration</SelectItem>
              <SelectItem value="search">Search</SelectItem>
              <SelectItem value="comparison">Comparison</SelectItem>
              <SelectItem value="visualization">Visualization</SelectItem>
              <SelectItem value="reference">Reference</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select
          value={complexityFilter}
          onValueChange={(value) => setComplexityFilter(value as SuggestionComplexity | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Complexity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredSuggestions.length} of {suggestions.length}
        </div>
      </div>

      {/* Suggestions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSuggestions.map((suggestion, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(suggestion.category)}
                  <Badge variant="outline" className="capitalize">
                    {suggestion.category}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className={getComplexityColor(suggestion.complexity)}
                >
                  {suggestion.complexity}
                </Badge>
              </div>
              <CardTitle className="text-lg">{suggestion.title}</CardTitle>
              <CardDescription>{suggestion.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {suggestion.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Component Type */}
              <div className="text-xs text-muted-foreground">
                Component: <code className="text-xs">{suggestion.componentType}</code>
              </div>

              {/* Estimated Results */}
              {suggestion.estimatedResults && (
                <div className="text-xs text-muted-foreground">
                  ~{suggestion.estimatedResults.toLocaleString()} results
                </div>
              )}

              {/* Query Preview */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View Query
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-[10px]">
                  {suggestion.graphqlQuery}
                </pre>
              </details>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => onAddToChat(suggestion)}
                className="w-full"
                variant="default"
              >
                Add to Chat
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            No suggestions match your filters
          </p>
          <Button
            onClick={() => {
              setCategoryFilter("all");
              setComplexityFilter("all");
            }}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
