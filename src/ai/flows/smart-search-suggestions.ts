'use server';

/**
 * @fileOverview Implements a smart search suggestion flow for pizzerias in Hermosillo.
 * This flow now uses local logic to avoid API rate limits.
 */

import { z } from 'genkit';
import { pizzeriasData } from '@/lib/pizzerias-data';

const SmartSearchSuggestionsInputSchema = z.object({
  query: z.string().describe('The search query entered by the user.'),
});
export type SmartSearchSuggestionsInput = z.infer<typeof SmartSearchSuggestionsInputSchema>;

const GeocodeSchema = z.object({
  lat: z.number().describe('The latitude of the geocoded address.'),
  lng: z.number().describe('The longitude of the geocoded address.'),
}).optional();

const SmartSearchSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of intelligent search suggestions for pizzerias.'),
  geocode: GeocodeSchema,
});
export type SmartSearchSuggestionsOutput = z.infer<typeof SmartSearchSuggestionsOutputSchema>;


export async function getSmartSearchSuggestions(input: SmartSearchSuggestionsInput): Promise<SmartSearchSuggestionsOutput> {
  const query = input.query.toLowerCase();
  const suggestions: string[] = [];
  let geocode: { lat: number, lng: number } | undefined = undefined;

  // Simple local logic
  if (query.length < 2) {
    return { suggestions: [], geocode: undefined };
  }

  // Check for pizzeria names
  const matchingPizzerias = pizzeriasData.filter(p => p.name.toLowerCase().includes(query));
  matchingPizzerias.slice(0, 3).forEach(p => {
    suggestions.push(p.name);
  });

  // Check for common terms
  if (query.includes('pep')) suggestions.push('Pizza de Pepperoni');
  if (query.includes('haw')) suggestions.push('Pizza Hawaiana');
  if (query.includes('mex')) suggestions.push('Pizza Mexicana');
  if (query.includes('veg')) suggestions.push('Pizza Vegetariana');

  // Mock geocoding for specific Hermosillo locations (optional, can be expanded)
  if (query.includes('centro')) {
    suggestions.push('Pizzerías cerca del Centro');
    geocode = { lat: 29.072967, lng: -110.955919 };
  } else if (query.includes('pitic')) {
    suggestions.push('Pizzerías en Colonia Pitic');
    geocode = { lat: 29.0963, lng: -110.957 };
  }

  // Deduplicate
  const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 5);

  return {
    suggestions: uniqueSuggestions,
    geocode
  };
}
