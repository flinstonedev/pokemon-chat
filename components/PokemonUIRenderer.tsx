"use client";

import React from "react";
import type { PokemonUIElement } from "@/lib/pokemon-ui-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PokemonUIRendererProps {
  elements: PokemonUIElement[];
  onAction?: (actionId: string, payload?: unknown) => void;
}

/**
 * Renders Pokemon UI elements from the schema
 */
export function PokemonUIRenderer({
  elements,
  onAction,
}: PokemonUIRendererProps) {
  return (
    <div className="space-y-4">
      {elements.map((element, index) => (
        <ElementRenderer
          key={element.id || index}
          element={element}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

interface ElementRendererProps {
  element: PokemonUIElement;
  onAction?: (actionId: string, payload?: unknown) => void;
}

function ElementRenderer({ element, onAction }: ElementRendererProps) {
  switch (element.type) {
    case "pokemon-card":
      return <PokemonCardRenderer {...element.props} />;

    case "pokemon-stat":
      return <PokemonStatRenderer {...element.props} />;

    case "pokemon-stats-panel":
      return <PokemonStatsPanelRenderer {...element.props} />;

    case "pokemon-type":
      return <PokemonTypeRenderer typeName={element.props.typeName} />;

    case "pokemon-evolution":
      return (
        <PokemonEvolutionRenderer
          evolutionChain={element.props.evolutionChain}
        />
      );

    case "pokemon-moves":
      return <PokemonMovesRenderer moves={element.props.moves} />;

    case "text":
      return <TextRenderer {...element.props} />;

    case "heading":
      return <HeadingRenderer {...element.props} />;

    case "button":
      return (
        <ButtonRenderer
          {...element.props}
          onClick={() =>
            element.props.actionId && onAction?.(element.props.actionId)
          }
        />
      );

    case "list":
      return <ListRenderer items={element.props.items} />;

    case "table":
      return <TableRenderer {...element.props} />;

    case "code":
      return <CodeRenderer {...element.props} />;

    case "container":
      return (
        <ContainerRenderer {...element.props} onAction={onAction}>
          {"children" in element &&
            element.children?.map((child: PokemonUIElement, index: number) => (
              <ElementRenderer
                key={child.id || index}
                element={child}
                onAction={onAction}
              />
            ))}
        </ContainerRenderer>
      );

    default:
      return null;
  }
}

// Pokemon-specific renderers
function PokemonCardRenderer({
  name,
  number,
  imageUrl,
  types,
  description,
}: {
  name: string;
  number?: number;
  imageUrl?: string;
  types: string[];
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            {name}
            {number && (
              <span className="text-muted-foreground ml-2">#{number}</span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {types.map((type) => (
              <PokemonTypeRenderer key={type} typeName={type} />
            ))}
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {imageUrl && (
        <CardContent>
          <div className="flex justify-center">
            <Image
              src={imageUrl}
              alt={name}
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function PokemonStatRenderer({
  name,
  value,
  maxValue = 255,
}: {
  name: string;
  value: number;
  maxValue?: number;
  color?: string;
}) {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

function PokemonStatsPanelRenderer({
  pokemonName,
  stats,
}: {
  pokemonName: string;
  stats: Array<{ name: string; value: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{pokemonName} Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <PokemonStatRenderer key={stat.name} {...stat} />
        ))}
      </CardContent>
    </Card>
  );
}

function PokemonTypeRenderer({ typeName }: { typeName: string }) {
  const typeColors: Record<string, string> = {
    normal: "bg-gray-400",
    fire: "bg-red-500",
    water: "bg-blue-500",
    electric: "bg-yellow-400",
    grass: "bg-green-500",
    ice: "bg-cyan-400",
    fighting: "bg-orange-700",
    poison: "bg-purple-500",
    ground: "bg-yellow-600",
    flying: "bg-indigo-400",
    psychic: "bg-pink-500",
    bug: "bg-lime-500",
    rock: "bg-yellow-700",
    ghost: "bg-purple-700",
    dragon: "bg-indigo-600",
    dark: "bg-gray-700",
    steel: "bg-gray-500",
    fairy: "bg-pink-300",
  };

  const colorClass = typeColors[typeName.toLowerCase()] || "bg-gray-400";

  return (
    <Badge className={`${colorClass} text-white capitalize`}>{typeName}</Badge>
  );
}

function PokemonEvolutionRenderer({
  evolutionChain,
}: {
  evolutionChain: Array<{
    name: string;
    level?: number;
    method?: string;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolution Chain</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {evolutionChain.map((evolution, index) => (
            <React.Fragment key={evolution.name}>
              <div className="text-center">
                <div className="text-lg font-semibold capitalize">
                  {evolution.name}
                </div>
                {evolution.level && (
                  <div className="text-muted-foreground text-sm">
                    Level {evolution.level}
                  </div>
                )}
                {evolution.method && (
                  <div className="text-muted-foreground text-xs">
                    {evolution.method}
                  </div>
                )}
              </div>
              {index < evolutionChain.length - 1 && (
                <div className="text-muted-foreground text-2xl">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PokemonMovesRenderer({
  moves,
}: {
  moves: Array<{
    name: string;
    type: string;
    power?: number;
    accuracy?: number;
    description?: string;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Moves</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {moves.map((move) => (
            <div
              key={move.name}
              className="border-border/50 flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex-1">
                <div className="font-medium capitalize">{move.name}</div>
                {move.description && (
                  <div className="text-muted-foreground text-sm">
                    {move.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <PokemonTypeRenderer typeName={move.type} />
                {move.power && (
                  <span className="text-muted-foreground">
                    Power: {move.power}
                  </span>
                )}
                {move.accuracy && (
                  <span className="text-muted-foreground">
                    Acc: {move.accuracy}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Generic renderers
function TextRenderer({
  text,
  variant = "body",
}: {
  text: string;
  variant?: "body" | "muted" | "caption";
}) {
  const variantClasses = {
    body: "text-base",
    muted: "text-muted-foreground text-sm",
    caption: "text-muted-foreground text-xs",
  };

  return <p className={variantClasses[variant]}>{text}</p>;
}

function HeadingRenderer({
  text,
  level = 2,
}: {
  text: string;
  level?: number;
}) {
  const sizeClasses = {
    1: "text-3xl font-bold",
    2: "text-2xl font-bold",
    3: "text-xl font-bold",
    4: "text-lg font-bold",
  };

  const className =
    sizeClasses[level as keyof typeof sizeClasses] || sizeClasses[2];

  if (level === 1) return <h1 className={className}>{text}</h1>;
  if (level === 3) return <h3 className={className}>{text}</h3>;
  if (level === 4) return <h4 className={className}>{text}</h4>;
  return <h2 className={className}>{text}</h2>;
}

function ButtonRenderer({
  label,
  variant = "primary",
  onClick,
}: {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
}) {
  const variantMap = {
    primary: "default",
    secondary: "secondary",
    danger: "destructive",
  } as const;

  return (
    <Button variant={variantMap[variant]} onClick={onClick}>
      {label}
    </Button>
  );
}

function ListRenderer({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-6">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function TableRenderer({
  columns,
  rows,
}: {
  columns: Array<{ key: string; header: string }>;
  rows: Array<Record<string, unknown>>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2">
                  {String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeRenderer({
  code,
  language = "txt",
}: {
  code: string;
  language?: string;
}) {
  return (
    <pre className="bg-muted overflow-x-auto rounded-lg p-4">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
}

function ContainerRenderer({
  direction = "column",
  gap = 12,
  align = "start",
  justify = "start",
  children,
}: {
  direction?: "row" | "column";
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  children?: React.ReactNode;
  onAction?: (actionId: string, payload?: unknown) => void;
}) {
  const directionClass = direction === "row" ? "flex-row" : "flex-col";
  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  }[align];
  const justifyClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  }[justify];

  return (
    <div
      className={`flex ${directionClass} ${alignClass} ${justifyClass}`}
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
}
