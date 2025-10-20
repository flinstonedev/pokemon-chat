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

    // Use provided endpoint or default to Pokemon API
    const graphqlEndpoint = endpoint || "https://beta.pokeapi.co/graphql/v1beta";

    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
