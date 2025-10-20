"use client";

import type { InteractiveComponent } from "@/lib/ui-action-schema";
import {
  PaginatedList,
  SearchableList,
  DataTable,
} from "./InteractiveComponents";
import { PokemonUIRenderer } from "./PokemonUIRenderer";

/**
 * Enhanced UI renderer that supports both static and interactive components
 */
interface InteractiveUIRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[];
}

export const InteractiveUIRenderer = ({
  elements,
}: InteractiveUIRendererProps) => {
  if (!elements || elements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {elements.map((element, index) => (
        <RenderElement key={index} element={element} />
      ))}
    </div>
  );
};

/**
 * Renders a single element (static or interactive)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RenderElement = ({ element }: { element: any }) => {
  // Known interactive component types
  const interactiveTypes = ["paginated-list", "searchable-list", "data-table"];
  
  // Check if it's an interactive component:
  // - Has componentId AND (has actions OR is a known interactive type)
  const isInteractive =
    element.componentId &&
    (element.actions ||
      interactiveTypes.includes(element.type) ||
      interactiveTypes.includes(element.component));

  if (isInteractive) {
    return (
      <RenderInteractiveComponent component={element as InteractiveComponent} />
    );
  }

  // Otherwise, render as a static Pokemon UI element
  return <PokemonUIRenderer elements={[element]} />;
};

/**
 * Renders an interactive component
 */
const RenderInteractiveComponent = ({
  component,
}: {
  component: InteractiveComponent;
}) => {
  switch (component.component) {
    case "paginated-list":
      return <PaginatedList component={component} />;

    case "searchable-list":
      return <SearchableList component={component} />;

    case "data-table":
      return <DataTable component={component} />;

    default:
      // Fallback to static rendering
      return <PokemonUIRenderer elements={[component]} />;
  }
};
