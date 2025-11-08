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

export const geocodeAddressTool = ai.defineTool(
  {
    name: 'geocodeAddressTool',
    description: 'Geocodes an address to get its latitude and longitude.',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async ({ address }) => {
    // In a real application, you would use a Geocoding API (e.g., Google Maps, Nominatim).
    // For this example, we'll return a fixed location for "Catedral de Hermosillo"
    // and a default location for other queries.
    const lowerAddress = address.toLowerCase();
    
    if (lowerAddress.includes('catedral')) {
      return { lat: 29.073, lng: -110.957 };
    }
    
    if (lowerAddress.includes('colonia pitic')) {
      return { lat: 29.09, lng: -110.95 };
    }

    if (lowerAddress.includes('blvd. kino')) {
        return { lat: 29.098, lng: -110.95 };
    }
    
    // Default coordinates if no specific address is matched
    return { lat: 29.07296, lng: -110.95732 };
  }
);
