/**
 * GraphQL utility functions for query parsing and analysis
 */

/**
 * Extracts variable definitions from a GraphQL query
 * Returns a map of variable names to their types
 *
 * Example:
 * query GetPokemon($limit: Int!, $offset: Int!, $name: String) { ... }
 * Returns: { limit: 'Int!', offset: 'Int!', name: 'String' }
 */
export function extractVariables(query: string): Record<string, string> {
  const variables: Record<string, string> = {};

  // Match variable definitions like: $varName: Type
  // Handles required types (Type!), lists ([Type]), and combinations
  const variableRegex = /\$(\w+)\s*:\s*([\w\[\]!]+)/g;

  let match;
  while ((match = variableRegex.exec(query)) !== null) {
    const [, varName, varType] = match;
    variables[varName] = varType;
  }

  return variables;
}

/**
 * Detects the search variable name from a GraphQL query
 * Looks for common patterns:
 * - Variables containing "search", "name", "query", "filter"
 * - String or String! types that might be used for search
 *
 * Returns the most likely search variable name, or null if none found
 */
export function detectSearchVariable(query: string): string | null {
  const variables = extractVariables(query);

  // Priority order for search variable detection
  const searchKeywords = ['search', 'query', 'name', 'filter', 'text'];

  // First, check for exact matches with search keywords
  for (const keyword of searchKeywords) {
    if (variables[keyword]) {
      return keyword;
    }
  }

  // Next, check for variables that contain search keywords
  for (const [varName] of Object.entries(variables)) {
    for (const keyword of searchKeywords) {
      if (varName.toLowerCase().includes(keyword)) {
        return varName;
      }
    }
  }

  // Finally, check for any String type variable (likely for search)
  for (const [varName, varType] of Object.entries(variables)) {
    if (varType === 'String' || varType === 'String!') {
      return varName;
    }
  }

  return null;
}

/**
 * Checks if a query has pagination support (uses $limit and $offset)
 */
export function hasPaginationSupport(query: string): boolean {
  return query.includes('$limit') && query.includes('$offset');
}

/**
 * Checks if a query has search support
 * Looks for:
 * - $search variable
 * - _ilike or _like operators (Hasura/Postgres pattern)
 * - Any String variable that might be used for search
 */
export function hasSearchSupport(query: string): boolean {
  // Check for explicit search patterns
  if (query.includes('$search')) {
    return true;
  }

  // Check for like/ilike operators (common in Hasura/Postgres)
  if (query.includes('_ilike') || query.includes('_like')) {
    return true;
  }

  // Check if there's any String variable that could be for search
  const searchVar = detectSearchVariable(query);
  return searchVar !== null;
}
