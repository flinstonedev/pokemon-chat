import type {
  Action,
  GraphQLQueryAction,
  PaginationAction,
  CustomEventAction,
} from "./ui-action-schema";
import {
  validateGraphQLQuery,
  validateGraphQLVariables,
  validateGraphQLEndpoint,
} from "./graphql-validator";

/**
 * Rate limiter for component actions
 * Tracks requests per component and enforces limits
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if action is allowed for component
   */
  isAllowed(componentId: string): boolean {
    const now = Date.now();
    const componentRequests = this.requests.get(componentId) || [];

    // Filter out old requests outside the time window
    const recentRequests = componentRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Update stored requests
    this.requests.set(componentId, recentRequests);

    return recentRequests.length < this.maxRequests;
  }

  /**
   * Record a request for component
   */
  recordRequest(componentId: string): void {
    const now = Date.now();
    const componentRequests = this.requests.get(componentId) || [];
    componentRequests.push(now);
    this.requests.set(componentId, componentRequests);
  }

  /**
   * Get remaining requests for component
   */
  getRemainingRequests(componentId: string): number {
    const now = Date.now();
    const componentRequests = this.requests.get(componentId) || [];
    const recentRequests = componentRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Reset rate limit for component
   */
  reset(componentId: string): void {
    this.requests.delete(componentId);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
  }
}

/**
 * Action executor configuration
 */
interface ActionExecutorConfig {
  mcpUrl?: string;
  rateLimiter?: RateLimiter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCustomEvent?: (eventName: string, payload: any) => void | Promise<void>;
}

/**
 * Action executor result
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates an action executor for interactive UI components
 */
export const createActionExecutor = (config: ActionExecutorConfig = {}) => {
  const graphqlUrl = config.mcpUrl || "/api/execute-graphql"; // Use dedicated GraphQL endpoint
  const rateLimiter = config.rateLimiter || new RateLimiter(10, 60000); // 10 req/min
  const onCustomEvent = config.onCustomEvent;

  /**
   * Execute a GraphQL query action
   */
  const executeGraphQLQuery = async (
    action: GraphQLQueryAction,
    componentId: string
  ): Promise<ActionResult> => {
    // Validate query
    const queryValidation = validateGraphQLQuery(action.query);
    if (!queryValidation.valid) {
      return { success: false, error: queryValidation.error };
    }

    // Validate variables
    const variablesValidation = validateGraphQLVariables(
      action.variables || {}
    );
    if (!variablesValidation.valid) {
      return { success: false, error: variablesValidation.error };
    }

    // Validate endpoint
    const endpointValidation = validateGraphQLEndpoint(action.endpoint);
    if (!endpointValidation.valid) {
      return { success: false, error: endpointValidation.error };
    }

    // Check rate limit
    if (!rateLimiter.isAllowed(componentId)) {
      return {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
      };
    }

    // Record request
    rateLimiter.recordRequest(componentId);

    try {
      // Execute query via dedicated GraphQL endpoint
      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: action.query,
          variables: action.variables || {},
          endpoint: action.endpoint, // Pass through endpoint if specified
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Query execution failed");
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Query execution failed",
      };
    }
  };

  /**
   * Execute a pagination action
   */
  const executePagination = async (
    action: PaginationAction,
    componentId: string,
    queryAction?: GraphQLQueryAction
  ): Promise<ActionResult> => {
    if (!queryAction) {
      return {
        success: false,
        error: `Query action "${action.queryRef}" not found`,
      };
    }

    // Calculate offset for offset-based pagination
    const offset = action.currentPage * action.pageSize;

    // Merge pagination variables with query variables
    const paginatedVariables = {
      ...queryAction.variables,
      limit: action.pageSize,
      offset,
      ...(action.cursor && { cursor: action.cursor }),
    };

    // Execute the query with pagination variables
    const paginatedQuery: GraphQLQueryAction = {
      ...queryAction,
      variables: paginatedVariables,
    };

    return executeGraphQLQuery(paginatedQuery, componentId);
  };

  /**
   * Execute a custom event action
   */
  const executeCustomEvent = async (
    action: CustomEventAction
  ): Promise<ActionResult> => {
    try {
      if (onCustomEvent) {
        await onCustomEvent(action.eventName, action.payload);
      }
      return { success: true, data: { eventName: action.eventName } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Custom event failed",
      };
    }
  };

  /**
   * Execute any action
   */
  const executeAction = async (
    action: Action,
    componentId: string,
    context?: {
      actions?: Record<string, Action>;
    }
  ): Promise<ActionResult> => {
    switch (action.type) {
      case "graphql-query":
        return executeGraphQLQuery(action, componentId);

      case "pagination": {
        const queryAction = context?.actions?.[action.queryRef] as
          | GraphQLQueryAction
          | undefined;
        return executePagination(action, componentId, queryAction);
      }

      case "custom-event":
        return executeCustomEvent(action);

      default:
        return {
          success: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: `Unknown action type: ${(action as any).type}`,
        };
    }
  };

  return {
    executeAction,
    executeGraphQLQuery,
    executePagination,
    executeCustomEvent,
    rateLimiter,
  };
};

// Export types and utilities
export type ActionExecutor = ReturnType<typeof createActionExecutor>;
export type { ActionResult };
export { RateLimiter };
