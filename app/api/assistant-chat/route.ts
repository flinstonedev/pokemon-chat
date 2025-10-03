import { openai } from "@ai-sdk/openai";
import { streamText, experimental_createMCPClient, Tool } from "ai";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

// Define a type for the MCP client to avoid using `any`.
interface MCPClient {
    tools: () => Promise<Record<string, Tool>>;
    close: () => Promise<void>;
}

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 20; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
        // Create new record or reset expired one
        const newRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        rateLimitMap.set(identifier, newRecord);
        return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1, resetTime: newRecord.resetTime };
    }

    if (record.count >= RATE_LIMIT_REQUESTS) {
        // Rate limit exceeded
        return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    // Increment counter
    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - record.count, resetTime: record.resetTime };
}

// Clean up expired rate limit records (prevent memory leaks)
function cleanupRateLimit() {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}

// Environment configuration with validation
const MCP_URL = process.env.MCP_URL || 'https://agent-query-builder-toolbox.vercel.app/mcp';
const ALLOWED_MCP_DOMAINS = [
    'agent-query-builder-toolbox.vercel.app',
    'localhost',
    '127.0.0.1'
];

// Validate MCP URL to prevent SSRF attacks
function validateMCPUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        // Only allow HTTPS (except localhost for development)
        if (parsedUrl.protocol !== 'https:' && !parsedUrl.hostname.includes('localhost') && parsedUrl.hostname !== '127.0.0.1') {
            return false;
        }
        // Check if domain is in allowed list
        return ALLOWED_MCP_DOMAINS.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`));
    } catch {
        return false;
    }
}

// Create MCP client for QuerySculptor server
async function createQuerySculptorClient(): Promise<MCPClient | null> {
    const mcpUrl = MCP_URL;
    const clientName = 'pokemon-chat-client';

    // Validate URL before making request
    if (!validateMCPUrl(mcpUrl)) {
        console.error('❌ Invalid or unauthorized MCP URL:', mcpUrl);
        return null;
    }

    try {
        // Reduced logging for production
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔧 Starting MCP client creation process...');
            console.log('📡 Target URL:', mcpUrl);
            console.log('🏷️  Client name:', clientName);
        }

        // Test URL accessibility with timeout
        try {
            const testResponse = await fetch(mcpUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ URL test response status:', testResponse.status);
            }
        } catch (fetchError) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('❌ URL accessibility test failed:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
            }
        }

        const clientConfig = {
            transport: new StreamableHTTPClientTransport(new URL(mcpUrl), {
                sessionId: `pokemon-chat-${Date.now()}`,
            }),
            name: clientName,
            onUncaughtError: (error: unknown) => {
                // Reduced error logging for production
                if (process.env.NODE_ENV !== 'production') {
                    console.error('🚨 MCP Client uncaught error:', error instanceof Error ? error.message : 'Unknown error');
                }
            },
        };

        // Add timeout to client creation (10 seconds max)
        const clientPromise = experimental_createMCPClient(clientConfig);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`HTTP client creation timeout after 10s`)), 10000)
        );

        const client = await Promise.race([clientPromise, timeoutPromise]) as MCPClient;

        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ MCP client created successfully!');
        }

        return client;
    } catch (error) {
        // Reduced error logging for production
        if (process.env.NODE_ENV !== 'production') {
            console.error('❌ Failed to create QuerySculptor MCP client:', error instanceof Error ? error.message : 'Unknown error');
        }
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Authenticate the user
        const { userId } = await auth();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Clean up expired rate limit records periodically
        if (Math.random() < 0.01) { // 1% chance to clean up
            cleanupRateLimit();
        }

        // Rate limiting - now uses userId for authenticated users
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

        // Validate messages format
        if (!Array.isArray(messages)) {
            return new Response('Invalid messages format: must be an array', { status: 400 });
        }

        if (messages.length === 0) {
            return new Response('Invalid messages format: array cannot be empty', { status: 400 });
        }

        // Validate each message structure
        for (const message of messages) {
            if (!message || typeof message !== 'object' || !message.role) {
                return new Response('Invalid message format: each message must have role', { status: 400 });
            }

            // Validate role
            if (!['user', 'assistant', 'system', 'tool'].includes(message.role)) {
                return new Response('Invalid message role: must be user, assistant, system, or tool', { status: 400 });
            }

            // Content can be string or array (for multi-part messages like tool calls)
            if (message.content) {
                if (typeof message.content === 'string' && message.content.length > 10000) {
                    return new Response('Message content too long: maximum 10,000 characters', { status: 400 });
                }
                // Allow array content for tool calls and multi-part messages
                if (Array.isArray(message.content)) {
                    for (const part of message.content) {
                        if (part && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string' && part.text.length > 10000) {
                            return new Response('Message content too long: maximum 10,000 characters', { status: 400 });
                        }
                    }
                }
            }
        }

        // Set up MCP tools
        let mcpTools: Record<string, Tool> = {};
        let mcpClient: MCPClient | null = null;

        if (process.env.NODE_ENV !== 'production') {
            console.log('🔧 Starting MCP tool setup for Assistant UI...');
        }

        try {
            mcpClient = await createQuerySculptorClient();

            if (mcpClient) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('✅ MCP client created successfully');
                }

                mcpTools = await mcpClient.tools();

                if (process.env.NODE_ENV !== 'production') {
                    console.log('✅ MCP tools loaded:', Object.keys(mcpTools).length);
                }
            } else {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('⚠️  MCP client creation failed, using built-in tools only');
                }
            }
        } catch (mcpError) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('❌ MCP setup failed:', mcpError instanceof Error ? mcpError.message : 'Unknown error');
            }
        }

        const toolCount = Object.keys(mcpTools).length;

        // Create system message with tool information
        const systemMessage = toolCount > 0
            ? `You are a helpful AI assistant for a Pokemon chat application with access to ${toolCount} advanced tools from QuerySculptor.

