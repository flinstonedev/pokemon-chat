import { z } from "zod";

// --- Primitives ---

export const GenericActionSchema = z.object({
  type: z.enum(["navigate", "link", "trigger-event"]),
  payload: z.record(z.any()).optional(),
  label: z.string().optional(),
});

// --- Widgets ---

export const DataListSchema = z.object({
  type: z.literal("data-list"),
  title: z.string().optional(),
  dataKey: z.string().describe("Path to array in data (e.g. 'pokemons')"),
  itemTitleKey: z.string().describe("Key for item title (e.g. 'name')"),
  itemSubtitleKey: z.string().optional(),
  itemImageKey: z.string().optional(),
  actions: z.array(GenericActionSchema).optional(),
});

export const DataTableSchema = z.object({
  type: z.literal("data-table"),
  title: z.string().optional(),
  dataKey: z.string().describe("Path to array in data"),
  columns: z.array(
    z.object({
      header: z.string(),
      key: z.string(),
      format: z
        .enum(["text", "number", "currency", "image", "badge"])
        .optional(),
    })
  ),
});

export const DataDetailSchema = z.object({
  type: z.literal("data-detail"),
  title: z.string().optional(),
  dataKey: z
    .string()
    .describe("Path to object (e.g. 'selectedItem' or 'data.pokemon')"),
  fields: z.array(
    z.object({
      label: z.string(),
      key: z.string(),
      type: z
        .enum(["text", "number", "image", "json", "progress"])
        .default("text"),
    })
  ),
});

export const MetricSchema = z.object({
  label: z.string(),
  value: z.string().or(z.number()),
  trend: z.number().optional(),
  icon: z.string().optional(),
});

export const StatsGridSchema = z.object({
  type: z.literal("stats-grid"),
  title: z.string().optional(),
  metrics: z.array(MetricSchema),
});

// --- Layouts ---

// We need recursive definitions, so we use z.lazy
// Forward declarations for recursion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const UIComponentSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    DataListSchema,
    DataTableSchema,
    DataDetailSchema,
    StatsGridSchema,
    SplitLayoutSchema,
    GridLayoutSchema,
    StackLayoutSchema,
  ])
);

export const SplitLayoutSchema = z.object({
  type: z.literal("layout-split"),
  left: UIComponentSchema,
  right: UIComponentSchema,
  defaultSelectedKey: z.string().optional(),
});

export const GridLayoutSchema = z.object({
  type: z.literal("layout-grid"),
  columns: z.number().min(1).max(4).default(2),
  items: z.array(UIComponentSchema),
});

export const StackLayoutSchema = z.object({
  type: z.literal("layout-stack"),
  direction: z.enum(["vertical", "horizontal"]).default("vertical"),
  children: z.array(UIComponentSchema),
});

// --- Root Response ---

export const ComponentAgentResponseSchema = z.object({
  ui: UIComponentSchema,
  // Initial state or data queries if needed
  dataQueries: z.array(z.string()).optional(),
});

export type UIComponent = z.infer<typeof UIComponentSchema>;
export type ComponentAgentResponse = z.infer<
  typeof ComponentAgentResponseSchema
>;

// Export specific component types for type-safe rendering
export type DataList = z.infer<typeof DataListSchema>;
export type DataTable = z.infer<typeof DataTableSchema>;
export type DataDetail = z.infer<typeof DataDetailSchema>;
export type StatsGrid = z.infer<typeof StatsGridSchema>;
export type SplitLayout = z.infer<typeof SplitLayoutSchema>;
export type GridLayout = z.infer<typeof GridLayoutSchema>;
export type StackLayout = z.infer<typeof StackLayoutSchema>;
export type Metric = z.infer<typeof MetricSchema>;

// Column type for data-table
export type TableColumn = {
  header: string;
  key: string;
  format?: "text" | "number" | "currency" | "image" | "badge";
};

// Field type for data-detail
export type DetailField = {
  label: string;
  key: string;
  type?: "text" | "number" | "image" | "json" | "progress";
};

export const GENERIC_COMPONENT_PROMPT = `
You are a UI Architect. Build a user interface using High-Level Components.

**Components Available:**

1. **Layouts**:
   - \`layout-split\`: Left/Right view. Automatically handles "Master-Detail".
     - Left: usually a List.
     - Right: usually a Detail view.
     - *Magic*: Selecting an item on the Left automatically injects it as \`selectedItem\` into the Right component's context.
   - \`layout-grid\`: Grid of components (good for dashboards).
   - \`layout-stack\`: Vertical or horizontal stack.

2. **Widgets**:
   - \`data-list\`: Display a list of items.
     - \`dataKey\`: "pokemons" etc.
     - \`itemTitleKey\`: "name"
   - \`data-table\`: Tabular data.
   - \`data-detail\`: Rich detail card for a SINGLE object.
     - Use \`dataKey: "selectedItem"\` if inside a Split Layout's right panel.
   - \`stats-grid\`: Row of KPI cards.

**Goal**:
Return a JSON structure matching the schema. NO code.
`;
