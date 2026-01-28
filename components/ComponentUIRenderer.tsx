import React, { createContext, useContext, useState } from "react";
import {
  UIComponent,
  TableColumn,
  DetailField,
  Metric,
} from "@/lib/generic-ui-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import _ from "lodash";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// --- Context ---

interface RenderContextType {
  data: Record<string, unknown>; // The root data object
  selectedItem: Record<string, unknown> | null; // Currently selected item (for Master-Detail)
  onSelect: (item: Record<string, unknown>) => void;
}

const RenderContext = createContext<RenderContextType>({
  data: {},
  selectedItem: null,
  onSelect: () => {},
});

// --- Renderer ---

interface Props {
  component: UIComponent;
  data: Record<string, unknown>;
  className?: string;
}

export function ComponentUIRenderer({ component, data, className }: Props) {
  // Local state for this renderer instance (mostly for top-level selection)
  const [selectedItem, setSelectedItem] = useState<Record<
    string,
    unknown
  > | null>(null);

  return (
    <RenderContext.Provider
      value={{
        data,
        selectedItem,
        onSelect: setSelectedItem,
      }}
    >
      <div className={cn("h-full w-full", className)}>
        <RecursiveRenderer component={component} />
      </div>
    </RenderContext.Provider>
  );
}

function RecursiveRenderer({ component }: { component: UIComponent }) {
  const ctx = useContext(RenderContext);

  if (!component) return null;

  switch (component.type) {
    // --- Layouts ---
    case "layout-stack":
      return (
        <div
          className={cn(
            "flex gap-4",
            component.direction === "horizontal" ? "flex-row" : "flex-col"
          )}
        >
          {component.children.map((child: UIComponent, i: number) => (
            <RecursiveRenderer key={i} component={child} />
          ))}
        </div>
      );

    case "layout-grid":
      return (
        <div
          className={`grid grid-cols-1 gap-4 md:grid-cols-${component.columns || 2}`}
        >
          {component.items.map((child: UIComponent, i: number) => (
            <RecursiveRenderer key={i} component={child} />
          ))}
        </div>
      );

    case "layout-split":
      return (
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[600px] rounded-lg border"
        >
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="bg-muted/10 h-full border-r p-4">
              <RecursiveRenderer component={component.left} />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60}>
            <div className="h-full p-6">
              <RecursiveRenderer component={component.right} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

    // --- Widgets ---

    case "data-list": {
      const listData = _.get(ctx.data, component.dataKey, []) as Record<
        string,
        unknown
      >[];
      if (!Array.isArray(listData) || listData.length === 0) {
        return <div className="text-muted-foreground p-4">No data found</div>;
      }

      return (
        <div className="space-y-2">
          {component.title && (
            <h3 className="mb-2 font-semibold">{component.title}</h3>
          )}
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 pr-4">
              {listData.map((item: Record<string, unknown>, i: number) => {
                const imgSrc = component.itemImageKey
                  ? _.get(item, component.itemImageKey)
                  : null;
                return (
                  <div
                    key={i}
                    className={cn(
                      "hover:bg-accent flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                      ctx.selectedItem === item
                        ? "bg-accent border-primary"
                        : "bg-card"
                    )}
                    onClick={() => ctx.onSelect(item)}
                  >
                    {typeof imgSrc === "string" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgSrc}
                        alt="Thumbnail"
                        className="bg-muted h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">
                        {String(_.get(item, component.itemTitleKey, "Unknown"))}
                      </div>
                      {component.itemSubtitleKey && (
                        <div className="text-muted-foreground text-xs">
                          {String(_.get(item, component.itemSubtitleKey) ?? "")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      );
    }

    case "data-table": {
      const tableData = _.get(ctx.data, component.dataKey, []) as Record<
        string,
        unknown
      >[];
      return (
        <Card>
          <CardHeader>
            {component.title && <CardTitle>{component.title}</CardTitle>}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {component.columns.map((col: TableColumn, i: number) => (
                    <TableHead key={i}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData
                  .slice(0, 50)
                  .map((row: Record<string, unknown>, i: number) => (
                    <TableRow key={i}>
                      {component.columns.map((col: TableColumn, j: number) => (
                        <TableCell key={j}>{renderCell(row, col)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    case "data-detail": {
      // Resolve data: either root data + dataKey OR selectedItem
      const detailData =
        component.dataKey === "selectedItem"
          ? ctx.selectedItem
          : (_.get(ctx.data, component.dataKey) as Record<
              string,
              unknown
            > | null);

      if (!detailData) {
        return (
          <div className="text-muted-foreground flex h-full items-center justify-center rounded-lg border-2 border-dashed">
            Select an item to view details
          </div>
        );
      }

      return (
        <Card className="h-full border-none shadow-none">
          <CardHeader>
            <CardTitle>{component.title || "Details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {component.fields.map((field: DetailField, i: number) => (
              <div key={i}>
                <h4 className="text-muted-foreground text-sm font-medium">
                  {field.label}
                </h4>
                <div className="mt-1">{renderField(detailData, field)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    case "stats-grid":
      return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {component.metrics.map((m: Metric, i: number) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{m.value}</div>
                <div className="text-muted-foreground text-xs">{m.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    default:
      return <div>Unknown Component Type</div>;
  }
}

// Helpers

function renderCell(row: Record<string, unknown>, col: TableColumn) {
  const val = _.get(row, col.key);
  if (col.format === "image" && typeof val === "string") {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={val} alt="Cell" className="h-8 w-8 rounded object-cover" />
    );
  }
  return String(val ?? "");
}

function renderField(data: Record<string, unknown>, field: DetailField) {
  const val = _.get(data, field.key);
  if (field.type === "image" && typeof val === "string") {
    /* eslint-disable-next-line @next/next/no-img-element */
    return (
      <img
        src={val}
        alt={field.label}
        className="w-full max-w-[200px] rounded-lg border shadow-sm"
      />
    );
  }
  if (field.type === "json") {
    return (
      <pre className="bg-muted overflow-auto rounded p-2 text-xs">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  }
  return <div className="text-lg">{String(val ?? "")}</div>;
}
