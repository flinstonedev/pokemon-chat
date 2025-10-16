import { openai } from "@ai-sdk/openai";
import {
  streamText,
  experimental_createMCPClient,
  stepCountIs,
  convertToModelMessages,
  UIMessage,
} from "ai";
import { z } from "zod";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
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
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (process.env.NODE_ENV !== "production") {
      console.log("📨 Received messages:", messages.length, "messages");
    }

    // Initialize MCP client with the actual MCP server
    let mcpTools = {};

    try {
      // Create MCP client using StreamableHTTP transport
      const MCP_URL =
        process.env.MCP_URL ||
        "https://agent-query-builder-toolbox.vercel.app/mcp";

      mcpClient = await experimental_createMCPClient({
        transport: new StreamableHTTPClientTransport(new URL(MCP_URL), {
          sessionId: `pokemon-chat-${userId}-${Date.now()}`,
        }),
        name: "pokemon-chat-client",
      });

      if (process.env.NODE_ENV !== "production") {
        console.log("✅ MCP client created successfully");
      }

      // Get available tools from the MCP server
      mcpTools = await mcpClient.tools();

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "✅ MCP tools loaded:",
          Object.keys(mcpTools).length,
          "tools available"
        );
        console.log(
          "Available tools:",
          Object.keys(mcpTools).slice(0, 10),
          "..."
        );
      }
    } catch (mcpError) {
      console.error("⚠️ MCP setup failed:", mcpError);
      // Continue without MCP tools if connection fails
    }

    // Create custom tool for presenting Pokemon data with visualization
    const presentPokemonData = {
      description:
        "Visualize Pokemon data with a nice UI. Use this tool AFTER executing a Pokemon query to show the results. Write your intro text BEFORE calling this tool, not in it.",
      inputSchema: z.object({
        data: z
          .record(z.unknown())
          .describe(
            "The raw Pokemon data from the execute-query tool that should be visualized"
          ),
      }),
      execute: async ({ data }: { data: Record<string, unknown> }) => {
        // This tool just passes data through - the client will handle visualization
        return {
          success: true,
          data,
        };
      },
    };

    const systemMessage = `You are a helpful AI assistant for a Pokemon chat application with access to GraphQL query building tools through the MCP server.

IMPORTANT: You ONLY answer questions related to Pokemon. If a user asks about anything that is not Pokemon-related, politely decline and remind them that you can only help with Pokemon-related questions.

Your purpose is to answer questions about Pokemon using the provided GraphQL tools to query the Pokemon API.

Available tools help you:
- Introspect the GraphQL schema
- Start query sessions
- Build queries by selecting fields
- Set arguments on fields
- Validate and execute queries
- Clean up sessions
- **presentPokemonData**: Visualize Pokemon data with a nice UI

When users ask about Pokemon:
1. Start a query session with start-query-session
2. Build an appropriate GraphQL query using select-field or select-multi-fields
3. Set any needed arguments with set-string-argument or set-typed-argument
4. Validate the query with validate-query
5. Execute it with execute-query to get Pokemon data
6. **CRITICAL - YOU MUST DO THIS**: After getting data from execute-query:
   a. Write a SHORT intro text response (e.g., "Here are 5 Pokémon:")
   b. IMMEDIATELY call presentPokemonData with ONLY the data: presentPokemonData({ data: <data> })
7. End the session with end-query-session

**IMPORTANT RULES**:
- DO NOT describe Pokemon details or stats in your text response
- Write ONLY a brief intro sentence in text (1 line maximum)
- ALWAYS call presentPokemonData after execute-query - this is MANDATORY
- The tool handles visualization - your job is just to introduce it

Example:
User: "Show me 5 Pokemon"
You: [query steps] → execute-query gets data → Write: "Here are 5 Pokémon:" → **MUST call presentPokemonData**({ data: <data> })

NEVER describe the Pokemon data yourself - let the tool visualize it.`;

    // Combine MCP tools with our custom presentPokemonData tool
    const allTools = {
      ...mcpTools,
      presentPokemonData,
    };

    // Stream the response with all tools (AI SDK 5.0 style)
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemMessage,
      messages: convertToModelMessages(messages),
      tools: allTools,
      stopWhen: stepCountIs(100),
      onFinish: async ({ usage }) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("✅ Stream completed. Usage:", usage);
        }

        // Clean up MCP client
        if (mcpClient) {
          try {
            await mcpClient.close();
            if (process.env.NODE_ENV !== "production") {
              console.log("✅ MCP client closed");
            }
          } catch (error) {
            console.error("Error closing MCP client:", error);
          }
        }
      },
    });

    // Return UI message stream response (AI SDK 5.0)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("❌ Error in POST handler:", error);

    // Clean up MCP client on error
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }

    if (process.env.NODE_ENV !== "production") {
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Internal server error", { status: 500 });
  }
}
