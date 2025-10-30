/**
 * Type definitions for the MCP Query Exploration Agent
 *
 * These types define the structure of UI component suggestions
 * that are discovered by actively building and testing GraphQL queries
 * with MCP QuerySculptor tools.
 */

export type SuggestionCategory =
  | "exploration"
  | "comparison"
  | "search"
  | "visualization"
  | "reference";

export type SuggestionComplexity =
  | "beginner"
  | "intermediate"
  | "advanced";

export type ComponentType =
  | "paginated-list"
  | "searchable-list"
  | "data-table"
  | "chart";

export interface VariableDefinition {
  type: string;           // "Int!", "String!", "[Int!]!", etc.
  default: any;           // Default value to use
  description?: string;   // What this variable does
}

export interface UIComponentSuggestion {
  // Display Information
  title: string;                    // "Pokemon Browser" - Short, user-facing name
  description: string;              // "Browse all 1000+ Pokemon with pagination"
  category: SuggestionCategory;
  complexity: SuggestionComplexity;

  // The Working Query (TESTED and VALIDATED)
  graphqlQuery: string;             // Full GraphQL query with variables
  variables: Record<string, VariableDefinition>;

  // Component Mapping
  componentType: ComponentType;

  // Metadata
  tags: string[];                   // ["pokemon", "list", "browse", "beginner"]
  estimatedResults?: number;        // If known from testing
  exampleVariables?: Record<string, any>;  // Example values to try

  // Optional Enhancements
  relatedSuggestions?: string[];    // IDs of related suggestions
  requiresAuth?: boolean;           // If query needs special access
  performanceNotes?: string;        // "Large dataset, may be slow"
}

export interface ExploreQueriesRequest {
  categories?: SuggestionCategory[];  // Optional filter
  complexity?: SuggestionComplexity[]; // Optional filter
  maxSuggestions?: number;            // Optional limit
}

export interface ExploreQueriesResponse {
  success: true;
  suggestions: UIComponentSuggestion[];
  metadata: {
    totalDiscovered: number;
    totalReturned: number;
    discoveryTime: number;  // seconds
    mcpSessionId?: string;
  };
}

export interface ExploreQueriesError {
  success: false;
  error: string;
  details?: string;
}

export type ExploreQueriesResult = ExploreQueriesResponse | ExploreQueriesError;

/**
 * MCP Tool Response Types
 * (Simplified versions based on QuerySculptor protocol)
 */

export interface SchemaType {
  name: string;
  kind: string;
  fields?: SchemaField[];
  ofType?: SchemaType;
}

export interface SchemaField {
  name: string;
  type: SchemaType;
  args?: SchemaArgument[];
  description?: string;
}

export interface SchemaArgument {
  name: string;
  type: SchemaType;
  description?: string;
}

export interface IntrospectionResult {
  queries: SchemaField[];
  mutations: SchemaField[];
  types: Record<string, SchemaType>;
}

export interface QueryValidationResult {
  valid: boolean;
  query: string;
  errors?: string[];
  variables?: Record<string, any>;
}

export interface QueryExecutionResult {
  success: boolean;
  data?: any;
  errors?: any[];
  totalCount?: number;
}
