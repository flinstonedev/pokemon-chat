# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Pokemon Chat is a Next.js application that demonstrates MCP (Model Context Protocol) integration with AI-powered chat. Users can ask Pokemon-related questions, and the AI assistant uses GraphQL query-building tools to fetch data from the Pokemon API.

**Tech Stack:**

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS 4
- **Backend**: Convex (database and real-time sync)
- **Authentication**: Clerk
- **AI**: Vercel AI SDK 5.0 with OpenAI GPT-4o
- **MCP**: Model Context Protocol client for GraphQL query building

## Development Commands

### Start Development

```bash
npm install              # Install dependencies
npm run dev             # Start frontend and backend concurrently
```

The `dev` script runs both:

- `dev:frontend`: Next.js dev server (port 3000)
- `dev:backend`: Convex dev server

### Build and Deploy

```bash
npm run build           # Build Next.js for production
npm start               # Start production server
```

### Code Quality

```bash
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # Run TypeScript compiler
npm run validate        # Run type-check + lint + format:check (use before commits)
```

### Convex Operations

```bash
npx convex dev          # Start Convex dev server
npx convex dashboard    # Open Convex dashboard
npx convex deploy       # Deploy Convex functions
```

## Code Architecture

### Frontend Structure (`/app`)

- **App Router**: Uses Next.js 15 app directory structure
- **API Routes**:
  - `/app/api/chat/route.ts`: AI chat with MCP integration (Pokemon queries)
  - `/app/api/ui-agent/route.ts`: Generic dynamic UI generation endpoint
  - `/app/api/visualize-pokemon/route.ts`: Pokemon-specific UI visualization endpoint
- **Layout**: Root layout includes ClerkProvider, ConvexClientProvider, and ThemeProvider
- **Middleware**: Clerk authentication middleware protects routes matching `/api/assistant-chat(.*)` pattern
- **Privacy/Legal**: Privacy policy and Terms of Service pages
- **Theming**: Dark theme by default with theme toggle support via next-themes

### Components (`/components`)

- **ChatInterface.tsx**: Main chat UI with message rendering, tool call visualization, and Pokemon UI integration
- **PokemonUIRenderer.tsx**: Renders Pokemon UI elements from the agent schema (cards, stats, types, etc.)
- **PokemonResultsProvider.tsx**: React Context for managing Pokemon query results
- **PokemonResultsPanel.tsx**: Panel for displaying Pokemon query results
- **PokemonComponents.tsx**: Legacy UI components for rendering Pokemon data (cards, stats, etc.)
- **ConvexClientProvider.tsx**: Wraps app with Convex client
- **CookieBanner.tsx**: GDPR-compliant cookie consent banner with PostHog tracking integration
- **ThemeProvider.tsx**: Wraps app with next-themes for dark/light theme support
- **ThemeToggle.tsx**: UI component for switching themes
- **ai-elements/**: Reusable AI UI components (tool calls, messages, etc.)
- **assistant-ui/**: Custom UI components for tool calls and thread management
- **ui/**: shadcn/ui components (buttons, cards, tooltips, etc.)

### Backend Structure (`/convex`)

- **schema.ts**: Convex database schema (messages and threads tables)
- **auth.config.ts**: Clerk JWT authentication configuration
- Messages stored with threadId, role, content, and optional tool call data

### MCP Integration

The chat API (`/app/api/chat/route.ts`) connects to an MCP server that provides GraphQL query-building tools:

- Uses `experimental_createMCPClient` from Vercel AI SDK
- StreamableHTTP transport for MCP communication
- Default MCP server: `https://agent-query-builder-toolbox.vercel.app/mcp`
- Tools include: start-query-session, select-field, execute-query, etc.

### Utilities (`/lib`)

- **ui-agent.ts**: AI SDK v5 compatible UI generation (replaces `dynamic-ui-agent` package)
- **pokemon-ui-schema.ts**: Zod schema for Pokemon-specific UI components
- **cookie-consent.ts**: Cookie consent management with PostHog integration
- **utils.ts**: Common utility functions (cn for className merging, etc.)

### State Management

- React Context API for Pokemon results
- Convex for persistent storage (messages, threads)
- AI SDK's `useChat` hook for chat state
- Local storage for cookie consent preferences

## Convex Guidelines

### Function Syntax

Always use the new Convex function syntax with explicit validators:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQuery = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      /* ... */
    })
  ),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

