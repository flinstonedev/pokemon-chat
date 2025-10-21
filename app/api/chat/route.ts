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

    // Create custom tool for executing GraphQL queries
    const executeGraphQLQuery = {
      description:
        "Execute a GraphQL query against the configured endpoint. Use this INSTEAD of the MCP execute-query tool. This ensures queries use the correct endpoint and authentication.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("The GraphQL query string to execute"),
        variables: z
          .record(z.unknown())
          .optional()
          .describe("Variables for the GraphQL query (e.g., { limit: 20, offset: 0 })"),
      }),
      execute: async ({
        query,
        variables,
      }: {
        query: string;
        variables?: Record<string, unknown>;
      }) => {
        console.log("🔍 [executeGraphQLQuery] Executing query:", {
          query: query.substring(0, 100),
          variables,
        });

        try {
          const response = await fetch(
            `${req.nextUrl.origin}/api/execute-graphql`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query, variables: variables || {} }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `HTTP ${response.status}: ${response.statusText}`
            );
          }

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || "Query execution failed");
          }

          console.log("🔍 [executeGraphQLQuery] Success!");
          return {
            success: true,
            data: result.data,
            message: "Query executed successfully",
          };
        } catch (error) {
          console.error("🔍 [executeGraphQLQuery] Error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    };

    // Create custom tool for presenting Pokemon data with visualization
    const presentPokemonData = {
      description:
        "Visualize data with a nice UI. Use this tool AFTER executeGraphQLQuery to show the results. CRITICAL: Pass the 'data' field from executeGraphQLQuery's result (e.g., if executeGraphQLQuery returns {success: true, data: {...}}, pass the {...} part). Include the query and variables so the UI can be interactive. Write your intro text BEFORE calling this tool, not in it.",
      inputSchema: z.object({
        data: z
          .record(z.unknown())
          .describe(
            "REQUIRED: The 'data' field from executeGraphQLQuery's result. Example: if executeGraphQLQuery returns {success: true, data: {pokemon: [...]}}, pass {pokemon: [...]} here."
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
        endpoint: z
          .string()
          .url()
          .optional()
          .describe(
            "The GraphQL endpoint URL (optional - defaults to configured endpoint)"
          ),
      }),
      execute: async ({
        data,
        query,
        variables,
        endpoint,
      }: {
        data: Record<string, unknown>;
        query?: string;
        variables?: Record<string, unknown>;
        endpoint?: string;
      }) => {
        // Debug logging
        console.log("🎨 [presentPokemonData] Called with:", {
          hasData: !!data,
          hasQuery: !!query,
          hasVariables: !!variables,
          hasEndpoint: !!endpoint,
          query: query?.substring(0, 100),
          variables,
          endpoint,
        });

        // Pass through data and query metadata for client-side visualization
        const result = {
          success: true,
          data,
          queryMetadata: query
            ? { query, variables: variables || {}, endpoint }
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

IMPORTANT: You ONLY answer questions related to Pokemon. Pokemon-related requests include:
- Searching for Pokemon (e.g., "show me 20 Pokemon", "find fire type Pokemon")
- Building Pokemon search UIs, finders, or explorers (e.g., "create a Pokemon finder", "build a searchable list")
- Getting Pokemon stats, types, abilities, moves, evolutions
- Comparing Pokemon or analyzing Pokemon data
- ANY request involving Pokemon data or Pokemon UIs

If a user asks about non-Pokemon topics (like recipes, weather, math), politely decline and remind them you can only help with Pokemon.

Your purpose is to answer questions about Pokemon using the provided GraphQL tools to query the Pokemon API.

Available tools:

**MCP Query Building Tools (for building queries ONLY, NOT executing):**
- **introspect-schema** - Discover available types and fields in the GraphQL API
- **start-query-session** - Initialize a query building session
- **select-field / select-multi-fields** - Add fields to your query
- **set-string-argument / set-typed-argument** - Set field arguments
- **validate-query** - Check if query is valid
- **end-query-session** - Clean up the session
- NOTE: The MCP server has an execute-query tool - DO NOT USE IT! Use our executeGraphQLQuery instead.

**Execution & Visualization Tools:**
- **executeGraphQLQuery** - Execute the query you built (use this to run queries!)
- **presentPokemonData** - Visualize data with interactive UI

**COMMON USER REQUEST PATTERNS:**

When users ask for:
- "Pokemon finder" / "search" / "searchable list" → Build query with a String variable for search/filtering
- "Show me X Pokemon" / "list" / "browse" → Build query with $limit and $offset variables (Int type)
- "Pokemon with [attribute]" → Build query with appropriate filter arguments discovered from schema
- "Compare Pokemon" / "stats" → Build query for specific Pokemon data

The MCP server will help you discover the exact field names and argument types via introspection.
You MUST use the actual schema, not assumptions. Every GraphQL API is different.

**IMPORTANT: NEVER GIVE UP!**
- If one approach doesn't work, try a simpler query
- If you encounter errors, read them carefully and adjust your query
- You have all the tools needed to succeed - introspection shows you everything
- ALWAYS complete the workflow - never stop halfway and ask the user for help
- If unsure, build the simplest possible query first, then enhance it

**CRITICAL WORKFLOW - ALWAYS FOLLOW THIS ORDER:**

**PHASE 1: BUILD THE QUERY (using MCP tools)**

1. **INTROSPECT the schema**:
   - Call introspect-schema to discover available field names
   - Look for query root types and their fields
   - Find fields that return Pokemon lists (look for fields with "pokemon" in the name)
   - Note what arguments those fields accept (limit, offset, where, search, etc.)

2. **START query session**:
   - Call start-query-session

3. **BUILD the query**:
   - Use ONLY field names you discovered from introspection - never guess or assume
   - Start with the fields you found that return Pokemon data
   - Use select-field or select-multi-fields to add fields
   - Add arguments based on what the schema supports (discovered via introspection)
   - Use the EXACT names from the schema - spelling matters!

4. **ADD variables** (CRITICAL for interactive components):
   - For pagination: MUST use $limit: Int! and $offset: Int! variables
   - For search: MUST use $search: String! variable
   - Example: "query GetData($limit: Int!, $offset: Int!) { <field>(limit: $limit, offset: $offset) { ... } }"
   - DO NOT hardcode values - always use variables!

5. **SET arguments**:
   - Use set-string-argument or set-typed-argument for field arguments

6. **VALIDATE the query**:
   - Call validate-query to check if query is syntactically correct

**PHASE 2: EXECUTE THE QUERY (using our custom tool)**

7. **EXECUTE with executeGraphQLQuery**:
   - CRITICAL: DO NOT use MCP's execute-query tool!
   - Use executeGraphQLQuery tool (our custom execution tool)
   - Pass: { query: "<the query string you built>", variables: { limit: 20, offset: 0 } }
   - This ensures the query runs against the configured endpoint with authentication

**PHASE 3: VISUALIZE THE RESULTS**

8. **VISUALIZE with presentPokemonData**:
   After executeGraphQLQuery returns data, you MUST:
   a. Write a SHORT intro text (1 line max, e.g., "Here are 20 results:")
   b. Call presentPokemonData with:
      - data: The RESULT.DATA field from executeGraphQLQuery (NOT the entire result object!)
      - query: The EXACT query string you built
      - variables: The variables you used

   CRITICAL: executeGraphQLQuery returns { success: true, data: {...}, message: "..." }
   You MUST extract the "data" field and pass it to presentPokemonData!
   Example: If executeGraphQLQuery returns { success: true, data: { pokemon: [...] } }
   Then pass { pokemon: [...] } to presentPokemonData's data parameter.

**PHASE 4: CLEANUP**

9. **END session**:
   - Call end-query-session

**WHY VARIABLES MATTER:**
- $limit + $offset → Creates interactive paginated list with prev/next buttons
- $search → Creates searchable interface with text input
- Variables make queries reusable and enable interactive UIs

**VISUALIZATION RULES**:
- DO NOT describe data details in text - let presentPokemonData handle it
- Keep text response to 1 line maximum
- ALWAYS call presentPokemonData after executeGraphQLQuery - NOT optional
- Pass the exact query and variables for interactive components

**Example Workflow:**

User: "Show me 20 Pokemon"

PHASE 1 - BUILD (MCP tools only):
→ introspect-schema (discover what fields exist in the schema)
→ start-query-session
→ select-field (add the fields you discovered, with $limit/$offset variables)
→ validate-query

PHASE 2 - EXECUTE (custom tool):
→ executeGraphQLQuery({
    query: "query YourQueryName($limit: Int!, $offset: Int!) { <fields from schema> }",
    variables: { limit: 20, offset: 0 }
  })
  // Returns: { success: true, data: { ... }, message: "..." }

PHASE 3 - VISUALIZE (custom tool):
→ Write: "Here are 20 Pokémon:"
→ presentPokemonData({
    data: result.data,  // Extract the "data" field from executeGraphQLQuery result!
    query: "<the exact query string you built>",
    variables: { limit: 20, offset: 0 }
  })

PHASE 4 - CLEANUP (MCP tool):
→ end-query-session`;

    // Combine MCP tools with our custom tools
    const allTools = {
      ...mcpTools,
      executeGraphQLQuery,
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
