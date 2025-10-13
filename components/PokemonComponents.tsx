"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Star, Zap, Heart, Sword } from "lucide-react";

interface PokemonListProps {
    data: Record<string, unknown>;
    query: string;
}

interface PokemonDetailsProps {
    data: Record<string, unknown>;
    query: string;
}

interface PokemonErrorProps {
    error: string;
    query: string;
}

// Helper function to safely get nested values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeGet = (obj: any, path: string, defaultValue: unknown = null) => {
    try {
        return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
    } catch {
        return defaultValue;
    }
};

// Helper function to capitalize first letter
const capitalize = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export function PokemonList({ data, query }: PokemonListProps) {
    // Handle different possible data structures
    const dataObj = data as Record<string, unknown>;
    const dataData = dataObj?.data as Record<string, unknown> | undefined;
    const pokemonList = dataData?.pokemon || dataData?.pokemons || dataObj?.pokemon || dataObj?.pokemons || [];

    if (!Array.isArray(pokemonList) || pokemonList.length === 0) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    No Pokemon Found
                </CardTitle>
                <CardDescription>Query: {query}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No Pokemon data available in the response.</p>
            </CardContent>
        </Card>
    );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-chart-5" />
                    Pokemon List ({pokemonList.length})
                </CardTitle>
                <CardDescription>Query: {query}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    {pokemonList.slice(0, 20).map((pokemon: Record<string, unknown>, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                    {pokemon.image ? (
                                        <Image src={pokemon.image as string} alt={(pokemon.name as string) || 'Pokemon'} width={40} height={40} className="w-10 h-10 object-contain" />
                                    ) : (
                                        <span className="text-2xl">🎮</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {capitalize(safeGet(pokemon, 'name', `Pokemon ${index + 1}`))}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {safeGet(pokemon, 'id', 'N/A')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {(safeGet(pokemon, 'types', []) as unknown[]).map((type: unknown, typeIndex: number) => {
                                    const typeObj = type as Record<string, unknown> | string;
                                    const typeRecord = typeof typeObj === 'object' ? typeObj : null;
                                    const typeName = typeof typeObj === 'string' ? typeObj : String((typeRecord?.type as Record<string, unknown>)?.name || typeRecord?.name || typeObj);
                                    return (
                                        <Badge key={`pokemon-type-${typeName}-${typeIndex}`} variant="secondary" className="capitalize">
                                            {typeName}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {pokemonList.length > 20 && (
                        <p className="text-sm text-muted-foreground text-center">
                            Showing first 20 of {pokemonList.length} Pokemon
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function PokemonDetails({ data, query }: PokemonDetailsProps) {
    const dataObj = data as Record<string, unknown>;
    const dataData = dataObj?.data as Record<string, unknown> | undefined;
    const pokemon = dataData?.pokemon || dataObj?.pokemon || dataObj;

    if (!pokemon) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        No Pokemon Details
                    </CardTitle>
                    <CardDescription>Query: {query}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No Pokemon details available in the response.</p>
                </CardContent>
            </Card>
        );
    }

    const name = capitalize(safeGet(pokemon, 'name', 'Unknown Pokemon'));
    const id = safeGet(pokemon, 'id', 'N/A');
    const types = safeGet(pokemon, 'types', []);
    const stats = safeGet(pokemon, 'stats', []);
    const abilities = safeGet(pokemon, 'abilities', []);
    const height = safeGet(pokemon, 'height', 'N/A');
    const weight = safeGet(pokemon, 'weight', 'N/A');
    const image = safeGet(pokemon, 'sprites.front_default', null) || safeGet(pokemon, 'image', null);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-chart-5" />
                    {name}
                </CardTitle>
                <CardDescription>Query: {query}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                        {image ? (
                            <Image src={image as string} alt={name} width={80} height={80} className="w-20 h-20 object-contain" />
                        ) : (
                            <span className="text-4xl">🎮</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">ID</p>
                                <p className="font-semibold">{id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Height</p>
                                <p className="font-semibold">{height}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Weight</p>
                                <p className="font-semibold">{weight}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Types</p>
                                <div className="flex gap-1">
                                    {(types as unknown[]).map((type: unknown, index: number) => {
                                        const typeObj = type as Record<string, unknown> | string;
                                        const typeRecord = typeof typeObj === 'object' ? typeObj : null;
                                        const typeName = typeof typeObj === 'string' ? typeObj : String((typeRecord?.type as Record<string, unknown>)?.name || typeRecord?.name || typeObj);
                                        return (
                                            <Badge key={`type-${typeName}-${index}`} variant="secondary" className="capitalize">
                                                {typeName}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {abilities.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                Abilities
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {(abilities as Record<string, unknown>[]).map((ability: Record<string, unknown>, index: number) => {
                                    const abilityName = String((ability.ability as Record<string, unknown>)?.name || ability.name || ability);
                                    const uniqueKey = `ability-${abilityName}-${index}`;
                                    return (
                                        <div key={uniqueKey} className="p-2 bg-muted/30 rounded">
                                            <p className="font-medium capitalize">
                                                {abilityName}
                                            </p>
                                            {Boolean(ability.is_hidden) && (
                                                <Badge variant="outline" className="text-xs mt-1">Hidden</Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {stats.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Heart className="h-4 w-4" />
                                Stats
                            </h4>
                            <div className="grid gap-2">
                                {(stats as Record<string, unknown>[]).map((stat: Record<string, unknown>, index: number) => {
                                    const statName = String((stat.stat as Record<string, unknown>)?.name || stat.name || `Stat ${index + 1}`);
                                    const statValue = Number(stat.base_stat || stat.value || 0);
                                    const percentage = Math.min((statValue / 255) * 100, 100);
                                    const uniqueKey = `stat-${statName.replace(/\s+/g, '-')}-${index}`;

                                    return (
                                        <div key={uniqueKey} className="flex items-center gap-3">
                                            <div className="w-20 text-sm font-medium capitalize">
                                                {statName}
                                            </div>
                                            <div className="flex-1 bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="w-12 text-sm font-semibold text-right">
                                                {statValue}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export function PokemonError({ error, query }: PokemonErrorProps) {
    return (
        <Card className="w-full border-destructive/50 bg-destructive/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Error
                </CardTitle>
                <CardDescription>Query: {query}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
            </CardContent>
        </Card>
    );
}

export function PokemonGeneric({ data, query }: { data: Record<string, unknown>; query: string }) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sword className="h-5 w-5" />
                    Pokemon Data
                </CardTitle>
                <CardDescription>Query: {query}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
} 