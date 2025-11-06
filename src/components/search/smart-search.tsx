'use client';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { getSmartSearchSuggestions } from '@/ai/flows/smart-search-suggestions';
import { Card, CardContent } from '@/components/ui/card';
import { pizzerias } from '@/lib/pizzeria-data';
import type { Pizzeria } from '@/lib/pizzeria-data';

type SmartSearchProps = {
  onSearch: (results: Pizzeria[]) => void;
};

export default function SmartSearch({ onSearch }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
  
  const performSearch = (searchQuery: string) => {
    if (!searchQuery) {
      onSearch([]);
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = pizzerias.filter(p => 
      p.name.toLowerCase().includes(lowerCaseQuery) ||
      p.address.toLowerCase().includes(lowerCaseQuery)
    );
    onSearch(results);
    setSuggestions([]);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(query);
    }
  };

  const fetchSuggestions = useCallback((currentQuery: string) => {
    if (currentQuery.length > 2) {
      startTransition(async () => {
        try {
          const result = await getSmartSearchSuggestions({ query: currentQuery });
          // Filter out suggestions that are too similar to the query itself
          const filteredSuggestions = result.suggestions.filter(s => s.toLowerCase() !== currentQuery.toLowerCase());
          setSuggestions(filteredSuggestions);
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
          className="pl-11 h-12 text-base shadow-lg rounded-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => fetchSuggestions(debouncedQuery)}
          onKeyDown={handleKeyDown}
        />
        {isPending && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
      </div>
      {suggestions.length > 0 && query && (
        <Card className="absolute top-full mt-2 w-full z-20 shadow-xl animate-fade-in-down rounded-2xl">
          <CardContent className="p-2">
            <ul className="space-y-1">
              {suggestions.map((s, i) => (
                <li key={i} className="p-3 text-sm rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => {
                    setQuery(s);
                    performSearch(s);
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
