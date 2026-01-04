'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import SmartSearch from '@/components/search/smart-search';
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
  isAdmin = false,
  layoutSettings, // Receive settings
  onSettingsChange
}: MapViewProps & { layoutSettings?: any, onSettingsChange?: (settings: any) => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Determine popup offset based on device width (React-side heuristic or just pass both)
  // For simplicity, let's pass both props.

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
        popupOffsetY={layoutSettings?.popupOffsetY ?? -35}
        popupOffsetYMobile={layoutSettings?.popupOffsetYMobile ?? -35}
        onSettingsChange={onSettingsChange}
      />

      {/* Smart Search Bar */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-[1001] transition-all duration-300",
          isFullscreen ? "top-4" : "top-4"
        )}
        style={{
          width: 'var(--search-width-mobile, 90%)',
          height: 'var(--search-height-mobile, 2.5rem)',
          // We use media queries in CSS or Javascript logic if we want truly distinct variables via style prop, 
          // but since we are in a React component, we can use a simpler approach if we had window size.
          // However, since we defined CSS variables in parent Page, we can use them directly if we set them up correctly with media queries THERE.
          // Wait, CSS variables defined in inline-style don't behave like media queries. 
          // We need to use CSS classes that reference the variables, OR standard media queries.
          // The page.tsx defines --search-width-mobile and --search-width-desktop globally in the wrapper.
          // use classes:
        } as React.CSSProperties}
      >
        <div className="w-[var(--search-width-mobile,_90%)] md:w-[var(--search-width-desktop,_50%)] mx-auto h-[var(--search-height-mobile,_2.5rem)] md:h-[var(--search-height-desktop,_3rem)]">
          <SmartSearch onSearch={onSearch} allPizzerias={allPizzerias || []} onClear={onClearSearch} />
        </div>
      </div>


    </div>
  );
}
