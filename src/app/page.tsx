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
import TestimonialsCarousel from '@/components/testimonial/testimonials-carousel';
import WhyChoosePizzapp from '@/components/layout/why-choose-pizzapp';

const PizzaMap = dynamic(() => import('@/components/map/pizza-map'), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function Home() {
  const [selectedPizzeria, setSelectedPizzeria] = useState<Pizzeria | null>(null);
  const [visiblePizzerias, setVisiblePizzerias] = useState<Pizzeria[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSelectPizzeria = (pizzeria: Pizzeria) => {
    setSelectedPizzeria(pizzeria);
  };

  const handleSearchResults = (results: Pizzeria[]) => {
    setVisiblePizzerias(results);
    setIsSearching(true);
    // If search results are empty, close any open detail panel.
    if (results.length === 0) {
      setSelectedPizzeria(null);
    } else {
      // If there are results, clear the specific selection to allow the map to zoom out to the bounds.
      setSelectedPizzeria(null);
    }
  };
  
  const handleClearSearch = () => {
    setVisiblePizzerias([]);
    setIsSearching(false);
    setSelectedPizzeria(null);
  }

  const handleCloseDetail = () => {
    setSelectedPizzeria(null);
  }

  const pizzeriasForRanking = allPizzerias.sort((a, b) => b.rating - a.rating).slice(0, 3);
  const pizzeriasToShowInList = isSearching ? visiblePizzerias : pizzeriasForRanking;

  const podiumOrder = [1, 0, 2];

  return (
    <div className="h-full w-full relative overflow-y-auto">
      <div className="h-[60vh] w-full">
        <PizzaMap 
          pizzerias={visiblePizzerias}
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
                pizzerias={pizzeriasToShowInList}
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
          <h2 className="text-3xl font-headline text-center mb-16">Ranking de Pizzerías</h2>
          <div className="relative w-full max-w-4xl mx-auto flex items-end justify-center gap-1">
            {/* 2nd Place */}
            <div className="w-1/3 flex flex-col items-center">
              <div className="mb-2 w-full max-w-xs">
                <PizzeriaCard
                  pizzeria={pizzeriasForRanking[1]}
                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[1])}
                  rankingPlace={2}
                />
              </div>
              <div className="relative w-full h-24 bg-[#00608B] border-b-8 border-b-[#003F5C]">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -right-1 top-0 h-full w-1 bg-black/20"></div>
                <span className="absolute inset-0 flex items-center justify-center font-bold text-5xl text-white/80" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>2</span>
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="w-1/3 flex flex-col items-center">
              <div className="mb-2 w-full max-w-xs">
                <PizzeriaCard
                  pizzeria={pizzeriasForRanking[0]}
                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[0])}
                  rankingPlace={1}
                />
              </div>
              <div className="relative w-full h-36 bg-[#00608B] border-b-8 border-b-[#003F5C]">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -left-1 top-0 h-full w-1 bg-black/20"></div>
                 <div className="absolute -right-1 top-0 h-full w-1 bg-black/20"></div>
                <span className="absolute inset-0 flex items-center justify-center font-bold text-6xl text-white" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.5)' }}>1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="w-1/3 flex flex-col items-center">
              <div className="mb-2 w-full max-w-xs">
                <PizzeriaCard
                  pizzeria={pizzeriasForRanking[2]}
                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[2])}
                  rankingPlace={3}
                />
              </div>
              <div className="relative w-full h-20 bg-[#00608B] border-b-8 border-b-[#003F5C]">
                 <div className="absolute inset-0 bg-black/10"></div>
                 <div className="absolute -left-1 top-0 h-full w-1 bg-black/20"></div>
                 <span className="absolute inset-0 flex items-center justify-center font-bold text-4xl text-white/70" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>3</span>
              </div>
            </div>
             {/* Base Shadow */}
            <div className="absolute bottom-[-15px] h-8 w-[105%] bg-gray-400/30 rounded-[50%] blur-md z-[-1]"></div>
          </div>
        </div>
      )}
      
      {!isSearching && (
        <div id="testimonials" className="bg-muted/50 py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Lo que nuestra comunidad opina</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Descubre por qué a los amantes de la pizza les encanta PizzApp.
                </p>
            </div>
            <TestimonialsCarousel />
          </div>
        </div>
      )}

      {!isSearching && (
        <WhyChoosePizzapp />
      )}

      <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side="right" className="w-[90vw] max-w-[440px] p-0 flex flex-col" aria-describedby={undefined}>
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
