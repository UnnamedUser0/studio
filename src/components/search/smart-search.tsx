'use client';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pizzeria } from '@/lib/types';
import { Button } from '../ui/button';

type SmartSearchProps = {
  onSearch: (results: Pizzeria[]) => void;
  allPizzerias: Pizzeria[];
  onClear: () => void;
};

export default function SmartSearch({ onSearch, allPizzerias, onClear }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Pizzeria[]>([]);

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onClear();
  };
  
  const performSearch = (searchQuery: string) => {
    if (!searchQuery) {
      onSearch([]);
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = allPizzerias.filter(p => 
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
    if (currentQuery.length > 1) {
      const lowerCaseQuery = currentQuery.toLowerCase();
      const filtered = allPizzerias.filter(p => 
        p.name.toLowerCase().includes(lowerCaseQuery) ||
        p.address.toLowerCase().includes(lowerCaseQuery)
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [allPizzerias]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(query);
    }, 200); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [query, fetchSuggestions]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Busca por nombre o dirección..."
          className="pl-11 h-12 text-base shadow-lg rounded-full pr-20"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => fetchSuggestions(query)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
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
              {suggestions.map((pizzeria) => (
                <li key={pizzeria.id} className="p-3 text-sm rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => {
                    setQuery(pizzeria.name);
                    onSearch([pizzeria]);
                    setSuggestions([]);
                  }}
                >
                  <p className="font-medium">{pizzeria.name}</p>
                  <p className="text-xs text-muted-foreground">{pizzeria.address}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
