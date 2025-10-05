import { openai } from "@ai-sdk/openai";
import { streamText, experimental_createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mcpClient: any = null;

    try {
        // Authenticate the user
        const { userId } = await auth();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Parse the request
        const { messages } = await req.json();

        if (process.env.NODE_ENV !== 'production') {
            console.log('📨 Received messages:', messages.length, 'messages');
        }

        // Initialize MCP client with the actual MCP server
        let mcpTools = {};

        try {
            // Create MCP client using StreamableHTTP transport
            const MCP_URL = process.env.MCP_URL || 'https://agent-query-builder-toolbox.vercel.app/mcp';

            mcpClient = await experimental_createMCPClient({
                transport: new StreamableHTTPClientTransport(new URL(MCP_URL), {
                    sessionId: `pokemon-chat-${userId}-${Date.now()}`,
                }),
                name: 'pokemon-chat-client',
            });

            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ MCP client created successfully');
            }

            // Get available tools from the MCP server
            mcpTools = await mcpClient.tools();

            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ MCP tools loaded:', Object.keys(mcpTools).length, 'tools available');
                console.log('Available tools:', Object.keys(mcpTools).slice(0, 10), '...');
            }
        } catch (mcpError) {
            console.error('⚠️ MCP setup failed:', mcpError);
            // Continue without MCP tools if connection fails
        }

        const systemMessage = `You are a helpful AI assistant for a Pokemon chat application with access to GraphQL query building tools through the MCP server.

Your purpose is to answer questions about Pokemon using the provided GraphQL tools to query the Pokemon API.

Available tools help you:
- Introspect the GraphQL schema
- Start query sessions
- Build queries by selecting fields
- Set arguments on fields
- Validate and execute queries
- Clean up sessions

When users ask about Pokemon:
1. Start a query session with start-query-session
2. Build an appropriate GraphQL query using select-field or select-multi-fields
3. Set any needed arguments with set-string-argument or set-typed-argument
4. Validate the query with validate-query
5. Execute it with execute-query to get Pokemon data
6. End the session with end-query-session
7. Present the results in a friendly, informative way

Be conversational and explain what you're doing. If you encounter errors, try to understand and fix them.`;

        // Stream the response with MCP tools
        const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemMessage,
            messages,
            tools: mcpTools,
            maxSteps: 15,
            onFinish: async ({ usage }) => {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('✅ Stream completed. Usage:', usage);
                }

                // Clean up MCP client
                if (mcpClient) {
                    try {
                        await mcpClient.close();
                        if (process.env.NODE_ENV !== 'production') {
                            console.log('✅ MCP client closed');
                        }
                    } catch (error) {
                        console.error('Error closing MCP client:', error);
                    }
                }
            },
            onError: async (error) => {
                console.error('❌ Stream error:', error);

                // Clean up MCP client on error
                if (mcpClient) {
                    try {
                        await mcpClient.close();
                    } catch (closeError) {
                        console.error('Error closing MCP client:', closeError);
                    }
                }
            }
        });

        // Return the stream response for useChat
        return result.toDataStreamResponse();

    } catch (error) {
        console.error('❌ Error in POST handler:', error);

        // Clean up MCP client on error
        if (mcpClient) {
            try {
                await mcpClient.close();
            } catch (closeError) {
                console.error('Error closing MCP client:', closeError);
            }
        }

        if (process.env.NODE_ENV !== 'production') {
            return new Response(
                JSON.stringify({
                    error: 'Internal server error',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new Response('Internal server error', { status: 500 });
    }
}