'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('The address to geocode.'),
});

const GeocodeAddressOutputSchema = z.object({
  lat: z.number().describe('The latitude.'),
  lng: z.number().describe('The longitude.'),
});

// A dictionary of known locations for more reliable lookups.
const knownLocations: { [key: string]: { lat: number; lng: number } } = {
    'catedral': { lat: 29.073, lng: -110.957 },
    'colonia pitic': { lat: 29.09, lng: -110.95 },
    'blvd. kino': { lat: 29.098, lng: -110.95 },
    'cbtis 206': { lat: 29.053, lng: -111.002 },
};

export const geocodeAddressTool = ai.defineTool(
  {
    name: 'geocodeAddressTool',
    description: 'Geocodes an address or point of interest in Hermosillo to get its latitude and longitude.',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async ({ address }) => {
    // In a real application, you would use a Geocoding API (e.g., Google Maps, Nominatim).
    // For this example, we'll use a local dictionary of known locations.
    const lowerAddress = address.toLowerCase();

    // Find a matching known location
    for (const key in knownLocations) {
        if (lowerAddress.includes(key)) {
            return knownLocations[key];
        }
    }
    
    // Default coordinates if no specific address is matched
    return { lat: 29.07296, lng: -110.95732 };
  }
);
