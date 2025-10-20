import { z } from "zod";

/**
 * Action schemas for interactive UI components
 * These define how components can fetch data, paginate, and trigger events
 */

export const GraphQLQueryActionSchema = z.object({
  type: z.literal("graphql-query"),
  actionId: z.string().min(1),
  query: z.string().min(1),
  variables: z.record(z.any()).optional().default({}),
  // Endpoint is optional - defaults to MCP Pokemon API
  endpoint: z.string().url().optional(),
});

export const PaginationActionSchema = z.object({
  type: z.literal("pagination"),
  actionId: z.string().min(1),
  // Reference to the graphql-query action to paginate
  queryRef: z.string().min(1),
  pageSize: z.number().int().positive().max(100).default(20),
  currentPage: z.number().int().nonnegative().default(0),
  // For cursor-based pagination
  cursor: z.string().optional(),
});

export const CustomEventActionSchema = z.object({
  type: z.literal("custom-event"),
  actionId: z.string().min(1),
  eventName: z.string().min(1),
  payload: z.record(z.any()).optional(),
});

export const ActionSchema = z.discriminatedUnion("type", [
  GraphQLQueryActionSchema,
  PaginationActionSchema,
  CustomEventActionSchema,
]);

export const DataBindingSchema = z.object({
  // Source action ID that provides data
  source: z.string().min(1),
  // Target prop name in component
  target: z.string().min(1),
  // Optional transform function name
  transform: z.string().optional(),
});

export const InteractiveComponentSchema = z.object({
  componentId: z.string().min(1),
  component: z.string().min(1),
  props: z.record(z.any()).default({}),
  // Actions this component can trigger
  actions: z.record(ActionSchema).optional(),
  // Data bindings from actions to props
  dataBindings: z.array(DataBindingSchema).optional(),
});

// Type exports
export type GraphQLQueryAction = z.infer<typeof GraphQLQueryActionSchema>;
export type PaginationAction = z.infer<typeof PaginationActionSchema>;
export type CustomEventAction = z.infer<typeof CustomEventActionSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type DataBinding = z.infer<typeof DataBindingSchema>;
export type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;
