"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState } from "react";
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

// Generic QuerySculptor tool UI render function
const RenderMCPTool = ({ toolName, args, result, status, argsText }: ToolProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedToolId, setCopiedToolId] = useState<string | null>(null);

    const copyToClipboard = async (text: string, toolId: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedToolId(toolId);
        setTimeout(() => setCopiedToolId(null), 2000);
    };

    const getToolDescription = (toolName: string) => {
        const descriptions: Record<string, string> = {
            'introspect-schema': 'Retrieve the complete GraphQL schema definition for API understanding and exploration',
            'get-root-ops': 'Discover the available root operation types (Query, Mutation, Subscription) and their entry points',
            'get-type-info': 'Get detailed information about a specific GraphQL type including fields, descriptions, and relationships',
            'get-field-info': 'Get detailed information about a specific field within a GraphQL type including arguments and return type',
            'get-input-help': 'Get guidance and field information for GraphQL input object types to help with argument construction',
            'start-query-session': 'Initialize a new GraphQL query building session with persistent state management',
            'end-query-session': 'Clean up and close a GraphQL query building session to free resources',
            'get-current-query': 'Visualize the current GraphQL query structure and generated query string for debugging and review',
            'get-selections': 'Get suggestions for available fields that can be selected at a specific path in the query structure',
            'select-field': 'Add a field to the GraphQL query structure with optional aliasing and validation',
            'select-multi-fields': 'Add multiple fields to the GraphQL query structure in a single operation for efficiency',
            'set-query-variable': 'Define a GraphQL variable with its type and optional default value for use in the query',
            'set-variable-value': 'Assign a runtime value to a previously defined GraphQL variable for query execution',
            'rm-var': 'Remove a previously defined GraphQL variable from the query structure',
            'set-string-argument': 'Set string or enum arguments on GraphQL fields with automatic type detection and validation',
            'set-typed-argument': 'Sets a typed argument (number, boolean, null) on a field in the GraphQL query structure',
            'set-input-obj-arg': 'Set nested properties within GraphQL input object arguments for complex data structures',
            'set-var-arg': 'Set a field argument to reference a GraphQL variable instead of a literal value',
            'define-fragment': 'Create reusable named fragments for common field selections across queries',
            'apply-fragment': 'Apply a previously defined named fragment to a specific location in the query',
            'apply-inline-frag': 'Apply type-conditional field selections using inline fragments for union/interface types',
            'set-field-directive': 'Add GraphQL directives like @include or @skip to fields for conditional selection',
            'set-op-directive': 'Add directives to the root operation for query-level behavior control',
            'validate-query': 'Validate the built GraphQL query against the schema for syntax and semantic correctness',
            'execute-query': 'Execute the built GraphQL query against the configured endpoint and return results',
            'analyze-query-complexity': 'Analyze the complexity, depth, and performance characteristics of the current query structure',
            'get-rate-limit-status': 'Get current rate limit status for the client'
        };
        return descriptions[toolName] || 'QuerySculptor GraphQL tool for advanced query operations';
    };

    const getResultSummary = (result: unknown, toolName: string) => {
        if (!result) return 'Tool completed';

        try {
            // Handle nested results from the AI SDK
            let data: Record<string, unknown> = result as Record<string, unknown>;
            if (data?.content && Array.isArray(data.content) && data.content[0]?.text) {
                data = data.content[0].text;
            }

            const parsed = typeof data === 'string' ? JSON.parse(data) : data;

            // Generic check for a 'message' property, which is a common pattern for success feedback.
            if (parsed?.message) return parsed.message;

            // Specific handlers for different tools to provide more meaningful summaries.
            switch (toolName) {
                case 'start-query-session':
                    return `Session started successfully with ID: ${parsed.sessionId?.substring(0, 8)}...`;
                case 'get-current-query':
                    return `Current query: ${parsed.query ? 'Available' : 'Not available'}`;
                case 'validate-query':
                    return `Query validation ${parsed.valid ? 'passed' : 'failed'}`;
                case 'execute-query':
                    return `Query execution ${parsed.data ? 'succeeded' : 'failed'}`;
                case 'analyze-query-complexity':
                    return `Query complexity is ${parsed.complexity || 'not available'}`;
                case 'introspect-schema':
                    return `Schema analyzed: ${Object.keys(parsed?.types || {}).length || 0} types found`;
                default:
                    // If no specific handler, return a generic success message.
                    // This avoids the incorrect "Invalid" message.
                    return 'Tool executed successfully';
            }
        } catch {
            // Fallback for non-JSON results or parsing errors.
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
        <div className="border border-gray-700 rounded-lg bg-gray-800 p-3 mb-3 max-w-2xl">
            {/* Tool Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium text-sm text-white">{toolName}</span>

                    {/* Status */}
                    {hasResult ? (
                        <span className="text-xs text-green-300 border border-green-700 bg-green-900/50 px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3 mr-1 inline" />
                            completed
                        </span>
                    ) : isExecuting ? (
                        <span className="text-xs text-yellow-300 border border-yellow-700 bg-yellow-900/50 px-2 py-1 rounded">
                            <Play className="w-3 h-3 mr-1 inline" />
                            executing
                        </span>
                    ) : hasError ? (
                        <span className="text-xs text-red-300 border border-red-700 bg-red-900/50 px-2 py-1 rounded">
                            <AlertCircle className="w-3 h-3 mr-1 inline" />
                            error
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400 border border-gray-600 bg-gray-700 px-2 py-1 rounded">
                            <Clock className="w-3 h-3 mr-1 inline" />
                            pending
                        </span>
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
                {getToolDescription(toolName || '')}
            </p>

            {/* Quick Result Preview (when collapsed) */}
            {!isExpanded && hasResult && (
                <div className="p-2 bg-green-900/30 border border-green-800 rounded text-xs">
                    <span className="text-green-300">
                        {getResultSummary(result, toolName || '')}
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
                                        (status.error as Error)?.message || 'Unknown error occurred' : 'Unknown error occurred'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Create tool UI components for all 27 MCP tools
export const IntrospectSchemaToolUI = makeAssistantToolUI({
    toolName: "introspect-schema",
    render: RenderMCPTool,
});

export const GetRootOpsToolUI = makeAssistantToolUI({
    toolName: "get-root-ops",
    render: RenderMCPTool,
});

export const GetTypeInfoToolUI = makeAssistantToolUI({
    toolName: "get-type-info",
    render: RenderMCPTool,
});

export const GetFieldInfoToolUI = makeAssistantToolUI({
    toolName: "get-field-info",
    render: RenderMCPTool,
});

export const GetInputHelpToolUI = makeAssistantToolUI({
    toolName: "get-input-help",
    render: RenderMCPTool,
});

export const StartQuerySessionToolUI = makeAssistantToolUI({
    toolName: "start-query-session",
    render: RenderMCPTool,
});

export const EndQuerySessionToolUI = makeAssistantToolUI({
    toolName: "end-query-session",
    render: RenderMCPTool,
});

export const GetCurrentQueryToolUI = makeAssistantToolUI({
    toolName: "get-current-query",
    render: RenderMCPTool,
});

export const GetSelectionsToolUI = makeAssistantToolUI({
    toolName: "get-selections",
    render: RenderMCPTool,
});

export const SelectFieldToolUI = makeAssistantToolUI({
    toolName: "select-field",
    render: RenderMCPTool,
});

export const SelectMultiFieldsToolUI = makeAssistantToolUI({
    toolName: "select-multi-fields",
    render: RenderMCPTool,
});

export const SetQueryVariableToolUI = makeAssistantToolUI({
    toolName: "set-query-variable",
    render: RenderMCPTool,
});

export const SetVariableValueToolUI = makeAssistantToolUI({
    toolName: "set-variable-value",
    render: RenderMCPTool,
});

export const RmVarToolUI = makeAssistantToolUI({
    toolName: "rm-var",
    render: RenderMCPTool,
});

export const SetStringArgumentToolUI = makeAssistantToolUI({
    toolName: "set-string-argument",
    render: RenderMCPTool,
});

export const SetTypedArgumentToolUI = makeAssistantToolUI({
    toolName: "set-typed-argument",
    render: RenderMCPTool,
});

export const SetInputObjArgToolUI = makeAssistantToolUI({
    toolName: "set-input-obj-arg",
    render: RenderMCPTool,
});

export const SetVarArgToolUI = makeAssistantToolUI({
    toolName: "set-var-arg",
    render: RenderMCPTool,
});

export const DefineFragmentToolUI = makeAssistantToolUI({
    toolName: "define-fragment",
    render: RenderMCPTool,
});

export const ApplyFragmentToolUI = makeAssistantToolUI({
    toolName: "apply-fragment",
    render: RenderMCPTool,
});

export const ApplyInlineFragToolUI = makeAssistantToolUI({
    toolName: "apply-inline-frag",
    render: RenderMCPTool,
});

export const SetFieldDirectiveToolUI = makeAssistantToolUI({
    toolName: "set-field-directive",
    render: RenderMCPTool,
});

export const SetOpDirectiveToolUI = makeAssistantToolUI({
    toolName: "set-op-directive",
    render: RenderMCPTool,
});

export const ValidateQueryToolUI = makeAssistantToolUI({
    toolName: "validate-query",
    render: RenderMCPTool,
});

export const ExecuteQueryToolUI = makeAssistantToolUI({
    toolName: "execute-query",
    render: RenderMCPTool,
});

export const AnalyzeQueryComplexityToolUI = makeAssistantToolUI({
    toolName: "analyze-query-complexity",
    render: RenderMCPTool,
});

export const GetRateLimitStatusToolUI = makeAssistantToolUI({
    toolName: "get-rate-limit-status",
    render: RenderMCPTool,
});

// Complete list of all MCP tool UIs
export const AllMCPToolUIs = [
    IntrospectSchemaToolUI,
    GetRootOpsToolUI,
    GetTypeInfoToolUI,
    GetFieldInfoToolUI,
    GetInputHelpToolUI,
    StartQuerySessionToolUI,
    EndQuerySessionToolUI,
    GetCurrentQueryToolUI,
    GetSelectionsToolUI,
    SelectFieldToolUI,
    SelectMultiFieldsToolUI,
    SetQueryVariableToolUI,
    SetVariableValueToolUI,
    RmVarToolUI,
    SetStringArgumentToolUI,
    SetTypedArgumentToolUI,
    SetInputObjArgToolUI,
    SetVarArgToolUI,
    DefineFragmentToolUI,
    ApplyFragmentToolUI,
    ApplyInlineFragToolUI,
    SetFieldDirectiveToolUI,
    SetOpDirectiveToolUI,
    ValidateQueryToolUI,
    ExecuteQueryToolUI,
    AnalyzeQueryComplexityToolUI,
    GetRateLimitStatusToolUI,
]; 