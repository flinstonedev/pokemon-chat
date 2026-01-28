"use client";

import { useState, useEffect } from "react";
import { useComponentState } from "./UIComponentProvider";
import type {
  Action,
  InteractiveComponent,
  GraphQLQueryAction,
} from "@/lib/ui-action-schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import Image from "next/image";

// Helper to find array data in arbitrary GraphQL response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findArrayInData(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  // Common patterns
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.nodes)) return data.nodes;
  if (Array.isArray(data.results)) return data.results;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (Array.isArray(data.edges)) return data.edges.map((e: any) => e.node); // Relay style

  // Search for any array property
  const keys = Object.keys(data);
  for (const key of keys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
    // Drill down one level if it's an object (e.g. data.pokemons.results)
    if (typeof data[key] === "object" && data[key] !== null) {
      if (Array.isArray(data[key].results)) return data[key].results;
      if (Array.isArray(data[key].items)) return data[key].items;
      if (Array.isArray(data[key].nodes)) return data[key].nodes;
      // Check if the object itself is an array-like wrapper (e.g. { count: 10, items: [] })
      const subKeys = Object.keys(data[key]);
      for (const subKey of subKeys) {
        if (Array.isArray(data[key][subKey])) return data[key][subKey];
      }
    }
  }

  // If we have a single object wrapper, maybe return it as a list of 1?
  // Or check for specific single-object conventions?
  // For now return empty if no array found.
  return [];
}

/**
 * Generic Card Renderer for List Items
 */
