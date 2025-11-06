'use client';

import { useState } from 'react';
import type { Pizzeria } from '@/lib/pizzeria-data';
import SmartSearch from '@/components/search/smart-search';
import PizzeriaList from '@/components/pizzeria/pizzeria-list';
import PizzeriaDetail from '@/components/pizzeria/pizzeria-detail';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { pizzerias as allPizzerias } from '@/lib/pizzeria-data';
import PizzeriaCard from '@/components/pizzeria/pizzeria-card';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const PizzaMap = dynamic(() => import('@/components/map/pizza-map'), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function Home() {
  const [selectedPizzeria, setSelectedPizzeria] = useState<Pizzeria | null>(null);
  const [searchResults, setSearchResults] = useState<Pizzeria[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSelectPizzeria = (pizzeria: Pizzeria) => {
    setSelectedPizzeria(pizzeria);
  };

  const handleSearchResults = (results: Pizzeria[]) => {
    setSearchResults(results);
    setIsSearching(true);
    // Do not automatically select a pizzeria if there is only one result
    // Let the user click on it to see details.
    setSelectedPizzeria(null);
  };
  
  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
    setSelectedPizzeria(null);
  }

  const pizzeriasToShow = isSearching ? searchResults : allPizzerias.sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div className="h-full w-full relative overflow-y-auto">
      <div className="h-[60vh] w-full">
        <PizzaMap 
          pizzerias={isSearching ? searchResults: []}
          onMarkerClick={handleSelectPizzeria} 
          selectedPizzeria={selectedPizzeria} 
        />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" className="shadow-lg animate-fade-in-down">
              <List className="mr-2 h-5 w-5" />
              {isSearching ? 'Ver Resultados' : 'Explorar Pizzerías'}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-[440px] p-0 flex flex-col">
            <PizzeriaList 
                pizzerias={pizzeriasToShow}
                onPizzeriaSelect={handleSelectPizzeria} 
                isSearching={isSearching}
                onClearSearch={handleClearSearch}
            />
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm md:max-w-md lg:max-w-lg px-4">
        <SmartSearch onSearch={handleSearchResults} />
      </div>

      {!isSearching && (
        <div id="ranking" className="container py-12">
          <h2 className="text-3xl font-headline text-center mb-8">Ranking de Pizzerías</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPizzerias
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 3)
              .map((pizzeria) => (
                <PizzeriaCard key={pizzeria.id} pizzeria={pizzeria} onClick={() => handleSelectPizzeria(pizzeria)} />
              ))}
          </div>
        </div>
      )}


      <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && setSelectedPizzeria(null)}>
        <SheetContent side="right" className="w-[90vw] max-w-[440px] p-0 flex flex-col" aria-describedby={undefined}>
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
