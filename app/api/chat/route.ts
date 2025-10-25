import { openai, createOpenAI } from "@ai-sdk/openai";
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

export const maxDuration = 120; // 2 minutes for complex MCP workflows with multiple tool calls

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
      provider?: "openai" | "anthropic" | "zai" | "local" | "vercel";
      model?: string;
    } = await req.json();


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

      // Get available tools from the MCP server
      mcpTools = await mcpClient.tools();
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

    // Use a shorter system prompt for local models with limited context
    const systemMessage = provider === "local"
      ? `You are a Pokemon chat assistant with GraphQL query tools.

CRITICAL: For search/finder requests, use array-returning fields (like [Pokemon]) not single objects.
Check return types during introspection: pokemon(name:): Pokemon is WRONG for search. Use fields that return arrays.

When user asks for "search" or "input", add a String variable to enable search box.

Workflow:
1. Introspect schema - find array fields
2. Build query with variables ($limit, $offset for pagination; String var for search)
3. Execute with executeGraphQLQuery
4. Call presentPokemonData with the data

Only answer Pokemon questions.`
      : `You are a helpful AI assistant for a Pokemon chat application with access to GraphQL query building tools through the MCP server.

⚠️ CRITICAL RULE FOR SEARCH/FINDER QUERIES ⚠️

When the user asks for ANY of these:
- "search input", "search box", "input to search"
- "finder", "searchable", "search for Pokemon"
- "UI with input", "component with input"

You MUST build a query with BOTH:
1. Array-returning field (not single object)
2. String variable for search (like $search, $name, $query)

During introspection, check the RETURN TYPE of fields:
- pokemon(name: String!): Pokemon → Returns SINGLE object with exact match - DO NOT USE FOR SEARCH!
- pokemons(...): [Pokemon] → Returns ARRAY of results - USE THIS FOR SEARCH!

The square brackets [Type] mean it returns multiple results. For any search/finder UI, you MUST choose array-returning fields.

If you use pokemon(name: "pika"), it returns null because there's no Pokemon named exactly "pika".
If you use an array field with filters, it can find "pikachu", "pikachu-gmax", etc.

CRITICAL: If the user mentions "input" or "search" in their request, you MUST add a String variable to enable the search box!

ALWAYS check return types during introspection and choose array fields for search!

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

**CRITICAL: UNDERSTANDING FIELD TYPES**

When you introspect a GraphQL schema, fields have return types:
- Single object field: pokemon(name: String!): Pokemon → Returns ONE Pokemon by exact match
- Array/List field: pokemons(where: ...): [Pokemon] → Returns MULTIPLE Pokemon that match criteria

The square brackets [Type] or list indicators mean it returns multiple results. This is CRITICAL for search/finder UIs!

**COMMON USER REQUEST PATTERNS:**

When users ask for "Pokemon finder" / "search" / "searchable list" / "input to search" / ANY request mentioning "input" or "search":
1. During introspection, examine the RETURN TYPE of each field
2. Identify fields that return **[Pokemon]** or **[Type]** (arrays/lists - look for square brackets!)
3. REJECT fields that return single Pokemon object - those are for exact lookup only, not search
4. Choose an array-returning field
5. ⚠️ MANDATORY: Define a String variable for search input (e.g., $search, $name, $query)
6. Introspect that field's arguments to find filter/where/search parameters
7. Wire your String variable to those arguments (this enables the search box!)
8. Add $limit/$offset for pagination if the field supports it

WITHOUT a String variable, the UI will be a paginated list (no search box).
WITH a String variable properly wired, the UI will be a searchable list (with search input).

When users ask for "Show me X Pokemon" / "list" / "browse":
1. Same as above - find array-returning fields
2. Define $limit/$offset Int variables
3. Wire to pagination arguments

When users ask for "Compare Pokemon" / "stats" (specific Pokemon):
- Single object fields are OK here (pokemon(id: 1) or pokemon(name: "pikachu"))
- This is the ONLY case where single-object fields are appropriate

**WHY THIS MATTERS:**
- Field pokemon(name: "pika") with return type Pokemon → Returns null if no exact match
- Field pokemons(where: {name_contains: "pika"}) with return type [Pokemon] → Returns all Pokemon with "pika" in name
- For search UIs, you MUST use array-returning fields!

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
   - ⚠️ CRITICAL: For EVERY field, check its RETURN TYPE (is it Pokemon or [Pokemon]?)
   - For "finder" or "search" requests, you MUST find fields with return type [Type] or [Pokemon] (arrays)
   - DO NOT USE fields with return type Pokemon (single object) - these only work for exact lookups
   - Example: pokemon(name: String!): Pokemon → WRONG for search (returns null for "pika")
   - Example: pokemons(...): [Pokemon] → CORRECT for search (returns array with matches)
   - Once you identify array-returning fields, note what arguments they accept (limit, offset, where, search, filter, etc.)

2. **START query session**:
   - Call start-query-session

3. **BUILD the query**:
   - Use ONLY field names you discovered from introspection - never guess or assume
   - Start with the fields you found that return Pokemon data
   - Use select-field or select-multi-fields to add fields
   - Add arguments based on what the schema supports (discovered via introspection)
   - Use the EXACT names from the schema - spelling matters!

4. **ADD variables** (CRITICAL for interactive components):
   - For pagination: Define $limit: Int! and $offset: Int! variables, then pass them to the field's limit/offset arguments
   - For search/finder (when user asks for "input", "search", "finder"): Define a String variable (e.g., $search, $name, $query), then pass it to a field argument
   - ⚠️ IMPORTANT: If user's request mentions "input" or "search", you MUST include a String variable - without it, they won't get a search box!
   - The variable name can be anything (e.g., $search, $name, $filter) - what matters is that you PASS IT to a field argument
   - Introspection will show you what arguments the field accepts - use those!
   - DO NOT hardcode values - always use variables!

5. **WIRE variables to arguments**:
   - After defining variables, you MUST pass them to field arguments
   - The argument name and structure comes entirely from introspection - every API is different!
   - Some arguments take simple values: field(name: $search)
   - Some arguments take nested objects: field(where: {name: {contains: $search}})
   - Introspect to discover the EXACT structure the argument expects
   - If an argument accepts an object type, introspect that type to see what fields it has
   - Use set-string-argument or set-typed-argument to set these field arguments with your variable values

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
- $limit + $offset ONLY → Creates paginated list (prev/next buttons, NO search box)
- $limit + $offset + String variable → Creates searchable list (prev/next buttons + search input!)
- String variable (wired to filter/where/search argument) → Enables the search input box
- Variables MUST be passed to field arguments - defining them isn't enough!
- The system auto-detects: if it finds a String variable in your query, it creates a search box
- If user asks for "search" or "input" but you don't include a String variable, they'll get the wrong UI!

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

    // Handle Vercel provider separately using model registry
    if (provider === "vercel") {
      // Vercel AI uses model registry format: 'anthropic/claude-3.5-haiku'
      const result = streamText({
        model: model,
        system: systemMessage,
        messages: convertToModelMessages(messages),
        tools: allTools,
        stopWhen: stepCountIs(100),
        onFinish: async () => {
          // Clean up MCP client
          if (mcpClient) {
            try {
              await mcpClient.close();
            } catch (error) {
              console.error("Error closing MCP client:", error);
            }
          }
        },
      });

      // Return UI message stream response (AI SDK 5.0)
      return result.toUIMessageStreamResponse();
    }

    // Handle all other providers (anthropic, openai, zai, local)
    let selectedProvider;
    if (provider === "anthropic") {
      selectedProvider = anthropic;
    } else if (provider === "zai") {
      const zhipu = createOpenAI({
        baseURL: "https://api.z.ai/api/paas/v4",
        apiKey: process.env.ZHIPU_API_KEY || "",
      });
      selectedProvider = zhipu;
    } else if (provider === "local") {
      const localClient = createOpenAI({
        baseURL: "http://127.0.0.1:1234/v1",
        apiKey: "not-needed",
      });
      selectedProvider = localClient;
    } else {
      selectedProvider = openai;
    }

    const result = streamText({
      model: (provider === "zai" || provider === "local") ? selectedProvider.chat(model) : selectedProvider(model),
      system: systemMessage,
      messages: convertToModelMessages(messages),
      tools: allTools,
      stopWhen: stepCountIs(100),
      onFinish: async () => {
        // Clean up MCP client
        if (mcpClient) {
          try {
            await mcpClient.close();
          } catch (error) {
            console.error("Error closing MCP client:", error);
          }
        }
      },
    });

    // Return UI message stream response (AI SDK 5.0)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in POST handler:", error);

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
