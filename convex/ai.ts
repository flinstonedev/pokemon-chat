"use node";

import { v } from "convex/values";
import { action, ActionCtx } from "./_generated/server";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { z } from "zod";

// Define tools
const tools = {
    getWeatherInformation: {
        description: "Get current weather information for a specific city",
        parameters: z.object({
            city: z.string().describe("The city to get weather for"),
        }),
        execute: async ({ city }: { city: string }) => {
            // Simulate weather API call
            const weatherConditions = ["sunny", "cloudy", "rainy", "snowy", "windy", "partly cloudy"];
            const temperatures = [15, 18, 22, 25, 28, 30, 12, 8];

            const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
            const temperature = temperatures[Math.floor(Math.random() * temperatures.length)];

            return {
                city,
                condition,
                temperature,
                humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
                windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
            };
        },
    },

    calculateMath: {
        description: "Perform mathematical calculations",
        parameters: z.object({
            expression: z.string().describe("The mathematical expression to evaluate"),
        }),
        execute: async ({ expression }: { expression: string }) => {
            try {
                // Simple math evaluation (in production, use a proper math parser)
                const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
                const result = Function(`"use strict"; return (${sanitized})`)();

                return {
                    expression,
                    result,
                    isValid: true,
                };
            } catch (error) {
                return {
                    expression,
                    result: null,
                    isValid: false,
                    error: "Invalid mathematical expression",
                };
            }
        },
    },

    searchDatabase: {
        description: "Search for information in a database",
        parameters: z.object({
            query: z.string().describe("The search query"),
            category: z.enum(["users", "products", "orders"]).describe("The category to search in"),
        }),
        execute: async ({ query, category }: { query: string; category: "users" | "products" | "orders" }) => {
            // Simulate database search
            const mockResults = {
                users: [
                    { id: 1, name: "John Doe", email: "john@example.com" },
                    { id: 2, name: "Jane Smith", email: "jane@example.com" },
                ],
                products: [
                    { id: 1, name: "Laptop", price: 999, category: "Electronics" },
                    { id: 2, name: "Phone", price: 699, category: "Electronics" },
                ],
                orders: [
                    { id: 1, customer: "John Doe", total: 1299, status: "shipped" },
                    { id: 2, customer: "Jane Smith", total: 699, status: "processing" },
                ],
            };

            const results = mockResults[category].filter((item) =>
                JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
            );

            return {
                query,
                category,
                results,
                count: results.length,
            };
        },
    },
};

// Create the chat agent with tools
const chatAgent = new Agent(components.agent, {
    chat: openai.chat("gpt-4o-mini"),
    textEmbedding: openai.embedding("text-embedding-3-small"),
    instructions: `You are a helpful AI assistant with access to various tools. 
    Use the appropriate tools when users ask for:
    - Weather information (use getWeatherInformation)
    - Mathematical calculations (use calculateMath)
    - Database searches (use searchDatabase)
    
    Be conversational and explain what tools you're using and why.`,
    maxSteps: 5,
});

// Define the return type
type SendMessageResult = {
    userMessageId: Id<"messages">;
    assistantMessages: Id<"messages">[];
};

// Send a message and get AI response with tool support
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

        // Convert to format expected by the agent (simplified approach)
        const conversationHistory = existingMessages
            .filter(msg => msg.role !== "tool") // Skip tool messages for now
            .map((msg) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content || "",
            }));

        // Create or continue agent thread
        const { thread } = await chatAgent.createThread(ctx, {
            userId,
        });

        try {
            // Generate AI response with tools using a simpler approach
            const result = await thread.generateText({
                messages: [
                    ...conversationHistory.slice(0, -1), // Previous context
                    { role: "user" as const, content }, // Current message
                ],
                tools: {
                    getWeatherInformation: {
                        description: tools.getWeatherInformation.description,
                        parameters: tools.getWeatherInformation.parameters,
                        execute: tools.getWeatherInformation.execute,
                    },
                    calculateMath: {
                        description: tools.calculateMath.description,
                        parameters: tools.calculateMath.parameters,
                        execute: tools.calculateMath.execute,
                    },
                    searchDatabase: {
                        description: tools.searchDatabase.description,
                        parameters: tools.searchDatabase.parameters,
                        execute: tools.searchDatabase.execute,
                    },
                },
            });

            const assistantMessages: Id<"messages">[] = [];

            // Check if there are tool calls in the result
            if (result.toolCalls && result.toolCalls.length > 0) {
                // Save assistant message with tool calls
                const assistantMessageId = await ctx.runMutation(api.chat.saveMessage, {
                    threadId,
                    role: "assistant" as const,
                    content: result.text || "",
                    toolCalls: result.toolCalls.map(tc => ({
                        id: tc.toolCallId,
                        name: tc.toolName,
                        arguments: JSON.stringify(tc.args),
                    })),
                });
                assistantMessages.push(assistantMessageId);

                // Execute tools and save results
                for (const toolCall of result.toolCalls) {
                    try {
                        let toolResult: any;

                        // Execute the appropriate tool
                        if (toolCall.toolName === "getWeatherInformation") {
                            toolResult = await tools.getWeatherInformation.execute(toolCall.args as { city: string });
                        } else if (toolCall.toolName === "calculateMath") {
                            toolResult = await tools.calculateMath.execute(toolCall.args as { expression: string });
                        } else if (toolCall.toolName === "searchDatabase") {
                            toolResult = await tools.searchDatabase.execute(toolCall.args as { query: string; category: "users" | "products" | "orders" });
                        }

                        // Save tool result
                        const toolResultId = await ctx.runMutation(api.chat.saveMessage, {
                            threadId,
                            role: "tool" as const,
                            content: JSON.stringify(toolResult),
                            toolCallId: toolCall.toolCallId,
                            toolName: toolCall.toolName,
                        });
                        assistantMessages.push(toolResultId);
                    } catch (error) {
                        console.error(`Tool execution failed for ${toolCall.toolName}:`, error);
                        // Save error result
                        const errorResultId = await ctx.runMutation(api.chat.saveMessage, {
                            threadId,
                            role: "tool" as const,
                            content: JSON.stringify({ error: "Tool execution failed" }),
                            toolCallId: toolCall.toolCallId,
                            toolName: toolCall.toolName,
                        });
                        assistantMessages.push(errorResultId);
                    }
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