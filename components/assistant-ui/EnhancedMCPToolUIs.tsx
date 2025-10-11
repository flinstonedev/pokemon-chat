"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState, useEffect } from "react";
import { usePokemonResults } from "../PokemonResultsProvider";
import {
    Wrench,
    Play,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Copy,
    Eye,
    Clock
} from "lucide-react";

// Match the exact types that @assistant-ui/react expects
type ToolStatus =
    | { readonly type: "running" }
    | { readonly type: "complete" }
    | { readonly type: "incomplete"; readonly reason: "error" | "cancelled" | "length" | "content-filter" | "other"; readonly error?: unknown }
    | { readonly type: "requires-action"; readonly reason: "tool-calls" | "interrupt" };

type ToolProps = {
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    status: ToolStatus;
    argsText: string;
};

// Enhanced execute-query tool that captures results for Pokemon data
const RenderEnhancedExecuteQueryTool = ({ toolName, args, result, status, argsText }: ToolProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedToolId, setCopiedToolId] = useState<string | null>(null);
    const { addResult } = usePokemonResults();

    // Capture the result when the tool completes
    useEffect(() => {
        if (status.type === "complete" && result && toolName === "execute-query") {
            try {
                // Parse the result to extract Pokemon data
                let data: Record<string, unknown> = result as Record<string, unknown>;
                if (data?.content && Array.isArray(data.content) && data.content[0]?.text) {
                    data = data.content[0].text;
                }

                const parsed = typeof data === 'string' ? JSON.parse(data) : data;

                // Only capture if we have actual data (not just session management)
                if (parsed?.data || parsed?.pokemon || parsed?.pokemons) {
                    const queryDescription = argsText || JSON.stringify(args);
                    addResult({
                        type: 'search', // Will be inferred automatically
                        data: parsed,
                        query: queryDescription,
                    });
                }
            } catch {
                // Still add error result
                addResult({
                    type: 'error',
                    data: { error: 'Failed to parse Pokemon data' },
                    query: argsText || JSON.stringify(args),
                });
            }
        }
    }, [status.type, result, toolName, addResult, args, argsText]);

    const copyToClipboard = async (text: string, toolId: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedToolId(toolId);
        setTimeout(() => setCopiedToolId(null), 2000);
    };

    const getResultSummary = (result: unknown) => {
        if (!result) return 'Tool completed';

        try {
            // Handle nested results from the AI SDK
            let data: Record<string, unknown> = result as Record<string, unknown>;
            if (data?.content && Array.isArray(data.content) && data.content[0]?.text) {
                data = data.content[0].text;
            }

            const parsed = typeof data === 'string' ? JSON.parse(data) : data;

            // Check if we have Pokemon data
            if (parsed?.data) {
                return `Pokemon query executed successfully - Results shown in panel!`;
            }

            return `Query execution ${parsed.data ? 'succeeded' : 'failed'}`;
        } catch {
            const resultStr = result?.toString() || '';
            return resultStr.length > 50 ? `${resultStr.substring(0, 50)}...` : resultStr;
        }
    };

    const renderToolResult = (result: unknown) => {
        if (!result) return <div className="text-xs text-gray-400">No result</div>;

        let data: Record<string, unknown> = result as Record<string, unknown>;
        if (data?.content && Array.isArray(data.content) && data.content[0]?.text) {
            data = data.content[0].text;
        }

        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;

            // Show a nice message if we have Pokemon data
            if (parsed?.data) {
                return (
                    <div className="text-xs text-green-300 bg-green-900/20 p-2 rounded border border-green-800">
                        <div className="font-semibold mb-1">🎮 Pokemon data captured!</div>
                        <div>Results are now displayed in the Pokemon Results panel on the right.</div>
                    </div>
                );
            }

            return (
                <pre className="text-xs text-green-300 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            );
        } catch {
            return (
                <div className="text-xs text-green-300 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                    {data?.toString() || 'No result'}
                </div>
            );
        }
    };

    const hasResult = status.type === "complete";
    const isExecuting = status.type === "running";
    const hasError = status.type === "incomplete" && status.reason === "error";

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 my-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Tool Icon */}
                    <div className="flex items-center gap-1">
                        {isExecuting ? (
                            <Play className="w-4 h-4 text-blue-400 animate-pulse" />
                        ) : hasResult ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : hasError ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : (
                            <Wrench className="w-4 h-4 text-gray-400" />
                        )}
                    </div>

                    {/* Tool Name */}
                    <span className="text-sm font-medium text-gray-200">
                        Execute Pokemon Query
                    </span>

                    {/* Status */}
                    {isExecuting && (
                        <div className="flex items-center gap-1 text-blue-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">Running...</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => copyToClipboard(argsText || JSON.stringify(args), toolName || 'tool')}
                        className="h-6 w-6 p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                    >
                        {copiedToolId === toolName ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                            <Copy className="w-3 h-3" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-6 w-6 p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tool Description */}
            <p className="text-xs text-gray-400 mb-2">
                Execute the built GraphQL query against the Pokemon API and return results
            </p>

            {/* Quick Result Preview (when collapsed) */}
            {!isExpanded && hasResult && (
                <div className="p-2 bg-green-900/30 border border-green-800 rounded text-xs">
                    <span className="text-green-300">
                        {getResultSummary(result)}
                    </span>
                </div>
            )}

            {/* Error Preview (when collapsed) */}
            {!isExpanded && hasError && (
                <div className="p-2 bg-red-900/30 border border-red-800 rounded text-xs">
                    <span className="text-red-300">
                        Tool execution failed: {status.type === "incomplete" && status.error ?
                            (status.error as Error)?.message || 'Unknown error' : 'Unknown error'}
                    </span>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="space-y-2 border-t border-gray-700 pt-2">
                    {/* Parameters */}
                    {(args || argsText) && (
                        <div>
                            <span className="text-xs font-medium text-gray-300">Parameters:</span>
                            <div className="bg-gray-900 rounded p-2 mt-1">
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                                    {argsText || JSON.stringify(args, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {hasResult && (
                        <div>
                            <div className="flex items-center gap-1 mb-1">
                                <Eye className="w-3 h-3 text-green-400" />
                                <span className="text-xs font-medium text-green-300">Result:</span>
                            </div>
                            <div className="bg-green-900/30 border border-green-800 rounded p-2">
                                {renderToolResult(result)}
                            </div>
                        </div>
                    )}

                    {/* Error Details */}
                    {hasError && (
                        <div>
                            <div className="flex items-center gap-1 mb-1">
                                <AlertCircle className="w-3 h-3 text-red-400" />
                                <span className="text-xs font-medium text-red-300">Error:</span>
                            </div>
                            <div className="bg-red-900/30 border border-red-800 rounded p-2">
                                <div className="text-xs text-red-300">
                                    {status.type === "incomplete" && status.error ?
                                        (status.error as Error)?.message || 'Unknown error' : 'Unknown error'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Enhanced execute-query tool UI
export const EnhancedExecuteQueryToolUI = makeAssistantToolUI({
    toolName: "execute-query",
    render: RenderEnhancedExecuteQueryTool,
}); 