### Important Convex Rules

- Use `query` for read operations, `mutation` for writes
- Use `internalQuery`/`internalMutation` for private functions
- Always include `args` and `returns` validators
- System fields `_id` and `_creationTime` are automatically added
- Index fields must be queried in the order they're defined
- Use `v.null()` for functions returning null

### Schema Pattern

The schema uses indexes for efficient queries:

```typescript
defineTable({
  // fields...
})
  .index("by_threadId", ["threadId"])
  .index("by_userId", ["userId"]);
```

## Authentication Flow

1. Clerk handles user authentication
2. JWT issued by Clerk is validated by Convex
3. API routes use `auth()` from `@clerk/nextjs/server` to get userId
4. Middleware protects routes matching `/api/assistant-chat(.*)`

### Required Environment Variables

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-id

# Clerk
CLERK_JWT_ISSUER_DOMAIN=your-domain.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: MCP Server URL
MCP_URL=https://agent-query-builder-toolbox.vercel.app/mcp
```

## Styling

- **TailwindCSS 4** with `@tailwindcss/postcss` plugin
- **shadcn/ui**: Component library for consistent UI
- **Fira Code**: Google Font used for monospace text
- Custom gradient designs for chat bubbles and tool call displays
- Responsive design with mobile-first approach
- Dark theme by default with glass-morphism effects
- Theme switching support via next-themes
- Custom CSS variables defined in `globals.css`

## Analytics & Privacy

- **PostHog**: Analytics integration with EU data residency
  - Configured via rewrites in `next.config.ts` (`/ingest/*`)
  - Cookie consent banner for GDPR compliance
  - User can opt-in/opt-out of analytics tracking
- **Privacy Pages**: `/privacy` and `/terms` routes for legal compliance
- **Cookie Management**: Utilities in `lib/cookie-consent.ts`

## Security Considerations

- Content Security Policy headers configured in `next.config.ts`
- Clerk middleware protects routes matching `/api/assistant-chat(.*)`
- Rate limiting and input validation on chat API (20 req/min per IP+UA)
- MCP URL validation against trusted domains only
- Security headers: X-Frame-Options, X-Content-Type-Options, CSP, etc.
- See `SECURITY.md` for detailed security documentation and testing

## Code Style Preferences

- **Function-based approach**: Prefer functions over ES6 classes
- **TypeScript**: Strict mode enabled, always type function parameters and returns
- **Validators**: Always use Convex validators for arguments and return types
- **Modern syntax**: Use async/await, destructuring, and optional chaining
- **Error handling**: Use try-catch with proper cleanup in async operations

## Common Patterns

### Adding a New Convex Query

1. Define in appropriate file under `/convex/`
2. Use new function syntax with validators
3. Add indexes to schema if needed
4. Call from frontend using `useQuery` from `convex/react`

### Adding UI Components

1. Create functional component in `/components/`
2. Use TypeScript with proper prop types
3. Apply TailwindCSS classes for styling
4. Use Lucide React for icons

### Modifying Chat Behavior

1. Update system message in `/app/api/chat/route.ts`
2. Adjust tool call handling in `ChatInterface.tsx`
3. Update result processing in `PokemonResultsProvider.tsx`

## Pokemon UI Visualization Flow

The application uses an AI agent to intelligently render Pokemon data:

### Flow Overview

1. **User asks about Pokemon** → Chat sends request to `/api/chat`
2. **MCP tools query Pokemon API** → GraphQL data is fetched
3. **Pokemon data returned** → `execute-query` tool provides structured data
4. **UI Agent visualizes data** → `/api/visualize-pokemon` decides how to render
5. **Components rendered** → `PokemonUIRenderer` displays the UI

### API Endpoints

**`/app/api/visualize-pokemon/route.ts`**

- Takes Pokemon data from MCP tools
- Calls UI agent with data + instructions
- Agent decides best components (pokemon-card, stats-panel, etc.)
- Returns structured UI schema

**`/app/api/ui-agent/route.ts`**

- Generic UI generation endpoint
- Accepts any prompt and returns UI components
- Uses same underlying technology

### Implementation

**Custom AI SDK v5 Implementation** (`lib/ui-agent.ts`):

- Uses `generateObject` from AI SDK v5 (not the `dynamic-ui-agent` package)
- Compatible with Vercel AI SDK 5.x
- Uses OpenAI GPT-4o-mini with temperature 0.7

**Note:** The `dynamic-ui-agent` npm package uses AI SDK v3 and is incompatible with AI SDK v5. We've implemented our own version using the v5 `generateObject` API.

### ChatInterface Integration

```typescript
// When Pokemon data is received from MCP tools:
const visualizePokemonData = async (data, messageId) => {
  const response = await fetch("/api/visualize-pokemon", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  const result = await response.json();
  // Result contains UI schema with pokemon-card, pokemon-stats-panel, etc.
  setVisualizations((prev) => new Map(prev).set(messageId, result));
};

// Render with PokemonUIRenderer:
<PokemonUIRenderer elements={visualization.ui} />
```

### Pokemon UI Schema (`/lib/pokemon-ui-schema.ts`)

Custom Zod schema that extends the built-in UI schema with Pokemon-specific components:

**Pokemon Components:**

- `pokemon-card`: Display Pokemon with name, image, types, and description
- `pokemon-stat`: Single stat display with progress bar (HP, Attack, etc.)
- `pokemon-stats-panel`: Complete stats panel for a Pokemon
- `pokemon-type`: Type badge display
- `pokemon-evolution`: Evolution chain visualization
- `pokemon-moves`: Move list with type, power, and accuracy

**Generic Components:**

- `text`, `heading`, `button`, `list`, `table`, `code`, `container`

**Schema Configuration:**

```typescript
import {
  PokemonAgentResponseSchema,
  POKEMON_SYSTEM_PROMPT,
} from "@/lib/pokemon-ui-schema";
import { respond } from "@/lib/ui-agent";
import { openai } from "@ai-sdk/openai";

const result = await respond(prompt, {
  schema: PokemonAgentResponseSchema,
  systemPrompt: POKEMON_SYSTEM_PROMPT,
  llm: { provider: openai, model: "gpt-4o-mini", temperature: 0.7 },
});
```

## Testing

Currently no test framework configured. When adding tests:

- Consider Vitest for unit tests
- Use React Testing Library for component tests
- Test Convex functions with Convex testing utilities
- Mock MCP client responses in API tests
- See `SECURITY.md` for security testing examples

## TypeScript Configuration

- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode enabled
- Path alias: `@/*` maps to project root
- JSX: preserve (handled by Next.js)

## Key Dependencies to Note

- `@ai-sdk/react` and `ai`: Vercel AI SDK v5.0 (breaking changes from v4)
- `@modelcontextprotocol/sdk`: MCP client implementation
- `convex`: Real-time database with TypeScript support
- `@clerk/nextjs`: Authentication with Next.js integration
- `dynamic-ui-agent`: Dynamic UI generation from AI prompts
- `next-themes`: Theme management for dark/light mode
- `shadcn/ui` components: Various Radix UI primitives
- `lucide-react`: Icon library
- `posthog-js` & `posthog-node`: Analytics platform
- `react-syntax-highlighter`: Code syntax highlighting
- `zod`: Runtime type validation (used by AI SDK)

## AI SDK 5.0 Migration Notes

This project uses AI SDK 5.0, which has breaking changes:

- `useChat` from `@ai-sdk/react` (not `ai/react`)
- New message structure with `parts` array
- Tool calls in message parts with state tracking
- Response uses `.toUIMessageStreamResponse()`
- Transport specified via `DefaultChatTransport`
