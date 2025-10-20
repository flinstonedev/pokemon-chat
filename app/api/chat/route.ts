import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
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
    const {
      messages,
      provider = "openai",
      model = "gpt-4o",
    }: {
      messages: UIMessage[];
      provider?: "openai" | "anthropic";
      model?: string;
    } = await req.json();

    if (process.env.NODE_ENV !== "production") {
      console.log("📨 Received messages:", messages.length, "messages");
      console.log("🤖 Using provider:", provider, "model:", model);
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
        "Visualize data with a nice UI. Use this tool AFTER executing a query to show the results. IMPORTANT: Include the query and variables you used so the UI can be interactive. Write your intro text BEFORE calling this tool, not in it.",
      inputSchema: z.object({
        data: z
          .record(z.unknown())
          .describe(
            "The raw data from the execute-query tool that should be visualized"
          ),
        query: z
          .string()
          .optional()
          .describe(
            "The GraphQL query string you built and executed (with variables like $limit, $offset)"
          ),
        variables: z
          .record(z.unknown())
          .optional()
          .describe(
            "The variables you used when executing the query (e.g., { limit: 20, offset: 0 })"
          ),
      }),
      execute: async ({
        data,
        query,
        variables,
      }: {
        data: Record<string, unknown>;
        query?: string;
        variables?: Record<string, unknown>;
      }) => {
        // Debug logging
        console.log("🎨 [presentPokemonData] Called with:", {
          hasData: !!data,
          hasQuery: !!query,
          hasVariables: !!variables,
          query: query?.substring(0, 100),
          variables,
        });

        // Pass through data and query metadata for client-side visualization
        const result = {
          success: true,
          data,
          queryMetadata: query
            ? { query, variables: variables || {} }
            : undefined,
        };

        console.log("🎨 [presentPokemonData] Returning:", {
          hasQueryMetadata: !!result.queryMetadata,
          queryMetadata: result.queryMetadata,
        });

        return result;
      },
    };

    const systemMessage = `You are a helpful AI assistant for a Pokemon chat application with access to GraphQL query building tools through the MCP server.

IMPORTANT: You ONLY answer questions related to Pokemon. If a user asks about anything that is not Pokemon-related, politely decline and remind them that you can only help with Pokemon-related questions.

Your purpose is to answer questions about Pokemon using the provided GraphQL tools to query the Pokemon API.

Available MCP tools:
- **introspect-schema** - Discover available types and fields in the GraphQL API
- **start-query-session** - Initialize a query building session
- **select-field / select-multi-fields** - Add fields to your query
- **set-string-argument / set-typed-argument** - Set field arguments
- **validate-query** - Check if query is valid
- **execute-query** - Run the query and get results
- **end-query-session** - Clean up the session
- **presentPokemonData** - Visualize data with interactive UI

**CRITICAL WORKFLOW - ALWAYS FOLLOW THIS ORDER:**

1. **INTROSPECT FIRST** (MANDATORY):
   - Call introspect-schema to discover the actual field names in the API
   - DO NOT assume or guess field names
   - The API might use names like "pokemon_v2_pokemon" instead of "pokemons"
   - Look for query root types and their fields

2. **Start session**:
   - Call start-query-session

3. **Build query using DISCOVERED field names**:
   - Use select-field or select-multi-fields
   - ONLY use field names you discovered from introspection
   - DO NOT use intuitive names like "pokemons" - use the EXACT names from the schema
4. **CRITICAL - Use Variables for Dynamic Values**:
   - For pagination: MUST use $limit: Int! and $offset: Int! variables
   - For search: MUST use $search: String! variable
   - For filters: Use appropriate variable types
   - Example: "query GetData($limit: Int!, $offset: Int!) { <field>(limit: $limit, offset: $offset) { ... } }"
   - DO NOT hardcode values - always use variables!

5. **Set arguments**:
   - Use set-string-argument or set-typed-argument for field arguments

6. **Validate**:
   - Call validate-query to check if query is valid

7. **Execute**:
   - Call execute-query to run the query and get data
   - This ensures the query works with the actual API

8. **CRITICAL - Visualize with presentPokemonData**:
   After getting data from execute-query, you MUST:
   a. Write a SHORT intro text (e.g., "Here are 20 results:")
   b. IMMEDIATELY call presentPokemonData with:
      - data: The result data from execute-query
      - query: The EXACT query string you built
      - variables: The variables you used (e.g., { limit: 20, offset: 0 })

   This allows the UI to create interactive pagination/search components.

9. **Clean up**:
   - Call end-query-session

**WHY VARIABLES MATTER:**
- $limit + $offset → Creates interactive paginated list with prev/next buttons
- $search → Creates searchable interface with text input
- Variables make queries reusable and enable interactive UIs

**VISUALIZATION RULES**:
- DO NOT describe data details in text - let presentPokemonData handle it
- Keep text response to 1 line maximum
- ALWAYS call presentPokemonData after execute-query - NOT optional
- Pass the exact query and variables for interactive components

**Example Workflow:**
User: "Show me all Pokemon"

Step 1: introspect-schema (discover that the field is "pokemon_v2_pokemon")
Step 2: start-query-session
Step 3: select-field("pokemon_v2_pokemon") with $limit and $offset variables
Step 4: validate-query
Step 5: execute-query with { limit: 20, offset: 0 }
Step 6: Write: "Here are 20 Pokémon:"
Step 7: presentPokemonData({
  data: <execute-query result>,
  query: "query GetPokemon($limit: Int!, $offset: Int!) { pokemon_v2_pokemon(limit: $limit, offset: $offset) { id name } }",
  variables: { limit: 20, offset: 0 }
})
Step 8: end-query-session`;

    // Combine MCP tools with our custom presentPokemonData tool
    const allTools = {
      ...mcpTools,
      presentPokemonData,
    };

    // Select the appropriate provider
    const selectedProvider = provider === "anthropic" ? anthropic : openai;

    // Stream the response with all tools (AI SDK 5.0 style)
    const result = streamText({
      model: selectedProvider(model),
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
