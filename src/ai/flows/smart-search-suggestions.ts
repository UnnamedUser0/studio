'use server';

/**
 * @fileOverview Implements a smart search suggestion flow for pizzerias in Hermosillo.
 * This flow now includes geocoding capabilities to handle address-based queries.
 *
 * - `getSmartSearchSuggestions` - A function that takes a search query and returns intelligent suggestions for pizzerias, including coordinates for address queries.
 * - `SmartSearchSuggestionsInput` - The input type for the `getSmartSearchSuggestions` function.
 * - `SmartSearchSuggestionsOutput` - The return type for the `getSmartSearchSuggestions` function.
 */

import { ai } from '@/ai/genkit';
import { geocodeAddressTool } from '@/ai/tools/geocode-address-tool';
import { z } from 'genkit';

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
  return smartSearchSuggestionsFlow(input);
}

const smartSearchSuggestionsPrompt = ai.definePrompt({
  name: 'smartSearchSuggestionsPrompt',
  input: { schema: SmartSearchSuggestionsInputSchema },
  output: { schema: SmartSearchSuggestionsOutputSchema },
  tools: [geocodeAddressTool],
  prompt: `You are an AI assistant for a pizza finder app in Hermosillo, Sonora. Your goal is to provide intelligent search suggestions.

  Analyze the user's query: "{{{query}}}"

  1.  **If the query looks like a specific pizzeria name, part of a name, or a type of pizza (e.g., "Pepperoni", "Pizza Roma", "Hawaiana"):**
      - Generate a list of relevant suggestion strings.
      - Examples: "Pizzería (nombre)", "Pizzerías con (ingrediente)", "Pizzerías en colonia (nombre)".
      - The geocode field should be null.

  2.  **If the query looks like a street address, a neighborhood, or a point of interest in Hermosillo (e.g., "Blvd. Kino", "Colonia Pitic", "Catedral de Hermosillo"):**
      - Use the \`geocodeAddressTool\` to get the coordinates for that location.
      - Your primary suggestion should be a user-friendly version of the identified address (e.g., "Pizzerías cerca de Catedral de Hermosillo").
      - The geocode field in the output MUST be populated with the latitude and longitude from the tool.

  Your response must always be in the specified JSON format.`,
});

const smartSearchSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartSearchSuggestionsFlow',
    inputSchema: SmartSearchSuggestionsInputSchema,
    outputSchema: SmartSearchSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await smartSearchSuggestionsPrompt(input);
    return output!;
  }
);
