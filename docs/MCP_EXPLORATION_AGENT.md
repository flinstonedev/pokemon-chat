# MCP Query Exploration Agent

## Overview

The MCP Query Exploration Agent is a system that helps users discover and use pre-built GraphQL queries for the Pokemon API. It provides an interactive suggestion browser that generates UI components on demand.

## Architecture

### Components

1. **Type Definitions** (`lib/exploration-types.ts`)
   - `UIComponentSuggestion` - Structure for query suggestions
   - `ExploreQueriesRequest` - API request format
   - `ExploreQueriesResponse` - API response format
   - Enums for categories, complexity levels, and component types

2. **Exploration Agent** (`lib/exploration-agent.ts`)
   - Generates pre-configured query suggestions
   - Supports filtering by category and complexity
   - Returns suggestions for:
     - Paginated lists (Pokemon, Moves, Types, Abilities)
     - Searchable lists (Pokemon, Moves, Abilities)
     - Comparison queries (Pokemon stats, Type effectiveness)

3. **API Endpoint** (`app/api/explore-queries/route.ts`)
   - `POST /api/explore-queries` - Main exploration endpoint
   - `GET /api/explore-queries` - Simple exploration with URL params
   - 30-second timeout for discovery
   - Returns filtered suggestions based on request

4. **Suggestion Browser** (`components/SuggestionBrowser.tsx`)
   - Visual UI for browsing query suggestions
   - Filter by category (exploration, search, comparison, etc.)
   - Filter by complexity (beginner, intermediate, advanced)
   - Display query previews
   - One-click "Add to Chat" functionality

5. **Chat Integration** (`components/ChatInterface.tsx`)
   - "Explore Pokemon Data" button in chat input area
   - Dialog modal with suggestion browser
   - Automatic query formatting and execution
   - Seamless integration with existing chat flow

6. **Dialog Component** (`components/ui/dialog.tsx`)
   - Radix UI-based modal dialog
   - Used to display the suggestion browser
   - Responsive and accessible

## Features

### Query Suggestions

#### Exploration (Beginner)
- **Pokemon Browser**: Browse all 1000+ Pokemon with pagination
- **Move Library**: Explore all Pokemon moves with details
- **Type Explorer**: Discover all 18 Pokemon types
- **Ability Catalog**: Browse all Pokemon abilities

#### Search (Intermediate)
- **Pokemon Search**: Search for Pokemon by name with instant results
- **Move Search**: Filter moves by name
- **Ability Search**: Find abilities by name

#### Comparison (Intermediate)
- **Pokemon Stat Comparison**: Compare base stats side-by-side
- **Type Effectiveness Chart**: View type matchup data

### Component Types

1. **paginated-list**: Offset-based pagination with GraphQL queries
2. **searchable-list**: Debounced search with GraphQL filtering
3. **data-table**: Client-side sortable tables
4. **chart**: (Future) Data visualizations

### User Flow

1. User clicks "Explore Pokemon Data" button
2. Dialog opens with suggestion browser
3. User browses/filters suggestions
4. User clicks "Add to Chat" on a suggestion
5. System formats query and sends to chat
6. LLM executes query and creates interactive component
7. Component is rendered in chat with live data

## GraphQL Query Patterns

### Paginated Query Example
```graphql
query PaginatedPokemonV2Pokemon($limit: Int!, $offset: Int!) {
  pokemon_v2_pokemon(limit: $limit, offset: $offset) {
    id
    name
    height
    weight
    pokemon_v2_pokemontypes {
      pokemon_v2_type { name }
    }
  }
}
```

### Searchable Query Example
```graphql
query SearchPokemonV2Pokemon($search: String!, $limit: Int!) {
  pokemon_v2_pokemon(where: { name: { _ilike: $search } }, limit: $limit) {
    id
    name
    height
    weight
    pokemon_v2_pokemontypes {
      pokemon_v2_type { name }
    }
  }
}
```

### Comparison Query Example
```graphql
query ComparePokemon($ids: [Int!]!) {
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
}
```

## Implementation Details

### Suggestion Structure

Each suggestion contains:
- **title**: User-facing name ("Pokemon Browser")
- **description**: What the query does
- **category**: Classification (exploration, search, comparison, etc.)
- **complexity**: Skill level (beginner, intermediate, advanced)
- **graphqlQuery**: Complete GraphQL query with variables
- **variables**: Variable definitions with types and defaults
- **componentType**: Which UI component to render
- **tags**: Searchable keywords
- **estimatedResults**: Approximate number of results
- **exampleVariables**: Sample values for testing

### API Request Example

```json
{
  "categories": ["exploration", "search"],
  "complexity": ["beginner", "intermediate"],
  "maxSuggestions": 20
}
```

