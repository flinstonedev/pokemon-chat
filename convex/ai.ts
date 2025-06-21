"use node";

import { v } from "convex/values";
import { action, ActionCtx } from "./_generated/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, tool, experimental_createMCPClient } from "ai";
import { api } from "./_generated/api";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Id } from "./_generated/dataModel";
import { z } from "zod";

// Create MCP client for QueryArtisan server
async function createQueryArtisanClient() {
    const mcpUrl = 'https://agent-query-builder-toolbox.vercel.app/mcp';
    const clientName = 'pokemon-chat-client';

    try {
        console.log('🔧 Starting MCP client creation process...');
        console.log('📡 Target URL:', mcpUrl);
        console.log('🏷️  Client name:', clientName);
        console.log('⏰ Timestamp:', new Date().toISOString());

        // Test URL accessibility first
        console.log('🌐 Testing URL accessibility...');
        try {
            const testResponse = await fetch(mcpUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            console.log('✅ URL test response status:', testResponse.status);
        } catch (fetchError) {
            console.error('❌ URL accessibility test failed:', {
                error: fetchError,
                message: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
                name: fetchError instanceof Error ? fetchError.name : 'Unknown',
            });
        }

        console.log('🔨 Creating MCP client with experimental_createMCPClient...');

        // Create MCP client using HTTP transport
        console.log('🔨 Creating MCP client with HTTP transport...');

        const clientConfig = {
            transport: new StreamableHTTPClientTransport(new URL(mcpUrl), {
                sessionId: `pokemon-chat-${Date.now()}`,
            }),
            name: clientName,
            onUncaughtError: (error: unknown) => {
                console.error('🚨 MCP Client uncaught error detected:', {
                    error,
                    errorType: typeof error,
                    errorConstructor: error?.constructor?.name,
                    errorMessage: error instanceof Error ? error.message : 'Non-Error object',
                    errorStack: error instanceof Error ? error.stack : 'No stack trace',
                    timestamp: new Date().toISOString(),
                });

                // Log all enumerable properties
                if (error && typeof error === 'object') {
                    console.error('🔍 Error object properties:', Object.getOwnPropertyNames(error));
                    console.error('🔍 Error object entries:', Object.entries(error));
                }
            },
        };

        console.log('⚙️  MCP client configuration:', JSON.stringify({
            transportType: 'HTTP',
            url: mcpUrl,
            sessionId: clientConfig.transport.sessionId,
            clientName,
        }, null, 2));

        // Add timeout to client creation (10 seconds max)
        console.log('⏱️  Setting 10-second timeout for client creation...');
        const clientPromise = experimental_createMCPClient(clientConfig);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`HTTP client creation timeout after 10s`)), 10000)
        );

        const client = await Promise.race([clientPromise, timeoutPromise]);

        console.log('✅ MCP client created successfully!');
        console.log('🎯 Client type:', typeof client);
        console.log('🔧 Client constructor:', client?.constructor?.name);

        // Try to log client methods/properties safely
        try {
            console.log('📋 Client properties:', Object.getOwnPropertyNames(client || {}));
        } catch (propError) {
            console.log('⚠️  Could not enumerate client properties:', propError);
        }

        return client;

    } catch (error) {
        console.error('❌ MCP client creation failed with detailed error info:');
        console.error('🔍 Error details:', {
            error,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            errorMessage: error instanceof Error ? error.message : 'Non-Error object',
            errorStack: error instanceof Error ? error.stack : 'No stack trace',
            errorName: error instanceof Error ? error.name : 'No name',
            timestamp: new Date().toISOString(),
        });

        // Log all enumerable properties of the error
        if (error && typeof error === 'object') {
            console.error('🔍 Error object properties:', Object.getOwnPropertyNames(error));
            try {
                console.error('🔍 Error object stringified:', JSON.stringify(error, null, 2));
            } catch (stringifyError) {
                console.error('⚠️  Could not stringify error:', stringifyError);
            }
        }

        // Check for specific MCP error properties
        if (error && typeof error === 'object') {
            const errorObj = error as any;
            if (errorObj[Symbol.for('vercel.ai.error')]) {
                console.error('🎯 This is a Vercel AI SDK error');
            }
            if (errorObj[Symbol.for('vercel.ai.error.AI_MCPClientError')]) {
                console.error('🎯 This is specifically an MCP Client error');
            }
        }

        return null;
    }
}

