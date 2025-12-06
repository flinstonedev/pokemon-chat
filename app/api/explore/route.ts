/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { experimental_createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ExplorationSuggestion } from "@/lib/pokemon-ui-schema";

export const maxDuration = 120; // 2 minutes for complex exploration

/**
 * Exploration agent that uses MCP QuerySculptor tools to discover and test
 * GraphQL queries, then returns UI component suggestions based on actual working queries.
 */
export async function POST() {
  let mcpClient: any = null;

  try {
    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize MCP client
    try {
      const MCP_URL =
        process.env.MCP_URL ||
        "https://agent-query-builder-toolbox.vercel.app/mcp";

      mcpClient = await experimental_createMCPClient({
        transport: new StreamableHTTPClientTransport(new URL(MCP_URL), {
          sessionId: `pokemon-explore-${userId}-${Date.now()}`,
        }),
        name: "pokemon-explore-client",
      });

      // Get available tools from the MCP server
      const mcpTools: Record<string, any> = await mcpClient.tools();

      if (!mcpTools || Object.keys(mcpTools).length === 0) {
        throw new Error("No MCP tools available");
      }

      // Check if required tools are available
      const requiredTools = [
        "introspect-schema",
        "start-query-session",
        "select-field",
        "set-query-variable",
        "validate-query",
        "get-current-query",
      ];

      const availableToolNames = Object.keys(mcpTools);
      const missingTools = requiredTools.filter(
        (tool) => !availableToolNames.includes(tool)
      );

      if (missingTools.length > 0) {
        throw new Error(
          `Missing required MCP tools: ${missingTools.join(", ")}`
        );
      }

      // Helper function to call MCP tools safely
      const callTool = async (toolName: string, args: any) => {
        try {
          // Try using the MCP client's callTool method directly
          if (mcpClient.callTool && typeof mcpClient.callTool === "function") {
            const result = await mcpClient.callTool(toolName, args);
            return result;
          }

          // Try using the tool's execute method if available
          const tool = mcpTools[toolName];
          if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
          }

          if (typeof tool === "function") {
            return await tool(args);
          } else if (tool.execute && typeof tool.execute === "function") {
            return await tool.execute(args);
          } else if (tool.call && typeof tool.call === "function") {
            return await tool.call(args);
          }

          // If tool has a specific structure, try to extract the callable
          if (tool.parameters && typeof tool === "object") {
            // This is a tool definition, not a callable function
            // Try to use the MCP client's direct call method
            throw new Error(
              `Tool ${toolName} is a definition, not callable. Use mcpClient.callTool directly.`
            );
          }

          throw new Error(`Cannot call tool ${toolName}: unknown tool format`);
        } catch (error) {
          console.error(`Error calling tool ${toolName}:`, error);
          console.error(`Tool structure:`, mcpTools[toolName]);
          console.error(`MCP client methods:`, Object.keys(mcpClient || {}));
          throw error;
        }
      };

      const suggestions: ExplorationSuggestion[] = [];
      const errors: string[] = [];

      // Test 1: Paginated list query
      try {
        console.log("Calling start-query-session...");
        const session1 = await callTool("start-query-session", {
          operationType: "query",
        });
        console.log(
          "start-query-session response:",
          JSON.stringify(session1, null, 2)
        );

        // Try multiple possible response structures
        const sessionId1 =
          session1?.sessionId ||
          session1?.data?.sessionId ||
          session1?.session?.sessionId ||
          session1?.content?.[0]?.text ||
          (typeof session1 === "string" ? session1 : null) ||
          session1?.result?.sessionId ||
          session1?.response?.sessionId;

        if (!sessionId1) {
          console.error("Session response structure:", session1);
          throw new Error(
            `Could not get session ID from start-query-session. Response: ${JSON.stringify(session1)}`
          );
        }

        console.log("Extracted session ID:", sessionId1);

        // Introspect schema to find array-returning fields
        const schema = await callTool("introspect-schema", {});
        const queryType = schema?.data?.__schema?.queryType;

        if (!queryType) {
          throw new Error("Could not introspect schema");
        }

        // Find array-returning Pokemon fields
        const fields = queryType.fields || [];
        const pokemonArrayFields = fields.filter((field: any) => {
          const returnType = field.type?.ofType || field.type;
          return (
            field.name &&
            returnType?.kind === "LIST" &&
            (returnType?.ofType?.name === "Pokemon" ||
              returnType?.ofType?.ofType?.name === "Pokemon")
          );
        });

        if (pokemonArrayFields.length > 0) {
          const field = pokemonArrayFields[0];
          const fieldName = field.name;

          // Get field info to understand arguments
          const fieldInfo = await callTool("get-field-info", {
            typeName: "Query",
            fieldName: fieldName,
          });

          // Set variables for pagination
          await callTool("set-query-variable", {
            sessionId: sessionId1,
            variableName: "$limit",
            variableType: "Int!",
          });
          await callTool("set-query-variable", {
            sessionId: sessionId1,
            variableName: "$offset",
            variableType: "Int!",
          });

          // Set variable values
          await callTool("set-variable-value", {
            sessionId: sessionId1,
            variableName: "$limit",
            value: "20",
          });
          await callTool("set-variable-value", {
            sessionId: sessionId1,
            variableName: "$offset",
            value: "0",
          });

          // Select the field
          await callTool("select-field", {
            sessionId: sessionId1,
            fieldName: fieldName,
          });

          // Add common Pokemon fields
          const pokemonFields = ["id", "name", "types"];
          for (const pokemonField of pokemonFields) {
            try {
              await callTool("select-field", {
                sessionId: sessionId1,
                currentPath: fieldName,
                fieldName: pokemonField,
              });
            } catch {
              // Field might not exist, continue
            }
          }

          // Set pagination arguments if field supports them
          try {
            const args = fieldInfo?.args || fieldInfo?.data?.args || [];
            if (args.some((arg: any) => arg.name === "limit")) {
              await callTool("set-typed-argument", {
                sessionId: sessionId1,
                currentPath: fieldName,
                argumentName: "limit",
                value: "$limit",
              });
            }
            if (args.some((arg: any) => arg.name === "offset")) {
              await callTool("set-typed-argument", {
                sessionId: sessionId1,
                currentPath: fieldName,
                argumentName: "offset",
                value: "$offset",
              });
            }
          } catch {
            // Arguments might not be settable this way, try alternative
          }

          // Validate query
          const validation = await callTool("validate-query", {
            sessionId: sessionId1,
          });

          if (validation.valid || validation.data?.valid) {
            // Get the query string
            const queryResult = await callTool("get-current-query", {
              sessionId: sessionId1,
              prettyPrint: true,
            });

            const queryString =
              queryResult?.query ||
              queryResult?.data?.query ||
              queryResult?.data?.queryString;
            if (queryString) {
              suggestions.push({
                title: "Pokemon Browser",
                description: "Browse all Pokemon with pagination",
                category: "exploration",
                complexity: "beginner",
                graphqlQuery: queryString,
                variables: {
                  limit: { type: "Int!", default: 20 },
                  offset: { type: "Int!", default: 0 },
                },
                componentType: "paginated-list",
                tags: ["pokemon", "list", "browse"],
              });
            }
          }

          await callTool("end-query-session", { sessionId: sessionId1 });
        }
      } catch (error) {
        errors.push(
          `Paginated list test failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Test 2: Searchable list query
      try {
        const session2 = await callTool("start-query-session", {
          operationType: "query",
        });
        const sessionId2 =
          session2.sessionId ||
          session2.data?.sessionId ||
          session2.session?.sessionId;

        if (!sessionId2) {
          throw new Error("Could not get session ID from start-query-session");
        }

        const schema = await callTool("introspect-schema", {});
        const queryType = schema?.data?.__schema?.queryType;
        const fields = queryType?.fields || [];

        const pokemonArrayFields = fields.filter((field: any) => {
          const returnType = field.type?.ofType || field.type;
          return (
            field.name &&
            returnType?.kind === "LIST" &&
            (returnType?.ofType?.name === "Pokemon" ||
              returnType?.ofType?.ofType?.name === "Pokemon")
          );
        });

        if (pokemonArrayFields.length > 0) {
          const field = pokemonArrayFields[0];
          const fieldName = field.name;

          // Set search variable
          await callTool("set-query-variable", {
            sessionId: sessionId2,
            variableName: "$search",
            variableType: "String!",
          });
          await callTool("set-variable-value", {
            sessionId: sessionId2,
            variableName: "$search",
            value: '""',
          });

          // Set pagination variables too
          await callTool("set-query-variable", {
            sessionId: sessionId2,
            variableName: "$limit",
            variableType: "Int!",
          });
          await callTool("set-query-variable", {
            sessionId: sessionId2,
            variableName: "$offset",
            variableType: "Int!",
          });

          await callTool("set-variable-value", {
            sessionId: sessionId2,
            variableName: "$limit",
            value: "20",
          });
          await callTool("set-variable-value", {
            sessionId: sessionId2,
            variableName: "$offset",
            value: "0",
          });

          await callTool("select-field", {
            sessionId: sessionId2,
            fieldName: fieldName,
          });

          // Add Pokemon fields
          const pokemonFields = ["id", "name", "types"];
          for (const pokemonField of pokemonFields) {
            try {
              await callTool("select-field", {
                sessionId: sessionId2,
                currentPath: fieldName,
                fieldName: pokemonField,
              });
            } catch {
              // Field might not exist
            }
          }

          // Get field info to see search arguments
          const fieldInfo = await callTool("get-field-info", {
            typeName: "Query",
            fieldName: fieldName,
          });

          // Try to set search/filter arguments
          const args = fieldInfo?.args || fieldInfo?.data?.args || [];
          const searchArg = args.find(
            (arg: any) =>
              arg.name === "search" ||
              arg.name === "where" ||
              arg.name === "filter" ||
              arg.name === "name"
          );

          if (searchArg) {
            try {
              if (searchArg.name === "search" || searchArg.name === "name") {
                await callTool("set-string-argument", {
                  sessionId: sessionId2,
                  currentPath: fieldName,
                  argumentName: searchArg.name,
                  value: "$search",
                });
              } else if (
                searchArg.name === "where" ||
                searchArg.name === "filter"
              ) {
                // Try setting nested where filter
                await callTool("set-input-obj-arg", {
                  sessionId: sessionId2,
                  currentPath: fieldName,
                  argumentName: searchArg.name,
                  objectPath: "name.contains",
                  value: "$search",
                });
              }
            } catch {
              // Argument setting might fail
            }
          }

          // Set pagination arguments
          try {
            if (args.some((arg: any) => arg.name === "limit")) {
              await callTool("set-typed-argument", {
                sessionId: sessionId2,
                currentPath: fieldName,
                argumentName: "limit",
                value: "$limit",
              });
            }
            if (args.some((arg: any) => arg.name === "offset")) {
              await callTool("set-typed-argument", {
                sessionId: sessionId2,
                currentPath: fieldName,
                argumentName: "offset",
                value: "$offset",
              });
            }
          } catch {
            // Continue
          }

          const validation = await callTool("validate-query", {
            sessionId: sessionId2,
          });

          if (validation.valid || validation.data?.valid) {
            const queryResult = await callTool("get-current-query", {
              sessionId: sessionId2,
              prettyPrint: true,
            });

            const queryString =
              queryResult?.query ||
              queryResult?.data?.query ||
              queryResult?.data?.queryString;
            if (queryString) {
              suggestions.push({
                title: "Pokemon Finder",
                description: "Search for Pokemon by name with pagination",
                category: "exploration",
                complexity: "beginner",
                graphqlQuery: queryString,
                variables: {
                  search: { type: "String!", default: "" },
                  limit: { type: "Int!", default: 20 },
                  offset: { type: "Int!", default: 0 },
                },
                componentType: "searchable-list",
                tags: ["pokemon", "search", "finder"],
              });
            }
          }

          await callTool("end-query-session", { sessionId: sessionId2 });
        }
      } catch (error) {
        errors.push(
          `Searchable list test failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Test 3: Type-based filtering
      try {
        const session3 = await callTool("start-query-session", {
          operationType: "query",
        });
        const sessionId3 =
          session3.sessionId ||
          session3.data?.sessionId ||
          session3.session?.sessionId;

        if (!sessionId3) {
          throw new Error("Could not get session ID from start-query-session");
        }

        const schema = await callTool("introspect-schema", {});
        const queryType = schema?.data?.__schema?.queryType;
        const fields = queryType?.fields || [];

        const pokemonArrayFields = fields.filter((field: any) => {
          const returnType = field.type?.ofType || field.type;
          return (
            field.name &&
            returnType?.kind === "LIST" &&
            (returnType?.ofType?.name === "Pokemon" ||
              returnType?.ofType?.ofType?.name === "Pokemon")
          );
        });

        if (pokemonArrayFields.length > 0) {
          const field = pokemonArrayFields[0];
          const fieldName = field.name;

          // Set type filter variable
          await callTool("set-query-variable", {
            sessionId: sessionId3,
            variableName: "$type",
            variableType: "String!",
          });
          await callTool("set-variable-value", {
            sessionId: sessionId3,
            variableName: "$type",
            value: '"fire"',
          });

          await callTool("set-query-variable", {
            sessionId: sessionId3,
            variableName: "$limit",
            variableType: "Int!",
          });
          await callTool("set-variable-value", {
            sessionId: sessionId3,
            variableName: "$limit",
            value: "20",
          });

          await callTool("select-field", {
            sessionId: sessionId3,
            fieldName: fieldName,
          });

          // Add fields
          const pokemonFields = ["id", "name", "types"];
          for (const pokemonField of pokemonFields) {
            try {
              await callTool("select-field", {
                sessionId: sessionId3,
                currentPath: fieldName,
                fieldName: pokemonField,
              });
            } catch {
              // Continue
            }
          }

          // Get field info
          const fieldInfo = await callTool("get-field-info", {
            typeName: "Query",
            fieldName: fieldName,
          });

          // Try to set type filter
          const args = fieldInfo?.args || fieldInfo?.data?.args || [];
          const typeArg = args.find(
            (arg: any) =>
              arg.name === "type" ||
              arg.name === "types" ||
              (arg.name === "where" &&
                arg.type?.inputFields?.some((f: any) => f.name === "type"))
          );

          if (typeArg) {
            try {
              if (typeArg.name === "type" || typeArg.name === "types") {
                await callTool("set-string-argument", {
                  sessionId: sessionId3,
                  currentPath: fieldName,
                  argumentName: typeArg.name,
                  value: "$type",
                });
              } else if (typeArg.name === "where") {
                await callTool("set-input-obj-arg", {
                  sessionId: sessionId3,
                  currentPath: fieldName,
                  argumentName: "where",
                  objectPath: "types.contains",
                  value: "$type",
                });
              }
            } catch {
              // Continue
            }
          }

          // Set limit
          try {
            if (args.some((arg: any) => arg.name === "limit")) {
              await callTool("set-typed-argument", {
                sessionId: sessionId3,
                currentPath: fieldName,
                argumentName: "limit",
                value: "$limit",
              });
            }
          } catch {
            // Continue
          }

          const validation = await callTool("validate-query", {
            sessionId: sessionId3,
          });

          if (validation.valid || validation.data?.valid) {
            const queryResult = await callTool("get-current-query", {
              sessionId: sessionId3,
              prettyPrint: true,
            });

            const queryString =
              queryResult?.query ||
              queryResult?.data?.query ||
              queryResult?.data?.queryString;
            if (queryString) {
              suggestions.push({
                title: "Pokemon by Type",
                description: "Filter Pokemon by type",
                category: "exploration",
                complexity: "intermediate",
                graphqlQuery: queryString,
                variables: {
                  type: { type: "String!", default: "fire" },
                  limit: { type: "Int!", default: 20 },
                },
                componentType: "data-table",
                tags: ["pokemon", "type", "filter"],
              });
            }
          }

          await callTool("end-query-session", { sessionId: sessionId3 });
        }
      } catch (error) {
        errors.push(
          `Type filter test failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Clean up MCP client
      if (mcpClient) {
        try {
          await mcpClient.close();
        } catch (closeError) {
          console.error("Error closing MCP client:", closeError);
        }
      }

      // Return suggestions - no fallback, if exploration fails, it fails
      return NextResponse.json({
        suggestions,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (mcpError) {
      console.error("⚠️ MCP setup failed:", mcpError);

      // Clean up on error
      if (mcpClient) {
        try {
          await mcpClient.close();
        } catch (closeError) {
          console.error("Error closing MCP client:", closeError);
        }
      }

      // No fallback - if exploration fails, it fails
      return NextResponse.json(
        {
          suggestions: [],
          errors: [
            `Exploration failed: ${mcpError instanceof Error ? mcpError.message : String(mcpError)}`,
          ],
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in exploration:", error);

    return NextResponse.json(
      {
        suggestions: [],
        errors: [
          `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        ],
      },
      { status: 500 }
    );
  }
}
