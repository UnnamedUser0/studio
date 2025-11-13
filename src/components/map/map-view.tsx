'use client';

import dynamic from 'next/dynamic';

import SmartSearch from '@/components/search/smart-search';
import PizzeriaDetail from '@/components/pizzeria/pizzeria-detail';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Pizzeria } from '@/lib/types';

const PizzaMap = dynamic(() => import('@/components/map/pizza-map'), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type Geocode = { lat: number, lng: number };

type MapViewProps = {
  allPizzerias: Pizzeria[];
  onSearch: (results: Pizzeria[]) => void;
  onClearSearch: () => void;
  onSelectPizzeria: (pizzeria: Pizzeria) => void;
  visiblePizzerias: Pizzeria[];
  selectedPizzeria: Pizzeria | null;
  searchCenter: Geocode | null;
  onCloseDetail: () => void;
  onLocateUser: (coords: Geocode) => void;
};

export default function MapView({
  allPizzerias,
  onSearch,
  onClearSearch,
  onSelectPizzeria,
  visiblePizzerias,
  selectedPizzeria,
  searchCenter,
  onCloseDetail,
  onLocateUser,
}: MapViewProps) {
  
  return (
    <div className="relative h-full w-full">
      <PizzaMap 
        pizzerias={visiblePizzerias}
        onMarkerClick={onSelectPizzeria} 
        selectedPizzeria={selectedPizzeria}
        searchCenter={searchCenter}
        onLocateUser={onLocateUser}
      />
      
      {/* Smart Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-sm md:max-w-md lg:max-w-lg z-[1001]">
        <SmartSearch onSearch={onSearch} allPizzerias={allPizzerias || []} onClear={onClearSearch} />
      </div>

      {/* Pizzeria Detail Sheet */}
      <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && onCloseDetail()}>
        <SheetContent side="right" className="w-[90vw] max-w-[440px] p-0 flex flex-col" aria-describedby={undefined}>
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