// Define the return type
type SendMessageResult = {
    userMessageId: Id<"messages">;
    assistantMessages: Id<"messages">[];
};

// Define streaming result type
type SendMessageStreamResult = {
    userMessageId: Id<"messages">;
    assistantMessageId: Id<"messages">;
};

// Streaming version of sendMessage
export const sendMessageStream = action({
    args: {
        threadId: v.id("threads"),
        userId: v.string(),
        content: v.string(),
    },
    returns: v.object({
        userMessageId: v.id("messages"),
        assistantMessageId: v.id("messages"),
    }),
    handler: async (ctx: ActionCtx, { threadId, userId, content }): Promise<SendMessageStreamResult> => {
        // Save user message
        const userMessageId: Id<"messages"> = await ctx.runMutation(api.chat.saveMessage, {
            threadId,
            role: "user" as const,
            content,
        });

        // Create placeholder assistant message with visible content
        const assistantMessageId: Id<"messages"> = await ctx.runMutation(api.chat.saveMessage, {
            threadId,
            role: "assistant" as const,
            content: "⏳ Thinking...",
        });

        // Get conversation history
        const existingMessages = await ctx.runQuery(api.chat.getThreadMessages, {
            threadId,
        });

        // Convert to format expected by AI SDK
        const messages = existingMessages
            .filter(msg => msg.role !== "tool") // Skip tool messages for conversation history
            .map((msg) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content || "",
            }));

        // Add the current user message
        messages.push({
            role: "user" as const,
            content,
        });

        try {
            // Get MCP tools from QueryArtisan server
            let mcpTools = {};
            let mcpClient: any = null;

            console.log('🔧 Starting MCP tool setup...');

            try {
                console.log('🌐 Creating QueryArtisan MCP client...');
                mcpClient = await createQueryArtisanClient();

                if (mcpClient) {
                    console.log('✅ MCP client created successfully');

                    console.log('🔍 Fetching MCP tools...');
                    mcpTools = await mcpClient.tools();
                    console.log('✅ MCP tools loaded:', Object.keys(mcpTools));
                    console.log('📊 Number of MCP tools:', Object.keys(mcpTools).length);

                    // Log details about each tool
                    Object.entries(mcpTools).forEach(([name, tool]) => {
                        console.log(`🛠️  Tool: ${name}`, {
                            description: (tool as any)?.description || 'No description',
                        });
                    });
                } else {
                    console.log('⚠️  MCP client creation failed, using built-in tools only');
                }
            } catch (mcpError) {
                console.error('❌ MCP setup failed:', mcpError);
                console.log('⚠️  Falling back to built-in tools only');
            }

            // Use only MCP tools
            const allTools = mcpTools;
            const toolCount = Object.keys(allTools).length;

            console.log('🎯 Total tools available:', toolCount);
            console.log('🌐 All tools from MCP:', toolCount);

            // Create system message with tool information
            const systemMessage = toolCount > 0
                ? `You are a helpful AI assistant with access to ${toolCount} advanced tools from QueryArtisan:

QUERYARTISAN GRAPHQL TOOLS (${toolCount} tools available):
Advanced GraphQL query building, schema introspection, and API analysis tools including:
- Schema introspection and analysis
- Query building and optimization
- Field selection and variable management
- Query execution and complexity analysis
- Rate limiting and performance monitoring
- Database operations and queries
- API testing and validation

Be conversational and explain what tools you're using and why. These QueryArtisan tools are particularly powerful for GraphQL-related tasks, database operations, and API development.`
                : `You are a helpful AI assistant. 

Note: QueryArtisan MCP tools are temporarily unavailable.
I can still help you with general questions and conversation.`;

            // Generate AI response with streaming
            const result = await streamText({
                model: anthropic("claude-3-5-sonnet-latest"),
                messages,
                tools: allTools,
                system: systemMessage,
                maxSteps: 30,
            });

            let currentContent = "";
            let hasReceivedText = false;
            let currentToolCalls: any[] = [];
            let contentSegments: any[] = [];
            let currentTextSegment = "";

            // Process the stream for text and tool calls
            for await (const delta of result.fullStream) {
                console.log('🔍 Stream delta type:', delta.type);

                if (delta.type === 'text-delta') {
                    currentContent += delta.textDelta;
                    currentTextSegment += delta.textDelta;
                    hasReceivedText = true;
                    // Update message with current content
                    await ctx.runMutation(api.chat.updateMessage, {
                        messageId: assistantMessageId,
                        content: currentContent,
                    });
                }

                // Handle individual tool calls as they stream (with type assertion)
                if ((delta as any).type === 'tool-call') {
                    const toolCallData = delta as any;
                    console.log('🔧 Individual tool call detected:', toolCallData.toolName);

                    // Add current text segment if it has content
                    if (currentTextSegment.trim()) {
                        contentSegments.push({
                            type: "text",
                            content: currentTextSegment,
                        });
                        currentTextSegment = ""; // Reset for next segment
                    }

                    // Add tool call segment
                    contentSegments.push({
                        type: "tool_call",
                        toolCall: {
                            id: toolCallData.toolCallId,
                            name: toolCallData.toolName,
                            arguments: JSON.stringify(toolCallData.args || {}),
                        },
                    });

                    currentToolCalls.push({
                        id: toolCallData.toolCallId,
                        name: toolCallData.toolName,
                        arguments: JSON.stringify(toolCallData.args || {}),
                    });

                    // Update message with segments and tool calls
                    await ctx.runMutation(api.chat.updateMessage, {
                        messageId: assistantMessageId,
                        content: currentContent || "🔧 Using tools to help with your request...",
                        contentSegments: contentSegments,
                        toolCalls: currentToolCalls,
                    });
                }

                // Handle individual tool results as they stream (with type assertion)
                if ((delta as any).type === 'tool-result') {
                    const toolResultData = delta as any;
                    console.log('🔧 Individual tool result detected:', toolResultData.toolName);

                    // Add tool result segment
                    contentSegments.push({
                        type: "tool_result",
                        toolCallId: toolResultData.toolCallId,
                        content: JSON.stringify(toolResultData.result),
                    });

                    // Update message with new segments
                    await ctx.runMutation(api.chat.updateMessage, {
                        messageId: assistantMessageId,
                        content: currentContent,
                        contentSegments: contentSegments,
                        toolCalls: currentToolCalls,
                    });

                    await ctx.runMutation(api.chat.saveMessage, {
                        threadId,
                        role: "tool" as const,
                        content: JSON.stringify(toolResultData.result),
                        toolCallId: toolResultData.toolCallId,
                        toolName: toolResultData.toolName,
                    });
                }

                // Handle tool calls during streaming via step-finish (fallback)
                if (delta.type === 'step-finish') {
                    const stepData = delta as any;
                    console.log('🔧 Step finished, checking for tools...');

                    // Check if this step has tool calls (fallback if individual events missed)
                    if (stepData.toolCalls && stepData.toolCalls.length > 0) {
                        console.log('🔧 Tool calls found in step:', stepData.toolCalls.length);

                        for (const toolCall of stepData.toolCalls) {
                            // Only add if not already added
                            const exists = currentToolCalls.some(tc => tc.id === toolCall.toolCallId);
                            if (!exists) {
                                currentToolCalls.push({
                                    id: toolCall.toolCallId,
                                    name: toolCall.toolName,
                                    arguments: JSON.stringify(toolCall.args || {}),
                                });
                            }
                        }

                        // Update message to show tool calls
                        await ctx.runMutation(api.chat.updateMessage, {
                            messageId: assistantMessageId,
                            content: currentContent || "🔧 Using tools to help with your request...",
                            toolCalls: currentToolCalls,
                        });
                    }

                    // Check if this step has tool results (fallback)
                    if (stepData.toolResults && stepData.toolResults.length > 0) {
                        console.log('🔧 Tool results found in step:', stepData.toolResults.length);

                        for (const toolResult of stepData.toolResults) {
                            await ctx.runMutation(api.chat.saveMessage, {
                                threadId,
                                role: "tool" as const,
                                content: JSON.stringify(toolResult.result),
                                toolCallId: toolResult.toolCallId,
                                toolName: toolResult.toolName,
                            });
                        }
                    }
                }
            }

            // Get the final result to access tool calls and results
            const finalResponse = result;

            try {
                // Wait for the final result to complete
                await finalResponse.finishReason;

                // Access tool calls from the completed result
                const toolCalls = await finalResponse.toolCalls || [];
                const toolResults = await finalResponse.toolResults || [];
                const finalText = await finalResponse.text || currentContent;

                console.log('🔧 Final result - Tool calls:', toolCalls.length, 'Tool results:', toolResults.length);

                // Add final text segment if there's remaining content
                if (currentTextSegment.trim()) {
                    contentSegments.push({
                        type: "text",
                        content: currentTextSegment,
                    });
                }

                // Update message with final content and ensure tool calls are present
                if (toolCalls.length > 0) {
                    // If we didn't capture tool calls during streaming, add them now
                    if (currentToolCalls.length === 0) {
                        currentToolCalls = toolCalls.map((tc: any) => ({
                            id: tc.toolCallId,
                            name: tc.toolName,
                            arguments: JSON.stringify(tc.args),
                        }));
                    }

                    await ctx.runMutation(api.chat.updateMessage, {
                        messageId: assistantMessageId,
                        content: finalText,
                        contentSegments: contentSegments.length > 0 ? contentSegments : undefined,
                        toolCalls: currentToolCalls,
                    });

                    // Save tool results as separate messages
                    for (const toolResult of toolResults) {
                        await ctx.runMutation(api.chat.saveMessage, {
                            threadId,
                            role: "tool" as const,
                            content: JSON.stringify((toolResult as any).result),
                            toolCallId: (toolResult as any).toolCallId,
                            toolName: (toolResult as any).toolName,
                        });
                    }
                } else if (!hasReceivedText && currentToolCalls.length === 0) {
                    // If no text was streamed and no tools, clear the placeholder
                    await ctx.runMutation(api.chat.updateMessage, {
                        messageId: assistantMessageId,
                        content: finalText || "",
                    });
                } else {
                    // Update with final text but keep any tool calls that were captured during streaming
                    await ctx.runMutation(api.chat.updateMessage, {
                        messageId: assistantMessageId,
                        content: finalText,
                        toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
                    });
                }

                console.log('🎯 Streaming completed, final content length:', finalText.length);
            } catch (error) {
                console.error('❌ Error accessing final result:', error);
                // Fallback: just clear placeholder if needed
                if (!hasReceivedText) {
                    await ctx.runMutation(api.chat.updateMessage, {
                        messageId: assistantMessageId,
                        content: "",
                    });
                }
            }

            // Clean up MCP client
            if (mcpClient) {
                try {
                    await mcpClient.close();
                    console.log('🔒 MCP client closed successfully');
                } catch (closeError) {
                    console.error('⚠️  Error closing MCP client:', closeError);
                }
            }

            // Update thread timestamp
            await ctx.runMutation(api.chat.updateThreadTimestamp, {
                threadId,
            });

            return {
                userMessageId,
                assistantMessageId,
            };
        } catch (error) {
            console.error("AI streaming failed:", error);

            // Update message with error
            await ctx.runMutation(api.chat.updateMessage, {
                messageId: assistantMessageId,
                content: "I apologize, but I encountered an error while processing your request. Please try again.",
            });

            return {
                userMessageId,
                assistantMessageId,
            };
        }
    },
});

