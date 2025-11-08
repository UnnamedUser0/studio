'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

import SmartSearch from '@/components/search/smart-search';
import PizzeriaList from '@/components/pizzeria/pizzeria-list';
import PizzeriaDetail from '@/components/pizzeria/pizzeria-detail';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Pizzeria } from '@/lib/types';

const PizzaMap = dynamic(() => import('@/components/map/pizza-map'), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type Geocode = { lat: number, lng: number };

type MapViewProps = {
  pizzerias: Pizzeria[];
  onSelectPizzeria: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
  searchCenter: Geocode | null;
  onSearch: (results: Pizzeria[], geocode: Geocode | null) => void;
  onClearSearch: () => void;
  pizzeriasInList: Pizzeria[];
  isSearching: boolean;
  isLoadingPizzerias: boolean;
  onCloseDetail: () => void;
};

export default function MapView({
  pizzerias,
  onSelectPizzeria,
  selectedPizzeria,
  searchCenter,
  onSearch,
  onClearSearch,
  pizzeriasInList,
  isSearching,
  isLoadingPizzerias,
  onCloseDetail
}: MapViewProps) {
  
  const firestore = useFirestore();
  const pizzeriasQuery = useMemo(() => 
    firestore ? collection(firestore, 'pizzerias') : null, 
  [firestore]);
  const { data: allPizzerias } = useCollection<Pizzeria>(pizzeriasQuery);

  return (
    <>
      <div className="h-[60vh] w-full">
        <PizzaMap 
          pizzerias={pizzerias}
          onMarkerClick={onSelectPizzeria} 
          selectedPizzeria={selectedPizzeria}
          searchCenter={searchCenter}
        />
      </div>

      {/* This container ensures UI elements are layered above the map */}
      <div className="absolute top-0 left-0 w-full h-[60vh] p-4 pointer-events-none z-40">
         <div className="relative w-full h-full">
            <div className="absolute top-0 left-0 pointer-events-auto">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" className="shadow-lg animate-fade-in-down">
                    <List className="mr-2 h-5 w-5" />
                    {isSearching ? 'Ver Resultados' : 'Explorar Pizzerías'}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[90vw] max-w-[440px] p-0 flex flex-col">
                  <PizzeriaList 
                      pizzerias={pizzeriasInList}
                      onPizzeriaSelect={onSelectPizzeria} 
                      isSearching={isSearching}
                      onClearSearch={onClearSearch}
                      isLoading={isLoadingPizzerias}
                  />
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm md:max-w-md lg:max-w-lg px-4 pointer-events-auto">
              <SmartSearch onSearch={onSearch} allPizzerias={allPizzerias || []} onClear={onClearSearch} />
            </div>
         </div>
      </div>


      <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && onCloseDetail()}>
        <SheetContent side="right" className="w-[90vw] max-w-[440px] p-0 flex flex-col" aria-describedby={undefined}>
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
