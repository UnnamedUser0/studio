'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import type { Pizzeria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, LocateFixed, MapPin, Ruler, Star, Settings, Navigation, X, ArrowLeft, MoreVertical, Volume2, Compass, AlertTriangle, Search, Leaf, CornerUpLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRoot } from 'react-dom/client';
import getDistance from 'geolib/es/getDistance';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const pizzaIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/1404/1404945.png', // Pizza Slice Icon
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -25],
  className: 'drop-shadow-lg'
});

const myLocationIcon = new L.Icon({
  iconUrl: '/icono512.jpg', // Local custom icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: 'drop-shadow-md rounded-full'
});

const navigationIcon = new L.DivIcon({
  className: 'navigation-arrow',
  html: `<div class="nav-arrow-inner" style="
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        /* Remove translate(-50%, -50%) from here as needed, but DivIcon usually needs centering logic if not handled by Anchor. 
           L.DivIcon with iconAnchor [20,20] centers the TopLeft of the div at the point. 
           If the div is 40x40, [20,20] is center. 
           So we don't need translate(-50%,-50%) inside the HTML if iconAnchor is correct.
           However, let's keep the existing styles but mainly add the class. 
           Wait, existing style has transform: translate(-50%, -50%). 
           If iconAnchor is [20,20] (center), Leaflet positions the top-left of the icon element at (Point - Anchor).
           So TopLeft is at (Px - 20, Py - 20). 
           So the div (40x40) occupies (Px-20, Py-20) to (Px+20, Py+20). Correctly centered.
           The inner transform translate(-50%, -50%) might shift it further? 
           Let's inspect original: transform: translate(-50%, -50%) was there. 
           If the container div provided by Leaflet is 0x0 (default DivIcon size if not specified, but here size IS specified).
           Actually, DivIcon creates a div. 'html' is put INSIDE it.
           If iconSize is [40,40], the Wrapper Div is 40x40.
           So the inner html just needs to fill it. 
           The existing style seems to try to center itself relative to something. 
           I will just wrap everything in nav-arrow-inner and keep styles safe.
        */
      ">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="white" fill-opacity="0.2"/>
          <path d="M20 5L32 35L20 27L8 35L20 5Z" fill="#2563EB" stroke="white" stroke-width="3" stroke-linejoin="round"/>
        </svg>
      </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
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
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [mapRotation, setMapRotation] = useState(0);

  // Helper: Calculate bearing between two points
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;

    const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    return bearing;
  };

  // Helper: Get target bearing based on route
  const getRouteBearing = (userLat: number, userLng: number) => {
    // If we have a route layer, try to find the heading along the path
    if (!routeLayerRef.current) return 0;

    const latlngs = routeLayerRef.current.getLatLngs() as L.LatLng[];
    if (!latlngs || latlngs.length < 2) return 0;

    // Find closest point index (simple Euclidean approx for speed)
    let minDist = Infinity;
    let closestIdx = 0;
    for (let i = 0; i < latlngs.length; i++) {
      const d = Math.sqrt(Math.pow(latlngs[i].lat - userLat, 2) + Math.pow(latlngs[i].lng - userLng, 2));
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }

    // Look ahead a few points to determine general direction (e.g., 20-30 meters ahead)
    // Assuming route points are dense. If end of route, use last segment.
    const lookAheadIdx = Math.min(closestIdx + 3, latlngs.length - 1);

    if (lookAheadIdx > closestIdx) {
      return calculateBearing(latlngs[closestIdx].lat, latlngs[closestIdx].lng, latlngs[lookAheadIdx].lat, latlngs[lookAheadIdx].lng);
    } else if (closestIdx > 0) {
      // End of route, look back
      return calculateBearing(latlngs[closestIdx - 1].lat, latlngs[closestIdx - 1].lng, latlngs[closestIdx].lat, latlngs[closestIdx].lng);
    }

    return 0;
  };

  // Center exactly on user without offset (as requested)
  const offsetMapCenter = (lat: number, lng: number, map: L.Map) => {
    map.panTo([lat, lng], { animate: true, duration: 0.5 });
  };

  // Effect: Apply Map Rotation (Course Up)
  const [isLocked, setIsLocked] = useState(true); // New state to track if we are locked on user

  // Effect: Apply Map Rotation (Course Up)
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // We rotate the entire map container
    // We removed 3D perspective (rotateX) as requested to keep the view "encima de mi ubicación" (Top-Down).
    // We keep rotateZ to "apuntar hacia la ruta" (Course Up).
    // We use scale(4) to ensure the square container covers the rectangular screen when rotated - removing black corners.
    if (isNavigating && isLocked) {
      mapContainerRef.current.classList.add('navigation-3d-view');
      mapContainerRef.current.style.transition = 'transform 0.5s ease-out';
      mapContainerRef.current.style.transform = `scale(4) rotateZ(-${mapRotation}deg)`;
      mapContainerRef.current.style.setProperty('--map-rotation', `${mapRotation}deg`);
      map.dragging.disable();
      map.touchZoom.disable();
    } else {
      mapContainerRef.current.classList.remove('navigation-3d-view');
      mapContainerRef.current.style.transform = '';
      mapContainerRef.current.style.transition = '';
      mapContainerRef.current.style.removeProperty('--map-rotation');
      map.dragging.enable();
      map.touchZoom.enable();
    }
  }, [mapRotation, isNavigating, isLocked]);

  // Effect: Update marker icon when mode changes
  useEffect(() => {
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.setIcon(isNavigating ? navigationIcon : myLocationIcon);
    }
  }, [isNavigating]);

  // Effect: Update bearing continuously when moving
  useEffect(() => {
    // Only update bearing/rotation if we are effectively locked/Tracking
    if (isNavigating && userLocation && isLocked) {
      const bearing = getRouteBearing(userLocation.lat, userLocation.lng);
      setMapRotation(bearing);
    }
  }, [userLocation, isNavigating, isLocked]);

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

    const onLocationSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed } = position.coords;
      console.log(`=== LOCATION FOUND ===`);

      // Update speed
      const speedKmh = speed ? Math.round(speed * 3.6) : 0;
      setCurrentSpeed(speedKmh);

      let bestAccuracy = accuracy;
      const latlng = new L.LatLng(latitude, longitude);
      setUserLocation({ lat: latitude, lng: longitude });

      // Always update markers or create if works
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setIcon(isNavigating ? navigationIcon : myLocationIcon);
        myLocationMarkerRef.current.setLatLng(latlng);
      } else {
        myLocationMarkerRef.current = L.marker(latlng, { icon: isNavigating ? navigationIcon : myLocationIcon }).addTo(map);
      }

      // If navigating, force center
      if (isNavigating && isLocked) {
        offsetMapCenter(latitude, longitude, map);
      } else if (!isNavigating) {
        map.flyTo(latlng, 16);
      }

      onLocateUser({ lat: latitude, lng: longitude });

      toast({
        title: 'Ubicación encontrada',
        description: `Precisión: ~${accuracy.toFixed(0)}m`,
      });

      // Start watching for better accuracy
      const watchId = navigator.geolocation.watchPosition(
        (betterPosition) => {
          const { latitude: lat, longitude: lng, accuracy: acc, speed: newSpeed } = betterPosition.coords;

          if (newSpeed !== null) setCurrentSpeed(Math.round(newSpeed * 3.6));

          // Update if accurate enough or navigating
          // We accept any update if navigating to keep movement smooth
          if (acc < bestAccuracy || isNavigating) {
            bestAccuracy = acc;
            const newLatlng = new L.LatLng(lat, lng);
            setUserLocation({ lat, lng });

            if (myLocationMarkerRef.current) {
              myLocationMarkerRef.current.setIcon(isNavigating ? navigationIcon : myLocationIcon);
              // Rotate the ARROW itself to match bearing?
              // Usually the arrow points to the heading (compass) or course.
              // If we rotate the map, the arrow stays pointing up relative to screen (which is correct for course-up).
              myLocationMarkerRef.current.setLatLng(newLatlng);
            }
            onLocateUser({ lat, lng });

            if (isNavigating && mapInstanceRef.current && isLocked) {
              offsetMapCenter(lat, lng, mapInstanceRef.current);
            }
          }
        },
        (error) => console.log('GPS Watch ignored:', error.message),
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );

      // Stop watching after 5 minutes if NOT navigating
      if (!isNavigating) {
        setTimeout(() => navigator.geolocation.clearWatch(watchId), 300000);
      }
    };

    const onLocationError = async (error: GeolocationPositionError) => {
      console.warn("Geolocation error:", error.code, error.message);

      // Fallback to IP Geolocation
      toast({
        title: 'Usando ubicación aproximada (IP)',
        description: 'GPS no disponible. Buscando por red...',
      });

      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP Geo failed');
        const data = await response.json();

        if (data.latitude && data.longitude) {
          // Construct a mock position object
          const mockPosition = {
            coords: {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 5000, // Low accuracy for IP
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          } as unknown as GeolocationPosition;

          onLocationSuccess(mockPosition);
          return;
        }
      } catch (err) {
        console.error("IP Fallback failed", err);
      }

      toast({
        variant: 'destructive',
        title: 'No se pudo obtener ubicación',
        description: 'Se agotaron los intentos por GPS y Red.',
      });
    };

    // FORCE LOW ACCURACY & ALLOW CACHED
    // We try to get "cached" location immediately (Infinity). If none, it waits 5s before failing to IP.
    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
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

  /* Camera Transition Routine for Navigation Mode */
  const enterNavigationMode = (lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Use current location exactly as requested suitable for navigation
    map.flyTo([lat, lng], 18, {
      animate: true,
      duration: 1.5, // Smooth transition
      easeLinearity: 0.25
    });
  };

  // Start Navigation Wrapper to set initial bearing
  const startNavigation = () => {
    if (!activeRoute) return;
    setIsNavigating(true);
    setIsLocked(true); // Ensure locked on start
    const map = mapInstanceRef.current;
    if (map && userLocation) {
      // Zoom in and center on user
      map.setZoom(18);
      // Force immediate snap without animation to ensure correct center before rotation hits
      map.panTo([userLocation.lat, userLocation.lng], { animate: false });

      // Update Icon Immediately
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setIcon(navigationIcon);
      }

      // Initial Bearing with Fallback
      let bearing = getRouteBearing(userLocation.lat, userLocation.lng);
      if (bearing === 0 && activeRoute) {
        // Fallback: Calculate bearing directly to destination if route lookahead fails
        // calculateBearing is not available in scope? It is inside PizzaMap but defined above. 
        // Assuming calculateBearing is available (it is defined a few lines above getRouteBearing in previous view).
        bearing = calculateBearing(userLocation.lat, userLocation.lng, activeRoute.lat, activeRoute.lng);
      }
      setMapRotation(bearing);

      if (mapContainerRef.current) {
        // Apply initial transform immediately with high scale
        mapContainerRef.current.style.transform = `scale(4) rotateZ(-${bearing}deg)`;
      }

      setTimeout(() => {
        map.invalidateSize();
        // Aggressive centering loop to ensure map snaps correctly after layout shifts
        let attempts = 0;
        const interval = setInterval(() => {
          map.panTo([userLocation.lat, userLocation.lng], { animate: false });
          // Re-apply rotation style to be safe
          if (mapContainerRef.current) {
            // We can't access isLocked easily here inside closure if it's stale, but we set it true above.
            // Just force it for start sequence.
            mapContainerRef.current.style.transform = `scale(4) rotateZ(-${bearing}deg)`;
          }
          attempts++;
          if (attempts > 5) clearInterval(interval);
        }, 100);
      }, 300);
    }

    // Announce start
    // const destinationName = pizzerias.find(p => Math.abs(p.lat - activeRoute.lat) < 0.0001)?.name || 'el destino';
    // speak(`Iniciando ruta hacia ${destinationName}.`);

    toast({
      title: "Iniciando navegación",
      description: "Sigue la ruta en el mapa."
    });
  };

  // Also fix clearRoute to remove 3D class
  const clearRoute = () => {
    if (mapContainerRef.current) {
      mapContainerRef.current.classList.remove('navigation-3d-view');
      mapContainerRef.current.style.transform = ''; // Reset transform
    }
    // ... existing clear logic
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    setActiveRoute(null);
    setIsNavigating(false);
    setIsLocked(false);
    setRouteDetails(null);
    const map = mapInstanceRef.current;
    if (map) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.flyTo(HERMOSILLO_CENTER, 12);
    }
  };

  // Follow user location when navigating
  useEffect(() => {
    if (isNavigating && userLocation && mapInstanceRef.current && isLocked) {
      offsetMapCenter(userLocation.lat, userLocation.lng, mapInstanceRef.current);
    }
  }, [userLocation, isNavigating, isLocked]);

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
      const isRouteDestination = activeRoute && Math.abs(activeRoute.lat - pizzeria.lat) < 0.0001 && Math.abs(activeRoute.lng - pizzeria.lng) < 0.0001;

      // Determine Icon
      let markerIcon = defaultIcon;
      if (isSelected) markerIcon = selectedIcon;
      else if (isNavigating && isRouteDestination) markerIcon = pizzaIcon;

      const marker = L.marker([pizzeria.lat, pizzeria.lng], {
        icon: markerIcon,
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
      <div
        ref={mapContainerRef}
        style={{ height: '100%', width: '100%' }}
      />

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
            <div className="flex flex-col gap-2">
              <Button
                variant={showAll ? "default" : "secondary"}
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="shadow-lg rounded-full h-8 md:h-10 px-3 text-xs md:text-sm font-medium"
              >
                {showAll ? "Ver cercanas" : "Ver todas"}
              </Button>

              {/* Manual Location Adjustment - Available on Desktop when location is known */}
              <div className="hidden md:block">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => {
                          setIsLocked(false);
                          if (myLocationMarkerRef.current) {
                            const marker = myLocationMarkerRef.current;
                            if (marker.dragging) marker.dragging.enable();

                            // Re-bind dragend to ensure we catch updates
                            marker.off('dragend');
                            marker.on('dragend', (e) => {
                              const newPos = e.target.getLatLng();
                              setUserLocation({ lat: newPos.lat, lng: newPos.lng });
                              onLocateUser({ lat: newPos.lat, lng: newPos.lng });
                              toast({ title: 'Ubicación actualizada manualmente' });
                            });
                          }
                          toast({ title: "Modo ajuste", description: "Arrastra tu icono para corregir la ubicación." });
                        }}
                        className="shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10 bg-white/90 text-black hover:bg-white"
                      >
                        <span className="text-base">📍</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Ajustar Ubicación</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
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
      {/* Navigation Dashboard (Active Mode - Google Maps Style) */}
      <TooltipProvider>
        {isNavigating && routeDetails && (
          <>
            {/* Top Instruction Bar - Green (Google Maps Style - Exact Match) */}
            <div className="absolute top-4 left-4 right-4 z-[1002] animate-in slide-in-from-top-4">
              {/* Primary Instruction Card */}
              <div className="bg-[#00695C] text-white p-4 rounded-xl shadow-lg flex items-center min-h-[80px]">
                {/* Left Arrow Icon */}
                <div className="flex-shrink-0 mr-4">
                  <CornerUpLeft className="w-12 h-12 text-white stroke-[3px]" />
                </div>

                {/* Text Content */}
                <div className="flex flex-col justify-center overflow-hidden">
                  <span className="text-2xl font-bold leading-none mb-1">50 m</span>
                  <h3 className="text-3xl font-bold leading-tight truncate">
                    {pizzerias.find(p => activeRoute && Math.abs(p.lat - activeRoute.lat) < 0.0001)?.address?.split(',')[0] || 'Calle Sahuaro'}
                  </h3>
                </div>
              </div>
            </div>

            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-[1001]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-xl bg-black/80 text-white hover:bg-black/90 border-0 overflow-hidden p-0"
                    onClick={() => {
                      const map = mapInstanceRef.current;
                      if (map && userLocation) {
                        setIsLocked(true); // Re-lock
                        map.setZoom(18);
                        // Snap immediately to fix "not centering"
                        map.panTo([userLocation.lat, userLocation.lng], { animate: false });

                        // Force update rotation explicitly so camera aligns to route
                        const bearing = getRouteBearing(userLocation.lat, userLocation.lng);
                        setMapRotation(bearing);
                      }
                    }}
                  >
                    <div className="relative w-full h-full bg-[#222] flex items-center justify-center">
                      <div className="w-1.5 h-4 bg-red-500 rounded-t-sm absolute top-2 left-1/2 -translate-x-1/2 z-10 shadow-sm"></div>
                      <div className="w-1.5 h-4 bg-gray-300 rounded-b-sm absolute bottom-2 left-1/2 -translate-x-1/2 z-10 shadow-sm"></div>
                      <div className="w-8 h-8 rounded-full border-[3px] border-gray-600/60"></div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Norte / Recentrar</p>
                </TooltipContent>
              </Tooltip>

              {/* Mute button removed */}
            </div>

            {/* Floating Speed Bubble */}
            <div className="absolute bottom-28 left-4 z-[1001] w-16 h-16 bg-black/80 rounded-full flex flex-col items-center justify-center border-2 border-white/10 shadow-xl backdrop-blur-sm">
              <span className="text-white font-bold text-xl leading-none">{currentSpeed}</span>
              <span className="text-white/70 text-[10px] uppercase font-bold">km/h</span>
            </div>

            {/* Manual Location Adjustment Button (Desktop/Nav) */}
            <div className="absolute bottom-48 right-4 z-[1001] hidden md:block">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsLocked(false);
                      if (myLocationMarkerRef.current) {
                        const marker = myLocationMarkerRef.current;
                        if (marker.dragging) marker.dragging.enable();

                        marker.off('dragend');
                        marker.on('dragend', (e) => {
                          const newPos = e.target.getLatLng();
                          setUserLocation({ lat: newPos.lat, lng: newPos.lng });
                          onLocateUser({ lat: newPos.lat, lng: newPos.lng });
                          toast({ title: 'Ubicación actualizada manualmente' });
                        });
                      }
                      toast({ title: "Modo ajuste", description: "Arrastra tu icono para corregir la ubicación." });
                    }}
                    className="bg-white/90 text-black hover:bg-white shadow-lg"
                  >
                    <span className="mr-2">📍</span> Ajustar Ubicación
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Habilita arrastrar el marcador</TooltipContent>
              </Tooltip>
            </div>

            {/* Bottom Status Bar - Black */}
            <div className="absolute bottom-0 left-0 right-0 z-[1002] bg-[#111111] p-4 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 text-white pb-8">
              <div className="flex items-center justify-between">
                <Button
                  onClick={clearRoute}
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-12 w-12 hover:bg-white/10 text-white"
                >
                  <X className="w-8 h-8" />
                </Button>

                <div className="flex flex-col items-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#4ade80] leading-none">
                      {(routeDetails.duration / 60).toFixed(0)} <span className="text-xl">min</span>
                    </span>
                    <Leaf className="w-4 h-4 text-[#4ade80] fill-[#4ade80]" />
                  </div>
                  <div className="text-gray-400 font-medium text-sm mt-1">
                    {(routeDetails.distance / 1000).toFixed(1)} km • {new Date(Date.now() + routeDetails.duration * 1000 + 180000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (hora estimada de llegada)
                  </div>
                </div>

                <div className="w-12" />
              </div>
            </div>
          </>
        )}
      </TooltipProvider>

      {/* Traffic Legend */}
      {
        showTrafficLegend && !isNavigating && (
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
        )
      }




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
        
        /* Navigation Mode - 2D Rotation (Course Up) */
        .navigation-3d-view .leaflet-map-pane {
           /* No perspective/tilt, just rotate the flat map */
           transform: rotateZ(var(--map-rotation, 0deg));
           transform-origin: center center;
           transition: transform 0.5s ease-out;
        }
        
        /* Rotate INNER CONTENT of markers to keep them upright/aligned relative to screen */
        .navigation-3d-view .nav-arrow-inner {
           /* Rotate POSITIVE to counteract negative map rotation */
           transform: rotateZ(var(--map-rotation, 0deg));
           transition: transform 0.1s linear; /* Smooth rotation */
        }
        
        .navigation-3d-view .leaflet-popup,
        .navigation-3d-view .leaflet-tooltip {
           /* Popups need to rotate too. They use translate3d, so using transform !important kills position. 
              Leaflet popups are separate panes. 
              We can't easily fix popups in CSS-only 3D view without breaking position. 
              For now, let them rotate with map (users can still read them). 
              Or we can try to target inner content of popup. 
           */
        }
      `}</style>
    </div>
  );
};
