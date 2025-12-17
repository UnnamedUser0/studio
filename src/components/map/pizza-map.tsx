'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import type { Pizzeria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, LocateFixed, MapPin, Ruler, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRoot } from 'react-dom/client';
import getDistance from 'geolib/es/getDistance';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LayoutSettingsManager from '@/components/admin/layout-settings-manager';
import { Settings } from 'lucide-react';

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
      title: 'Obteniendo ubicación...',
    });

    // Note: On some mobile devices, we might need high accuracy to trigger the prompt correctly
    // checking for secure context first
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      toast({
        variant: 'warning',
        title: 'Advertencia de seguridad',
        description: 'La ubicación podría fallar si no estás usando HTTPS.',
      });
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Shared success handler to avoid code duplication across branches
    const onLocationSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log(`=== LOCATION FOUND ===`);
      console.log(`Latitude: ${latitude}`);
      console.log(`Longitude: ${longitude}`);
      console.log(`Accuracy: ${accuracy} meters`);

      let bestAccuracy = accuracy; // This will be updated by the watchPosition
      const latlng = new L.LatLng(latitude, longitude);
      setUserLocation({ lat: latitude, lng: longitude });

      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setLatLng(latlng);
      } else {
        myLocationMarkerRef.current = L.marker(latlng, { icon: myLocationIcon }).addTo(map);
      }

      map.flyTo(latlng, 16);
      onLocateUser({ lat: latitude, lng: longitude });

      toast({
        title: 'Ubicación encontrada',
        description: `Precisión: ${accuracy.toFixed(0)}m`,
      });

      // Phase 2: Start watching for better accuracy with GPS (Original Logic)
      const watchId = navigator.geolocation.watchPosition(
        (betterPosition) => {
          const { latitude: lat, longitude: lng, accuracy: acc } = betterPosition.coords;
          if (acc < bestAccuracy * 0.8) { // Only update if accuracy improved significantly
            console.log('=== IMPROVED LOCATION (GPS) ===');
            bestAccuracy = acc;
            const newLatlng = new L.LatLng(lat, lng);
            setUserLocation({ lat, lng });
            if (myLocationMarkerRef.current) myLocationMarkerRef.current.setLatLng(newLatlng);
            onLocateUser({ lat, lng });
          }
        },
        (error) => console.log('GPS refinement failed:', error.message),
        { enableHighAccuracy: true, timeout: 45000, maximumAge: 0 }
      );

      // Stop watching after 60 seconds
      setTimeout(() => navigator.geolocation.clearWatch(watchId), 60000);
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

    if (isMobile) {
      // MOBILE STRATEGY: High Accuracy First -> Fallback
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        (error) => {
          if (error.code === error.TIMEOUT) {
            console.log('Mobile timeout, trying low accuracy fallback...');
            toast({ title: 'Reintentando...', description: 'Buscando ubicación con menor precisión.' });
            navigator.geolocation.getCurrentPosition(
              onLocationSuccess,
              onLocationError,
              { enableHighAccuracy: false, timeout: 20000, maximumAge: Infinity }
            );
          } else {
            onLocationError(error);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      // DESKTOP STRATEGY: Low Accuracy First (RESTORED ORIGINAL MECHANISM)
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
          color: '#ef4444', // Primary red color
          weight: 5,
          opacity: 0.8,
          lineCap: 'round'
        }).addTo(map);

        routeLayerRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

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
  }, [selectedPizzeria, searchCenter, routeLayerRef, userLocation]);

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
  }, [visiblePizzerias, selectedPizzeria, onMarkerClick, userLocation]);

  return (
    <div className="relative h-full w-full z-0">
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

      {/* Map Controls Container */}
      <div className="absolute top-40 right-4 z-[1001] flex flex-col gap-2">
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
      </div>

      {/* Traffic Legend */}
      {showTrafficLegend && (
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

      {/* Admin Map Settings Button */}
      {isAdmin && (
        <div className="absolute top-28 left-4 z-[1001]">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="shadow-lg rounded-full h-10 w-10 border-2 border-white/20"
                title="Configuración del Mapa"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuración del Mapa</DialogTitle>
              </DialogHeader>
              <LayoutSettingsManager />
            </DialogContent>
          </Dialog>
        </div>
      )}


      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 12px;
          width: 280px !important;
        }
        .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          color: #9ca3af !important;
        }
      `}</style>
    </div>
  );
}