// Send a message and get AI response with tool support (original non-streaming version)
export const sendMessage = action({
    args: {
        threadId: v.id("threads"),
        userId: v.string(),
        content: v.string(),
    },
    returns: v.object({
        userMessageId: v.id("messages"),
        assistantMessages: v.array(v.id("messages")),
    }),
    handler: async (ctx: ActionCtx, { threadId, userId, content }): Promise<SendMessageResult> => {
        // Save user message
        const userMessageId = await ctx.runMutation(api.chat.saveMessage, {
            threadId,
            role: "user" as const,
            content,
        });

        // Get conversation history
        const existingMessages = await ctx.runQuery(api.chat.getThreadMessages, {
            threadId,
        });

        // Convert to format expected by AI SDK
        const messages = existingMessages
            .filter(msg => msg.role !== "tool") // Skip tool messages for conversation history
            .map((msg) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content || "",
            }));

        // Add the current user message
        messages.push({
            role: "user" as const,
            content,
        });

        try {
            // Get MCP tools from QueryArtisan server
            let mcpTools = {};
            let mcpClient: any = null;

            console.log('🔧 Starting MCP tool setup...');

            try {
                console.log('🌐 Creating QueryArtisan MCP client...');
                mcpClient = await createQueryArtisanClient();

                if (mcpClient) {
                    console.log('✅ MCP client created successfully');

                    console.log('🔍 Fetching MCP tools...');
                    mcpTools = await mcpClient.tools();
                    console.log('✅ MCP tools loaded:', Object.keys(mcpTools));
                    console.log('📊 Number of MCP tools:', Object.keys(mcpTools).length);

                    // Log details about each tool
                    Object.entries(mcpTools).forEach(([name, tool]) => {
                        console.log(`🛠️  Tool: ${name}`, {
                            description: (tool as any)?.description || 'No description',
                        });
                    });
                } else {
                    console.log('⚠️  MCP client creation failed, using built-in tools only');
                }
            } catch (mcpError) {
                console.error('❌ MCP setup failed:', mcpError);
                console.log('⚠️  Falling back to built-in tools only');
            }

            // Use only MCP tools
            const allTools = mcpTools;
            const toolCount = Object.keys(allTools).length;

            console.log('🎯 Total tools available:', toolCount);
            console.log('🌐 All tools from MCP:', toolCount);

            // Create system message with tool information
            const systemMessage = toolCount > 0
                ? `You are a helpful AI assistant with access to ${toolCount} advanced tools from QueryArtisan:

QUERYARTISAN GRAPHQL TOOLS (${toolCount} tools available):
Advanced GraphQL query building, schema introspection, and API analysis tools including:
- Schema introspection and analysis
- Query building and optimization
- Field selection and variable management
- Query execution and complexity analysis
- Rate limiting and performance monitoring
- Database operations and queries
- API testing and validation

Be conversational and explain what tools you're using and why. These QueryArtisan tools are particularly powerful for GraphQL-related tasks, database operations, and API development.`
                : `You are a helpful AI assistant. 

Note: QueryArtisan MCP tools are temporarily unavailable.
I can still help you with general questions and conversation.`;

            // Generate AI response with tools
            const result = await generateText({
                model: anthropic("claude-3-5-sonnet-latest"),
                messages,
                tools: allTools,
                system: systemMessage,
                maxSteps: 30,
            });

            // Clean up MCP client
            if (mcpClient) {
                try {
                    await mcpClient.close();
                    console.log('🔒 MCP client closed successfully');
                } catch (closeError) {
                    console.error('⚠️  Error closing MCP client:', closeError);
                }
            }

            console.log('🎯 AI response generated with tools:', {
                toolCallsCount: result.toolCalls?.length || 0,
                toolResultsCount: result.toolResults?.length || 0
            });

            const assistantMessages: Id<"messages">[] = [];

            // Save assistant message with tool calls if any
            if (result.toolCalls && result.toolCalls.length > 0) {
                const assistantMessageId = await ctx.runMutation(api.chat.saveMessage, {
                    threadId,
                    role: "assistant" as const,
                    content: result.text || "",
                    toolCalls: result.toolCalls.map((tc: any) => ({
                        id: tc.toolCallId,
                        name: tc.toolName,
                        arguments: JSON.stringify(tc.args),
                    })),
                });
                assistantMessages.push(assistantMessageId);

                // Save tool results
                for (const toolResult of result.toolResults || []) {
                    const toolResultId = await ctx.runMutation(api.chat.saveMessage, {
                        threadId,
                        role: "tool" as const,
                        content: JSON.stringify((toolResult as any).result),
                        toolCallId: (toolResult as any).toolCallId,
                        toolName: (toolResult as any).toolName,
                    });
                    assistantMessages.push(toolResultId);
                }
            } else {
                // Save regular assistant response
                const assistantMessageId = await ctx.runMutation(api.chat.saveMessage, {
                    threadId,
                    role: "assistant" as const,
                    content: result.text,
                });
                assistantMessages.push(assistantMessageId);
            }

            // Update thread timestamp
            await ctx.runMutation(api.chat.updateThreadTimestamp, {
                threadId,
            });

            return {
                userMessageId,
                assistantMessages,
            };
        } catch (error) {
            console.error("AI generation failed:", error);

            // Save error message
            const errorMessageId = await ctx.runMutation(api.chat.saveMessage, {
                threadId,
                role: "assistant" as const,
                content: "I apologize, but I encountered an error while processing your request. Please try again.",
            });

            return {
                userMessageId,
                assistantMessages: [errorMessageId],
            };
        }
    },
});

