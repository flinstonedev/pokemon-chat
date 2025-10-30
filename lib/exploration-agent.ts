/**
 * MCP Query Exploration Agent
 *
 * This agent actively discovers what's possible with the Pokemon GraphQL API
 * by using MCP QuerySculptor tools to build, validate, and test actual queries.
 *
 * NOTE: This is a simplified version that returns pre-configured suggestions.
 * Future enhancement: Integrate actual MCP discovery.
 */

import {
  UIComponentSuggestion,
  ExploreQueriesRequest,
  ExploreQueriesResult,
} from "./exploration-types";

/**
 * Main exploration function that discovers UI component suggestions
 */
export async function exploreQueries(
  request: ExploreQueriesRequest = {}
): Promise<ExploreQueriesResult> {
  const startTime = Date.now();

  try {
    console.log("[ExplorationAgent] Generating query suggestions...");

    // Generate all suggestions
    const allSuggestions: UIComponentSuggestion[] = [
      ...discoverPaginatedQueries(),
      ...discoverSearchableQueries(),
      ...discoverComparisonQueries(),
    ];

    // Filter by request criteria
    let filteredSuggestions = allSuggestions;

    if (request.categories && request.categories.length > 0) {
      filteredSuggestions = filteredSuggestions.filter((s) =>
        request.categories!.includes(s.category)
      );
    }

    if (request.complexity && request.complexity.length > 0) {
      filteredSuggestions = filteredSuggestions.filter((s) =>
        request.complexity!.includes(s.complexity)
      );
    }

    if (request.maxSuggestions) {
      filteredSuggestions = filteredSuggestions.slice(0, request.maxSuggestions);
    }

    const discoveryTime = (Date.now() - startTime) / 1000;

    console.log(
      `[ExplorationAgent] Discovery complete: ${allSuggestions.length} total, ${filteredSuggestions.length} returned in ${discoveryTime}s`
    );

    return {
      success: true,
      suggestions: filteredSuggestions,
      metadata: {
        totalDiscovered: allSuggestions.length,
        totalReturned: filteredSuggestions.length,
        discoveryTime,
      },
    };
  } catch (error) {
    console.error("[ExplorationAgent] Error during exploration:", error);
    return {
      success: false,
      error: "Failed to explore queries",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Discover paginated list queries
 */
function discoverPaginatedQueries(): UIComponentSuggestion[] {
  const queryConfigs = [
    {
      fieldName: "pokemon_v2_pokemon",
      title: "Pokemon Browser",
      description: "Browse all 1000+ Pokemon with pagination. View names, types, and sprites.",
      tags: ["pokemon", "list", "browse", "beginner"],
      defaultLimit: 20,
      estimatedResults: 1000,
    },
    {
      fieldName: "pokemon_v2_move",
      title: "Move Library",
      description: "Explore all Pokemon moves with details on power, accuracy, and effects.",
      tags: ["moves", "list", "browse", "beginner"],
      defaultLimit: 20,
      estimatedResults: 900,
    },
    {
      fieldName: "pokemon_v2_type",
      title: "Type Explorer",
      description: "Discover all 18 Pokemon types with their strengths and weaknesses.",
      tags: ["types", "list", "browse", "beginner"],
      defaultLimit: 18,
      estimatedResults: 18,
    },
    {
      fieldName: "pokemon_v2_ability",
      title: "Ability Catalog",
      description: "Browse all Pokemon abilities and their effects.",
      tags: ["abilities", "list", "browse", "beginner"],
      defaultLimit: 20,
      estimatedResults: 300,
    },
  ];

  const suggestions: UIComponentSuggestion[] = [];

  for (const config of queryConfigs) {
    const query = buildPaginatedQuery(config.fieldName);
    suggestions.push({
      title: config.title,
      description: config.description,
      category: "exploration",
      complexity: "beginner",
      graphqlQuery: query,
      variables: {
        limit: {
          type: "Int!",
          default: config.defaultLimit,
          description: "Number of items to fetch per page",
        },
        offset: {
          type: "Int!",
          default: 0,
          description: "Starting position for pagination",
        },
      },
      componentType: "paginated-list",
      tags: config.tags,
      estimatedResults: config.estimatedResults,
      exampleVariables: {
        limit: config.defaultLimit,
        offset: 0,
      },
    });
  }

  return suggestions;
}

/**
 * Discover searchable list queries
 */
function discoverSearchableQueries(): UIComponentSuggestion[] {
  const queryConfigs = [
    {
      fieldName: "pokemon_v2_pokemon",
      title: "Pokemon Search",
      description: "Search for Pokemon by name with instant results. Find your favorite quickly!",
      tags: ["pokemon", "search", "filter", "intermediate"],
      category: "search" as const,
    },
    {
      fieldName: "pokemon_v2_move",
      title: "Move Search",
      description: "Search for moves by name. Filter through hundreds of attacks and effects.",
      tags: ["moves", "search", "filter", "intermediate"],
      category: "search" as const,
    },
    {
      fieldName: "pokemon_v2_ability",
      title: "Ability Search",
      description: "Find abilities by name. Search through all Pokemon abilities instantly.",
      tags: ["abilities", "search", "filter", "intermediate"],
      category: "search" as const,
    },
  ];

  const suggestions: UIComponentSuggestion[] = [];

  for (const config of queryConfigs) {
    const query = buildSearchableQuery(config.fieldName);
    suggestions.push({
      title: config.title,
      description: config.description,
      category: config.category,
      complexity: "intermediate",
      graphqlQuery: query,
      variables: {
        search: {
          type: "String!",
          default: "%",
          description: "Search pattern (use % as wildcard)",
        },
        limit: {
          type: "Int!",
          default: 50,
          description: "Maximum number of results",
        },
      },
      componentType: "searchable-list",
      tags: config.tags,
      exampleVariables: {
        search: "%pika%",
        limit: 50,
      },
    });
  }

  return suggestions;
}

/**
 * Discover comparison queries
 */
function discoverComparisonQueries(): UIComponentSuggestion[] {
  const suggestions: UIComponentSuggestion[] = [];

  // Pokemon stat comparison
  suggestions.push({
    title: "Pokemon Stat Comparison",
    description:
      "Compare base stats of multiple Pokemon side-by-side. Perfect for team building!",
    category: "comparison",
    complexity: "intermediate",
    graphqlQuery: buildComparisonQuery(),
    variables: {
      ids: {
        type: "[Int!]!",
        default: [1, 4, 7],
        description: "Pokemon IDs to compare",
      },
    },
    componentType: "data-table",
    tags: ["pokemon", "stats", "comparison", "table", "intermediate"],
    exampleVariables: {
      ids: [1, 4, 7], // Bulbasaur, Charmander, Squirtle
    },
    performanceNotes: "Best with 2-10 Pokemon for optimal viewing",
  });

  // Type effectiveness comparison
  suggestions.push({
    title: "Type Effectiveness Chart",
    description:
      "View type matchup data. See which types are strong or weak against others.",
    category: "reference",
    complexity: "intermediate",
    graphqlQuery: buildTypeEffectivenessQuery(),
    variables: {
      typeNames: {
        type: "[String!]!",
        default: ["fire", "water", "grass"],
        description: "Type names to analyze",
      },
    },
    componentType: "data-table",
    tags: ["types", "effectiveness", "reference", "table", "intermediate"],
    exampleVariables: {
      typeNames: ["fire", "water", "grass"],
    },
  });

  return suggestions;
}

/**
 * Build a paginated query for a given field
 */
function buildPaginatedQuery(fieldName: string): string {
  const fieldMap: Record<string, string[]> = {
    pokemon_v2_pokemon: [
      "id",
      "name",
      "height",
      "weight",
      "pokemon_v2_pokemontypes { pokemon_v2_type { name } }",
    ],
    pokemon_v2_move: ["id", "name", "power", "accuracy", "pp"],
    pokemon_v2_type: ["id", "name"],
    pokemon_v2_ability: ["id", "name"],
  };

  const fields = fieldMap[fieldName] || ["id", "name"];

  return `query Paginated${toPascalCase(fieldName)}($limit: Int!, $offset: Int!) {
  ${fieldName}(limit: $limit, offset: $offset) {
    ${fields.join("\n    ")}
  }
}`;
}

/**
 * Build a searchable query for a given field
 */
function buildSearchableQuery(fieldName: string): string {
  const fieldMap: Record<string, string[]> = {
    pokemon_v2_pokemon: [
      "id",
      "name",
      "height",
      "weight",
      "pokemon_v2_pokemontypes { pokemon_v2_type { name } }",
    ],
    pokemon_v2_move: ["id", "name", "power", "accuracy", "type_id"],
    pokemon_v2_ability: ["id", "name"],
  };

  const fields = fieldMap[fieldName] || ["id", "name"];

  return `query Search${toPascalCase(fieldName)}($search: String!, $limit: Int!) {
  ${fieldName}(where: { name: { _ilike: $search } }, limit: $limit) {
    ${fields.join("\n    ")}
  }
}`;
}

/**
 * Build a comparison query for Pokemon stats
 */
function buildComparisonQuery(): string {
  return `query ComparePokemon($ids: [Int!]!) {
  pokemon_v2_pokemon(where: { id: { _in: $ids } }) {
    id
    name
    height
    weight
    pokemon_v2_pokemonstats {
      base_stat
      pokemon_v2_stat {
        name
      }
    }
    pokemon_v2_pokemontypes {
      pokemon_v2_type {
        name
      }
    }
  }
}`;
}

/**
 * Build a type effectiveness query
 */
function buildTypeEffectivenessQuery(): string {
  return `query TypeEffectiveness($typeNames: [String!]!) {
  pokemon_v2_type(where: { name: { _in: $typeNames } }) {
    id
    name
    pokemonV2TypeefficaciesByTargetTypeId {
      damage_factor
      pokemon_v2_type {
        name
      }
    }
  }
}`;
}

/**
 * Convert snake_case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}
