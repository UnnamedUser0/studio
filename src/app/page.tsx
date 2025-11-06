
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
         <h2 className="text-3xl font-headline text-center mb-24">Ranking de las 3 Mejores Pizzerías de Hermosillo</h2>
         <div className="relative w-full max-w-4xl mx-auto h-[250px]">

             {/* Podium Base Structure */}
             <div className="absolute bottom-0 w-full flex items-end">
                 {/* 2nd place */}
                 <div className="w-1/3 h-24 bg-primary relative flex justify-center">
                     
                     <span className="absolute bottom-4 font-bold text-5xl text-white/80" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>2</span>
                 </div>
                 {/* 1st place */}
                 <div className="w-1/3 h-36 bg-primary relative flex justify-center">
                     
                     <span className="absolute bottom-4 font-bold text-6xl text-white" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.5)' }}>1</span>
                 </div>
                 {/* 3rd place */}
                 <div className="w-1/3 h-20 bg-primary relative flex justify-center">
                     
                     <span className="absolute bottom-4 font-bold text-4xl text-white/70" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>3</span>
                 </div>
             </div>
             
             {/* Podium Platform Top */}
             <div className="absolute bottom-[80px] w-[calc(100%+20px)] left-[-10px] h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>
             <div className="absolute bottom-[96px] w-[calc(33.33%+20px)] left-[calc(33.33%-10px)] h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>
             <div className="absolute bottom-[144px] w-[calc(33.33%+20px)] left-[calc(33.33%-10px)] h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>

             {/* Separator Shadows */}
             <div className="absolute bottom-0 top-0 left-1/3 w-px bg-black/20 z-10 h-[144px]"></div>
             <div className="absolute bottom-0 top-0 left-2/3 w-px bg-black/20 z-10 h-[144px]"></div>
             

             {/* Pizzeria Cards - positioned absolutely */}
             <div className="absolute bottom-[96px] left-[calc(0%+16.66%-128px)] w-[256px] z-20">
                 <PizzeriaCard
                   pizzeria={pizzeriasForRanking[1]}
                   onClick={() => handleSelectPizzeria(pizzeriasForRanking[1])}
                   rankingPlace={2}
                 />
             </div>
             <div className="absolute bottom-[144px] left-[calc(33.33%+16.66%-128px)] w-[256px] z-20">
                 <PizzeriaCard
                   pizzeria={pizzeriasForRanking[0]}
                   onClick={() => handleSelectPizzeria(pizzeriasForRanking[0])}
                   rankingPlace={1}
                 />
             </div>
             <div className="absolute bottom-[80px] left-[calc(66.66%+16.66%-128px)] w-[256px] z-20">
                 <PizzeriaCard
                   pizzeria={pizzeriasForRanking[2]}
                   onClick={() => handleSelectPizzeria(pizzeriasForRanking[2])}
                   rankingPlace={3}
                 />
             </div>
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
