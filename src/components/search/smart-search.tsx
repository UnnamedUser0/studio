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

    // 2. AI search for addresses and other terms (debounced)
    startTransition(async () => {
      try {
        const result = await getSmartSearchSuggestions({ query: currentQuery });
        const aiSuggestions: Suggestion[] = [];
        
        if (result.geocode) {
           // Create a primary suggestion for the geocoded location
          aiSuggestions.push({
            type: 'geocode',
            label: `Pizzerías cerca de ${currentQuery}`,
            data: result.geocode,
          });
        }
        
        result.suggestions?.forEach(label => {
            // Avoid adding duplicate labels from local search
            if (!localPizzeriaSuggestions.some(p => p.label === label)) {
                aiSuggestions.push({ type: 'ai', label, data: label });
            }
        });

        // Combine and set suggestions, giving priority to local results
        setSuggestions(prev => {
            const combined = [...prev.filter(s => s.type === 'pizzeria'), ...aiSuggestions];
            const uniqueLabels = new Set<string>();
            return combined.filter(s => {
                if (uniqueLabels.has(s.label)) return false;
                uniqueLabels.add(s.label);
                return true;
            }).slice(0, 5);
        });

      } catch (error) {
        console.error("AI search failed:", error);
        // Fallback to only local suggestions if AI fails
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

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none">
          {isPending ? <Loader2 className="animate-spin" /> : <Search />}
        </div>
        <Input
          placeholder="Busca por nombre, dirección o colonia..."
          className="pl-11 h-12 text-base shadow-lg rounded-full pr-12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => fetchSuggestions(query)}
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
