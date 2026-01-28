import { NextResponse } from "next/server";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  ComponentAgentResponseSchema,
  GENERIC_COMPONENT_PROMPT,
} from "@/lib/generic-ui-schema";
import { respond } from "@/lib/ui-agent";
import { auth } from "@clerk/nextjs/server";

// Simple in-memory rate limiter for API endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // 20 requests per minute (lower than execute-graphql due to AI cost)
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

export async function POST(req: Request) {
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

    const {
      data,
      queryMetadata,
      provider = "openai",
      model = "gpt-4o",
    } = await req.json();

    if (process.env.NODE_ENV !== "production") {
      console.log("🎨 [visualize-data] Generative Component UI request");
    }

    if (!data) {
      return NextResponse.json({ error: "Data is required" }, { status: 400 });
    }

    // Prepare Prompt
    const prompt = `
Data to Visualize:
${JSON.stringify(data, null, 2)}

Query Metadata:
${JSON.stringify(queryMetadata || {}, null, 2)}

Instructions:
Create a Component-Based UI.
If the data is a List of objects, create a 'layout-split' with a 'data-list' on the left and 'data-detail' on the right.
If the data is tabular, use 'data-table'.
`;

    // Select Provider
    let selectedProvider;
    if (provider === "anthropic") {
      selectedProvider = anthropic;
    } else if (provider === "local") {
      const localClient = createOpenAI({
        baseURL: "http://127.0.0.1:1234/v1",
        apiKey: "not-needed",
      });
      selectedProvider = localClient;
    } else {
      selectedProvider = openai;
    }

    const result = await respond(prompt, {
      schema: ComponentAgentResponseSchema,
      systemPrompt: GENERIC_COMPONENT_PROMPT,
      llm: {
        provider: selectedProvider,
        model: model,
        temperature: 0.2, // Low temp for architectural stability
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("🎨 [visualize-data] Generated Component UI");
    }

    return NextResponse.json(
      {
        ...result,
        data: data, // Echo back data for the renderer
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Visualization error:", error);
    }
    return NextResponse.json(
      { error: "Failed to visualize data" },
      { status: 500 }
    );
  }
}
