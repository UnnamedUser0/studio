'use client';
import { useState, useEffect, useCallback, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, X, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pizzeria } from '@/lib/types';
import { Button } from '../ui/button';
import { getSmartSearchSuggestions } from '@/ai/flows/smart-search-suggestions';
import getDistance from 'geolib/es/getDistance';

type Geocode = { lat: number, lng: number };

type SmartSearchProps = {
  onSearch: (results: Pizzeria[], geocode?: Geocode) => void;
  allPizzerias: Pizzeria[];
  onClear: () => void;
};

type Suggestion = {
  type: 'pizzeria' | 'ai' | 'geocode';
  label: string;
  data: Pizzeria | string | Geocode;
};

export default function SmartSearch({ onSearch, allPizzerias, onClear }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onClear();
  };

  const performGeocodeSearch = (geocode: Geocode) => {
    const pizzeriasByDistance = [...allPizzerias]
      .map(pizzeria => ({
        ...pizzeria,
        distance: getDistance(
          { latitude: geocode.lat, longitude: geocode.lng },
          { latitude: pizzeria.lat, longitude: pizzeria.lng }
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    onSearch(pizzeriasByDistance.slice(0, 20), geocode);
    setSuggestions([]);
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.label);
    setSuggestions([]);

    if (suggestion.type === 'pizzeria') {
      onSearch([suggestion.data as Pizzeria]);
    } else if (suggestion.type === 'geocode') {
      performGeocodeSearch(suggestion.data as Geocode);
    } else { // 'ai' suggestion
      startTransition(async () => {
        const aiResult = await getSmartSearchSuggestions({ query: suggestion.label });
        if (aiResult.geocode) {
          performGeocodeSearch(aiResult.geocode);
        } else {
          // Fallback to local search if AI doesn't return geocode
          const lowerCaseQuery = suggestion.label.toLowerCase();
          const results = allPizzerias.filter(p => p.name.toLowerCase().includes(lowerCaseQuery));
          onSearch(results);
        }
      });
    }
  };

  const fetchSuggestions = useCallback((currentQuery: string) => {
    if (currentQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    // 1. Local search for pizzeria names (instant)
    const lowerCaseQuery = currentQuery.toLowerCase();
    const localPizzeriaSuggestions = allPizzerias
      .filter(p => p.name.toLowerCase().includes(lowerCaseQuery))
      .slice(0, 3)
      .map((p): Suggestion => ({ type: 'pizzeria', label: p.name, data: p }));

    setSuggestions(localPizzeriaSuggestions);

    // 2. Coordinate Search
    const coordinateRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const coordMatch = currentQuery.match(coordinateRegex);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSuggestions(prev => [
          ...prev,
          {
            type: 'geocode',
            label: `Ir a coordenadas: ${lat}, ${lng}`,
            data: { lat, lng }
          }
        ]);
        return; // Return early if coordinates found
      }
    }

    // 3. Nominatim Geocoding & AI Search
    startTransition(async () => {
      try {
        const aiSuggestions: Suggestion[] = [];

        // Nominatim Geocoding for Addresses (Hermosillo Priority)
        try {
          // Viewbox for Hermosillo approx: [left, top, right, bottom] -> minlon, minlat, maxlon, maxlat
          // -111.2, 28.8, -110.8, 29.3
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentQuery + ' Hermosillo')}&viewbox=-111.2,29.3,-110.8,28.8&bounded=1&limit=3`;

          const response = await fetch(nominatimUrl);
          if (response.ok) {
            const data = await response.json();
            data.forEach((item: any) => {
              aiSuggestions.push({
                type: 'geocode',
                label: item.display_name,
                data: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
              });
            });
          }
        } catch (e) {
          console.error("Nominatim error:", e);
        }

        /* AI Search - Disabled/Secondary to prefer direct geocoding for speed/accuracy on addresses
        const result = await getSmartSearchSuggestions({ query: currentQuery });
        if (result.geocode) {
          aiSuggestions.push({
            type: 'geocode',
            label: `Pizzerías cerca de ${currentQuery}`,
            data: result.geocode,
          });
        }
        result.suggestions?.forEach(label => {
          if (!localPizzeriaSuggestions.some(p => p.label === label)) {
             aiSuggestions.push({ type: 'ai', label, data: label });
          }
        });
        */

        setSuggestions(prev => {
          // Merge: Local > Geocoded > Previous AI/History
          // We filter out duplicates
          const combined = [...prev, ...aiSuggestions];
          const unique = new Map();
          combined.forEach(s => {
            if (!unique.has(s.label)) unique.set(s.label, s);
          });
          return Array.from(unique.values()).slice(0, 5);
        });

      } catch (error) {
        console.error("Search failed:", error);
      }
    });

  }, [allPizzerias]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(query);
    }, 300); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [query, fetchSuggestions]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If suggestions exist, pick the first one?
      // Or perform a fresh search if no suggestion clicked.
      // Better: Try to geocode the current query directly.
      if (query.trim().length > 2) {
        setSuggestions([]); // Clear UI

        // 1. Check if it matches a pizzeria name exactly or partially
        const lowerCaseQuery = query.toLowerCase();
        const localMatch = allPizzerias.filter(p => p.name.toLowerCase().includes(lowerCaseQuery));

        if (localMatch.length > 0) {
          // If many matches, just show them as list
          onSearch(localMatch);
          return;
        }

        // 2. Fallback to Geocoding
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Hermosillo')}&viewbox=-111.2,29.3,-110.8,28.8&bounded=1&limit=1`;
          const response = await fetch(nominatimUrl);
          const data = await response.json();

          if (data && data.length > 0) {
            const result = data[0];
            performGeocodeSearch({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
          } else {
            // 3. Last resort: AI (if enabled) or just no results
            // For now, no results found toast?
            onSearch([]);
          }
        } catch (e) {
          console.error("Enter search failed", e);
          onSearch([]);
        }
      }
    }
  };

  return (
    <div className="relative h-full">
      <div className="relative h-full">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none">
          {isPending ? <Loader2 className="animate-spin" /> : <Search />}
        </div>
        <Input
          placeholder="Busca por nombre, dirección o colonia..."
          className="pl-11 h-full text-sm md:text-base shadow-lg rounded-full pr-12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => fetchSuggestions(query)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleClear}>
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      {suggestions.length > 0 && query && (
        <Card className="absolute top-full mt-2 w-full z-20 shadow-xl animate-fade-in-down rounded-2xl">
          <CardContent className="p-2">
            <ul className="space-y-1">
              {suggestions.map((suggestion) => (
                <li key={suggestion.label} className="p-3 text-sm rounded-lg hover:bg-accent/50 cursor-pointer flex items-center gap-3"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.type === 'geocode' ? <MapPin className="h-4 w-4 text-primary" /> : <Search className="h-4 w-4 text-muted-foreground" />}
                  <span>{suggestion.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
