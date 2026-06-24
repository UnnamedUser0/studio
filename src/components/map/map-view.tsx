'use client';

import { useState, useMemo } from 'react';
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
  disableDistanceFilter?: boolean; // NEW PROP
  explicitPizzeriasToShow?: Pizzeria[]; // NEW PROP
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
  layoutSettings,
  onSettingsChange,
  disableDistanceFilter = false,
  explicitPizzeriasToShow = []
}: MapViewProps & { layoutSettings?: any, onSettingsChange?: (settings: any) => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const mapHeightStyle = useMemo(() => {
    if (!layoutSettings) return {};
    return {
      '--map-height-mobile': `${layoutSettings.mapHeightMobile || 55}vh`,
      '--map-height-desktop': `${layoutSettings.mapHeight || 70}vh`,
      '--search-width-desktop': `${layoutSettings.searchWidth || 50}%`,
      '--search-width-mobile': `${layoutSettings.searchWidthMobile || 90}%`,
      '--search-height-desktop': `${(layoutSettings.searchHeight || 12) * 0.25}rem`,
      '--search-height-mobile': `${(layoutSettings.searchHeightMobile || 10) * 0.25}rem`,
      '--buttons-top-desktop': `${layoutSettings.buttonsTop || 160}px`,
      '--buttons-top-mobile': `${layoutSettings.buttonsTopMobile || 160}px`,
      '--layer-control-top-desktop': `${layoutSettings.layerControlTop || 10}px`,
      '--layer-control-top-mobile': `${layoutSettings.layerControlTopMobile || 10}px`,
      '--popup-width-desktop': `${layoutSettings.popupWidth || 280}px`,
      '--popup-width-mobile': `${layoutSettings.popupWidthMobile || 260}px`,
      '--popup-scale-desktop': `${layoutSettings.popupScale || 1}`,
      '--popup-scale-mobile': `${layoutSettings.popupScaleMobile || 1}`,
      '--popup-font-size-desktop': `${layoutSettings.popupFontSize || 14}px`,
      '--popup-font-size-mobile': `${layoutSettings.popupFontSizeMobile || 12}px`,
    } as React.CSSProperties;
  }, [layoutSettings]);

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-in-out",
        isFullscreen ? "fixed inset-0 z-[40] h-[100dvh] w-screen bg-background" : "relative h-full w-full"
      )}
      style={mapHeightStyle}
    >
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
          console.log('Navigate to:', pizzeria.name);
        }}
        onRate={onRate || onSelectPizzeria}
        routeDestination={routeDestination}
        isAdmin={isAdmin}
        disableDistanceFilter={disableDistanceFilter}
        explicitPizzeriasToShow={explicitPizzeriasToShow}
        popupOffsetY={layoutSettings?.popupOffsetY ?? -35}
        popupOffsetYMobile={layoutSettings?.popupOffsetYMobile ?? -35}
        mapCenterOffset={layoutSettings?.mapCenterOffset ?? 150}
        iconAnchorX={layoutSettings?.iconAnchorX ?? 25}
        iconAnchorY={layoutSettings?.iconAnchorY ?? 25}
        onSettingsChange={onSettingsChange}
        onNavigationStateChange={setIsNavigating}
        onCloseDetail={onCloseDetail}
      />

      {/* Smart Search Bar */}
      {!isNavigating && (
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
      )}


    </div>
  );
}