### API Response Example

```json
{
  "success": true,
  "suggestions": [
    {
      "title": "Pokemon Browser",
      "description": "Browse all 1000+ Pokemon with pagination",
      "category": "exploration",
      "complexity": "beginner",
      "graphqlQuery": "query PaginatedPokemonV2Pokemon($limit: Int!, $offset: Int!) { ... }",
      "variables": {
        "limit": {
          "type": "Int!",
          "default": 20,
          "description": "Number of items to fetch per page"
        },
        "offset": {
          "type": "Int!",
          "default": 0,
          "description": "Starting position for pagination"
        }
      },
      "componentType": "paginated-list",
      "tags": ["pokemon", "list", "browse", "beginner"],
      "estimatedResults": 1000
    }
  ],
  "metadata": {
    "totalDiscovered": 10,
    "totalReturned": 10,
    "discoveryTime": 0.05
  }
}
```

## Future Enhancements

### Phase 1 (Current)
- [x] Pre-configured query suggestions
- [x] Category and complexity filtering
- [x] Basic UI components (paginated, searchable, table)
- [x] Chat integration

### Phase 2 (Planned)
- [ ] Actual MCP QuerySculptor integration for dynamic discovery
- [ ] Query validation and testing
- [ ] User feedback on suggestions
- [ ] Favorite/bookmark suggestions
- [ ] Query customization UI

### Phase 3 (Future)
- [ ] Chart and visualization components
- [ ] AI-generated query descriptions
- [ ] Query performance metrics
- [ ] Community-contributed queries
- [ ] Query composition (combine patterns)
- [ ] Advanced filters (by Pokemon generation, type, etc.)

## Testing

### Manual Testing Steps

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the chat interface

3. Click "Explore Pokemon Data" button

4. Verify suggestions load:
   - Should show 10+ suggestions
   - Categories should be visible
   - Filtering should work

5. Click "Add to Chat" on a suggestion:
   - Query should be sent to chat
   - LLM should execute query
   - Interactive component should render

6. Test interactive components:
   - Pagination buttons should work
   - Search should filter results
   - Data should load from GraphQL API

### API Testing

```bash
# Get all suggestions
curl http://localhost:3000/api/explore-queries

# Get filtered suggestions
curl -X POST http://localhost:3000/api/explore-queries \
  -H "Content-Type: application/json" \
  -d '{"categories": ["exploration"], "maxSuggestions": 5}'
```

## Known Limitations

1. **Current Implementation**:
   - Suggestions are pre-configured, not dynamically discovered
   - Limited to Pokemon GraphQL API
   - No query validation before execution

2. **MCP Integration**:
   - Placeholder for actual MCP discovery
   - Will be enhanced to use QuerySculptor tools in Phase 2

3. **Component Types**:
   - Chart components not yet implemented
   - Limited customization of components

## File Structure

```
lib/
  exploration-types.ts          # Type definitions
  exploration-agent.ts           # Core discovery logic

app/api/
  explore-queries/
    route.ts                     # API endpoint

components/
  SuggestionBrowser.tsx          # Suggestion browser UI
  ChatInterface.tsx              # Chat integration (updated)
  ui/
    dialog.tsx                   # Modal dialog component

docs/
  MCP_EXPLORATION_AGENT.md       # This file
```

## Dependencies

- `@radix-ui/react-dialog` - Dialog component primitive
- `lucide-react` - Icons
- Existing project dependencies (Next.js, React, etc.)

## Configuration

No additional environment variables required. The system uses existing API endpoints and configurations.

## Troubleshooting

### Suggestions Not Loading

1. Check API endpoint is running:
   ```bash
   curl http://localhost:3000/api/explore-queries
   ```

2. Check browser console for errors

3. Verify GraphQL endpoint is accessible

### Interactive Components Not Working

1. Verify `UIComponentProvider` wraps the app
2. Check GraphQL query has proper variables
3. Check browser console for validation errors
4. Ensure endpoint is whitelisted in `graphql-validator.ts`

### Dialog Not Opening

1. Verify `@radix-ui/react-dialog` is installed
2. Check for console errors
3. Verify dialog component is properly imported

## Contributing

To add new query suggestions:

1. Edit `lib/exploration-agent.ts`
2. Add new configuration to appropriate discovery function
3. Build query using helper functions
4. Test query in GraphQL playground
5. Add to suggestions array

Example:
```typescript
{
  fieldName: "pokemon_v2_berry",
  title: "Berry Catalog",
  description: "Browse all Pokemon berries",
  tags: ["berries", "items", "browse"],
  defaultLimit: 20,
  estimatedResults: 60,
}
```
