# Pokemon Chat - AI Assistant with MCP Integration

An intelligent Pokemon chat application that demonstrates the power of Model Context Protocol (MCP) for building dynamic, data-driven AI assistants. Built with Next.js 15, featuring real-time GraphQL queries, dynamic UI generation, and interactive components.

## Features

- **MCP-Powered AI Chat**: Uses Model Context Protocol to dynamically build and execute GraphQL queries against the Pokemon API
- **Dynamic UI Generation**: AI-generated interactive components (cards, stats panels, evolution chains, searchable lists)
- **Multi-Provider Support**: Supports both OpenAI (GPT-4o) and Anthropic (Claude) models
- **Real-time Backend**: Convex database for message persistence and thread management
- **Authentication**: Secure user authentication via Clerk
- **Interactive Components**: Pagination, search, and data tables with GraphQL-backed data fetching
- **Modern UI**: Beautiful, responsive design with TailwindCSS 4 and dark mode support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS 4
- **Backend**: Convex (real-time database)
- **Authentication**: Clerk
- **AI**: Vercel AI SDK 5.0 with OpenAI and Anthropic
- **MCP**: Model Context Protocol for GraphQL query building
- **TypeScript**: Strict mode for type safety

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- OpenAI API key (required)
- Anthropic API key (optional)
- Clerk account for authentication
- Convex account for backend

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pokemon-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```bash
# Convex Backend
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

# OpenAI API (required)
OPENAI_API_KEY=sk-proj-your_key

# Anthropic API (optional)
ANTHROPIC_API_KEY=sk-ant-api03-your_key

# MCP Server (optional - defaults to production)
MCP_URL=https://agent-query-builder-toolbox.vercel.app/mcp

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

4. Set up Convex:

First, log in to Convex:
```bash
npx convex login
```

Then initialize your project:
```bash
npx convex dev
```

This will:
- Create a new Convex project
- Set up your deployment
- Automatically populate `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT`

5. Set up Clerk authentication:

- Go to [clerk.com](https://clerk.com) and create a new application
- Copy your publishable and secret keys to `.env.local`
- In Convex dashboard, go to Settings → Environment Variables
- Add `CLERK_JWT_ISSUER_DOMAIN` from your Clerk dashboard (found in API Keys → JWT Templates)

6. Start the development server:
```bash
npm run dev
```

This runs both the Next.js frontend (port 3000) and Convex backend in parallel.

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Basic Chat

Simply ask questions about Pokemon:

- "Show me the first 10 Pokemon"
- "Tell me about Pikachu"
- "What are the strongest Dragon-type Pokemon?"
- "Create a searchable list of all Pokemon"

The AI assistant will:
1. Use MCP tools to build GraphQL queries
2. Execute queries against the Pokemon API
3. Generate interactive UI components to display results
4. Present data with cards, stats panels, and searchable/paginated lists

### Interactive Components

The app automatically creates interactive components based on queries:

- **Paginated Lists**: When requesting multiple Pokemon (e.g., "Show me 20 Pokemon")
- **Searchable Lists**: When asking for searchable interfaces (e.g., "Create a Pokemon finder")
- **Data Tables**: When requesting tabular data (e.g., "Show Pokemon stats in a table")
- **Pokemon Cards**: Rich cards with images, types, and descriptions
- **Stats Panels**: Visual stat displays with progress bars
- **Evolution Chains**: Interactive evolution tree visualizations

### Settings

Click the settings icon to:
- Switch between OpenAI and Anthropic models
- Choose specific models (GPT-4o, Claude Sonnet, etc.)
- Configure chat and UI generation separately

## Development

### Project Structure

```
app/
  api/              # API routes (chat, visualization, GraphQL)
  page.tsx          # Main page with auth gates
  layout.tsx        # Root layout with providers
components/         # React components
  ai-elements/      # AI chat UI primitives
  ui/               # Reusable UI components
  ChatInterface.tsx # Main chat interface
  InteractiveUIRenderer.tsx    # Renders interactive components
  InteractiveComponents.tsx    # Interactive component implementations
lib/
  ui-agent.ts                  # AI UI generation
  pokemon-ui-schema.ts         # Component schemas
  graphql-validator.ts         # Query validation
convex/
  schema.ts                    # Database schema
  auth.config.ts               # Clerk integration
```

### Code Quality

```bash
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
npm run format          # Format with Prettier
npm run validate        # Run all checks (type-check + lint + format)
```

### Key Files

- **CLAUDE.md**: Comprehensive documentation for AI assistants
- **WARP.md**: Terminal-focused development guide
- **lib/pokemon-ui-schema.ts**: UI component type definitions
- **lib/graphql-validator.ts**: Security and validation for GraphQL queries

## Architecture

### MCP Integration

The app uses Model Context Protocol to dynamically build GraphQL queries:

1. User asks a question
2. AI assistant uses MCP tools to introspect the Pokemon API schema
3. Assistant builds a GraphQL query with proper variables
4. Query is validated and executed
5. Results are passed to the UI generation system
6. Dynamic components are created and rendered

### Dynamic UI System

1. **Schema Definition** (`lib/pokemon-ui-schema.ts`): Zod schemas for all components
2. **UI Agent** (`lib/ui-agent.ts`): AI-powered component generation
3. **Action Executor** (`lib/ui-action-executor.ts`): Handles data fetching for interactive components
4. **Validation** (`lib/graphql-validator.ts`): Security checks for all GraphQL queries

### Security

- GraphQL queries are validated before execution
- Rate limiting: 10 requests/minute per component
- Endpoint whitelisting for allowed APIs
- No direct database access from frontend
- All mutations go through Convex functions
- Clerk authentication for all routes

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run validation checks (`npm run validate`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

Apache License 2.0 - see LICENSE file for details

## Acknowledgments

- [Convex](https://convex.dev/) for the real-time backend
- [Clerk](https://clerk.com/) for authentication
- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integration
- [PokéAPI](https://pokeapi.co/) for Pokemon data
- [MCP](https://modelcontextprotocol.io/) for query building tools
