"use client";

import { useState, useEffect } from "react";
import { useComponentState } from "./UIComponentProvider";
import type {
  InteractiveComponent,
  GraphQLQueryAction,
} from "@/lib/ui-action-schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

/**
 * FilterPanel component - Multi-criteria filtering UI
 */
interface FilterPanelProps {
  component: InteractiveComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderItem?: (item: any, index: number) => React.ReactNode;
}

export const FilterPanel = ({ component, renderItem }: FilterPanelProps) => {
  const { componentId, props, actions } = component;
  const state = useComponentState(componentId);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(true);

  // Extract items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = [];
  if (state.data) {
    if (state.data.pokemon_v2_pokemon) {
      items = state.data.pokemon_v2_pokemon;
    } else if (Array.isArray(state.data.pokemon)) {
      items = state.data.pokemon;
    } else if (state.data.items) {
      items = state.data.items;
    } else if (Array.isArray(state.data)) {
      items = state.data;
    }
  }

  const filterFields = props.filterFields || [];

  // Apply filters
  useEffect(() => {
    if (actions?.fetchData && actions.fetchData.type === "graphql-query") {
      const fetchAction = actions.fetchData as GraphQLQueryAction;
      const filterAction: GraphQLQueryAction = {
        ...fetchAction,
        variables: {
          ...fetchAction.variables,
          ...filters,
        },
      };
      state.execute(filterAction, { actions });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultRenderItem = (item: any, index: number) => {
    const name = item.name || `Item ${index + 1}`;
    const types =
      item.pokemon_v2_pokemontypes?.map(
        (t: { pokemon_v2_type?: { name?: string } }) => t.pokemon_v2_type?.name
      ) ||
      item.types?.map(
        (t: { type?: { name?: string }; name?: string }) =>
          t.type?.name || t.name
      ) ||
      [];

    return (
      <Card key={index} className="max-w-[400px] min-w-[280px]">
        <CardHeader>
          <CardTitle className="capitalize">{name}</CardTitle>
          {types.length > 0 && (
            <div className="mt-2 flex gap-2">
              {types.map((type: string, i: number) => (
                <Badge key={i} variant="secondary" className="capitalize">
                  {type}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters</CardTitle>
              </div>
              <div className="flex gap-2">
                {Object.keys(filters).length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-4 w-4" />
                    Clear
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {filterFields.map((field: any) => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-sm font-medium capitalize">
                      {field.label || field.name}
                    </label>
                    <Input
                      placeholder={
                        field.placeholder || `Filter by ${field.name}...`
                      }
                      value={filters[field.name] || ""}
                      onChange={(e) =>
                        handleFilterChange(field.name, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Results */}
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

      {!state.loading && items.length === 0 && (
        <div className="text-muted-foreground p-8 text-center">
          No items match the current filters
        </div>
      )}
    </div>
  );
};

/**
 * ChartView component - Bar/line charts for distributions and analytics
 */
interface ChartViewProps {
  component: InteractiveComponent;
}

export const ChartView = ({ component }: ChartViewProps) => {
  const { componentId, props, actions } = component;
  const state = useComponentState(componentId);

  // Extract items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = [];
  if (state.data) {
    if (state.data.pokemon_v2_pokemon) {
      items = state.data.pokemon_v2_pokemon;
    } else if (Array.isArray(state.data.pokemon)) {
      items = state.data.pokemon;
    } else if (state.data.items) {
      items = state.data.items;
    } else if (Array.isArray(state.data)) {
      items = state.data;
    }
  }

  // Fetch data on mount
  useEffect(() => {
    if (actions?.fetchData) {
      state.execute(actions.fetchData, { actions });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartField = props.chartField || "value";
  const labelField = props.labelField || "name";
  const chartType = props.chartType || "bar";

  // Calculate max value for scaling
  const maxValue = Math.max(...items.map((item) => item[chartField] || 0), 1);

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

      {!state.loading && !state.error && items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{props.title || "Data Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartType === "bar" && (
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {items.map((item: any, index: number) => {
                  const value = item[chartField] || 0;
                  const label = item[labelField] || `Item ${index + 1}`;
                  const percentage = (value / maxValue) * 100;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{label}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                      <div className="bg-muted h-6 overflow-hidden rounded-md">
                        <div
                          className="bg-primary flex h-full items-center justify-end pr-2 text-xs font-semibold text-white transition-all"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 15 && `${percentage.toFixed(0)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * MatrixView component - Grid layout for relationships (type effectiveness, etc.)
 */
interface MatrixViewProps {
  component: InteractiveComponent;
}

export const MatrixView = ({ component }: MatrixViewProps) => {
  const { componentId, props, actions } = component;
  const state = useComponentState(componentId);

  // Extract items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = [];
  if (state.data) {
    if (state.data.items) {
      items = state.data.items;
    } else if (Array.isArray(state.data)) {
      items = state.data;
    }
  }

  // Fetch data on mount
  useEffect(() => {
    if (actions?.fetchData) {
      state.execute(actions.fetchData, { actions });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowField = props.rowField || "row";
  const colField = props.colField || "col";
  const valueField = props.valueField || "value";

  // Build matrix structure
  const rows = [...new Set(items.map((item) => item[rowField]))];
  const cols = [...new Set(items.map((item) => item[colField]))];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCell = (row: any, col: any) => {
    const cell = items.find(
      (item) => item[rowField] === row && item[colField] === col
    );
    return cell ? cell[valueField] : null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCellColor = (value: any) => {
    if (value === null || value === undefined) return "bg-muted";
    if (typeof value === "number") {
      if (value > 1) return "bg-green-500/20";
      if (value < 1) return "bg-red-500/20";
      return "bg-muted";
    }
    return "bg-primary/10";
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

      {!state.loading && !state.error && items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{props.title || "Relationship Matrix"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-muted border p-2 text-left text-sm font-medium"></th>
                    {cols.map((col, i) => (
                      <th
                        key={i}
                        className="bg-muted border p-2 text-center text-sm font-medium capitalize"
                      >
                        {String(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td className="bg-muted border p-2 text-sm font-medium capitalize">
                        {String(row)}
                      </td>
                      {cols.map((col, j) => {
                        const value = getCell(row, col);
                        return (
                          <td
                            key={j}
                            className={`border p-2 text-center text-sm ${getCellColor(value)}`}
                          >
                            {value !== null && value !== undefined
                              ? String(value)
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * DetailPanel component - Expandable deep-dive view with tabs/sections
 */
interface DetailPanelProps {
  component: InteractiveComponent;
}

export const DetailPanel = ({ component }: DetailPanelProps) => {
  const { componentId, props, actions } = component;
  const state = useComponentState(componentId);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(props.sections?.[0] || "overview");

  // Extract items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = [];
  if (state.data) {
    if (state.data.pokemon_v2_pokemon) {
      items = state.data.pokemon_v2_pokemon;
    } else if (Array.isArray(state.data.pokemon)) {
      items = state.data.pokemon;
    } else if (state.data.items) {
      items = state.data.items;
    } else if (Array.isArray(state.data)) {
      items = state.data;
    }
  }

  // Fetch data on mount
  useEffect(() => {
    if (actions?.fetchData) {
      state.execute(actions.fetchData, { actions });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedItem = items[selectedIndex];
  const sections = props.sections || ["overview", "details"];

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

      {!state.loading && !state.error && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Item list */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {items.map((item: any, index: number) => (
                <Button
                  key={index}
                  variant={selectedIndex === index ? "default" : "ghost"}
                  className="w-full justify-start capitalize"
                  onClick={() => setSelectedIndex(index)}
                >
                  {item.name || `Item ${index + 1}`}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Detail view */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="capitalize">
                {selectedItem?.name || "Details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  {sections.map((section: string) => (
                    <TabsTrigger
                      key={section}
                      value={section}
                      className="capitalize"
                    >
                      {section}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {sections.map((section: string) => (
                  <TabsContent
                    key={section}
                    value={section}
                    className="space-y-4"
                  >
                    <div className="rounded-lg border p-4">
                      <pre className="overflow-auto text-xs">
                        {JSON.stringify(selectedItem, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
