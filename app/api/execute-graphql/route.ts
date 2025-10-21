import { NextResponse } from "next/server";

/**
 * API endpoint for executing GraphQL queries from interactive components
 * This is separate from the chat API to keep concerns separated
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, variables, endpoint } = body;

    if (!query) {
      return NextResponse.json(
        { error: "GraphQL query is required" },
        { status: 400 }
      );
    }

    // Use provided endpoint or fall back to configured GRAPHQL_API_ENDPOINT
    const graphqlEndpoint = endpoint || process.env.GRAPHQL_API_ENDPOINT;

    if (!graphqlEndpoint) {
      return NextResponse.json(
        { error: "GraphQL endpoint not configured. Set GRAPHQL_API_ENDPOINT environment variable." },
        { status: 500 }
      );
    }

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add bearer token if available (for the configured endpoint)
    if (graphqlEndpoint === process.env.GRAPHQL_API_ENDPOINT && process.env.GRAPHQL_API_BEARER_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GRAPHQL_API_BEARER_TOKEN}`;
    }

    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[execute-graphql] GraphQL API error:", errorText);
      return NextResponse.json(
        { error: "GraphQL query failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      console.error("[execute-graphql] GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: "GraphQL query returned errors", errors: data.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("[execute-graphql] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
