/**
 * GraphQL query validation utilities
 * Validates syntax and complexity to prevent malicious queries
 */

interface ValidationResult {
  valid: boolean;
  error?: string;
  complexity?: number;
}

// Basic GraphQL syntax patterns (reserved for future use)
// const GRAPHQL_PATTERNS = {
//   query: /^(query|mutation|subscription)\s+\w+/,
//   fields: /\{[^}]+\}/,
//   variables: /\$\w+:\s*\w+/,
//   directive: /@\w+/,
// };

// Dangerous patterns we want to block
const DANGEROUS_PATTERNS = [
  /\b__schema\b/i, // Introspection
  /\b__type\b/i, // Introspection
  /\bexec\b/i, // Potential command execution
  /\beval\b/i, // Potential code execution
];

/**
 * Validates GraphQL query syntax and safety
 */
export const validateGraphQLQuery = (query: string): ValidationResult => {
  if (!query || typeof query !== "string") {
    return { valid: false, error: "Query must be a non-empty string" };
  }

  // Check minimum length
  if (query.trim().length < 5) {
    return { valid: false, error: "Query too short" };
  }

  // Check maximum length (prevent DoS)
  if (query.length > 10000) {
    return {
      valid: false,
      error: "Query exceeds maximum length (10000 chars)",
    };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(query)) {
      return { valid: false, error: "Query contains forbidden operations" };
    }
  }

  // Basic syntax validation
  const openBraces = (query.match(/\{/g) || []).length;
  const closeBraces = (query.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    return { valid: false, error: "Mismatched braces in query" };
  }

  // Calculate basic complexity (nested depth)
  const complexity = calculateComplexity(query);
  if (complexity > 10) {
    return {
      valid: false,
      error: "Query complexity exceeds limit (max depth: 10)",
    };
  }

  return { valid: true, complexity };
};

/**
 * Calculates query complexity based on nesting depth
 */
const calculateComplexity = (query: string): number => {
  let maxDepth = 0;
  let currentDepth = 0;

  for (const char of query) {
    if (char === "{") {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === "}") {
      currentDepth--;
    }
  }

  return maxDepth;
};

/**
 * Validates GraphQL variables object
 */
export const validateGraphQLVariables = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables: Record<string, any>
): ValidationResult => {
  if (typeof variables !== "object" || variables === null) {
    return { valid: false, error: "Variables must be an object" };
  }

  // Check variable count
  const varCount = Object.keys(variables).length;
  if (varCount > 50) {
    return { valid: false, error: "Too many variables (max: 50)" };
  }

  // Check for dangerous values
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === "function") {
      return { valid: false, error: "Variables cannot contain functions" };
    }

    // Stringify to check size
    try {
      const serialized = JSON.stringify(value);
      if (serialized.length > 10000) {
        return {
          valid: false,
          error: `Variable "${key}" exceeds size limit`,
        };
      }
    } catch {
      return { valid: false, error: `Variable "${key}" cannot be serialized` };
    }
  }

  return { valid: true };
};

/**
 * Whitelisted endpoints for GraphQL queries
 */
const ALLOWED_ENDPOINTS = [
  "https://beta.pokeapi.co/graphql/v1beta", // Pokemon GraphQL API
  // Add other trusted endpoints here
];

/**
 * Validates GraphQL endpoint URL
 */
export const validateGraphQLEndpoint = (
  endpoint?: string
): ValidationResult => {
  // If no endpoint specified, we'll use MCP (which is safe)
  if (!endpoint) {
    return { valid: true };
  }

  // Check if endpoint is in whitelist
  if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
    return { valid: false, error: "Endpoint not in whitelist" };
  }

  return { valid: true };
};
