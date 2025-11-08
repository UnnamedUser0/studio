'use client';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, X } from 'lucide-react';
import { getSmartSearchSuggestions } from '@/ai/flows/smart-search-suggestions';
import { Card, CardContent } from '@/components/ui/card';
import type { Pizzeria } from '@/lib/types';
import { Button } from '../ui/button';

type Geocode = { lat: number, lng: number };

type SmartSearchProps = {
  onSearch: (results: Pizzeria[], geocode: Geocode | null) => void;
  allPizzerias: Pizzeria[];
  onClear: () => void;
};

type Suggestion = {
  text: string;
  geocode: Geocode | null;
};


export default function SmartSearch({ onSearch, allPizzerias, onClear }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isPending, startTransition] = useTransition();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onClear();
  };
  
  const performSearch = (searchQuery: string, geocode: Geocode | null) => {
    if (!searchQuery) {
      onSearch([], null);
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = allPizzerias.filter(p => 
      p.name.toLowerCase().includes(lowerCaseQuery) ||
      p.address.toLowerCase().includes(lowerCaseQuery)
    );
    onSearch(results, geocode);
    setSuggestions([]);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(query, null);
    }
  };

  const fetchSuggestions = useCallback((currentQuery: string) => {
    if (currentQuery.length > 2) {
      startTransition(async () => {
        try {
          const result = await getSmartSearchSuggestions({ query: currentQuery });
          const suggestionTexts = result.suggestions.filter(s => s.toLowerCase() !== currentQuery.toLowerCase());
          
          const newSuggestions: Suggestion[] = suggestionTexts.map(text => ({
            text,
            geocode: result.geocode || null,
          }));

          setSuggestions(newSuggestions);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        }
      });
    } else {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  return (
    <div className="relative animate-fade-in-down">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Busca por nombre o dirección..."
          className="pl-11 h-12 text-base shadow-lg rounded-full pr-20"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => fetchSuggestions(debouncedQuery)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          {query && !isPending && (
             <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleClear}>
              <X className="h-5 w-5 text-muted-foreground" />
             </Button>
          )}
        </div>
      </div>
      {suggestions.length > 0 && query && (
        <Card className="absolute top-full mt-2 w-full z-20 shadow-xl animate-fade-in-down rounded-2xl">
          <CardContent className="p-2">
            <ul className="space-y-1">
              {suggestions.map((s, i) => (
                <li key={i} className="p-3 text-sm rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => {
                    setQuery(s.text);
                    performSearch(s.text, s.geocode);
                  }}
                >
                  {s.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
