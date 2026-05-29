'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('The address or point of interest to geocode in Hermosillo, Sonora.'),
});

const GeocodeAddressOutputSchema = z.object({
  lat: z.number().describe('The latitude.'),
  lng: z.number().describe('The longitude.'),
});

export const geocodeAddressTool = ai.defineTool(
  {
    name: 'geocodeAddressTool',
    description: 'Geocodes an address or point of interest in Hermosillo, Sonora, to get its latitude and longitude. Use this for any non-pizzeria name query that looks like a location.',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async ({ address }) => {
    const apiKey = process.env.HERE_API_KEY || process.env.NEXT_PUBLIC_HERE_API_KEY;
    const query = encodeURIComponent(`${address}, Hermosillo, Sonora, Mexico`);

    if (apiKey) {
      const hereUrl = `https://geocode.search.hereapi.com/v1/geocode?q=${query}&apiKey=${apiKey}`;
      try {
        const response = await fetch(hereUrl);
        if (response.ok) {
          const data = await response.json();
          if (data && data.items && data.items.length > 0) {
            const { lat, lng } = data.items[0].position;
            return { lat, lng };
          }
        }
      } catch (error) {
        console.error('Error fetching from HERE Maps API, falling back to Nominatim:', error);
      }
    }

    // Fallback to public OpenStreetMap Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PizzApp/1.0 (pizzapp.dev@example.com)'
        }
      });
      if (!response.ok) {
        console.error('Nominatim API error:', response.statusText);
        return { lat: 29.07296, lng: -110.95732 };
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return { lat: parseFloat(lat), lng: parseFloat(lon) };
      }
    } catch (error) {
      console.error('Error fetching from Nominatim API:', error);
    }
    
    // Default coordinates if no result is found or an error occurs
    return { lat: 29.07296, lng: -110.95732 };
  }
);
