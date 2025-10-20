import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  PokemonAgentResponseSchema,
  POKEMON_SYSTEM_PROMPT,
} from "@/lib/pokemon-ui-schema";
import { respond } from "@/lib/ui-agent";

export async function POST(req: Request) {
  try {
    const {
      data,
      // context is optional metadata from caller (currently unused)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context,
      queryMetadata,
      provider = "openai",
      model = "gpt-4o-mini",
    } = await req.json();

    // Debug logging
    console.log("🎨 [visualize-pokemon] ===== REQUEST START =====");
    console.log("🎨 [visualize-pokemon] Received:", {
      hasData: !!data,
      hasQueryMetadata: !!queryMetadata,
      dataKeys: data ? Object.keys(data) : [],
    });
    console.log("🎨 [visualize-pokemon] Query Metadata:",
      queryMetadata ? JSON.stringify(queryMetadata, null, 2) : "NONE"
    );

    if (!data) {
      return NextResponse.json(
        { error: "Pokemon data is required" },
        { status: 400 }
      );
    }

    // Check if query supports pagination
    const hasPaginationSupport =
      !!queryMetadata &&
      typeof queryMetadata.query === "string" &&
      queryMetadata.query.includes("$limit") &&
      queryMetadata.query.includes("$offset");

    // Check if query supports search
    const hasSearchSupport =
      !!queryMetadata &&
      typeof queryMetadata.query === "string" &&
      (queryMetadata.query.includes("$search") ||
        queryMetadata.query.includes("_ilike") ||
        queryMetadata.query.includes("_like"));

    // If we have query metadata with pagination/search, directly construct the interactive component
    // This is faster and more reliable than asking the LLM
    if (hasPaginationSupport || hasSearchSupport) {
      console.log("🎨 [visualize-pokemon] ✅ INTERACTIVE COMPONENT DETECTED!");
      console.log("🎨 [visualize-pokemon] Detection details:", {
        hasPaginationSupport,
        hasSearchSupport,
        queryContainsLimit: queryMetadata?.query?.includes("$limit"),
        queryContainsOffset: queryMetadata?.query?.includes("$offset"),
        queryContainsSearch: queryMetadata?.query?.includes("$search"),
      });

      const pageSize =
        (queryMetadata?.variables &&
          typeof queryMetadata.variables === "object" &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (queryMetadata.variables as any).limit) ||
        20;

      let componentType: "paginated-list" | "searchable-list" = "paginated-list";
      let componentProps: Record<string, unknown> = {
        pageSize,
        renderItem: "pokemon-card",
      };

      // Prefer searchable-list if search is supported
      if (hasSearchSupport) {
        componentType = "searchable-list";
        componentProps = {
          placeholder: "Search Pokemon...",
          renderItem: "pokemon-card",
          searchField: "name",
        };
      }

      const interactiveComponent = {
        type: componentType,
        componentId: `${componentType}-main`,
        component: componentType,
        props: componentProps,
        actions: {
          fetchData: {
            type: "graphql-query",
            actionId: "fetchData",
            query: queryMetadata!.query,
            variables: {},
          },
        },
      };

      const result = {
        title: hasSearchSupport ? "Pokemon Search" : "Pokemon List",
        description: hasSearchSupport
          ? "Search and browse Pokemon"
          : "Browse all Pokemon with pagination",
        ui: [interactiveComponent],
      };

      console.log("🎨 [visualize-pokemon] ✅ Generated interactive component!");
      console.log("🎨 [visualize-pokemon] Component details:", {
        componentType,
        componentId: interactiveComponent.componentId,
        hasActions: !!interactiveComponent.actions,
        actionQuery: interactiveComponent.actions?.fetchData?.query?.substring(0, 100),
      });
      console.log("🎨 [visualize-pokemon] ===== REQUEST END (INTERACTIVE) =====");

      return NextResponse.json(result);
    }

    // Otherwise, use LLM to generate static visualization
    console.log("🎨 [visualize-pokemon] ⚠️ NO INTERACTIVE SUPPORT - Using LLM for static visualization");
    console.log("🎨 [visualize-pokemon] Reason: No $limit/$offset or $search variables detected");

    const prompt = `
Visualize this Pokemon data using static components:

${JSON.stringify(data, null, 2)}

Use appropriate Pokemon components like pokemon-card, pokemon-stats-panel, containers, etc.
Choose the best component type based on the data structure.
`.trim();

    const selectedProvider = provider === "anthropic" ? anthropic : openai;

    const result = await respond(prompt, {
      schema: PokemonAgentResponseSchema,
      systemPrompt: POKEMON_SYSTEM_PROMPT,
      llm: {
        provider: selectedProvider,
        model: model,
        temperature: 0.7,
      },
    });

    // Debug logging for generated UI
    console.log("🎨 [visualize-pokemon] Generated static UI:", {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uiComponentTypes: (result.ui as any[]).map((el: any) => el.type),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      firstComponent: (result.ui as any[])[0],
    });
    console.log("🎨 [visualize-pokemon] ===== REQUEST END (STATIC) =====");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Pokemon visualization error:", error);
    return NextResponse.json(
      { error: "Failed to visualize Pokemon data" },
      { status: 500 }
    );
  }
}
