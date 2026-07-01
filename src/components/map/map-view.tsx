'use client';

import { useState, useMemo, useEffect } from 'react';
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
  const [isRouteActive, setIsRouteActive] = useState(false);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('map-fullscreen');
    } else {
      document.body.classList.remove('map-fullscreen');
    }
    return () => {
      document.body.classList.remove('map-fullscreen');
    };
  }, [isFullscreen]);

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
      '--buttons-right-desktop': `${layoutSettings.buttonsRight ?? 16}px`,
      '--buttons-right-mobile': `${layoutSettings.buttonsRightMobile ?? 16}px`,
      '--view-all-top-desktop': `${layoutSettings.viewAllTop ?? 260}px`,
      '--view-all-top-mobile': `${layoutSettings.viewAllTopMobile ?? 260}px`,
      '--view-all-right-desktop': `${layoutSettings.viewAllRight ?? 16}px`,
      '--view-all-right-mobile': `${layoutSettings.viewAllRightMobile ?? 16}px`,
      '--map-settings-top-desktop': `${layoutSettings.mapSettingsTop ?? 400}px`,
      '--map-settings-top-mobile': `${layoutSettings.mapSettingsTopMobile ?? 400}px`,
      '--map-settings-right-desktop': `${layoutSettings.mapSettingsRight ?? 16}px`,
      '--map-settings-right-mobile': `${layoutSettings.mapSettingsRightMobile ?? 16}px`,
      '--locate-btn-top-desktop': `${layoutSettings.locateBtnTop ?? 160}px`,
      '--locate-btn-top-mobile': `${layoutSettings.locateBtnTopMobile ?? 160}px`,
      '--locate-btn-right-desktop': `${layoutSettings.locateBtnRight ?? 16}px`,
      '--locate-btn-right-mobile': `${layoutSettings.locateBtnRightMobile ?? 16}px`,
      '--locate-btn-scale-desktop': `${layoutSettings.locateBtnScale ?? 1.0}`,
      '--locate-btn-scale-mobile': `${layoutSettings.locateBtnScaleMobile ?? 1.0}`,
      '--layer-control-top-desktop': `${layoutSettings.layerControlTop || 10}px`,
      '--layer-control-top-mobile': `${layoutSettings.layerControlTopMobile || 10}px`,
      '--popup-width-desktop': `${layoutSettings.popupWidth || 280}px`,
      '--popup-width-mobile': `${layoutSettings.popupWidthMobile || 260}px`,
      '--popup-scale-desktop': `${layoutSettings.popupScale || 1}`,
      '--popup-scale-mobile': `${layoutSettings.popupScaleMobile || 1}`,
      '--popup-font-size-desktop': `${layoutSettings.popupFontSize || 14}px`,
      '--popup-font-size-mobile': `${layoutSettings.popupFontSizeMobile || 12}px`,
      '--nav-instruction-top-desktop': `${layoutSettings.navInstructionTop ?? 16}px`,
      '--nav-instruction-top-mobile': `${layoutSettings.navInstructionTopMobile ?? 16}px`,
      '--nav-instruction-scale-desktop': `${layoutSettings.navInstructionScale ?? 1}`,
      '--nav-instruction-scale-mobile': `${layoutSettings.navInstructionScaleMobile ?? 1}`,
      '--nav-dashboard-bottom-desktop': `${layoutSettings.navDashboardBottom ?? 0}px`,
      '--nav-dashboard-bottom-mobile': `${layoutSettings.navDashboardBottomMobile ?? 0}px`,
      '--nav-dashboard-scale-desktop': `${layoutSettings.navDashboardScale ?? 1}`,
      '--nav-dashboard-scale-mobile': `${layoutSettings.navDashboardScaleMobile ?? 1}`,
      '--nav-street-bottom-desktop': `${layoutSettings.navStreetBottom ?? 112}px`,
      '--nav-street-bottom-mobile': `${layoutSettings.navStreetBottomMobile ?? 112}px`,
      '--nav-street-scale-desktop': `${layoutSettings.navStreetScale ?? 1}`,
      '--nav-street-scale-mobile': `${layoutSettings.navStreetScaleMobile ?? 1}`,
      '--nav-instruction-left-desktop': `${layoutSettings.navInstructionLeft ?? 0}px`,
      '--nav-instruction-left-mobile': `${layoutSettings.navInstructionLeftMobile ?? 0}px`,
      '--nav-dashboard-left-desktop': `${layoutSettings.navDashboardLeft ?? 0}px`,
      '--nav-dashboard-left-mobile': `${layoutSettings.navDashboardLeftMobile ?? 0}px`,
      '--nav-street-left-desktop': `${layoutSettings.navStreetLeft ?? 0}px`,
      '--nav-street-left-mobile': `${layoutSettings.navStreetLeftMobile ?? 0}px`,
      '--nav-instruction-width-desktop': `${layoutSettings.navInstructionWidth ?? 100}%`,
      '--nav-instruction-width-mobile': `${layoutSettings.navInstructionWidthMobile ?? 100}%`,
      '--nav-dashboard-width-desktop': `${layoutSettings.navDashboardWidth ?? 100}%`,
      '--nav-dashboard-width-mobile': `${layoutSettings.navDashboardWidthMobile ?? 100}%`,
      '--user-marker-scale-desktop': `${layoutSettings.userMarkerScale ?? 1}`,
      '--user-marker-scale-mobile': `${layoutSettings.userMarkerScaleMobile ?? 1}`,
      '--nav-speed-bottom-desktop': `${layoutSettings.navSpeedBottom ?? 112}px`,
      '--nav-speed-bottom-mobile': `${layoutSettings.navSpeedBottomMobile ?? 112}px`,
      '--nav-speed-left-desktop': `${layoutSettings.navSpeedLeft ?? 0}px`,
      '--nav-speed-left-mobile': `${layoutSettings.navSpeedLeftMobile ?? 0}px`,
      '--nav-speed-scale-desktop': `${layoutSettings.navSpeedScale ?? 1}`,
      '--nav-speed-scale-mobile': `${layoutSettings.navSpeedScaleMobile ?? 1}`,
      '--nav-instruction-font-size-desktop': `${layoutSettings.navInstructionFontSize ?? 24}px`,
      '--nav-instruction-font-size-mobile': `${layoutSettings.navInstructionFontSizeMobile ?? 18}px`,
      '--nav-dashboard-font-size-desktop': `${layoutSettings.navDashboardFontSize ?? 30}px`,
      '--nav-dashboard-font-size-mobile': `${layoutSettings.navDashboardFontSizeMobile ?? 22}px`,
      '--nav-next-left-desktop': `${layoutSettings.navNextLeft ?? 0}px`,
      '--nav-next-left-mobile': `${layoutSettings.navNextLeftMobile ?? 0}px`,
      '--nav-next-top-desktop': `${layoutSettings.navNextTop ?? 0}px`,
      '--nav-next-top-mobile': `${layoutSettings.navNextTopMobile ?? 0}px`,
      '--nav-next-scale-desktop': `${layoutSettings.navNextScale ?? 1}`,
      '--nav-next-scale-mobile': `${layoutSettings.navNextScaleMobile ?? 1}`,
      '--nav-next-width-desktop': `${layoutSettings.navNextWidth ?? 100}%`,
      '--nav-next-width-mobile': `${layoutSettings.navNextWidthMobile ?? 100}%`,
      '--nav-next-font-size-desktop': `${layoutSettings.navNextFontSize ?? 14}px`,
      '--nav-next-font-size-mobile': `${layoutSettings.navNextFontSizeMobile ?? 14}px`,
      '--start-trip-bottom-desktop': `${layoutSettings.startTripBottom ?? 40}px`,
      '--start-trip-bottom-mobile': `${layoutSettings.startTripBottomMobile ?? 40}px`,
      '--start-trip-left-desktop': `${layoutSettings.startTripLeft ?? 0}px`,
      '--start-trip-left-mobile': `${layoutSettings.startTripLeftMobile ?? 0}px`,
      '--start-trip-scale-desktop': `${layoutSettings.startTripScale ?? 1.0}`,
      '--start-trip-scale-mobile': `${layoutSettings.startTripScaleMobile ?? 1.0}`,
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
        popupCenterOffset2D={layoutSettings?.popupCenterOffset2D ?? 180}
        popupCenterOffset2DMobile={layoutSettings?.popupCenterOffset2DMobile ?? 150}
        popupCenterOffset3D={layoutSettings?.popupCenterOffset3D ?? 250}
        popupCenterOffset3DMobile={layoutSettings?.popupCenterOffset3DMobile ?? 200}
        iconAnchorX={layoutSettings?.iconAnchorX ?? 25}
        iconAnchorY={layoutSettings?.iconAnchorY ?? 25}
        onSettingsChange={onSettingsChange}
        onNavigationStateChange={setIsNavigating}
        onRouteActiveChange={setIsRouteActive}
        onCloseDetail={onCloseDetail}
      />

      {/* Smart Search Bar */}
      {!isNavigating && !selectedPizzeria && !isRouteActive && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1001] transition-all duration-300 top-4 w-[var(--search-width-mobile,_90%)] md:w-[var(--search-width-desktop,_50%)] h-[var(--search-height-mobile,_2.5rem)] md:h-[var(--search-height-desktop,_3rem)]"
        >
          <div className="w-full h-full">
            <SmartSearch onSearch={onSearch} allPizzerias={allPizzerias || []} onClear={onClearSearch} />
          </div>
        </div>
      )}


    </div>
  );
}