function GenericItemCard({
  item,
  mapping,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  mapping?: Record<string, string>;
}) {
  // Helper to get value by path (dot notation)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const get = (obj: any, path: string) => {
    return path.split(".").reduce((o, p) => (o ? o[p] : undefined), obj);
  };

  // Auto-detect fields if no mapping
  const title = mapping?.title
    ? get(item, mapping.title)
    : item.name || item.title || item.label || item.id;
  const subtitle = mapping?.subtitle
    ? get(item, mapping.subtitle)
    : item.subtitle || item.type || item.category || item.status;
  const imageUrl = mapping?.image
    ? get(item, mapping.image)
    : item.image || item.imageUrl || item.avatar || item.url || item.sprite;
  const description = mapping?.description
    ? get(item, mapping.description)
    : item.description || item.bio || item.summary || item.text;

  // Filter out complex objects for simple display
  const simpleFields = Object.entries(item)
    .filter(
      ([k, v]) =>
        k !== "id" &&
        k !== "__typename" &&
        typeof v !== "object" &&
        k !== "name" &&
        k !== "title" &&
        k !== "description" &&
        k !== "image" &&
        k !== "imageUrl"
    )
    .slice(0, 4); // Limit to 4 extra fields

  return (
    <Card className="max-w-[400px] min-w-[280px]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg capitalize">
              {String(title || "Unknown")}
            </CardTitle>
            {subtitle && (
              <CardDescription className="capitalize">
                {String(subtitle)}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {imageUrl && typeof imageUrl === "string" && (
          <div className="bg-muted/20 relative mb-4 h-[150px] w-full rounded-md">
            <Image
              src={imageUrl}
              alt={String(title)}
              fill
              className="object-contain"
            />
          </div>
        )}
        {description && (
          <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
            {String(description)}
          </p>
        )}

        {simpleFields.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {simpleFields.map(([k, v]) => (
              <div key={k}>
                <span className="text-muted-foreground capitalize">{k}: </span>
                <span className="font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Paginated list component
 */
interface PaginatedListProps {
  component: InteractiveComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderItem?: (item: any, index: number) => React.ReactNode;
}

export const PaginatedList = ({
  component,
  renderItem,
}: PaginatedListProps) => {
  const { componentId, props, actions } = component;
  const [currentPage, setCurrentPage] = useState(0);
  const state = useComponentState(componentId);

  const pageSize = props.pageSize || 20;

  // Generic data extraction
  const items = findArrayInData(state.data);

  // Try to find total count
  const totalCount =
    state.data?.count ||
    state.data?.total ||
    state.data?.totalCount ||
    state.data?.pokemons?.count || // Fallback to pokemon heuristic if needed, but risky
    items.length; // If no total count, assume items length (which is wrong for pagination but safest fallback)

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Fetch data on mount or page change
  useEffect(() => {
    if (actions?.fetchData) {
      const paginationAction: Action = {
        type: "pagination",
        actionId: "paginate",
        queryRef: "fetchData",
        pageSize,
        currentPage,
      };
      state.execute(paginationAction, { actions });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultRenderItem = (item: any, index: number) => {
    if (props.renderItem === "json") {
      return (
        <pre key={index} className="bg-muted rounded p-2 text-xs">
          {JSON.stringify(item, null, 2)}
        </pre>
      );
    }
    return (
      <GenericItemCard
        key={index}
        item={item}
        mapping={props.itemPropsMapping}
      />
    );
  };

  return (
    <div className="space-y-4">
      {state.loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      )}

      {state.error && (
        <div className="border-destructive bg-destructive/10 text-destructive rounded-lg border p-4">
          {state.error}
        </div>
      )}

      {!state.loading && !state.error && items.length === 0 && (
        <div className="text-muted-foreground p-8 text-center">
          No items found
        </div>
      )}

      {!state.loading && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {items.map((item: any, index: number) =>
              renderItem
                ? renderItem(item, index)
                : defaultRenderItem(item, index)
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-muted-foreground text-sm">
              Page {currentPage + 1} of {totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePrevious}
                disabled={currentPage === 0 || state.loading}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1 || state.loading}
                variant="outline"
                size="sm"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Searchable list component
 */
interface SearchableListProps {
  component: InteractiveComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderItem?: (item: any, index: number) => React.ReactNode;
}

export const SearchableList = ({
  component,
  renderItem,
}: SearchableListProps) => {
  const { componentId, props, actions } = component;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const state = useComponentState(componentId);

  // Generic data extraction
  const items = findArrayInData(state.data);

  const placeholder = props.placeholder || "Search...";

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get the search variable name from props (defaults to "search")
  const searchVariable = props.searchVariable || "search";

  // Fetch data when search query changes
  useEffect(() => {
    // Only execute search if there's actual text in the search box
    // Empty string searches often return no/null results from GraphQL APIs
    if (
      actions?.fetchData &&
      actions.fetchData.type === "graphql-query" &&
      debouncedQuery.trim().length > 0
    ) {
      const fetchAction = actions.fetchData as GraphQLQueryAction;
      const searchAction: GraphQLQueryAction = {
        ...fetchAction,
        variables: {
          ...fetchAction.variables,
          [searchVariable]: debouncedQuery, // Use detected variable name
        },
      };
      state.execute(searchAction, { actions });
    }
  }, [debouncedQuery, searchVariable]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultRenderItem = (item: any, index: number) => {
    if (props.renderItem === "json") {
      return (
        <pre key={index} className="bg-muted rounded p-2 text-xs">
          {JSON.stringify(item, null, 2)}
        </pre>
      );
    }
    return (
      <GenericItemCard
        key={index}
        item={item}
        mapping={props.itemPropsMapping}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {state.loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      )}

      {state.error && (
        <div className="border-destructive bg-destructive/10 text-destructive rounded-lg border p-4">
          {state.error}
        </div>
      )}

      {!state.loading && items.length === 0 && (
        <div className="text-muted-foreground p-8 text-center">
          {searchQuery ? "No results found" : "Start typing to search"}
        </div>
      )}

      {!state.loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {items.map((item: any, index: number) =>
            renderItem
              ? renderItem(item, index)
              : defaultRenderItem(item, index)
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Data table component
 */
interface DataTableProps {
  component: InteractiveComponent;
}

export const DataTable = ({ component }: DataTableProps) => {
  const { componentId, props, actions } = component;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const state = useComponentState(componentId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = props.columns || ([] as any[]);

  // Generic data extraction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = findArrayInData(state.data);

  // Fetch data on mount
  useEffect(() => {
    if (actions?.fetchData) {
      state.execute(actions.fetchData, { actions });
    }
  }, []);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedItems = [...items].sort((a: any, b: any) => {
    if (!sortColumn) return 0;

    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {state.loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      )}

      {state.error && (
        <div className="border-destructive bg-destructive/10 text-destructive rounded-lg border p-4">
          {state.error}
        </div>
      )}

      {!state.loading && !state.error && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {columns.map((column: any) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-sm font-medium"
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="hover:text-primary flex items-center gap-2"
                      >
                        {column.label}
                        {sortColumn === column.key && (
                          <span className="text-xs">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {sortedItems.map((item: any, index: number) => (
                <tr
                  key={index}
                  className="hover:bg-muted/50 border-t transition-colors"
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {columns.map((column: any) => (
                    <td key={column.key} className="px-4 py-3 text-sm">
                      {String(item[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {sortedItems.length === 0 && (
            <div className="text-muted-foreground p-8 text-center">
              No data available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Re-export ComparisonGrid if you want it (though it was also Pokemon specific).
// For now omitting it or making it generic is complex, better to stick to Lists/Tables/Cards as primary needs.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ComparisonGrid = (props: { component: InteractiveComponent }) => {
  return (
    <div className="border border-dashed p-4 text-gray-400">
      Comparison Grid not yet fully generic. Use Table instead.
    </div>
  );
};
