import { z } from "zod";

/**
 * Pokemon-specific UI schema for dynamic-ui-agent
 * This schema defines the structure for Pokemon-related UI components
 */

// Pokemon stat display
const PokemonStat = z.object({
  type: z.literal("pokemon-stat"),
  id: z.string().optional(),
  props: z.object({
    name: z.string(),
    value: z.number(),
    maxValue: z.number().default(255),
    color: z.string().optional(),
  }),
});

// Pokemon type badge
const PokemonType = z.object({
  type: z.literal("pokemon-type"),
  id: z.string().optional(),
  props: z.object({
    typeName: z.string(),
  }),
});

// Pokemon card display
const PokemonCard = z.object({
  type: z.literal("pokemon-card"),
  id: z.string().optional(),
  props: z.object({
    name: z.string(),
    number: z.number().optional(),
    imageUrl: z.string().optional(),
    types: z.array(z.string()).default([]),
    description: z.string().optional(),
  }),
});

// Pokemon stats panel
const PokemonStatsPanel = z.object({
  type: z.literal("pokemon-stats-panel"),
  id: z.string().optional(),
  props: z.object({
    pokemonName: z.string(),
    stats: z.array(
      z.object({
        name: z.string(),
        value: z.number(),
      })
    ),
  }),
});

// Pokemon evolution chain
const PokemonEvolution = z.object({
  type: z.literal("pokemon-evolution"),
  id: z.string().optional(),
  props: z.object({
    evolutionChain: z.array(
      z.object({
        name: z.string(),
        level: z.number().optional(),
        method: z.string().optional(),
      })
    ),
  }),
});

// Pokemon move list
const PokemonMoveList = z.object({
  type: z.literal("pokemon-moves"),
  id: z.string().optional(),
  props: z.object({
    moves: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        power: z.number().optional(),
        accuracy: z.number().optional(),
        description: z.string().optional(),
      })
    ),
  }),
});

// Generic UI elements (from the built-in schema)
const UIText = z.object({
  type: z.literal("text"),
  id: z.string().optional(),
  props: z.object({
    text: z.string(),
    variant: z.enum(["body", "muted", "caption"]).default("body"),
  }),
});

const UIHeading = z.object({
  type: z.literal("heading"),
  id: z.string().optional(),
  props: z.object({
    text: z.string(),
    level: z.number().int().min(1).max(4).default(2),
  }),
});

const UIButton = z.object({
  type: z.literal("button"),
  id: z.string().optional(),
  props: z.object({
    label: z.string(),
    variant: z.enum(["primary", "secondary", "danger"]).default("primary"),
    actionId: z.string().optional(),
  }),
});

const UIList = z.object({
  type: z.literal("list"),
  id: z.string().optional(),
  props: z.object({
    items: z.array(z.string()),
  }),
});

const UITable = z.object({
  type: z.literal("table"),
  id: z.string().optional(),
  props: z.object({
    columns: z.array(
      z.object({
        key: z.string(),
        header: z.string(),
      })
    ),
    rows: z.array(z.record(z.any())).default([]),
  }),
});

const UICode = z.object({
  type: z.literal("code"),
  id: z.string().optional(),
  props: z.object({
    language: z.string().default("txt"),
    code: z.string(),
  }),
});

// Recursive container type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PokemonUIElementSchema: any = z.discriminatedUnion("type", [
  UIText,
  UIHeading,
  UIButton,
  UIList,
  UITable,
  UICode,
  PokemonCard,
  PokemonStat,
  PokemonType,
  PokemonStatsPanel,
  PokemonEvolution,
  PokemonMoveList,
  z.object({
    type: z.literal("container"),
    id: z.string().optional(),
    props: z.object({
      direction: z.enum(["row", "column"]).default("column"),
      gap: z.number().min(0).max(48).default(12),
      align: z.enum(["start", "center", "end", "stretch"]).default("start"),
      justify: z.enum(["start", "center", "end", "between"]).default("start"),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: z.array(z.lazy((): any => PokemonUIElementSchema)).default([]),
  }),
]);

export type PokemonUIElement = z.infer<typeof PokemonUIElementSchema>;

// Tolerant UI array schema
const PokemonUIArraySchema = z.preprocess((val: unknown) => {
  if (Array.isArray(val)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return val.filter((item: any) => {
      if (typeof item !== "object" || item === null) return false;
      return typeof item.type === "string";
    });
  }
  return [];
}, z.array(PokemonUIElementSchema).default([]));

// UI Action schema
export const UIActionSchema = z.object({
  id: z.string(),
  type: z.enum(["submit", "navigate", "open_url", "emit_event", "call"]),
  label: z.string().optional(),
  params: z.record(z.any()).optional(),
});

export type UIAction = z.infer<typeof UIActionSchema>;

// Main Pokemon Agent Response schema
export const PokemonAgentResponseSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ui: PokemonUIArraySchema,
  actions: z.array(UIActionSchema).default([]),
  suggestions: z.array(z.string()).default([]),
  followUpQuestion: z.string().optional(),
});

export type PokemonAgentResponse = z.infer<typeof PokemonAgentResponseSchema>;

// Custom system prompt for Pokemon UI generation
export const POKEMON_SYSTEM_PROMPT = `You are a Pokemon UI specialist. Generate structured UI components for displaying Pokemon information.

Available Pokemon-specific components:
- pokemon-card: Display a Pokemon with name, image, types, and description
- pokemon-stat: Display a single Pokemon stat (HP, Attack, Defense, etc.) with a progress bar
- pokemon-stats-panel: Display all stats for a Pokemon
- pokemon-type: Display a Pokemon type badge
- pokemon-evolution: Display evolution chain
- pokemon-moves: Display a list of Pokemon moves

Also available generic components:
- text, heading, button, list, table, code, container

When displaying Pokemon data:
1. Use pokemon-card for Pokemon overview
2. Use pokemon-stats-panel for detailed stats
3. Use pokemon-type badges for type information
4. Use pokemon-evolution for evolution chains
5. Use pokemon-moves for move lists
6. Use containers to organize complex layouts

Always provide relevant suggestions for next steps and follow-up questions.
Return ONLY valid JSON matching the schema.`;
