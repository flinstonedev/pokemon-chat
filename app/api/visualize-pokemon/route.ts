import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import {
  PokemonAgentResponseSchema,
  POKEMON_SYSTEM_PROMPT,
} from "@/lib/pokemon-ui-schema";
import { respond } from "@/lib/ui-agent";

export async function POST(req: Request) {
  try {
    const { data, context } = await req.json();

    if (!data) {
      return NextResponse.json(
        { error: "Pokemon data is required" },
        { status: 400 }
      );
    }

    // Create a prompt for the UI agent to visualize the Pokemon data
    const prompt = `
Visualize this Pokemon data using the appropriate components:

${JSON.stringify(data, null, 2)}

${context ? `Context: ${context}` : ""}

Choose the best Pokemon components to display this data:
- Use pokemon-card for Pokemon overview
- Use pokemon-stats-panel for stats
- Use pokemon-type badges for types
- Use pokemon-evolution for evolution chains
- Use pokemon-moves for move lists

Make it visually appealing and informative.
`.trim();

    const result = await respond(prompt, {
      schema: PokemonAgentResponseSchema,
      systemPrompt: POKEMON_SYSTEM_PROMPT,
      llm: {
        provider: openai,
        model: "gpt-4o-mini",
        temperature: 0.7,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Pokemon visualization error:", error);
    return NextResponse.json(
      { error: "Failed to visualize Pokemon data" },
      { status: 500 }
    );
  }
}
