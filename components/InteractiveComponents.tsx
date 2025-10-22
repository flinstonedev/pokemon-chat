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
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

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

  // Handle various Pokemon API response structures
  let items = [];
  if (state.data) {
    // Check for pokemons.results (custom GraphQL Pokedex structure - plural)
    if (state.data.pokemons?.results) {
      items = state.data.pokemons.results;
    }
    // Check for pokemon.results (custom GraphQL Pokedex structure - singular with results)
    else if (state.data.pokemon?.results) {
      items = state.data.pokemon.results;
    }
    // Check for pokemon as a single object (not .results) - MUST have valid id (not null)
    else if (
      state.data.pokemon &&
      typeof state.data.pokemon === "object" &&
      !Array.isArray(state.data.pokemon) &&
      state.data.pokemon.id !== null &&
      state.data.pokemon.id !== undefined
    ) {
      items = [state.data.pokemon];
    }
    // Check for pokemon as an array
    else if (Array.isArray(state.data.pokemon)) {
      items = state.data.pokemon;
    }
    // Check for pokemon_v2_pokemon (beta.pokeapi.co structure)
    else if (state.data.pokemon_v2_pokemon) {
      items = state.data.pokemon_v2_pokemon;
    } else if (state.data.items) {
      items = state.data.items;
    } else if (Array.isArray(state.data)) {
      items = state.data;
    }
  }

  const totalCount = state.data?.pokemons?.count || state.data?.pokemon?.count || state.data?.totalCount || items.length;
  const totalPages = Math.ceil(totalCount / pageSize);

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

  // Default render function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultRenderItem = (item: any, index: number) => {
    if (props.renderItem === "pokemon-card") {
      // Extract Pokemon data from API structure
      const name = item.name || "Pokemon";
      const pokemonId = item.id || index + 1;

      // Extract types from Pokemon API structure
      let types: string[] = [];
      if (item.pokemon_v2_pokemontypes) {
        types = item.pokemon_v2_pokemontypes.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) => t.pokemon_v2_type?.name || "unknown"
        );
      } else if (item.types) {
        // Handle types as array of objects with {slot, type: {name}}
        const typeArray = Array.isArray(item.types) ? item.types : [item.types];
        types = typeArray.map((t: any) => {
          if (typeof t === 'string') return t;
          if (t?.type?.name) return t.type.name;
          if (t?.name) return t.name;
          return "unknown";
        });
      }

      return (
        <Card key={index} className="max-w-[400px] min-w-[280px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">{name}</CardTitle>
              <span className="text-muted-foreground text-sm">
                #{pokemonId}
              </span>
            </div>
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
          {item.description && (
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </CardContent>
          )}
        </Card>
      );
    }
    return (
      <div key={index} className="bg-card rounded-lg border p-4">
        <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
      </div>
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
              Page {currentPage + 1} of {totalPages || 1} ({totalCount} total)
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

  // Handle various Pokemon API response structures
  let items = [];
  if (state.data) {
    console.log("[SearchableList] Raw state.data:", state.data);
    console.log("[SearchableList] Checking data structure:", {
      hasPokemons: !!state.data.pokemons,
      hasPokemonsResults: !!state.data.pokemons?.results,
      hasPokemonV2: !!state.data.pokemon_v2_pokemon,
      hasItems: !!state.data.items,
      isArray: Array.isArray(state.data),
    });

    // Check for pokemons.results (custom GraphQL Pokedex structure - plural)
    if (state.data.pokemons?.results) {
      items = state.data.pokemons.results;
      console.log("[SearchableList] Using pokemons.results, count:", items.length);
    }
    // Check for pokemon.results (custom GraphQL Pokedex structure - singular with results)
    else if (state.data.pokemon?.results) {
      items = state.data.pokemon.results;
      console.log("[SearchableList] Using pokemon.results, count:", items.length);
    }
    // Check for pokemon as a single object (not .results) - MUST have valid id (not null)
    else if (
      state.data.pokemon &&
      typeof state.data.pokemon === "object" &&
      !Array.isArray(state.data.pokemon) &&
      state.data.pokemon.id !== null &&
      state.data.pokemon.id !== undefined
    ) {
      items = [state.data.pokemon];
      console.log("[SearchableList] Using pokemon as single object");
    }
    // Check for pokemon as an array
    else if (Array.isArray(state.data.pokemon)) {
      items = state.data.pokemon;
      console.log("[SearchableList] Using pokemon as array, count:", items.length);
    }
    // Check for pokemon_v2_pokemon (beta.pokeapi.co structure)
    else if (state.data.pokemon_v2_pokemon) {
      items = state.data.pokemon_v2_pokemon;
      console.log("[SearchableList] Using pokemon_v2_pokemon, count:", items.length);
    } else if (state.data.items) {
      items = state.data.items;
      console.log("[SearchableList] Using items, count:", items.length);
    } else if (Array.isArray(state.data)) {
      items = state.data;
      console.log("[SearchableList] Using array, count:", items.length);
    } else {
      console.warn("[SearchableList] Could not find items in data structure");
    }
  } else {
    console.log("[SearchableList] state.data is null/undefined");
  }
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
    if (actions?.fetchData && actions.fetchData.type === "graphql-query" && debouncedQuery.trim().length > 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, searchVariable]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultRenderItem = (item: any, index: number) => {
    if (props.renderItem === "pokemon-card") {
      // Extract Pokemon data from API structure
      const name = item.name || "Pokemon";
      const pokemonId = item.id || index + 1;

      // Extract types from Pokemon API structure
      let types: string[] = [];
      if (item.pokemon_v2_pokemontypes) {
        types = item.pokemon_v2_pokemontypes.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) => t.pokemon_v2_type?.name || "unknown"
        );
      } else if (item.types) {
        // Handle types as array of objects with {slot, type: {name}}
        const typeArray = Array.isArray(item.types) ? item.types : [item.types];
        types = typeArray.map((t: any) => {
          if (typeof t === 'string') return t;
          if (t?.type?.name) return t.type.name;
          if (t?.name) return t.name;
          return "unknown";
        });
      }

      return (
        <Card key={index} className="max-w-[400px] min-w-[280px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">{name}</CardTitle>
              <span className="text-muted-foreground text-sm">
                #{pokemonId}
              </span>
            </div>
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
          {item.description && (
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </CardContent>
          )}
        </Card>
      );
    }
    return (
      <div key={index} className="bg-card rounded-lg border p-4">
        <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
      </div>
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

  // Handle various Pokemon API response structures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = [];
  if (state.data) {
    // Check for pokemons.results (custom GraphQL Pokedex structure - plural)
    if (state.data.pokemons?.results) {
      items = state.data.pokemons.results;
    }
    // Check for pokemon.results (custom GraphQL Pokedex structure - singular with results)
    else if (state.data.pokemon?.results) {
      items = state.data.pokemon.results;
    }
    // Check for pokemon as a single object (not .results) - MUST have valid id (not null)
    else if (
      state.data.pokemon &&
      typeof state.data.pokemon === "object" &&
      !Array.isArray(state.data.pokemon) &&
      state.data.pokemon.id !== null &&
      state.data.pokemon.id !== undefined
    ) {
      items = [state.data.pokemon];
    }
    // Check for pokemon as an array
    else if (Array.isArray(state.data.pokemon)) {
      items = state.data.pokemon;
    }
    // Check for pokemon_v2_pokemon (beta.pokeapi.co structure)
    else if (state.data.pokemon_v2_pokemon) {
      items = state.data.pokemon_v2_pokemon;
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
                      {item[column.key]}
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
