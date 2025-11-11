'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

import SmartSearch from '@/components/search/smart-search';
import PizzeriaList from '@/components/pizzeria/pizzeria-list';
import PizzeriaDetail from '@/components/pizzeria/pizzeria-detail';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Pizzeria } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const PizzaMap = dynamic(() => import('@/components/map/pizza-map'), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type Geocode = { lat: number, lng: number };

type MapViewProps = {
  pizzeriasToShowInList: Pizzeria[];
  isSearching: boolean;
  onSearch: (results: Pizzeria[], geocode: Geocode | null) => void;
  onClearSearch: () => void;
  onSelectPizzeria: (pizzeria: Pizzeria) => void;
  isLoadingPizzerias: boolean;
  visiblePizzerias: Pizzeria[];
  selectedPizzeria: Pizzeria | null;
  searchCenter: Geocode | null;
  onCloseDetail: () => void;
};

export default function MapView({
  pizzeriasToShowInList,
  isSearching,
  onSearch,
  onClearSearch,
  onSelectPizzeria,
  isLoadingPizzerias,
  visiblePizzerias,
  selectedPizzeria,
  searchCenter,
  onCloseDetail
}: MapViewProps) {
  
  const firestore = useFirestore();

  const allPizzeriasQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'pizzerias') : null
  , [firestore]);
  const { data: allPizzerias } = useCollection<Pizzeria>(allPizzeriasQuery);

  return (
    <div className="relative h-full w-full">
      <PizzaMap 
        pizzerias={visiblePizzerias}
        onMarkerClick={onSelectPizzeria} 
        selectedPizzeria={selectedPizzeria}
        searchCenter={searchCenter}
      />

      <div className="absolute top-4 left-0 w-full px-4 flex justify-center items-start pointer-events-none z-[1000]">
         <div className="absolute left-4 top-20 pointer-events-auto">
           <Sheet>
             <SheetTrigger asChild>
               <Button 
                variant="secondary" 
                className="shadow-lg animate-fade-in-down hover:shadow-xl hover:-translate-y-1 active:translate-y-px transition-all duration-300"
               >
                 <List className="mr-2 h-5 w-5" />
                 {isSearching ? 'Ver Resultados' : 'Explorar Pizzerías'}
               </Button>
             </SheetTrigger>
             <SheetContent side="left" className="w-[90vw] max-w-[440px] p-0 flex flex-col">
               <PizzeriaList 
                   pizzerias={pizzeriasToShowInList}
                   onPizzeriaSelect={onSelectPizzeria} 
                   isSearching={isSearching}
                   onClearSearch={onClearSearch}
                   isLoading={isLoadingPizzerias}
               />
             </SheetContent>
           </Sheet>
         </div>
         
         <div className="w-full max-w-sm md:max-w-md lg:max-w-lg pointer-events-auto">
           <SmartSearch onSearch={onSearch} allPizzerias={allPizzerias || []} onClear={onClearSearch} />
         </div>
      </div>

      <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && onCloseDetail()}>
        <SheetContent side="right" className="w-[90vw] max-w-[440px] p-0 flex flex-col" aria-describedby={undefined}>
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
