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
npm run lint            # Run ESLint
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
- **API Routes**: `/app/api/chat/route.ts` handles AI chat with MCP integration
- **Layout**: Root layout includes ClerkProvider and ConvexClientProvider
- **Middleware**: Clerk authentication middleware protects API routes

### Components (`/components`)
- **ChatInterface.tsx**: Main chat UI with message rendering and tool call visualization
- **PokemonResultsProvider.tsx**: React Context for managing Pokemon query results
- **ConvexClientProvider.tsx**: Wraps app with Convex client
- **PokemonComponents.tsx**: UI components for rendering Pokemon data
- **assistant-ui/**: Custom UI components for tool calls and thread management

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

### State Management
- React Context API for Pokemon results
- Convex for persistent storage (messages, threads)
- AI SDK's `useChat` hook for chat state

## Convex Guidelines

### Function Syntax
Always use the new Convex function syntax with explicit validators:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQuery = query({
    args: { userId: v.string() },
    returns: v.array(v.object({ /* ... */ })),
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
}).index("by_threadId", ["threadId"])
  .index("by_userId", ["userId"])
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
- Custom gradient designs for chat bubbles and tool call displays
- Responsive design with mobile-first approach
- Dark theme with glass-morphism effects

## Security Considerations

- Content Security Policy headers configured in `next.config.ts`
- Clerk middleware protects sensitive routes
- Rate limiting and input validation on chat API
- MCP URL validation against trusted domains only
- See `SECURITY.md` for detailed security documentation

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

## Testing

Currently no test framework configured. When adding tests:
- Consider Vitest for unit tests
- Use React Testing Library for component tests
- Test Convex functions with Convex testing utilities
- Mock MCP client responses in API tests

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
- `lucide-react`: Icon library
- `zod`: Runtime type validation (used by AI SDK)

## AI SDK 5.0 Migration Notes

This project uses AI SDK 5.0, which has breaking changes:
- `useChat` from `@ai-sdk/react` (not `ai/react`)
- New message structure with `parts` array
- Tool calls in message parts with state tracking
- Response uses `.toUIMessageStreamResponse()`
- Transport specified via `DefaultChatTransport`
