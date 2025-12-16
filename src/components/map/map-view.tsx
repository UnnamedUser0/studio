'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

import SmartSearch from '@/components/search/smart-search';
import PizzeriaDetail from '@/components/pizzeria/pizzeria-detail';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Pizzeria } from '@/lib/types';
import { cn } from '@/lib/utils';

const PizzaMap = dynamic(() => import('@/components/map/pizza-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type Geocode = { lat: number, lng: number };

type MapViewProps = {
  allPizzerias: Pizzeria[];
  onSearch: (results: Pizzeria[], geocode?: Geocode) => void;
  onClearSearch: () => void;
  onSelectPizzeria: (pizzeria: Pizzeria) => void;
  visiblePizzerias: Pizzeria[];
  selectedPizzeria: Pizzeria | null;
  searchCenter: Geocode | null;
  onCloseDetail: () => void;
  onLocateUser: (coords: Geocode) => void;
  routeDestination?: { lat: number, lng: number } | null;
  onViewMenu?: (pizzeria: Pizzeria) => void;
  onRate?: (pizzeria: Pizzeria) => void;
  isAdmin?: boolean;
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
  routeDestination,
  onViewMenu,
  onRate,
  isAdmin = false // Default to false
}: MapViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out",
      isFullscreen ? "fixed inset-0 z-[2000] h-[100dvh] w-screen bg-background" : "relative h-full w-full"
    )}>
      <PizzaMap
        pizzerias={visiblePizzerias}
        onMarkerClick={onSelectPizzeria}
        selectedPizzeria={selectedPizzeria}
        searchCenter={searchCenter}
        onLocateUser={onLocateUser}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onViewMenu={onViewMenu || onSelectPizzeria}
        onNavigate={(pizzeria) => {
          // This prop is for the popup button, which handles routing internally in PizzaMap
          // But we can also open external maps if needed, though the user requested internal routing.
          // Since PizzaMap handles internal routing via drawRoute when the button is clicked inside the popup,
          // we might not need to do anything here, or we can use this to trigger the detail view if routing fails.
          // However, the popup implementation in PizzaMap calls drawRoute directly.
          // The prop is mainly to satisfy the interface if we want to bubble up the event.
          // Let's just log it for now or leave it empty as the logic is inside PizzaMap.
          console.log('Navigate to:', pizzeria.name);
        }}
        onRate={onRate || onSelectPizzeria}
        routeDestination={routeDestination}
        isAdmin={isAdmin}
      />

      {/* Smart Search Bar */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[300px] md:w-full md:max-w-md lg:max-w-lg z-[1001] transition-all duration-300",
        isFullscreen ? "top-4" : "top-4"
      )}>
        <SmartSearch onSearch={onSearch} allPizzerias={allPizzerias || []} onClear={onClearSearch} />
      </div>

      {/* Pizzeria Detail Sheet */}
      <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && onCloseDetail()}>
        <SheetContent side="right" className="w-[90vw] max-w-[600px] p-0 flex flex-col" aria-describedby={undefined}>
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
