# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Pokemon chat application built with Next.js, featuring an AI assistant that uses the MCP (Model Context Protocol) to interact with the Pokemon GraphQL API. The app demonstrates dynamic UI generation and interactive components powered by LLMs.

**Key Technologies:**
- Next.js 15 with React 19
- Convex for backend (database, real-time data)
- Clerk for authentication
- AI SDK 5.0 (Vercel) with MCP integration
- TailwindCSS 4.0 for styling
- TypeScript with strict mode

## Development Commands

### Running the Application
```bash
npm run dev              # Start both frontend (Next.js) and backend (Convex) in parallel
npm run dev:frontend     # Start Next.js dev server only
npm run dev:backend      # Start Convex dev server only
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler without emitting files
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting without modifying
npm run validate         # Run type-check, lint, and format:check
```

### Building
```bash
npm run build            # Build Next.js for production
npm start                # Start production server
```

## Architecture

### High-Level Structure

The application follows a three-layer architecture:

1. **Frontend Layer** (`app/`, `components/`)
   - Next.js 15 with App Router
   - Client components for interactive UI
   - Server components for authentication gates

2. **API Layer** (`app/api/`)
   - `/api/chat` - Main chat endpoint with MCP integration
   - `/api/visualize-pokemon` - UI generation endpoint
   - `/api/execute-graphql` - GraphQL query execution

3. **Backend Layer** (Convex - `convex/`)
   - Message persistence
   - Thread management
   - User data storage

### MCP Integration

The app connects to a QuerySculptor MCP server to build and execute GraphQL queries:

- **MCP Server URL**: `https://agent-query-builder-toolbox.vercel.app/mcp` (configurable via `MCP_URL` env var)
- **Tools Available**: Introspection, query building, field selection, argument setting, query validation/execution
- **Integration Point**: `app/api/chat/route.ts` creates MCP client per request with session management

### Dynamic UI System

The application features a sophisticated UI generation system:

**Core Components:**

1. **UI Agent** (`lib/ui-agent.ts`)
   - Uses AI SDK's `generateObject` to create structured UI from prompts
   - Supports both OpenAI and Anthropic providers
   - Generates Zod-validated component schemas

2. **Pokemon UI Schema** (`lib/pokemon-ui-schema.ts`)
   - Defines Pokemon-specific components (cards, stats, types, evolution chains)
   - Defines interactive components (paginated-list, searchable-list, data-table)
   - Uses discriminated unions for type safety
   - Includes action schemas for data fetching

3. **Interactive Components** (`components/InteractiveComponents.tsx`)
   - `PaginatedList`: Offset-based pagination with GraphQL queries
   - `SearchableList`: Debounced search with GraphQL filtering
   - `DataTable`: Client-side sortable tables
   - All components use `UIComponentProvider` for state management

   **Supported Data Structures:**
   All interactive components support multiple GraphQL API response formats:
   - `pokemons.results` + `pokemons.count` (plural form)
   - `pokemon.results` + `pokemon.count` (singular form)
   - `pokemon_v2_pokemon` (PokeAPI beta structure)
   - `items` (generic)
   - Direct arrays

   This flexibility allows the same components to work with different GraphQL endpoints without modification.

4. **Action Executor** (`lib/ui-action-executor.ts`)
   - Executes GraphQL queries from UI actions
   - Rate limiting: 10 requests/minute per component
   - Query validation via `lib/graphql-validator.ts`

5. **GraphQL Validator** (`lib/graphql-validator.ts`)
   - Validates query syntax and complexity
   - Blocks introspection and dangerous patterns
   - Enforces depth limits (max 10), size limits (max 10KB)
   - Whitelists allowed endpoints

**Data Flow:**

```
User Input → Chat API (MCP Tools) → LLM builds query → execute-query tool
  → presentPokemonData tool → /api/visualize-pokemon → UI Agent
  → Interactive UI Schema → InteractiveUIRenderer → React Components
```

### State Management

1. **Settings** (`components/SettingsProvider.tsx`)
   - Manages LLM provider/model selection for chat and UI generation
   - Persists to localStorage
   - Supports: OpenAI (gpt-4o-mini, gpt-5-mini), Anthropic (Claude Sonnet/Haiku)

2. **Pokemon Results** (`components/PokemonResultsProvider.tsx`)
   - Context for Pokemon data across components
   - Tracks search history and results

3. **UI Component State** (`components/UIComponentProvider.tsx`)
   - Manages state for interactive components
   - Tracks loading, errors, data per component
   - Must wrap entire app to enable interactive features

### Convex Backend

**Schema** (`convex/schema.ts`):
- `messages` table: Stores chat messages with role, content, thread association
- `threads` table: Conversation threads with user ownership
- Indexes: `by_threadId`, `by_userId`, `by_createdAt`

