import { openai } from "@ai-sdk/openai";
import { streamText, experimental_createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
        const newRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        rateLimitMap.set(identifier, newRecord);
        return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1, resetTime: newRecord.resetTime };
    }

    if (record.count >= RATE_LIMIT_REQUESTS) {
        return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - record.count, resetTime: record.resetTime };
}

// Clean up expired rate limit records
function cleanupRateLimit() {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}

// Message types for conversion
interface MessagePart {
    type: string;
    text?: string;
}

interface UIMessage {
    role: string;
    content?: string | MessagePart[];
    parts?: MessagePart[];
}

export async function POST(req: NextRequest) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mcpClient: any = null;

    try {
        // Authenticate the user
        const { userId } = await auth();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Clean up expired rate limit records periodically
        if (Math.random() < 0.01) {
            cleanupRateLimit();
        }

        // Rate limiting
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get("x-real-ip") || 'unknown';
        const identifier = userId || `${ip}:${req.headers.get("user-agent") || 'unknown'}`;

        const rateLimit = checkRateLimit(identifier);

        if (!rateLimit.allowed) {
            const resetInSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    message: `Too many requests. Try again in ${resetInSeconds} seconds.`,
                    retryAfter: resetInSeconds
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': resetInSeconds.toString(),
                        'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
                    }
                }
            );
        }

        // Input validation
        const body = await req.json();
        const { messages } = body;

        if (process.env.NODE_ENV !== 'production') {
            console.log('📨 Received messages:', JSON.stringify(messages, null, 2));
        }

        // Validate messages
        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response('Invalid messages format', { status: 400 });
        }

        // Convert messages to the format expected by AI SDK
        const convertedMessages = messages.map((msg: UIMessage) => {
            // Handle Assistant UI message format
            if (msg.content && typeof msg.content === 'string') {
                return {
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: msg.content
                };
            }

            // Handle multi-part messages
            if (msg.content && Array.isArray(msg.content)) {
                const textParts = msg.content
                    .filter((part: MessagePart) => part.type === 'text')
                    .map((part: MessagePart) => part.text || '')
                    .join(' ');

                return {
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: textParts
                };
            }

            // Handle parts format from Assistant UI
            if (msg.parts && Array.isArray(msg.parts)) {
                const textParts = msg.parts
                    .filter((part: MessagePart) => part.type === 'text')
                    .map((part: MessagePart) => part.text || '')
                    .join(' ');

                return {
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: textParts
                };
            }

            return {
                role: msg.role as 'user' | 'assistant' | 'system',
                content: ''
            };
        });

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
                console.log('Available tools:', Object.keys(mcpTools));
            }
        } catch (mcpError) {
            console.error('⚠️ MCP setup failed:', mcpError);
            // Continue without MCP tools if connection fails
        }

        const systemMessage = `You are a helpful AI assistant for a Pokemon chat application with access to GraphQL query building tools through the MCP server.

Your purpose is to answer questions about Pokemon using the provided GraphQL tools to query the Pokemon API.

Available tools include:
- introspect-schema: Get the GraphQL schema
- start-query-session: Start a new query session
- select-field and select-multi-fields: Add fields to your query
- set-string-argument: Set arguments on fields
- validate-query: Validate your query
- execute-query: Execute the query and get Pokemon data
- end-query-session: Clean up the session

When users ask about Pokemon:
1. Start a query session
2. Build an appropriate GraphQL query
3. Execute it to get data
4. End the session
5. Present the results in a friendly way

Be conversational and explain what you're doing.`;

        // Stream the response with MCP tools
        const result = streamText({
            model: openai("gpt-4o-mini"),
            messages: [
                { role: 'system', content: systemMessage },
                ...convertedMessages
            ],
            tools: mcpTools,
            maxSteps: 10,
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

        // Return the stream response in Assistant UI format
        // For AI SDK v4 with Assistant UI, we need to use toDataStreamResponse
        return result.toDataStreamResponse({
            headers: {
                'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            }
        });

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