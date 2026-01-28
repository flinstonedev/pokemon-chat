import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, stepCountIs, convertToModelMessages, UIMessage } from "ai";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
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
      // Log MCP errors only in development
      if (process.env.NODE_ENV !== "production") {
        console.error("⚠️ MCP setup failed:", mcpError);
      }
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
          .describe(
            "Variables for the GraphQL query (e.g., { limit: 20, offset: 0 })"
          ),
      }),
      execute: async ({
        query,
        variables,
      }: {
        query: string;
        variables?: Record<string, unknown>;
      }) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("🔍 [executeGraphQLQuery] Executing query:", {
            query: query.substring(0, 100),
            variables,
          });
        }

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
              errorData.error ||
                `HTTP ${response.status}: ${response.statusText}`
            );
          }

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || "Query execution failed");
          }

          if (process.env.NODE_ENV !== "production") {
            console.log("🔍 [executeGraphQLQuery] Success!");
          }
          return {
            success: true,
            data: result.data,
            message: "Query executed successfully",
          };
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.error("🔍 [executeGraphQLQuery] Error:", error);
          }
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    };

    // Create custom tool for presenting data with visualization
    const presentData = {
      description:
        "Visualize data. Use this tool AFTER executeGraphQLQuery. Pass the 'data' part of the result, plus the query metadata.",
      inputSchema: z.object({
        data: z
          .record(z.unknown())
          .describe(
            "REQUIRED: The 'data' field from executeGraphQLQuery's result."
          ),
        query: z
          .string()
          .optional()
          .describe("The GraphQL query string you built and executed"),
        variables: z
          .record(z.unknown())
          .optional()
          .describe("The variables you used when executing the query"),
        endpoint: z.string().optional(),
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
        const result = {
          success: true,
          data,
          queryMetadata: query
            ? { query, variables: variables || {}, endpoint }
            : undefined,
        };
        return result;
      },
    };

    const systemMessage = `You are a GraphQL Explorer Assistant.

MISSION: Help users explore the API and visualize data.

**Workflow:**
1. **Introspect**: Find available types/fields.
2. **Build Query**: Create a GraphQL query to fetch the requested data.
   - Use $limit/$offset variables for lists.
   - Use $search variable for search.
3. **Execute**: Run the query used executeGraphQLQuery.
4. **Visualize**: Call presentData(data, query, variables).

**Important**:
- You do NOT generate the UI JSON yourself. You just pass the raw data to presentData.
- The UI Generator (specialized agent) will handle the visualization.
`;

    const allTools = {
      ...mcpTools,
      executeGraphQLQuery,
      presentData,
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
              if (process.env.NODE_ENV !== "production") {
                console.error("Error closing MCP client:", error);
              }
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
      model:
        provider === "zai" || provider === "local"
          ? selectedProvider.chat(model)
          : selectedProvider(model),
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
            if (process.env.NODE_ENV !== "production") {
              console.error("Error closing MCP client:", error);
            }
          }
        }
      },
    });

    // Return UI message stream response (AI SDK 5.0)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error in POST handler:", error);
    }

    // Clean up MCP client on error
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error closing MCP client:", closeError);
        }
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