**Function Guidelines** (see `.cursor/rules/convex_rules.mdc`):
- Always use new function syntax with validators
- Use `query`, `mutation`, `action` for public APIs
- Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- Include `args` and `returns` validators on all functions
- Never use `filter` in queries - use indexes instead

## Key Patterns

### Adding New Interactive Components

1. Define component schema in `lib/pokemon-ui-schema.ts`:
```typescript
const MyComponent = z.object({
  type: z.literal("my-component"),
  componentId: z.string().min(1),
  component: z.literal("my-component"),
  props: z.object({ /* props */ }),
  actions: z.record(ActionSchema).optional(),
});
```

2. Add to discriminated union in schema file
3. Implement React component in `components/InteractiveComponents.tsx`
4. Register in `components/InteractiveUIRenderer.tsx`

### Working with GraphQL Queries

**CRITICAL**: Always use GraphQL variables for dynamic values:
- Pagination: Use `$limit: Int!` and `$offset: Int!`
- Search: Use `$search: String!`
- Filters: Use `$filter: ...!`

This enables the UI system to detect capabilities and create interactive components.

**Example:**
```graphql
query GetPokemon($limit: Int!, $offset: Int!) {
  pokemon_v2_pokemon(limit: $limit, offset: $offset) {
    id
    name
  }
}
```

### AI Chat Flow

The chat system has a specific workflow enforced by system prompts:

1. User asks Pokemon question
2. LLM starts query session (MCP tool)
3. LLM builds GraphQL query with variables
4. LLM validates and executes query
5. LLM writes brief intro text (1 line max)
6. **LLM MUST call `presentPokemonData`** with data, query, and variables
7. Frontend visualizes with interactive UI
8. LLM ends query session

The `presentPokemonData` tool is mandatory after query execution to trigger visualization.

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `CLERK_SECRET_KEY` - Clerk server secret
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `CONVEX_DEPLOYMENT` - Convex deployment ID
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access
- `MCP_URL` (optional) - MCP server URL (defaults to production)

## Code Style

### Convex Functions
- Follow guidelines in `.cursor/rules/convex_rules.mdc`
- Always use file-based routing
- Use strict typing with `Id<"tableName">` from generated types
- Include validators for all args and returns

### React Components
- Use client components (`"use client"`) for interactivity
- Server components for authentication checks
- Prefer composition over prop drilling
- Use Radix UI primitives for accessible components

### TypeScript
- Strict mode enabled
- Use discriminated unions for component types
- Prefer `interface` for object shapes
- Use `type` for unions and complex types
- Import types from `@/*` alias

### Styling
- TailwindCSS 4.0 utility classes
- Theme system with CSS variables (see component classes)
- Responsive design with mobile-first approach
- Custom utilities in `lib/utils.ts` (cn helper)

## Testing Interactive Components

To verify interactive components work:

1. "Show me 20 Pokemon" → Should create paginated-list
2. "Build a searchable Pokemon finder" → Should create searchable-list
3. "Create a table of Pokemon stats" → Should create data-table
4. Check browser console for GraphQL validation/execution logs
5. Verify pagination controls appear and function
6. Test rate limiting by rapidly clicking pagination

## Common Issues

### MCP Connection Failures
- MCP client creation happens per request
- Failures are logged but don't crash the app
- App continues without MCP tools if connection fails

### Interactive Components Not Loading
- Verify `UIComponentProvider` wraps the app in layout
- Check GraphQL query has proper variables ($limit, $offset)
- Check browser console for validation errors
- Ensure endpoint is whitelisted in `lib/graphql-validator.ts`

### Rate Limiting
- Default: 10 requests/minute per component
- Tracked per componentId
- Clear errors shown in UI
- Wait 60 seconds or use different componentId

## File Structure

```
app/
  api/           # API routes (chat, visualization, GraphQL execution)
  page.tsx       # Main page with auth gates
  layout.tsx     # Root layout with providers
components/      # React components
  ai-elements/   # AI chat UI primitives
  ui/            # Reusable UI components (Radix/Tailwind)
  ChatInterface.tsx          # Main chat interface
  InteractiveUIRenderer.tsx  # Renders interactive components
  InteractiveComponents.tsx  # Interactive component implementations
  PokemonUIRenderer.tsx      # Static Pokemon components
  SettingsProvider.tsx       # Settings context
  UIComponentProvider.tsx    # Interactive component state
lib/
  ui-agent.ts                # AI UI generation
  pokemon-ui-schema.ts       # Component schemas
  ui-action-schema.ts        # Action type definitions
  ui-action-executor.ts      # Action execution logic
  graphql-validator.ts       # Query validation
  utils.ts                   # Utilities (cn helper)
convex/
  schema.ts                  # Convex database schema
  auth.config.ts             # Clerk integration
```

## Security Considerations

- GraphQL queries are validated before execution
- Rate limiting prevents abuse
- Endpoint whitelisting restricts allowed APIs
- Clerk handles authentication/authorization
- No direct database access from frontend
- All mutations go through Convex functions