Your sole purpose is to answer questions about Pokemon. You must use the provided GraphQL QuerySculptor tools to find information about Pokemon.

Do not answer any questions that are not about Pokemon. If a user asks about anything else, politely decline and state that you can only provide information about Pokemon.

Be conversational and explain what tools you're using and why. These QuerySculptor tools are particularly powerful for GraphQL-related tasks, database operations, and API development.

If a tool call results in an error, analyze the error message, adjust your query or approach, and try again. Be persistent in solving the user's request.

IMPORTANT: Never stop in the middle of a tool call. Always complete all tool calls and process their results before responding to the user. If you must stop for any reason (such as encountering an error you cannot resolve), clearly inform the user about what happened and why you stopped.

This is the Assistant UI version of the Pokemon chat - it's a modern interface using Assistant UI components!`
            : `You are a helpful AI assistant for a Pokemon chat application.

Note: QuerySculptor MCP tools are temporarily unavailable.
I can still help you with general questions and conversation.

If a tool call results in an error, analyze the error message, adjust your query or approach, and try again. Be persistent in solving the user's request.

IMPORTANT: Never stop in the middle of a tool call. Always complete all tool calls and process their results before responding to the user. If you must stop for any reason (such as encountering an error you cannot resolve), clearly inform the user about what happened and why you stopped.

This is the Assistant UI version of the Pokemon chat - it's a modern interface using Assistant UI components!`;

        const result = streamText({
            model: openai("gpt-4.1-mini"),
            messages,
            tools: mcpTools,
            system: systemMessage,
            maxSteps: 50,
        });

        // Clean up MCP client when done
        if (mcpClient) {
            (async () => {
                try {
                    await result;
                    await mcpClient.close();
                } catch (error) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.error('⚠️  Error closing MCP client:', error);
                    }
                }
            })();
        }

        // Add rate limit headers to successful responses
        const response = result.toDataStreamResponse();
        response.headers.set('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

        return response;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('❌ Error in POST handler:', error);
        }

        // Generic error response to prevent information leakage
        return new Response('Internal server error', { status: 500 });
    }
} 