import { z } from "zod";
import { ActionSchema } from "./ui-action-schema";

/**
 * Pokemon-specific UI schema
 * This schema defines the structure for Pokemon-related UI components
 * Includes both static and interactive components with data-fetching capabilities
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

// Interactive components with data-fetching capabilities
const PaginatedList = z.object({
  type: z.literal("paginated-list"),
  componentId: z.string().min(1),
  component: z.literal("paginated-list"),
  props: z.object({
    pageSize: z.number().int().positive().max(100).default(20),
    renderItem: z.enum(["pokemon-card", "generic"]).default("generic"),
    itemProps: z.record(z.any()).optional(),
  }),
  actions: z.record(ActionSchema).optional(),
});

const SearchableList = z.object({
  type: z.literal("searchable-list"),
  componentId: z.string().min(1),
  component: z.literal("searchable-list"),
  props: z.object({
    placeholder: z.string().default("Search..."),
    renderItem: z.enum(["pokemon-card", "generic"]).default("generic"),
    searchField: z.string().default("name"),
    searchVariable: z.string().default("search"), // GraphQL variable name to use for search
  }),
  actions: z.record(ActionSchema).optional(),
});

const DataTable = z.object({
  type: z.literal("data-table"),
  componentId: z.string().min(1),
  component: z.literal("data-table"),
  props: z.object({
    columns: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        sortable: z.boolean().default(false),
      })
    ),
    paginated: z.boolean().default(false),
  }),
  actions: z.record(ActionSchema).optional(),
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
  PaginatedList,
  SearchableList,
  DataTable,
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

Interactive components (can fetch and display data):
- paginated-list: Display a paginated list of items with next/previous buttons
- searchable-list: Display a searchable list with a search input
- data-table: Display data in a sortable table

**CRITICAL: When creating interactive components, you MUST reuse the exact GraphQL query from the data context.**
The conversational agent has already built and tested a working query using MCP tools.
DO NOT modify, recreate, or write new queries - use the query exactly as provided in the query metadata.

If query metadata is provided, extract:
- The exact query string (with all fields)
- The exact variables
- Use these verbatim in the action's query and variables fields

Also available generic components:
- text, heading, button, list, table, code, container

**INTERACTIVE COMPONENT SELECTION (CRITICAL):**

**Rule: Detect component type from query variables**

1. **paginated-list** - Use when query metadata contains:
   - $limit variable (indicates pagination support)
   - $offset variable (indicates offset-based pagination)
   - **REQUIRED**: You MUST use paginated-list, not static containers
   - The query is already built to support pagination

2. **searchable-list** - Use when query metadata contains:
   - $search variable (indicates search functionality)
   - $filter variable (indicates filtering capability)

3. **data-table** - Use when:
   - Data has multiple columns with different data types
   - Sorting or tabular display is beneficial

**Implementation rules:**
- Always check query metadata FIRST before choosing components
- componentId must be unique (e.g., "list-main-1")
- **CRITICAL**: Use the exact query from metadata - do NOT modify it
- Match props.pageSize to the $limit value if present

**Data Display Rules:**

**STEP 1: Analyze query metadata**
- If $limit + $offset present → Use paginated-list
- If $search/$filter present → Use searchable-list  
- Otherwise → Use static components

**STEP 2: Choose static components based on data type**
1. pokemon-card: For individual entity overview
2. pokemon-stats-panel: For detailed statistics
3. pokemon-type: For type/category badges
4. pokemon-evolution: For relationship chains
5. pokemon-moves: For lists of moves/actions
6. container: For grouping static components only

**CRITICAL**: Query metadata determines component type, NOT data shape

**Example: Detecting pagination from query:**

Given query metadata with variables $limit and $offset:
- Query: "query GetData($limit: Int!, $offset: Int!) { items(limit: $limit, offset: $offset) { id name } }"
- Variables: { limit: 20, offset: 0 }

Detection logic:
1. Query contains $limit → YES
2. Query contains $offset → YES  
3. Result → MUST use paginated-list

Generated UI structure:
{
  "ui": [{
    "type": "paginated-list",
    "componentId": "data-list-main",
    "component": "paginated-list",
    "props": { "pageSize": 20, "renderItem": "pokemon-card" },
    "actions": {
      "fetchData": {
        "type": "graphql-query",
        "actionId": "fetchData",
        "query": "<USE EXACT QUERY FROM METADATA>",
        "variables": {}
      }
    }
  }]
}

**Static components layout** (when NO $limit/$offset in query):
- Small groups (2-5 items): container with direction="row" and gap=16
- Single item: display card directly

Always provide relevant suggestions for next steps and follow-up questions.
Return ONLY valid JSON matching the schema.`;
