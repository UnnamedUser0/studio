'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import type { Pizzeria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, LocateFixed, MapPin, Ruler, Star, Settings, Navigation, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRoot } from 'react-dom/client';
import getDistance from 'geolib/es/getDistance';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LayoutSettingsManager from '@/components/admin/layout-settings-manager';


const HERMOSILLO_CENTER: L.LatLngTuple = [29.085, -110.977];

// Define custom icons
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/3595/3595458.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/1046/1046751.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45],
});

const myLocationIcon = new L.Icon({
  iconUrl: '/icono512.jpg', // Local custom icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: 'drop-shadow-md rounded-full' // Added rounded-full in case it's square
});

type PizzaMapProps = {
  pizzerias: Pizzeria[];
  onMarkerClick: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
  searchCenter: { lat: number; lng: number } | null;
  onLocateUser: (coords: { lat: number, lng: number }) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onViewMenu?: (pizzeria: Pizzeria) => void;
  onNavigate?: (pizzeria: Pizzeria) => void;
  onRate?: (pizzeria: Pizzeria) => void;
  routeDestination?: { lat: number, lng: number } | null;
};

export default function PizzaMap({
  pizzerias,
  onMarkerClick,
  selectedPizzeria,
  searchCenter,
  onLocateUser,
  isFullscreen,
  onToggleFullscreen,
  onViewMenu,
  onNavigate,
  onRate,
  routeDestination,
  isAdmin = false
}: PizzaMapProps & { isAdmin?: boolean }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showTrafficLegend, setShowTrafficLegend] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<{ lat: number, lng: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeDetails, setRouteDetails] = useState<{ distance: number, duration: number } | null>(null);

  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Error de ubicación',
        description: 'La geolocalización no está soportada por tu navegador.',
      });
      return;
    }

    toast({
      title: 'Obteniendo ubicación precisa...',
    });

    const onLocationSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log(`=== LOCATION FOUND ===`);
      console.log(`Latitude: ${latitude}`);
      console.log(`Longitude: ${longitude}`);
      console.log(`Accuracy: ${accuracy} meters`);

      let bestAccuracy = accuracy;
      const latlng = new L.LatLng(latitude, longitude);
      setUserLocation({ lat: latitude, lng: longitude });

      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setLatLng(latlng);
      } else {
        myLocationMarkerRef.current = L.marker(latlng, { icon: myLocationIcon }).addTo(map);
      }

      // Only fly to location if NOT navigating (navigating handles its own view)
      if (!isNavigating) {
        map.flyTo(latlng, 16);
      }

      onLocateUser({ lat: latitude, lng: longitude });

      toast({
        title: 'Ubicación encontrada',
        description: `Precisión: ${accuracy.toFixed(0)}m`,
      });

      // Refine with watchPosition
      const watchId = navigator.geolocation.watchPosition(
        (betterPosition) => {
          const { latitude: lat, longitude: lng, accuracy: acc } = betterPosition.coords;
          if (acc < bestAccuracy * 0.8 || isNavigating) { // Always update if navigating
            console.log('=== IMPROVED LOCATION (GPS) ===');
            bestAccuracy = acc;
            const newLatlng = new L.LatLng(lat, lng);
            setUserLocation({ lat, lng });
            if (myLocationMarkerRef.current) myLocationMarkerRef.current.setLatLng(newLatlng);
            onLocateUser({ lat, lng });
          }
        },
        (error) => console.log('High accuracy refinement failed:', error.message),
        { enableHighAccuracy: true, timeout: 45000, maximumAge: 0 }
      );

      // Stop watching after 2 minutes ONLY if not navigating
      if (!isNavigating) {
        setTimeout(() => navigator.geolocation.clearWatch(watchId), 120000);
      }
    };

    const onLocationError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error.code, error.message);
      let errorMessage = 'No se pudo obtener tu ubicación.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permiso denegado. Revisa la configuración de ubicación.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Ubicación no disponible. Verifica tu GPS y conexión.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
          break;
      }
      toast({
        variant: 'destructive',
        title: 'Error de ubicación',
        description: errorMessage,
      });
    };

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        (error) => {
          console.error("Mobile High Accuracy Error:", error);
          if (error.code === error.TIMEOUT) {
            navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, { enableHighAccuracy: false, timeout: 10000 });
          } else {
            onLocationError(error);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        onLocationError,
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
      );
    }
  };

  const drawRoute = async (destination: { lat: number, lng: number }) => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) {
      toast({
        variant: 'destructive',
        title: 'Ubicación no disponible',
        description: 'Necesitamos tu ubicación para trazar la ruta. Por favor usa el botón de "Ubicarme" primero.',
      });
      return;
    }

    try {
      toast({
        title: 'Calculando ruta...',
        description: 'Buscando el mejor camino para ti.',
      });

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );

      if (!response.ok) throw new Error('Error al obtener la ruta');

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);

        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
        }

        const polyline = L.polyline(coordinates, {
          color: '#4285F4', // Google Maps Blue
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        routeLayerRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

        setActiveRoute(destination);
        setRouteDetails({
          distance: route.distance,
          duration: route.duration
        });

        toast({
          title: 'Ruta trazada',
          description: `Distancia: ${(route.distance / 1000).toFixed(1)} km, Tiempo estimado: ${(route.duration / 60).toFixed(0)} min`,
        });
      }
    } catch (error) {
      console.error('Routing error:', error);
      toast({
        variant: 'destructive',
        title: 'Error de ruta',
        description: 'No se pudo calcular la ruta en este momento.',
      });
    }
  };

  const clearRoute = () => {
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    setActiveRoute(null);
    setIsNavigating(false);
    setRouteDetails(null);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(HERMOSILLO_CENTER, 12);
    }
  };

  const startNavigation = () => {
    if (!activeRoute) return;
    setIsNavigating(true);
    const map = mapInstanceRef.current;
    if (map && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 18, {
        animate: true,
        duration: 1
      });
    }
    toast({
      title: "Iniciando navegación",
      description: "Sigue la ruta en el mapa."
    });
  };

  // Follow user location when navigating
  useEffect(() => {
    if (isNavigating && userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([userLocation.lat, userLocation.lng], {
        animate: true,
        duration: 1
      });
    }
  }, [userLocation, isNavigating]);

  // Effect to handle routeDestination prop
  useEffect(() => {
    if (routeDestination) {
      drawRoute(routeDestination);
    }
  }, [routeDestination]);

  // Effect for map initialization and cleanup
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(HERMOSILLO_CENTER, 12);
      mapInstanceRef.current = map;

      const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const satelliteLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}', {
        attribution: 'Map data &copy; Google',
        maxZoom: 20
      });

      const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      });

      const baseMaps = {
        "Estándar": standardLayer,
        "Satélite": satelliteLayer,
        "Relieve": terrainLayer,
      };

      trafficLayerRef.current = L.tileLayer('https://mt0.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}', {
        attribution: 'Map data &copy; Google',
        maxZoom: 20
      });

      const overlayMaps = {
        "Tráfico (Google)": trafficLayerRef.current
      };

      L.control.layers(baseMaps, overlayMaps).addTo(map);

      // Event listeners for traffic layer
      map.on('overlayadd', (e) => {
        if (e.name === 'Tráfico (Google)') setShowTrafficLegend(true);
      });
      map.on('overlayremove', (e) => {
        if (e.name === 'Tráfico (Google)') setShowTrafficLegend(false);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Effect to update traffic layer periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (trafficLayerRef.current) {
        // Force refresh by updating URL with timestamp
        const timestamp = Date.now();
        trafficLayerRef.current.setUrl(`https://mt0.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}&ts=${timestamp}`);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const [showAll, setShowAll] = useState(false);

  // Filter pizzerias based on distance if user location is known and not showing all
  const visiblePizzerias = pizzerias.filter(pizzeria => {
    // Always show selected pizzeria
    if (selectedPizzeria?.id === pizzeria.id) return true;

    // If explicitly showing all, show everything
    if (showAll) return true;

    // If we have a search center (meaning a search was performed), show pizzerias
    if (searchCenter) return true;

    // If user location is known, filter by distance (2.5km)
    if (userLocation && typeof pizzeria.lat === 'number' && typeof pizzeria.lng === 'number') {
      // Always show if it is the route destination
      if (routeDestination &&
        Math.abs(pizzeria.lat - routeDestination.lat) < 0.0001 &&
        Math.abs(pizzeria.lng - routeDestination.lng) < 0.0001) {
        return true;
      }

      // Also show if it is the active route destination
      if (activeRoute &&
        Math.abs(pizzeria.lat - activeRoute.lat) < 0.0001 &&
        Math.abs(pizzeria.lng - activeRoute.lng) < 0.0001) {
        return true;
      }

      const distance = getDistance(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        { latitude: pizzeria.lat, longitude: pizzeria.lng }
      );
      return distance <= 2500; // 2.5km in meters
    }

    // Otherwise (no user location, no search, not showing all), hide everything
    return false;
  });

  // Effect for changing map view
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Skip auto-centering if navigating
    if (isNavigating) return;

    if (selectedPizzeria) {
      map.flyTo([selectedPizzeria.lat, selectedPizzeria.lng], 16, {
        animate: true,
        duration: 1.5,
      });
    } else if (searchCenter) {
      map.flyTo([searchCenter.lat, searchCenter.lng], 14, {
        animate: true,
        duration: 1.5,
      });
    } else {
      // Don't reset view if we have a route or user location active
      if (!routeLayerRef.current && !userLocation) {
        map.flyTo(HERMOSILLO_CENTER, 12, {
          animate: true,
          duration: 1.5
        });
      }
    }
  }, [selectedPizzeria, searchCenter, routeLayerRef, userLocation, isNavigating]);

  // Update markers based on visiblePizzerias
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Use visiblePizzerias instead of prop pizzerias
    visiblePizzerias.forEach(pizzeria => {
      if (typeof pizzeria.lat !== 'number' || typeof pizzeria.lng !== 'number') return;

      const isSelected = selectedPizzeria?.id === pizzeria.id;
      const marker = L.marker([pizzeria.lat, pizzeria.lng], {
        icon: isSelected ? selectedIcon : defaultIcon,
      })
        .addTo(map);

      // Create Popup Content for ALL markers
      const popupContent = document.createElement('div');
      const root = createRoot(popupContent);

      const distance = userLocation
        ? (getDistance(
          { latitude: userLocation.lat, longitude: userLocation.lng },
          { latitude: pizzeria.lat, longitude: pizzeria.lng }
        ) / 1000).toFixed(1) + ' km'
        : 'Calculando...';

      root.render(
        <div className="w-[280px] p-1 font-sans">
          {pizzeria.imageUrl && (
            <div className="mb-3 rounded-lg overflow-hidden h-36 w-full bg-gray-100 relative shadow-sm">
              <img
                src={pizzeria.imageUrl}
                alt={pizzeria.name}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLElement).parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-red-600 leading-tight">{pizzeria.name}</h3>
          </div>

          <div className="space-y-2 mb-4 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
              <span className="leading-tight">{pizzeria.address || 'Dirección no disponible'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Distancia: {distance}</span>
            </div>

            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-medium text-gray-900">Rating: {pizzeria.rating?.toFixed(1) || 'N/A'}</span>
              <div className="flex ml-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < Math.round(pizzeria.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white h-9 text-sm font-medium"
              onClick={() => {
                if (onViewMenu) onViewMenu(pizzeria);
              }}
            >
              Ver menú
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white h-9 text-sm font-medium"
              onClick={() => drawRoute({ lat: pizzeria.lat, lng: pizzeria.lng })}
            >
              Cómo llegar
            </Button>
            <Button
              className="col-span-2 bg-yellow-500 hover:bg-yellow-600 text-white h-9 text-sm font-medium"
              onClick={() => {
                if (onRate) onRate(pizzeria);
              }}
            >
              <Star className="w-4 h-4 mr-2 fill-current" />
              Calificar
            </Button>
          </div>
        </div>
      );

      const popup = L.popup({
        offset: [0, -35],
        closeButton: true,
        className: 'custom-popup',
        maxWidth: 300
      }).setContent(popupContent);

      marker.bindPopup(popup);

      if (isSelected) {
        marker.setZIndexOffset(1000);
        marker.openPopup();
        popupRef.current = popup;
      }

      markersRef.current.push(marker);
    });
  }, [visiblePizzerias, selectedPizzeria, onMarkerClick, userLocation, activeRoute]);

  return (
    <div className="relative h-full w-full z-0">
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

      {/* Map Controls Container - Hide when navigating */}
      {!isNavigating && (
        <div
          className="absolute right-4 z-[1001] flex flex-col gap-2 transition-all duration-300 top-[var(--buttons-top-mobile,_160px)] md:top-[var(--buttons-top-desktop,_160px)]"
        >
          <Button
            variant="secondary"
            size="icon"
            onClick={handleLocateMe}
            className="shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10"
            aria-label="Find my location"
          >
            <LocateFixed className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleFullscreen}
            className="shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10"
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>

          {userLocation && (
            <Button
              variant={showAll ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="shadow-lg rounded-full h-8 md:h-10 px-3 text-xs md:text-sm font-medium"
            >
              {showAll ? "Ver cercanas" : "Ver todas"}
            </Button>
          )}

          {isAdmin && (
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10 border-2 border-white/20"
                  title="Configuración del Mapa"
                  aria-label="Configuración"
                >
                  <Settings className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configuración del Mapa</DialogTitle>
                </DialogHeader>
                <LayoutSettingsManager />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Start Trip / Navigation Controls */}
      {activeRoute && !isNavigating && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-[1002] flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <Button
            onClick={startNavigation}
            className="bg-[#4285F4] hover:bg-[#3367d6] text-white shadow-xl rounded-full px-6 h-12 text-base font-semibold border-2 border-white/20"
          >
            <Navigation className="mr-2 h-5 w-5 fill-current" />
            Iniciar viaje
          </Button>
          <Button
            onClick={clearRoute}
            variant="secondary"
            size="icon"
            className="h-12 w-12 rounded-full shadow-xl bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-100"
            aria-label="Cancelar ruta"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Navigation Dashboard (Active Mode) */}
      {isNavigating && routeDetails && (
        <>
          {/* Top Instruction Bar */}
          <div className="absolute top-4 left-4 right-4 z-[1002] bg-[#4285F4] text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <Navigation className="w-8 h-8 mt-1 fill-white/20" />
              <div>
                <p className="text-white/80 text-sm font-medium uppercase tracking-wide">En ruta a</p>
                <h3 className="text-xl font-bold leading-tight">
                  {pizzerias.find(p => activeRoute && Math.abs(p.lat - activeRoute.lat) < 0.0001)?.name || 'Destino seleccionado'}
                </h3>
              </div>
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-[1002] bg-white p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {(routeDetails.duration / 60).toFixed(0)} <span className="text-lg font-medium text-gray-500">min</span>
                </div>
                <div className="text-gray-500 font-medium">
                  {(routeDetails.distance / 1000).toFixed(1)} km • {new Date(Date.now() + routeDetails.duration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <Button
                onClick={clearRoute}
                variant="destructive"
                className="rounded-full h-12 px-6 font-bold text-base shadow-md"
              >
                Terminar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Traffic Legend */}
      {showTrafficLegend && !isNavigating && (
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-slate-700 text-xs transition-colors duration-300">
          <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-100">Tráfico</h4>
          <div className="space-y-1.5 font-medium text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-8 h-1.5 bg-[#63d668] rounded-full"></span>
              <span>Rápido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-1.5 bg-[#ff974d] rounded-full"></span>
              <span>Moderado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-1.5 bg-[#f23c32] rounded-full"></span>
              <span>Lento</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-1.5 bg-[#811f1f] rounded-full"></span>
              <span>Pesado</span>
            </div>
          </div>
        </div>
      )}




      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        /* Global Popup Scale - Applied to wrapper to avoid breaking Leaflet positioning */
        .leaflet-popup-content-wrapper, .leaflet-popup-tip-container {
           transform-origin: bottom center;
           transform: scale(var(--popup-scale-mobile, 1));
           transition: transform 0.2s ease;
        }
        @media (min-width: 768px) {
           .leaflet-popup-content-wrapper, .leaflet-popup-tip-container {
              transform: scale(var(--popup-scale-desktop, 1));
           }
        }

        /* Content Font Size & Layout */
        .leaflet-popup-content {
          margin: 12px;
          min-width: 200px;
          width: var(--popup-width-mobile, 260px) !important;
          font-size: var(--popup-font-size-mobile, 12px) !important;
          line-height: 1.5;
        }
        /* Force font size inheritance for inner elements */
        .leaflet-popup-content * {
            font-size: inherit !important;
        }
        
        @media (min-width: 768px) {
          .leaflet-popup-content {
            width: var(--popup-width-desktop, 280px) !important;
            font-size: var(--popup-font-size-desktop, 14px) !important;
          }
        }
        .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          color: #9ca3af !important;
        }

        /* Independent Layer Control Positioning */
        .leaflet-top.leaflet-right {
          top: var(--layer-control-top-mobile, 10px);
          transition: top 0.3s ease;
        }
        @media (min-width: 768px) {
          .leaflet-top.leaflet-right {
            top: var(--layer-control-top-desktop, 10px);
          }
        }
      `}</style>
    </div>
  );
}
