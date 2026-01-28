import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  validateGraphQLQuery,
  validateGraphQLVariables,
} from "@/lib/graphql-validator";

// Simple in-memory rate limiter for API endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30; // 30 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

/**
 * API endpoint for executing GraphQL queries from interactive components
 * This is separate from the chat API to keep concerns separated
 */
export async function POST(request: Request) {
  try {
    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60",
          },
        }
      );
    }

    const body = await request.json();
    // Note: Custom endpoint parameter removed for security (SSRF prevention)
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json(
        { error: "GraphQL query is required" },
        { status: 400 }
      );
    }

    // Validate the GraphQL query
    const queryValidation = validateGraphQLQuery(query);
    if (!queryValidation.valid) {
      return NextResponse.json(
        { error: `Invalid query: ${queryValidation.error}` },
        { status: 400 }
      );
    }

    // Validate variables if provided
    if (variables) {
      const variablesValidation = validateGraphQLVariables(variables);
      if (!variablesValidation.valid) {
        return NextResponse.json(
          { error: `Invalid variables: ${variablesValidation.error}` },
          { status: 400 }
        );
      }
    }

    // Only use the configured endpoint (no user-provided endpoints for SSRF prevention)
    const graphqlEndpoint = process.env.GRAPHQL_API_ENDPOINT;

    if (!graphqlEndpoint) {
      return NextResponse.json(
        {
          error:
            "GraphQL endpoint not configured. Set GRAPHQL_API_ENDPOINT environment variable.",
        },
        { status: 500 }
      );
    }

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add bearer token if available
    if (process.env.GRAPHQL_API_BEARER_TOKEN) {
      headers["Authorization"] =
        `Bearer ${process.env.GRAPHQL_API_BEARER_TOKEN}`;
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
      // Log error server-side only, don't expose details to client
      if (process.env.NODE_ENV !== "production") {
        console.error("[execute-graphql] GraphQL API error:", errorText);
      }
      return NextResponse.json(
        { error: "GraphQL query failed" },
        {
          status: response.status,
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[execute-graphql] GraphQL errors:", data.errors);
      }
      return NextResponse.json(
        { error: "GraphQL query returned errors" },
        {
          status: 400,
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data.data,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[execute-graphql] Error:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
