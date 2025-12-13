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
  routeDestination
}: PizzaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

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

    // Progressive accuracy: Start fast with WiFi, improve with GPS
    let watchId: number | undefined;
    let bestAccuracy = Infinity;

    // Phase 1: Get quick initial position with WiFi/IP (low accuracy but fast)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('=== INITIAL LOCATION (WiFi/IP) ===');
        console.log(`Latitude: ${latitude}`);
        console.log(`Longitude: ${longitude}`);
        console.log(`Accuracy: ${accuracy} meters`);
        console.log('==================================');

        bestAccuracy = accuracy;
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
          description: `Precisión inicial: ${accuracy.toFixed(0)}m - Mejorando...`,
        });

        // Phase 2: Start watching for better accuracy with GPS
        watchId = navigator.geolocation.watchPosition(
          (betterPosition) => {
            const { latitude: lat, longitude: lng, accuracy: acc } = betterPosition.coords;

            // Only update if accuracy improved significantly
            if (acc < bestAccuracy * 0.8) { // At least 20% improvement
              console.log('=== IMPROVED LOCATION (GPS) ===');
              console.log(`Latitude: ${lat}`);
              console.log(`Longitude: ${lng}`);
              console.log(`Accuracy: ${acc} meters (improved from ${bestAccuracy.toFixed(0)}m)`);
              console.log('================================');

              bestAccuracy = acc;
              const newLatlng = new L.LatLng(lat, lng);
              setUserLocation({ lat, lng });

              if (myLocationMarkerRef.current) {
                myLocationMarkerRef.current.setLatLng(newLatlng);
              }

              map.panTo(newLatlng);
              onLocateUser({ lat, lng });

              let accuracyMessage = `Precisión mejorada: ${acc.toFixed(0)}m`;
              if (acc <= 20) {
                accuracyMessage += ` ✓ Excelente`;
                // Stop watching once we get very good accuracy
                if (watchId !== undefined) {
                  navigator.geolocation.clearWatch(watchId);
                  watchId = undefined;
                }
              } else if (acc <= 50) {
                accuracyMessage += ` ✓ Buena`;
              }

              toast({
                title: 'Ubicación actualizada',
                description: accuracyMessage,
              });
            }
          },
          (error) => {
            console.log('GPS refinement failed, keeping initial location:', error.message);
            // Don't show error - we already have a working location
          },
          {
            enableHighAccuracy: true, // Use GPS for refinement
            timeout: 45000,
            maximumAge: 0
          }
        );

        // Stop watching after 60 seconds to save battery
        setTimeout(() => {
          if (watchId !== undefined) {
            navigator.geolocation.clearWatch(watchId);
            watchId = undefined;
            console.log('Stopped GPS refinement after 60s');
          }
        }, 60000);
      },
      (error) => {
        console.error("Geolocation error:", error.code, error.message);

        let errorMessage = 'No se pudo obtener tu ubicación.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso denegado. Por favor habilita la ubicación en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica tu conexión.';
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
      },
      {
        enableHighAccuracy: false, // Fast WiFi/IP location first
        timeout: 20000, // 20 seconds for initial location
        maximumAge: 300000 // Accept cached position up to 5 minutes old for instant response
      }
    );
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

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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
    }, 60000); // Update every 60 seconds

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
      <div className="absolute top-24 right-4 z-[1001] flex flex-col gap-2">
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
