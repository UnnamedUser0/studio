'use server';

/**
 * @fileOverview Implements a smart search suggestion flow for pizzerias in Hermosillo.
 *
 * - `getSmartSearchSuggestions` - A function that takes a search query and returns intelligent suggestions for pizzerias.
 * - `SmartSearchSuggestionsInput` - The input type for the `getSmartSearchSuggestions` function.
 * - `SmartSearchSuggestionsOutput` - The return type for the `getSmartSearchSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSearchSuggestionsInputSchema = z.object({
  query: z.string().describe('The search query entered by the user.'),
});
export type SmartSearchSuggestionsInput = z.infer<typeof SmartSearchSuggestionsInputSchema>;

const SmartSearchSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of intelligent search suggestions for pizzerias.'),
});
export type SmartSearchSuggestionsOutput = z.infer<typeof SmartSearchSuggestionsOutputSchema>;

export async function getSmartSearchSuggestions(input: SmartSearchSuggestionsInput): Promise<SmartSearchSuggestionsOutput> {
  return smartSearchSuggestionsFlow(input);
}

const smartSearchSuggestionsPrompt = ai.definePrompt({
  name: 'smartSearchSuggestionsPrompt',
  input: {schema: SmartSearchSuggestionsInputSchema},
  output: {schema: SmartSearchSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to provide intelligent search suggestions for pizzerias in Hermosillo, Sonora.

  Based on the user's query, generate an array of suggestions that can help them quickly find the pizzeria they are looking for, even if they misspell the name or don't know the exact address.

  Query: {{{query}}}

  Suggestions:`, // Fixed Handlebars syntax.
});

const smartSearchSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartSearchSuggestionsFlow',
    inputSchema: SmartSearchSuggestionsInputSchema,
    outputSchema: SmartSearchSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await smartSearchSuggestionsPrompt(input);
    return output!;
  }
);
