import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import {
  PokemonAgentResponseSchema,
  POKEMON_SYSTEM_PROMPT,
} from "@/lib/pokemon-ui-schema";
import { respond } from "@/lib/ui-agent";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    const result = await respond(prompt, {
      schema: PokemonAgentResponseSchema,
      systemPrompt: POKEMON_SYSTEM_PROMPT,
      llm: {
        provider: openai,
        model: "gpt-4o-mini",
        temperature: 1,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("UI Agent error:", error);
    return NextResponse.json(
      { error: "Failed to generate UI" },
      { status: 500 }
    );
  }
}
