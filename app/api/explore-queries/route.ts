/**
 * API Endpoint: /api/explore-queries
 *
 * This endpoint runs the MCP Query Exploration Agent to discover
 * working GraphQL queries and return UI component suggestions.
 */

import { NextRequest, NextResponse } from "next/server";
import { exploreQueries } from "@/lib/exploration-agent";
import { ExploreQueriesRequest } from "@/lib/exploration-types";

export const runtime = "nodejs";
export const maxDuration = 30; // 30 second timeout for discovery

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExploreQueriesRequest;

    console.log("[ExploreQueriesAPI] Starting query exploration with request:", body);

    const result = await exploreQueries(body);

    if (!result.success) {
      console.error("[ExploreQueriesAPI] Exploration failed:", result.error);
      return NextResponse.json(result, { status: 500 });
    }

    console.log(
      `[ExploreQueriesAPI] Exploration successful: ${result.suggestions.length} suggestions`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ExploreQueriesAPI] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple exploration
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const maxSuggestions = searchParams.get("max")
      ? parseInt(searchParams.get("max")!, 10)
      : undefined;

    const request: ExploreQueriesRequest = {
      maxSuggestions,
    };

    console.log("[ExploreQueriesAPI] Starting query exploration (GET)");

    const result = await exploreQueries(request);

    if (!result.success) {
      console.error("[ExploreQueriesAPI] Exploration failed:", result.error);
      return NextResponse.json(result, { status: 500 });
    }

    console.log(
      `[ExploreQueriesAPI] Exploration successful: ${result.suggestions.length} suggestions`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ExploreQueriesAPI] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
