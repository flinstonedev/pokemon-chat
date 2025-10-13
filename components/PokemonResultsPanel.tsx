"use client";

import React from 'react';
import { usePokemonResults } from './PokemonResultsProvider';
import { PokemonList, PokemonDetails, PokemonError, PokemonGeneric } from './PokemonComponents';
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

// Helper function to determine the result type based on data structure
const inferResultType = (data: Record<string, unknown>): 'list' | 'details' | 'search' | 'error' => {
    if (!data || data.error) return 'error';

    // Check if it's a list of Pokemon
    const dataData = data?.data as Record<string, unknown> | undefined;
    const potentialList = dataData?.pokemon || dataData?.pokemons || data?.pokemon || data?.pokemons;
    if (Array.isArray(potentialList) && potentialList.length > 1) {
        return 'list';
    }

    // Check if it's a single Pokemon with detailed information
    const potentialPokemon = dataData?.pokemon || data?.pokemon || data;
    const pokemonObj = potentialPokemon as Record<string, unknown>;
    if (potentialPokemon && (pokemonObj.name || pokemonObj.id) && !Array.isArray(potentialPokemon)) {
        return 'details';
    }

    // Default to search for other types
    return 'search';
};

export function PokemonResultsPanel() {
    const { results, latestResult, clearResults } = usePokemonResults();
    const [selectedResultIndex, setSelectedResultIndex] = React.useState(0);

    const selectedResult = results[selectedResultIndex] || latestResult;

    if (!selectedResult) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🎮</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Pokemon Data</h3>
                    <p className="text-muted-foreground">
                        Ask the AI about Pokemon to see beautiful results here!
                    </p>
                    <div className="mt-4 text-sm text-muted-foreground">
                        <p>Try asking:</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>&quot;Show me a list of Pokemon&quot;</li>
                            <li>&quot;Give me details about Pikachu&quot;</li>
                            <li>&quot;Find Pokemon by type&quot;</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    const renderResult = (result: { type: string; data: Record<string, unknown>; query: string }) => {
        const actualType = result.type === 'search' ? inferResultType(result.data) : result.type;

        switch (actualType) {
            case 'list':
                return <PokemonList data={result.data} query={result.query} />;
            case 'details':
                return <PokemonDetails data={result.data} query={result.query} />;
            case 'error':
                return <PokemonError error={String(result.data?.error || 'Unknown error')} query={result.query} />;
            default:
                return <PokemonGeneric data={result.data} query={result.query} />;
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="w-full h-full flex flex-col bg-background">
            {/* Header */}
            <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm">🎮</span>
                    </div>
                    <h2 className="font-semibold text-foreground">Pokemon Results</h2>
                    <Badge variant="secondary" className="text-xs">
                        {results.length} result{results.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    {results.length > 0 && (
                        <button
                            onClick={clearResults}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                            title="Clear all results"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            {results.length > 1 && (
                <div className="border-b border-border px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedResultIndex(Math.max(0, selectedResultIndex - 1))}
                            disabled={selectedResultIndex === 0}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-muted-foreground">
                            {selectedResultIndex + 1} of {results.length}
                        </span>
                        <button
                            onClick={() => setSelectedResultIndex(Math.min(results.length - 1, selectedResultIndex + 1))}
                            disabled={selectedResultIndex === results.length - 1}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formatTimestamp(selectedResult.timestamp)}
                    </div>
                </div>
            )}

            {/* Results History Tabs */}
            {results.length > 1 && (
                <div className="border-b border-border">
                    <div className="flex items-center gap-2 bg-muted/30 px-4 py-2">
                        {results.slice(0, 5).map((result, index) => (
                            <button
                                key={result.id}
                                onClick={() => setSelectedResultIndex(index)}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors truncate max-w-32 ${selectedResultIndex === index
                                    ? 'bg-background text-foreground border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                {result.query.length > 20 ? `${result.query.substring(0, 20)}...` : result.query}
                            </button>
                        ))}
                        {results.length > 5 && (
                            <div className="text-xs text-muted-foreground px-2">
                                +{results.length - 5} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                    <div className="p-4">
                        {renderResult(selectedResult)}
                    </div>
                </div>
            </div>
        </div>
    );
} 