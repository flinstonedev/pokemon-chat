import { openai } from "@ai-sdk/openai";
import { streamText, experimental_createMCPClient, Tool } from "ai";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export const maxDuration = 30;

// Define a type for the MCP client to avoid using `any`.
interface MCPClient {
    tools: () => Promise<Record<string, Tool>>;
    close: () => Promise<void>;
}

// Create MCP client for QueryArtisan server (same as in convex/ai.ts)
async function createQueryArtisanClient(): Promise<MCPClient | null> {
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

        const client = await Promise.race([clientPromise, timeoutPromise]) as MCPClient;

        console.log('✅ MCP client created successfully!');
        console.log('🎯 Client type:', typeof client);
        console.log('🔧 Client constructor:', client?.constructor?.name);

        return client;
    } catch (error) {
        console.error('❌ Failed to create QueryArtisan MCP client:', {
            error,
            errorType: typeof error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack trace',
            timestamp: new Date().toISOString(),
        });
        return null;
    }
}

export async function POST(req: Request) {
    const { messages } = await req.json();

    // Set up MCP tools
    let mcpTools: Record<string, Tool> = {};
    let mcpClient: MCPClient | null = null;

    console.log('🔧 Starting MCP tool setup for Assistant UI...');

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
                    description: tool.description || 'No description',
                });
            });
        } else {
            console.log('⚠️  MCP client creation failed, using built-in tools only');
        }
    } catch (mcpError) {
        console.error('❌ MCP setup failed:', mcpError);
        console.log('⚠️  Falling back to built-in tools only');
    }

    const toolCount = Object.keys(mcpTools).length;
    console.log('🎯 Total tools available for Assistant UI:', toolCount);

    // Create system message with tool information
    const systemMessage = toolCount > 0
        ? `You are a helpful AI assistant for a Pokemon chat application with access to ${toolCount} advanced tools from QueryArtisan.

Your sole purpose is to answer questions about Pokemon. You must use the provided GraphQL QueryArtisan tools to find information about Pokemon.

Do not answer any questions that are not about Pokemon. If a user asks about anything else, politely decline and state that you can only provide information about Pokemon.

Be conversational and explain what tools you're using and why. These QueryArtisan tools are particularly powerful for GraphQL-related tasks, database operations, and API development.

If a tool call results in an error, analyze the error message, adjust your query or approach, and try again. Be persistent in solving the user's request.

This is the Assistant UI version of the Pokemon chat - it's a modern interface using Assistant UI components!`
        : `You are a helpful AI assistant for a Pokemon chat application.

Note: QueryArtisan MCP tools are temporarily unavailable.
I can still help you with general questions and conversation.

If a tool call results in an error, analyze the error message, adjust your query or approach, and try again. Be persistent in solving the user's request.

This is the Assistant UI version of the Pokemon chat - it's a modern interface using Assistant UI components!`;

    try {
        console.log('🔍 Starting streamText with tools:');
        const result = await streamText({
            // model: anthropic("claude-3-5-sonnet-latest"),
            model: openai("gpt-4.1"),
            messages,
            tools: mcpTools,
            system: systemMessage,
            maxSteps: 30,
        });

        // Clean up MCP client when done
        if (mcpClient) {
            result.finishReason.then(() => {
                mcpClient.close().catch((closeError: unknown) => {
                    console.error('⚠️  Error closing MCP client:', closeError);
                });
            }).catch((error) => {
                console.error('⚠️  Error closing MCP client:', error);
                // Ignore errors in cleanup
            });
        }

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('❌ Error in streamText:', error);
        // Clean up MCP client on error
        if (mcpClient) {
            try {
                await mcpClient.close();
                console.log('🔒 MCP client closed after error');
            } catch (closeError) {
                console.error('⚠️  Error closing MCP client after error:', closeError);
            }
        }
        throw error;
    }
} 