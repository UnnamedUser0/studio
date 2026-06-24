'use client';

import { useEffect, useRef, useState, memo, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Pizzeria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, LocateFixed, MapPin, Ruler, Star, Settings, Navigation, X, ArrowLeft, MoreVertical, Volume2, Compass, AlertTriangle, Search, Leaf, CornerUpLeft, CornerUpRight, ArrowUp, Phone, Globe, Share2, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import getDistance from 'geolib/es/getDistance';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LayoutSettingsManager from '@/components/admin/layout-settings-manager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const HERMOSILLO_CENTER: [number, number] = [29.085, -110.977]; // [lat, lng]

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
  popupOffsetY?: number;
  popupOffsetYMobile?: number;
  mapCenterOffset?: number;
  iconAnchorX?: number;
  iconAnchorY?: number;
  disableDistanceFilter?: boolean;
  explicitPizzeriasToShow?: Pizzeria[];
  onNavigationStateChange?: (navigating: boolean) => void;
  onCloseDetail?: () => void;
};

type Coord = { lat: number; lng: number };

const getMapStyle = () => {
  return {
    version: 8,
    sources: {
      "osm": {
        type: "raster",
        tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors"
      },
      "satellite": {
        type: "raster",
        tiles: ["https://mt0.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}"],
        tileSize: 256,
        attribution: "Map data &copy; Google"
      },
      "terrain": {
        type: "raster",
        tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png", "https://b.tile.opentopomap.org/{z}/{x}/{y}.png", "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "Map data &copy; OpenTopoMap"
      },
      "traffic": {
        type: "raster",
        tiles: ["https://mt0.google.com/vt/lyrs=m,traffic&hl=es&x={x}&y={y}&z={z}"],
        tileSize: 256,
        attribution: "Traffic &copy; Google"
      }
    },
    layers: [
      {
        id: "osm-layer",
        type: "raster",
        source: "osm",
        layout: { visibility: "visible" }
      },
      {
        id: "satellite-layer",
        type: "raster",
        source: "satellite",
        layout: { visibility: "none" }
      },
      {
        id: "terrain-layer",
        type: "raster",
        source: "terrain",
        layout: { visibility: "none" }
      },
      {
        id: "traffic-layer",
        type: "raster",
        source: "traffic",
        layout: { visibility: "none" }
      }
    ]
  } as maplibregl.StyleSpecification;
};

const updateLayersVisibility = (map: maplibregl.Map, baseLayer: string, showTraffic: boolean) => {
  map.setLayoutProperty('osm-layer', 'visibility', baseLayer === 'Estándar' ? 'visible' : 'none');
  map.setLayoutProperty('satellite-layer', 'visibility', baseLayer === 'Satélite' ? 'visible' : 'none');
  map.setLayoutProperty('terrain-layer', 'visibility', baseLayer === 'Relieve' ? 'visible' : 'none');
  map.setLayoutProperty('traffic-layer', 'visibility', showTraffic ? 'visible' : 'none');
};

const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;

  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
};

const getOffsetLatLng = (lat: number, lng: number, bearing: number, distanceMeters: number) => {
  const R = 6378137;
  const bearingRad = (bearing * Math.PI) / 180;
  const dLat = (distanceMeters * Math.cos(bearingRad)) / R;
  const dLng = (distanceMeters * Math.sin(bearingRad)) / (R * Math.cos((lat * Math.PI) / 180));
  return {
    lat: lat + (dLat * 180) / Math.PI,
    lng: lng + (dLng * 180) / Math.PI,
  };
};

const distanceToSegment = (p: Coord, a: Coord, b: Coord) => {
  const x = p.lng;
  const y = p.lat;
  const x1 = a.lng;
  const y1 = a.lat;
  const x2 = b.lng;
  const y2 = b.lat;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return getDistance({ latitude: y, longitude: x }, { latitude: y1, longitude: x1 });
  }

  let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const closestLng = x1 + t * dx;
  const closestLat = y1 + t * dy;

  return getDistance({ latitude: y, longitude: x }, { latitude: closestLat, longitude: closestLng });
};

const distanceToPolyline = (p: Coord, polylinePoints: Coord[]) => {
  let minDistance = Infinity;
  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const d = distanceToSegment(p, polylinePoints[i], polylinePoints[i + 1]);
    if (d < minDistance) {
      minDistance = d;
    }
  }
  return minDistance;
};

const getClosestPointOnPolyline = (p: Coord, polylinePoints: Coord[]): Coord => {
  if (!polylinePoints || polylinePoints.length === 0) return p;
  if (polylinePoints.length === 1) return polylinePoints[0];

  let minDistance = Infinity;
  let closestPoint = polylinePoints[0];

  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const a = polylinePoints[i];
    const b = polylinePoints[i + 1];

    const x = p.lng;
    const y = p.lat;
    const x1 = a.lng;
    const y1 = a.lat;
    const x2 = b.lng;
    const y2 = b.lat;

    const dx = x2 - x1;
    const dy = y2 - y1;

    let t = 0;
    if (dx !== 0 || dy !== 0) {
      t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
      t = Math.max(0, Math.min(1, t));
    }

    const projLng = x1 + t * dx;
    const projLat = y1 + t * dy;
    const projLatLng = { lat: projLat, lng: projLng };

    const d = getDistance(
      { latitude: y, longitude: x },
      { latitude: projLat, longitude: projLng }
    );

    if (d < minDistance) {
      minDistance = d;
      closestPoint = projLatLng;
    }
  }

  return closestPoint;
};

const calculateRemainingRouteDistance = (userLatLng: Coord, polylinePoints: Coord[]) => {
  if (polylinePoints.length < 2) return 0;

  let minDistance = Infinity;
  let closestSegmentIdx = 0;
  let closestPointOnSegment = polylinePoints[0];

  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const a = polylinePoints[i];
    const b = polylinePoints[i + 1];

    const x = userLatLng.lng;
    const y = userLatLng.lat;
    const x1 = a.lng;
    const y1 = a.lat;
    const x2 = b.lng;
    const y2 = b.lat;

    const dx = x2 - x1;
    const dy = y2 - y1;

    let t = 0;
    if (dx !== 0 || dy !== 0) {
      t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
      t = Math.max(0, Math.min(1, t));
    }

    const projLng = x1 + t * dx;
    const projLat = y1 + t * dy;
    const projLatLng = { lat: projLat, lng: projLng };

    const d = getDistance(
      { latitude: y, longitude: x },
      { latitude: projLat, longitude: projLng }
    );

    if (d < minDistance) {
      minDistance = d;
      closestSegmentIdx = i;
      closestPointOnSegment = projLatLng;
    }
  }

  let remainingDist = getDistance(
    { latitude: closestPointOnSegment.lat, longitude: closestPointOnSegment.lng },
    { latitude: polylinePoints[closestSegmentIdx + 1].lat, longitude: polylinePoints[closestSegmentIdx + 1].lng }
  );

  for (let i = closestSegmentIdx + 1; i < polylinePoints.length - 1; i++) {
    remainingDist += getDistance(
      { latitude: polylinePoints[i].lat, longitude: polylinePoints[i].lng },
      { latitude: polylinePoints[i + 1].lat, longitude: polylinePoints[i + 1].lng }
    );
  }

  return remainingDist;
};

const getCurrentStep = (userLatLng: Coord, steps: any[]) => {
  if (!steps || steps.length === 0) return null;

  let closestIdx = 0;
  let minDistance = Infinity;

  for (let i = 0; i < steps.length; i++) {
    if (!steps[i]?.maneuver?.location) continue;
    const stepLatLng = { lat: steps[i].maneuver.location[1], lng: steps[i].maneuver.location[0] };
    const d = getDistance(
      { latitude: userLatLng.lat, longitude: userLatLng.lng },
      { latitude: stepLatLng.lat, longitude: stepLatLng.lng }
    );
    if (d < minDistance) {
      minDistance = d;
      closestIdx = i;
    }
  }

  const closestStep = steps[closestIdx];
  if (!closestStep) return null;

  const closestStepLatLng = { lat: closestStep.maneuver.location[1], lng: closestStep.maneuver.location[0] };
  const distToManeuver = getDistance(
    { latitude: userLatLng.lat, longitude: userLatLng.lng },
    { latitude: closestStepLatLng.lat, longitude: closestStepLatLng.lng }
  );

  if (distToManeuver < 20 && closestIdx < steps.length - 1) {
    const nextStep = steps[closestIdx + 1];
    if (nextStep?.maneuver?.location) {
      return {
        step: nextStep,
        distance: getDistance(
          { latitude: userLatLng.lat, longitude: userLatLng.lng },
          { latitude: nextStep.maneuver.location[1], longitude: nextStep.maneuver.location[0] }
        ),
        index: closestIdx + 1
      };
    }
  }

  return {
    step: closestStep,
    distance: distToManeuver,
    index: closestIdx
  };
};

const getTurnIcon = (type: string, modifier: string) => {
  const mod = modifier?.toLowerCase() || '';
  const t = type?.toLowerCase() || '';

  if (t === 'arrive') return <MapPin className="w-12 h-12 text-white stroke-[3px]" />;
  if (t === 'depart') return <Navigation className="w-12 h-12 text-white stroke-[3px] rotate-45" />;

  if (mod.includes('left')) {
    return <CornerUpLeft className="w-12 h-12 text-white stroke-[3px]" />;
  }
  if (mod.includes('right')) {
    return <CornerUpRight className="w-12 h-12 text-white stroke-[3px]" />;
  }
  return <ArrowUp className="w-12 h-12 text-white stroke-[3px]" />;
};

const getTurnInstruction = (step: any, destinationName: string) => {
  if (!step) return 'Continúa por la ruta';
  const type = step.maneuver.type?.toLowerCase();
  const modifier = step.maneuver.modifier;
  const name = step.name || '';

  if (type === 'arrive') {
    return `Llegarás a ${destinationName}`;
  }
  if (type === 'depart') {
    return `Inicia el viaje hacia ${name || 'tu destino'}`;
  }

  const spanishModifier = modifier === 'left' ? 'izquierda' :
                          modifier === 'right' ? 'derecha' :
                          modifier === 'slight left' ? 'ligeramente a la izquierda' :
                          modifier === 'slight right' ? 'ligeramente a la derecha' :
                          modifier === 'sharp left' ? 'cerrado a la izquierda' :
                          modifier === 'sharp right' ? 'cerrado a la derecha' : '';

  if (spanishModifier) {
    return `Gira a la ${spanishModifier} en ${name || 'la siguiente calle'}`;
  }

  return `Continúa por ${name || 'la ruta'}`;
};

function PizzaMap({
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
  isAdmin = false,
  popupOffsetY = -35,
  popupOffsetYMobile = -35,
  mapCenterOffset = 150,
  iconAnchorX = 25,
  iconAnchorY = 25,
  disableDistanceFilter = false,
  explicitPizzeriasToShow = [],
  onSettingsChange,
  onNavigationStateChange,
  onCloseDetail
}: PizzaMapProps & { isAdmin?: boolean, onSettingsChange?: (settings: any) => void }) {
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const myLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const routeCoordinatesRef = useRef<[number, number][]>([]);
  const prevSelectedPizzeriaRef = useRef<Pizzeria | null>(null);
  const nextManeuverMarkerRef = useRef<maplibregl.Marker | null>(null);

  const { toast } = useToast();
  
  // Base style layers state
  const [currentBaseLayer, setCurrentBaseLayer] = useState<'Estándar' | 'Satélite' | 'Relieve'>('Estándar');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showTrafficLegend, setShowTrafficLegend] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<{ lat: number, lng: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeDetails, setRouteDetails] = useState<{ distance: number, duration: number } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [mapRotation, setMapRotation] = useState(0);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<{
    icon: React.ReactNode;
    text: string;
    distanceText: string;
  } | null>(null);

  const [isLocked, setIsLocked] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [currentStreet, setCurrentStreet] = useState<string>('');

  // Animated and tracking refs for 60fps rendering
  const animatedCoordsRef = useRef<{ lat: number, lng: number } | null>(null);
  const currentHeadingRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const initialRouteDistanceRef = useRef<number>(0);
  const initialRouteDurationRef = useRef<number>(0);
  const destinationNameRef = useRef<string>('tu destino');
  const lastGpsTimeRef = useRef<number>(Date.now());
  const lastRecalculateTimeRef = useRef<number>(0);
  const isRecalculatingRef = useRef<boolean>(false);

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isAdjustingLocation, setIsAdjustingLocation] = useState(false);
  const activeRouteRef = useRef<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    activeRouteRef.current = activeRoute;
  }, [activeRoute]);

  const isNavigatingRef = useRef(isNavigating);
  const isLockedRef = useRef(isLocked);
  const isProgrammaticCloseRef = useRef<boolean>(false);

  const changeLockState = (val: boolean) => {
    setIsLocked(val);
    isLockedRef.current = val;
  };

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    onNavigationStateChange?.(isNavigating);
  }, [isNavigating, onNavigationStateChange]);

  const updateNavigationInstructions = (userLatLng: Coord, steps: any[], destName: string) => {
    const result = getCurrentStep(userLatLng, steps);
    if (!result) return;

    const { step, distance, index } = result;
    const icon = getTurnIcon(step.maneuver?.type || '', step.maneuver?.modifier || '');
    const text = getTurnInstruction(step, destName);
    const distanceText = distance >= 1000
      ? `${(distance / 1000).toFixed(1)} km`
      : `${Math.round(distance)} m`;

    setCurrentInstruction({ icon, text, distanceText });

    // Update current street name
    const currentStreetName = step?.name || '';
    setCurrentStreet(currentStreetName);

    // Update next street marker on the map
    const map = mapInstanceRef.current;
    if (map) {
      const nextStep = steps[index + 1];
      if (nextStep && nextStep.maneuver?.location && nextStep.name) {
        const nextLoc = nextStep.maneuver.location; // [lng, lat]
        
        if (!nextManeuverMarkerRef.current) {
          const el = document.createElement('div');
          el.className = 'next-street-label-marker';
          el.innerHTML = `
            <div class="next-street-bubble">${nextStep.name}</div>
          `;
          nextManeuverMarkerRef.current = new maplibregl.Marker({
            element: el,
            anchor: 'bottom'
          })
          .setLngLat(nextLoc as [number, number])
          .addTo(map);
        } else {
          nextManeuverMarkerRef.current.setLngLat(nextLoc as [number, number]);
          const inner = nextManeuverMarkerRef.current.getElement().firstElementChild;
          if (inner) inner.textContent = nextStep.name;
        }
      } else {
        if (nextManeuverMarkerRef.current) {
          nextManeuverMarkerRef.current.remove();
          nextManeuverMarkerRef.current = null;
        }
      }
    }
  };

  const updateUserMarkerElement = (el: HTMLElement, navigating: boolean) => {
    if (navigating) {
      el.innerHTML = `
        <div class="nav-arrow-inner" style="
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <!-- Pulse Halo (GPS Accuracy) -->
          <div style="
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: rgba(37, 99, 235, 0.15);
            border: 1.5px solid rgba(37, 99, 235, 0.3);
            animation: pulse 2s infinite ease-in-out;
            pointer-events: none;
          "></div>
          
          <!-- White Circle Base -->
          <div style="
            position: absolute;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background-color: #ffffff;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          ">
            <!-- Blue Chevron Arrow pointing straight UP -->
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L22 22L12 17L2 22L12 2Z" fill="#1A73E8" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      `;
      el.style.width = '64px';
      el.style.height = '64px';
    } else {
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          background-image: url('/icono512.jpg');
          background-size: cover;
          background-position: center;
        "></div>
      `;
      el.style.width = '40px';
      el.style.height = '40px';
    }
  };

  const updateUserMarker = (lnglat: [number, number], forceIconUpdate = false) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!myLocationMarkerRef.current) {
      const el = document.createElement('div');
      updateUserMarkerElement(el, isNavigatingRef.current);
      
      const marker = new maplibregl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map',
        draggable: isAdjustingLocation
      })
      .setLngLat(lnglat)
      .addTo(map);

      // Register dragend listener to update user location state and recalculate active route
      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        const coords = { lat: newLngLat.lat, lng: newLngLat.lng };
        
        setUserLocation(coords);
        if (onLocateUser) {
          onLocateUser(coords);
        }
        
        setIsAdjustingLocation(false);
        marker.setDraggable(false);
        
        const markerEl = marker.getElement();
        markerEl.style.cursor = '';
        markerEl.style.boxShadow = '';
        
        try {
          localStorage.setItem('userLocation', JSON.stringify(coords));
        } catch (e) {
          console.warn("Storage access failed:", e);
        }
        
        toast({
          title: "Ubicación ajustada",
          description: `Nueva ubicación establecida: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
        });
        
        if (activeRouteRef.current) {
          drawRoute(activeRouteRef.current, coords);
        }
      });

      myLocationMarkerRef.current = marker;
    } else {
      myLocationMarkerRef.current.setLngLat(lnglat);
      if (forceIconUpdate) {
        const el = myLocationMarkerRef.current.getElement();
        updateUserMarkerElement(el, isNavigatingRef.current);
      }
    }
  };

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

    toast({ title: 'Obteniendo ubicación...' });

    const onLocationSuccess = (position: GeolocationPosition) => {
      let { latitude, longitude, accuracy, speed } = position.coords;

      const distFromCenter = getDistance(
        { latitude, longitude },
        { latitude: HERMOSILLO_CENTER[0], longitude: HERMOSILLO_CENTER[1] }
      );

      if (distFromCenter > 30000) {
        console.warn("Location outside Hermosillo detected.", { latitude, longitude });
        toast({
          title: 'Ubicación lejana detectada',
          description: 'Tu ubicación parece estar fuera de Hermosillo.',
        });
      }

      const speedKmh = speed ? Math.round(speed * 3.6) : 0;
      setCurrentSpeed(speedKmh);

      let bestAccuracy = accuracy;
      setUserLocation({ lat: latitude, lng: longitude });
      try {
        localStorage.setItem('userLocation', JSON.stringify({ lat: latitude, lng: longitude }));
      } catch (e) {
        console.warn("Storage access failed:", e);
      }

      if (!isNavigatingRef.current) {
        updateUserMarker([longitude, latitude]);
      }

      animateToLocation(latitude, longitude, speedKmh);

      if (!isNavigating) {
        map.easeTo({ center: [longitude, latitude], zoom: 16, duration: 1000 });
      }

      onLocateUser({ lat: latitude, lng: longitude });

      toast({
        title: 'Ubicación encontrada',
        description: `Precisión: ~${accuracy.toFixed(0)}m`,
      });

      const watchId = navigator.geolocation.watchPosition(
        (betterPosition) => {
          let { latitude: lat, longitude: lng, accuracy: acc, speed: newSpeed } = betterPosition.coords;
          const speedKmh = newSpeed ? Math.round(newSpeed * 3.6) : 0;

          if (acc < bestAccuracy || isNavigating) {
            bestAccuracy = acc;
            
            animateToLocation(lat, lng, speedKmh);

            if (isNavigating && routeCoordinatesRef.current.length > 0) {
              const userLatLng = { lat, lng };
              const distToRoute = distanceToPolyline(
                userLatLng,
                routeCoordinatesRef.current.map(c => ({ lat: c[0], lng: c[1] }))
              );
              
              if (distToRoute > 50 && !isRecalculatingRef.current && (Date.now() - lastRecalculateTimeRef.current > 5000)) {
                console.log("Off route detected! Recalculating path...");
                isRecalculatingRef.current = true;
                lastRecalculateTimeRef.current = Date.now();
                
                if (activeRoute) {
                  drawRoute(activeRoute).finally(() => {
                    isRecalculatingRef.current = false;
                  });
                }
              }
            }

            if (isNavigating && routeCoordinatesRef.current.length > 0 && routeSteps.length > 0) {
              const userLatLng = { lat, lng };
              const remDistance = calculateRemainingRouteDistance(
                userLatLng,
                routeCoordinatesRef.current.map(c => ({ lat: c[0], lng: c[1] }))
              );
              
              const initialRouteDist = initialRouteDistanceRef.current || 1000;
              const initialRouteDur = initialRouteDurationRef.current || 120;
              const progressRatio = remDistance / initialRouteDist;

              setRouteDetails({
                distance: remDistance,
                duration: progressRatio * initialRouteDur
              });

              updateNavigationInstructions(userLatLng, routeSteps, destinationNameRef.current);
            }

            setUserLocation({ lat, lng });
            onLocateUser({ lat, lng });
          }
        },
        (error) => console.log('GPS Watch ignored:', error.message),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
      );

      if (!isNavigating) {
        setTimeout(() => navigator.geolocation.clearWatch(watchId), 300000);
      }
    };

    const onLocationError = async (error: GeolocationPositionError) => {
      console.warn("Geolocation error:", error.code, error.message);
      toast({
        title: 'Usando ubicación aproximada (IP)',
        description: 'GPS no disponible. Buscando por red...',
      });

      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP Geo failed');
        const data = await response.json();

        if (data.latitude && data.longitude) {
          const mockPosition = {
            coords: {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 5000,
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

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
    );
  };

  const drawRoute = async (destination: { lat: number, lng: number }, originOverride?: { lat: number, lng: number }) => {
    const map = mapInstanceRef.current;
    const origin = originOverride || userLocation;
    if (!map || !origin) {
      toast({
        variant: 'destructive',
        title: 'Ubicación no disponible',
        description: 'Necesitamos tu ubicación para trazar la ruta. Por favor usa el botón de "Ubicarme" primero.',
      });
      return;
    }

    try {
      if (!isNavigating) {
        toast({
          title: 'Calculando ruta...',
          description: 'Buscando el mejor camino para ti.',
        });
      }

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`
      );

      if (!response.ok) throw new Error('Error al obtener la ruta');

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        if (activePopupRef.current) {
          isProgrammaticCloseRef.current = true;
          activePopupRef.current.remove();
          isProgrammaticCloseRef.current = false;
        }

        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;

        routeCoordinatesRef.current = coordinates.map((c: any) => [c[1], c[0]]); // [lat, lng]

        if (map.getSource('route')) {
          const source = map.getSource('route') as maplibregl.GeoJSONSource;
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });
        } else {
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry
            }
          });

          map.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#4285F4',
              'line-width': 6,
              'line-opacity': 0.9
            }
          });
        }

        if (!isNavigating) {
          const bounds = coordinates.reduce((acc: maplibregl.LngLatBounds, coord: number[]) => {
            return acc.extend(coord as [number, number]);
          }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

          map.fitBounds(bounds, { padding: 50 });
        }

        const steps = route.legs?.flatMap((leg: any) => leg.steps) || [];
        setRouteSteps(steps);
        initialRouteDistanceRef.current = route.distance;
        initialRouteDurationRef.current = route.duration;

        const destinationPizzeria = pizzerias.find(
          p => Math.abs(p.lat - destination.lat) < 0.0001 && Math.abs(p.lng - destination.lng) < 0.0001
        );
        destinationNameRef.current = destinationPizzeria?.name || 'tu destino';

        setActiveRoute(destination);
        setRouteDetails({
          distance: route.distance,
          duration: route.duration
        });

        const userLatLng = { lat: origin.lat, lng: origin.lng };
        updateNavigationInstructions(userLatLng, steps, destinationNameRef.current);

        if (!isNavigating) {
          toast({
            title: 'Ruta trazada',
            description: `Distancia: ${(route.distance / 1000).toFixed(1)} km, Tiempo estimado: ${(route.duration / 60).toFixed(0)} min`,
          });
        }
      }
    } catch (error) {
      console.error('Routing error:', error);
      if (!isNavigating) {
        toast({
          variant: 'destructive',
          title: 'Error de ruta',
          description: 'No se pudo calcular la ruta en este momento.',
        });
      }
    }
  };

  const getRouteBearing = (userLat: number, userLng: number) => {
    const latlngs = routeCoordinatesRef.current;
    if (!latlngs || latlngs.length < 2) return 0;

    // Find the closest segment
    let minDist = Infinity;
    let closestIdx = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      const d = distanceToSegment({ lat: userLat, lng: userLng }, { lat: latlngs[i][0], lng: latlngs[i][1] }, { lat: latlngs[i + 1][0], lng: latlngs[i + 1][1] });
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }

    // Look ahead along the route for at least 15 meters to get a stable segment bearing
    let targetIdx = closestIdx + 1;
    let dist = 0;
    while (targetIdx < latlngs.length) {
      dist = getDistance(
        { latitude: latlngs[closestIdx][0], longitude: latlngs[closestIdx][1] },
        { latitude: latlngs[targetIdx][0], longitude: latlngs[targetIdx][1] }
      );
      if (dist >= 15 || targetIdx === latlngs.length - 1) {
        break;
      }
      targetIdx++;
    }

    return calculateBearing(
      latlngs[closestIdx][0],
      latlngs[closestIdx][1],
      latlngs[targetIdx][0],
      latlngs[targetIdx][1]
    );
  };

  const animateToLocation = (targetLat: number, targetLng: number, targetSpeed: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let finalLat = targetLat;
    let finalLng = targetLng;

    if (isNavigatingRef.current && routeCoordinatesRef.current.length > 0) {
      const snapped = getClosestPointOnPolyline(
        { lat: targetLat, lng: targetLng },
        routeCoordinatesRef.current.map(c => ({ lat: c[0], lng: c[1] }))
      );
      finalLat = snapped.lat;
      finalLng = snapped.lng;
    }

    const now = Date.now();
    let duration = now - lastGpsTimeRef.current;
    if (duration < 800) duration = 1000;
    if (duration > 3000) duration = 1500;
    lastGpsTimeRef.current = now;

    const startCoords = animatedCoordsRef.current || { lat: finalLat, lng: finalLng };
    const startHeading = currentHeadingRef.current;

    let targetHeading = startHeading;
    if (isNavigatingRef.current) {
      targetHeading = getRouteBearing(finalLat, finalLng);
      if (targetHeading === 0 && activeRoute) {
        targetHeading = calculateBearing(finalLat, finalLng, activeRoute.lat, activeRoute.lng);
      }
    }

    const startTime = performance.now();

    const step = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentLat = startCoords.lat + (finalLat - startCoords.lat) * progress;
      const currentLng = startCoords.lng + (finalLng - startCoords.lng) * progress;

      let diff = targetHeading - startHeading;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;
      const currentHeading = (startHeading + diff * progress + 360) % 360;

      animatedCoordsRef.current = { lat: currentLat, lng: currentLng };
      currentHeadingRef.current = currentHeading;

      updateUserMarker([currentLng, currentLat]);
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setRotation(currentHeading);
      }

      setCurrentSpeed(targetSpeed);

      if (isNavigatingRef.current && isLockedRef.current) {
        const height = map.getContainer().clientHeight;
        const pixelOffset: [number, number] = [0, height * 0.22];
        map.easeTo({
          center: [currentLng, currentLat],
          pitch: 60,
          bearing: currentHeading,
          offset: pixelOffset,
          duration: 0
        });
        setMapRotation(currentHeading);
      } else {
        setMapRotation(currentHeading);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(step);
  };

  const startNavigation = () => {
    if (!activeRoute) return;

    setIsNavigating(true);
    isNavigatingRef.current = true;
    changeLockState(true);
    
    handleLocateMe();

    const map = mapInstanceRef.current;
    if (map && userLocation) {
      let navLoc = { lat: userLocation.lat, lng: userLocation.lng };
      if (routeCoordinatesRef.current.length > 0) {
        navLoc = getClosestPointOnPolyline(
          navLoc,
          routeCoordinatesRef.current.map(c => ({ lat: c[0], lng: c[1] }))
        );
      }

      let bearing = getRouteBearing(navLoc.lat, navLoc.lng);
      if (bearing === 0 && activeRoute) {
        bearing = calculateBearing(navLoc.lat, navLoc.lng, activeRoute.lat, activeRoute.lng);
      }
      setMapRotation(bearing);
      currentHeadingRef.current = bearing;
      animatedCoordsRef.current = { lat: navLoc.lat, lng: navLoc.lng };

      const height = map.getContainer().clientHeight;
      const pixelOffset: [number, number] = [0, height * 0.22];
      
      map.easeTo({
        center: [navLoc.lng, navLoc.lat],
        zoom: 18,
        pitch: 60,
        bearing: bearing,
        offset: pixelOffset,
        duration: 0
      });

      updateUserMarker([navLoc.lng, navLoc.lat], true);
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setRotation(bearing);
      }
    }

    toast({
      title: "Iniciando navegación",
      description: "Sigue la ruta en el mapa."
    });
  };

  const cleanupNavigationTimers = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const exitNavigation = () => {
    cleanupNavigationTimers();
    setIsNavigating(false);
    isNavigatingRef.current = false;
    changeLockState(false);
    setCurrentInstruction(null);
    setCurrentStreet('');
    if (nextManeuverMarkerRef.current) {
      nextManeuverMarkerRef.current.remove();
      nextManeuverMarkerRef.current = null;
    }

    const map = mapInstanceRef.current;
    if (map) {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 800
      });
      
      if (routeCoordinatesRef.current.length > 0) {
        const bounds = routeCoordinatesRef.current.reduce((acc, coord) => {
          return acc.extend([coord[1], coord[0]]);
        }, new maplibregl.LngLatBounds(
          [routeCoordinatesRef.current[0][1], routeCoordinatesRef.current[0][0]],
          [routeCoordinatesRef.current[0][1], routeCoordinatesRef.current[0][0]]
        ));
        map.fitBounds(bounds, { padding: 50 });
      }
    }

    if (userLocation) {
      updateUserMarker([userLocation.lng, userLocation.lat], true);
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setRotation(0);
      }
    }
    
    toast({
      title: "Navegación finalizada",
      description: "Has salido del modo de navegación."
    });
  };

  const clearRoute = () => {
    cleanupNavigationTimers();
    setCurrentInstruction(null);
    setCurrentStreet('');
    if (nextManeuverMarkerRef.current) {
      nextManeuverMarkerRef.current.remove();
      nextManeuverMarkerRef.current = null;
    }

    const map = mapInstanceRef.current;
    if (map) {
      if (map.getLayer('route-layer')) map.removeLayer('route-layer');
      if (map.getSource('route')) map.removeSource('route');
      
      map.easeTo({
        pitch: 0,
        bearing: 0,
        center: [HERMOSILLO_CENTER[1], HERMOSILLO_CENTER[0]],
        zoom: 12,
        duration: 800
      });
    }

    routeCoordinatesRef.current = [];
    setActiveRoute(null);
    setIsNavigating(false);
    isNavigatingRef.current = false;
    changeLockState(false);
    setRouteDetails(null);
    setRouteSteps([]);

    if (userLocation) {
      updateUserMarker([userLocation.lng, userLocation.lat], true);
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setRotation(0);
      }
    }
  };

  useEffect(() => {
    if (routeDestination) {
      drawRoute(routeDestination);
    }
  }, [routeDestination]);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getMapStyle(),
        center: [HERMOSILLO_CENTER[1], HERMOSILLO_CENTER[0]],
        zoom: 12,
        pitch: 0,
        bearing: 0,
        attributionControl: false
      });
      
      mapInstanceRef.current = map;

      // Close popup when clicking on empty space of the map
      map.on('click', () => {
        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }
      });

      // Unlock map center tracking on manual dragging
      map.on('dragstart', () => {
        if (isNavigatingRef.current) {
          changeLockState(false);
        }
      });

      let savedBaseLayerName = 'Estándar';
      try {
        const stored = localStorage.getItem('mapBaseLayer');
        if (stored === 'Estándar' || stored === 'Satélite' || stored === 'Relieve') {
          savedBaseLayerName = stored;
        }
      } catch (e) {
        console.warn("Storage access failed:", e);
      }
      setCurrentBaseLayer(savedBaseLayerName as any);

      map.on('load', () => {
        updateLayersVisibility(map, savedBaseLayerName, showTraffic);

        let savedLoc = null;
        try {
          savedLoc = localStorage.getItem('userLocation');
        } catch (e) {
          console.warn("Storage access failed:", e);
        }
        if (savedLoc) {
          try {
            const { lat, lng } = JSON.parse(savedLoc);
            if (typeof lat === 'number' && typeof lng === 'number') {
              setUserLocation({ lat, lng });
              updateUserMarker([lng, lat], true);
              map.setCenter([lng, lat]);
              map.setZoom(16);
            }
          } catch (e) {
            console.error("Failed to parse saved location", e);
          }
        }

        if (routeDestination) {
          drawRoute(routeDestination);
        }
      });
    }

    return () => {
      cleanupNavigationTimers();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleBaseLayerChange = (layerName: 'Estándar' | 'Satélite' | 'Relieve') => {
    setCurrentBaseLayer(layerName);
    try {
      localStorage.setItem('mapBaseLayer', layerName);
    } catch (e) {
      console.warn("Storage access failed:", e);
    }
    
    const map = mapInstanceRef.current;
    if (map) {
      updateLayersVisibility(map, layerName, showTraffic);
    }
  };

  const handleTrafficToggle = () => {
    const nextVal = !showTraffic;
    setShowTraffic(nextVal);
    setShowTrafficLegend(nextVal);
    
    const map = mapInstanceRef.current;
    if (map) {
      updateLayersVisibility(map, currentBaseLayer, nextVal);
    }
  };

  const visiblePizzerias = useMemo(() => {
    let candidates = pizzerias;
    if (selectedPizzeria && !pizzerias.find(p => p.id === selectedPizzeria.id)) {
      candidates = [...pizzerias, selectedPizzeria];
    }
    explicitPizzeriasToShow?.forEach(explicit => {
      if (!candidates.find(p => p.id === explicit.id)) {
        candidates = [...candidates, explicit];
      }
    });

    return candidates.filter(pizzeria => {
      if (selectedPizzeria?.id === pizzeria.id) return true;
      if (explicitPizzeriasToShow?.some(e => e.id === pizzeria.id)) return true;
      if (showAll) return true;
      if (disableDistanceFilter) return true;

      if (searchCenter && typeof pizzeria.lat === 'number' && typeof pizzeria.lng === 'number') {
        const distToSearch = getDistance(
          { latitude: searchCenter.lat, longitude: searchCenter.lng },
          { latitude: pizzeria.lat, longitude: pizzeria.lng }
        );
        if (distToSearch <= 2500) return true;
      }

      if (userLocation && typeof pizzeria.lat === 'number' && typeof pizzeria.lng === 'number') {
        if (routeDestination &&
          Math.abs(pizzeria.lat - routeDestination.lat) < 0.0001 &&
          Math.abs(pizzeria.lng - routeDestination.lng) < 0.0001) {
          return true;
        }

        if (activeRoute &&
          Math.abs(pizzeria.lat - activeRoute.lat) < 0.0001 &&
          Math.abs(pizzeria.lng - activeRoute.lng) < 0.0001) {
          return true;
        }

        const distance = getDistance(
          { latitude: userLocation.lat, longitude: userLocation.lng },
          { latitude: pizzeria.lat, longitude: pizzeria.lng }
        );
        return distance <= 2500;
      }

      return false;
    });
  }, [pizzerias, selectedPizzeria, showAll, searchCenter, userLocation, routeDestination, activeRoute, disableDistanceFilter, explicitPizzeriasToShow]);

  const updatePizzeriaMarkerElement = (el: HTMLElement, pizzeria: Pizzeria, isSelected: boolean, isRouteDestination: boolean) => {
    let iconUrl = 'https://cdn-icons-png.flaticon.com/128/3595/3595458.png';
    let size = 35;
    
    if (isSelected || isRouteDestination) {
      iconUrl = 'https://cdn-icons-png.flaticon.com/128/3595/3595458.png';
      size = isSelected ? 45 : 50;
    }

    el.innerHTML = `<img src="${iconUrl}" style="width: ${size}px; height: ${size}px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" />`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.cursor = 'pointer';
    el.style.zIndex = isSelected ? '1000' : '0';
  };

  const openPizzeriaPopup = (pizzeria: Pizzeria, marker: maplibregl.Marker) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activePopupRef.current) {
      isProgrammaticCloseRef.current = true;
      activePopupRef.current.remove();
      isProgrammaticCloseRef.current = false;
    }

    const container = document.createElement('div');
    container.className = "custom-popup-container";
    
    if (pizzeria.imageUrl) {
      const imgContainer = document.createElement('div');
      imgContainer.className = "custom-popup-img-container";
      const img = document.createElement('img');
      img.src = pizzeria.imageUrl;
      img.alt = pizzeria.name;
      img.className = "custom-popup-img";
      imgContainer.appendChild(img);
      container.appendChild(imgContainer);
    }

    const titleContainer = document.createElement('div');
    titleContainer.className = "custom-popup-title-container";
    const title = document.createElement('h3');
    title.className = "custom-popup-title";
    title.textContent = pizzeria.name;
    titleContainer.appendChild(title);
    container.appendChild(titleContainer);

    const infoContainer = document.createElement('div');
    infoContainer.className = "custom-popup-info";

    const addressRow = document.createElement('div');
    addressRow.className = "custom-popup-row";
    addressRow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
    const addressText = document.createElement('span');
    addressText.className = "custom-popup-text";
    addressText.textContent = pizzeria.address || 'Dirección no disponible';
    addressRow.appendChild(addressText);
    infoContainer.appendChild(addressRow);

    if (pizzeria.schedule) {
      const scheduleRow = document.createElement('div');
      scheduleRow.className = "custom-popup-row";
      scheduleRow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      const scheduleText = document.createElement('span');
      scheduleText.className = "custom-popup-text";
      scheduleText.textContent = pizzeria.schedule;
      scheduleRow.appendChild(scheduleText);
      infoContainer.appendChild(scheduleRow);
    }

    if (pizzeria.phoneNumber) {
      const phoneRow = document.createElement('div');
      phoneRow.className = "custom-popup-row";
      phoneRow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
      const phoneLink = document.createElement('a');
      phoneLink.href = `tel:${pizzeria.phoneNumber}`;
      phoneLink.className = "custom-popup-link";
      phoneLink.textContent = pizzeria.phoneNumber;
      phoneRow.appendChild(phoneLink);
      infoContainer.appendChild(phoneRow);
    }

    if (pizzeria.website) {
      const webRow = document.createElement('div');
      webRow.className = "custom-popup-row";
      webRow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
      const webLink = document.createElement('a');
      webLink.href = pizzeria.website;
      webLink.target = "_blank";
      webLink.rel = "noopener noreferrer";
      webLink.className = "custom-popup-link";
      webLink.textContent = pizzeria.website.replace(/^https?:\/\//, '');
      webRow.appendChild(webLink);
      infoContainer.appendChild(webRow);
    }

    const dist = userLocation
      ? (getDistance(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        { latitude: pizzeria.lat, longitude: pizzeria.lng }
      ) / 1000).toFixed(1) + ' km'
      : 'Calculando...';

    const distRow = document.createElement('div');
    distRow.className = "custom-popup-row";
    distRow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><path d="M6 18h12"/><path d="M6 10h12"/><path d="M6 6h12"/><path d="M6 14h12"/></svg>`;
    const distText = document.createElement('span');
    distText.className = "custom-popup-text";
    distText.textContent = `Distancia: ${dist}`;
    distRow.appendChild(distText);
    infoContainer.appendChild(distRow);

    if (pizzeria.rating) {
      const ratingRow = document.createElement('div');
      ratingRow.className = "custom-popup-row";
      ratingRow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      const ratingText = document.createElement('span');
      ratingText.className = "custom-popup-text font-medium";
      ratingText.textContent = `Rating: ${pizzeria.rating.toFixed(1)}`;
      ratingRow.appendChild(ratingText);
      infoContainer.appendChild(ratingRow);
    }

    container.appendChild(infoContainer);

    const btnGrid = document.createElement('div');
    btnGrid.className = "custom-popup-grid";

    const btnInfo = document.createElement('button');
    btnInfo.type = 'button';
    btnInfo.className = "custom-popup-btn";
    btnInfo.textContent = "Información";
    btnInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      onMarkerClick(pizzeria);
    });
    btnGrid.appendChild(btnInfo);

    const btnMenu = document.createElement('button');
    btnMenu.type = 'button';
    btnMenu.className = "custom-popup-btn";
    btnMenu.textContent = "Ver menú";
    btnMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onViewMenu) onViewMenu(pizzeria);
    });
    btnGrid.appendChild(btnMenu);

    const btnRoute = document.createElement('button');
    btnRoute.type = 'button';
    btnRoute.className = "custom-popup-btn";
    btnRoute.textContent = "Cómo llegar";
    btnRoute.addEventListener('click', (e) => {
      e.stopPropagation();
      drawRoute({ lat: pizzeria.lat, lng: pizzeria.lng });
    });
    btnGrid.appendChild(btnRoute);

    const btnRate = document.createElement('button');
    btnRate.type = 'button';
    btnRate.className = "custom-popup-btn-yellow";
    btnRate.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 fill-current inline-block mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Calificar`;
    btnRate.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onRate) onRate(pizzeria);
    });
    btnGrid.appendChild(btnRate);

    container.appendChild(btnGrid);

    const isMobile = window.innerWidth < 768;
    const currentOffset = isMobile ? (popupOffsetYMobile ?? -35) : (popupOffsetY ?? -35);

    const popup = new maplibregl.Popup({
      offset: [0, currentOffset],
      closeButton: true,
      closeOnClick: true,
      className: 'custom-popup',
      anchor: 'bottom'
    })
    .setDOMContent(container)
    .setLngLat([pizzeria.lng, pizzeria.lat])
    .addTo(map);

    popup.on('close', () => {
      if (isProgrammaticCloseRef.current) return;
      activePopupRef.current = null;
      if (selectedPizzeria?.id === pizzeria.id) {
        onCloseDetail?.();
      }
    });

    activePopupRef.current = popup;
  };

  useEffect(() => {
    updatePizzeriaMarkers();
  }, [visiblePizzerias, selectedPizzeria, activeRoute, isNavigating, iconAnchorX, iconAnchorY]);

  const updatePizzeriaMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentIds = new Set<string>();

    visiblePizzerias.forEach(pizzeria => {
      if (typeof pizzeria.lat !== 'number' || typeof pizzeria.lng !== 'number') return;
      currentIds.add(pizzeria.id);

      const isSelected = selectedPizzeria?.id === pizzeria.id;
      const isRouteDestination = !!(activeRoute && Math.abs(activeRoute.lat - pizzeria.lat) < 0.0001 && Math.abs(activeRoute.lng - pizzeria.lng) < 0.0001);

      let marker = markersMapRef.current.get(pizzeria.id);

      const S = isSelected ? 45 : (isRouteDestination ? 50 : 35);
      let ax = S / 2;
      let ay = S;
      if (iconAnchorX !== undefined && iconAnchorY !== undefined) {
        const scale = S / 50;
        ax = iconAnchorX * scale;
        ay = iconAnchorY * scale;
      }
      const offsetX = S / 2 - ax;
      const offsetY = S / 2 - ay;

      if (marker) {
        const el = marker.getElement();
        updatePizzeriaMarkerElement(el, pizzeria, isSelected, isRouteDestination);
        marker.setOffset([offsetX, offsetY]);
        
        if (isSelected) {
          openPizzeriaPopup(pizzeria, marker);
        }
      } else {
        const el = document.createElement('div');
        el.className = 'pizzeria-marker';
        updatePizzeriaMarkerElement(el, pizzeria, isSelected, isRouteDestination);

        const newMarker = new maplibregl.Marker({
          element: el,
          offset: [offsetX, offsetY]
        })
        .setLngLat([pizzeria.lng, pizzeria.lat])
        .addTo(map);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          // Open the popup directly on the map, do not trigger panel sheet immediately
          openPizzeriaPopup(pizzeria, newMarker);
          
          const height = map.getContainer().clientHeight;
          const isMobile = window.innerWidth < 768;
          const offsetFactor = isMobile ? 0.22 : 0.15;
          const offsetPixels = height * offsetFactor;

          map.easeTo({
            center: [pizzeria.lng, pizzeria.lat],
            zoom: 16,
            offset: [0, -offsetPixels],
            duration: 1500
          });
        });

        markersMapRef.current.set(pizzeria.id, newMarker);

        if (isSelected) {
          openPizzeriaPopup(pizzeria, newMarker);
        }
      }
    });

    markersMapRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersMapRef.current.delete(id);
      }
    });
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isNavigating) return;

    const prevSelected = prevSelectedPizzeriaRef.current;
    prevSelectedPizzeriaRef.current = selectedPizzeria;

    if (selectedPizzeria) {
      const height = map.getContainer().clientHeight;
      const isMobile = window.innerWidth < 768;
      const offsetFactor = isMobile ? 0.22 : 0.15;
      const offsetPixels = height * offsetFactor;

      map.easeTo({
        center: [selectedPizzeria.lng, selectedPizzeria.lat],
        zoom: 16,
        offset: [0, -offsetPixels],
        duration: 1500
      });

      const marker = markersMapRef.current.get(selectedPizzeria.id);
      if (marker) {
        openPizzeriaPopup(selectedPizzeria, marker);
      }
    } else if (prevSelected && !selectedPizzeria) {
      // If selectedPizzeria transitions to null (closed from parent sheet), remove active map popup
      if (activePopupRef.current) {
        isProgrammaticCloseRef.current = true;
        activePopupRef.current.remove();
        isProgrammaticCloseRef.current = false;
      }
    } else if (searchCenter) {
      map.easeTo({
        center: [searchCenter.lng, searchCenter.lat],
        zoom: 16,
        duration: 1500
      });
    } else {
      if (routeCoordinatesRef.current.length === 0 && !userLocation) {
        map.easeTo({
          center: [HERMOSILLO_CENTER[1], HERMOSILLO_CENTER[0]],
          zoom: 12,
          duration: 1500
        });
      }
    }
  }, [selectedPizzeria, searchCenter, userLocation, isNavigating, mapCenterOffset, popupOffsetY, popupOffsetYMobile]);

  useEffect(() => {
    updateSearchMarker();
  }, [searchCenter]);

  const updateSearchMarker = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (searchCenter) {
      if (!searchMarkerRef.current) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
          ">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3" fill="white"/>
            </svg>
          </div>
        `;
        searchMarkerRef.current = new maplibregl.Marker({
          element: el,
          anchor: 'bottom'
        })
        .setLngLat([searchCenter.lng, searchCenter.lat])
        .addTo(map);
      } else {
        searchMarkerRef.current.setLngLat([searchCenter.lng, searchCenter.lat]);
      }
    } else {
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (myLocationMarkerRef.current && mapInstanceRef.current) {
      updateUserMarker(myLocationMarkerRef.current.getLngLat().toArray() as [number, number], true);
    }
  }, [isNavigating]);

  return (
    <div className="relative h-full w-full z-0 overflow-hidden">
      {/* Map Container Wrapper */}
      <div className="absolute inset-0 z-10">
        <div
          ref={mapContainerRef}
          className="h-full w-full"
        />
      </div>

      {/* Flat 2D Overlays Wrapper */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        
        {/* Map Styles Selector - Positioned independently using layer-control-top variables */}
        {!isNavigating && (
          <div className="absolute right-4 z-[1001] transition-all duration-300 pointer-events-auto layer-control-container">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10 bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-100 border-0"
                  aria-label="Select map style"
                >
                  <Layers className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-slate-950 p-2 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 z-[1002]">
                <DropdownMenuLabel className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 px-2">Tipo de mapa</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleBaseLayerChange('Estándar')} className={cn("flex justify-between items-center px-2 py-1.5 rounded-md text-sm cursor-pointer", currentBaseLayer === 'Estándar' && "bg-primary/10 text-primary font-semibold")}>
                  <span>Estándar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBaseLayerChange('Satélite')} className={cn("flex justify-between items-center px-2 py-1.5 rounded-md text-sm cursor-pointer", currentBaseLayer === 'Satélite' && "bg-primary/10 text-primary font-semibold")}>
                  <span>Satélite</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBaseLayerChange('Relieve')} className={cn("flex justify-between items-center px-2 py-1.5 rounded-md text-sm cursor-pointer", currentBaseLayer === 'Relieve' && "bg-primary/10 text-primary font-semibold")}>
                  <span>Relieve</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 border-t border-gray-100 dark:border-slate-800" />
                <DropdownMenuItem onClick={handleTrafficToggle} className="flex justify-between items-center px-2 py-1.5 rounded-md text-sm cursor-pointer">
                  <span>Tránsito (Google)</span>
                  <span className={cn("w-2 h-2 rounded-full", showTraffic ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700")}></span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Map Controls Container (Locate Me & Fullscreen) - Positioned with buttons-top variables */}
        {!isNavigating && (
          <div
            className="absolute right-4 z-[1001] flex flex-col gap-2 transition-all duration-300 pointer-events-auto map-controls-container"
          >
            {/* Locate Me */}
            <Button
              variant="secondary"
              size="icon"
              onClick={handleLocateMe}
              className="shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10 bg-white dark:bg-slate-950"
              aria-label="Find my location"
            >
              <LocateFixed className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            {/* Toggle Fullscreen */}
            <Button
              variant="secondary"
              size="icon"
              onClick={onToggleFullscreen}
              className="shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10 bg-white dark:bg-slate-950"
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
                  className="shadow-lg rounded-full h-8 md:h-10 px-3 text-xs md:text-sm font-medium bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-900 border-0"
                >
                  {showAll ? "Ver cercanas" : "Ver todas"}
                </Button>

                {/* Manual Location Adjustment */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isAdjustingLocation ? "default" : "secondary"}
                        size="icon"
                        onClick={() => {
                          if (!myLocationMarkerRef.current) {
                            toast({
                              variant: "destructive",
                              title: "Marcador no disponible",
                              description: "Por favor ubícate primero usando el botón de brújula."
                            });
                            return;
                          }
                          const marker = myLocationMarkerRef.current;
                          const nextState = !isAdjustingLocation;
                          setIsAdjustingLocation(nextState);
                          marker.setDraggable(nextState);
                          const el = marker.getElement();
                          if (nextState) {
                            changeLockState(false);
                            el.style.cursor = 'grab';
                            el.style.boxShadow = '0 0 12px 4px rgba(34, 197, 94, 0.8)';
                            toast({
                              title: "Ajuste de ubicación activo",
                              description: "Haz clic y arrastra tu icono de ubicación para ajustar tu posición."
                            });
                          } else {
                            el.style.cursor = '';
                            el.style.boxShadow = '';
                            toast({
                              title: "Ajuste de ubicación desactivado",
                              description: "Se ha cancelado el ajuste."
                            });
                          }
                        }}
                        className={cn(
                          "shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10 transition-colors duration-200 border-2",
                          isAdjustingLocation
                            ? "bg-green-600 hover:bg-green-700 text-white border-green-400"
                            : "bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-900 border-transparent"
                        )}
                        aria-label="Ajustar Ubicación"
                      >
                        <span className="text-sm md:text-base">📍</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Ajustar Ubicación</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                  <LayoutSettingsManager onSettingsChange={onSettingsChange} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {/* Start Trip / Navigation Controls */}
        {activeRoute && !isNavigating && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-[1002] flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
            <Button
              onClick={startNavigation}
              className="bg-[#4285F4] hover:bg-[#3367d6] text-white shadow-xl rounded-full px-6 h-12 text-base font-semibold border-2 border-white/20"
            >
              <Navigation className="mr-2 h-5 w-5 fill-current animate-bounce" />
              Iniciar viaje
            </Button>
            <Button
              onClick={clearRoute}
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full shadow-xl bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border-2 border-gray-100 dark:border-slate-800"
              aria-label="Cancelar ruta"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        )}

        {/* Navigation Dashboard (Active Mode) */}
        <TooltipProvider>
          {isNavigating && routeDetails && (
            <>
              {/* Top Instruction Bar - Green (Google Maps Style) */}
              <div className="absolute top-4 left-4 right-4 z-[1002] animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
                <div className="bg-[#00695C] text-white p-4 rounded-xl shadow-lg flex items-center min-h-[80px] border border-white/10">
                  <div className="flex-shrink-0 mr-4 bg-white/10 p-2 rounded-lg">
                    {currentInstruction?.icon || <Navigation className="w-12 h-12 text-white stroke-[3px]" />}
                  </div>

                  <div className="flex flex-col justify-center overflow-hidden">
                    <span className="text-2xl font-black leading-none mb-1 tracking-wide text-teal-200">
                      {currentInstruction?.distanceText || '--- m'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold leading-tight truncate">
                      {currentInstruction?.text || 'Continúa por la ruta seleccionada'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Compass / Recenter control */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-[1001] pointer-events-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-12 w-12 rounded-full shadow-xl bg-black/80 text-white hover:bg-black/90 border-0 overflow-hidden p-0"
                      onClick={() => {
                        const map = mapInstanceRef.current;
                        if (map && animatedCoordsRef.current) {
                          setIsLocked(true);
                          map.easeTo({
                            zoom: 18,
                            pitch: 60,
                            bearing: currentHeadingRef.current,
                            center: [animatedCoordsRef.current.lng, animatedCoordsRef.current.lat],
                            duration: 500
                          });
                        }
                      }}
                    >
                      <div className="relative w-full h-full bg-[#222] flex items-center justify-center">
                        <div className="w-1.5 h-4 bg-red-500 rounded-t-sm absolute top-2 left-1/2 -translate-x-1/2 z-10 shadow-sm" style={{ transform: `rotate(${-mapRotation}deg)`, transformOrigin: '50% 100%' }}></div>
                        <div className="w-1.5 h-4 bg-gray-300 rounded-b-sm absolute bottom-2 left-1/2 -translate-x-1/2 z-10 shadow-sm" style={{ transform: `rotate(${-mapRotation}deg)`, transformOrigin: '50% 0%' }}></div>
                        <div className="w-8 h-8 rounded-full border-[3px] border-gray-600/60"></div>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Recentrar</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Floating Speed Bubble */}
              <div className="absolute bottom-28 left-4 z-[1001] w-16 h-16 bg-black/80 rounded-full flex flex-col items-center justify-center border-2 border-white/10 shadow-xl backdrop-blur-sm pointer-events-auto">
                <span className="text-white font-bold text-xl leading-none">{currentSpeed}</span>
                <span className="text-white/70 text-[10px] uppercase font-bold">km/h</span>
              </div>

              {/* Lock / Recenter Navigation Control */}
              {isLocked ? (
                currentStreet && (
                  <div
                    className="absolute bottom-28 left-1/2 z-[1002] animate-in fade-in-0 slide-in-from-bottom-2 duration-200 pointer-events-auto bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-full shadow-xl border border-gray-200 dark:border-slate-800 text-sm font-bold flex items-center gap-1.5"
                    style={{ transform: 'translateX(-50%)' }}
                  >
                    <Navigation className="w-4 h-4 text-blue-500 fill-blue-500 rotate-45" />
                    <span>{currentStreet}</span>
                  </div>
                )
              ) : (
                <div
                  className="absolute bottom-28 left-1/2 z-[1002] animate-in fade-in-0 slide-in-from-bottom-2 duration-200 pointer-events-auto"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <Button
                    onClick={() => {
                      changeLockState(true);
                      const map = mapInstanceRef.current;
                      if (map && animatedCoordsRef.current) {
                        const coords = animatedCoordsRef.current;
                        const bearing = currentHeadingRef.current;
                        const height = map.getContainer().clientHeight;
                        const pixelOffset: [number, number] = [0, height * 0.22];
                        map.easeTo({
                          center: [coords.lng, coords.lat],
                          zoom: 18,
                          pitch: 60,
                          bearing: bearing,
                          offset: pixelOffset,
                          duration: 500
                        });
                      }
                    }}
                    className="bg-[#00897B] hover:bg-[#00695C] text-white shadow-2xl rounded-full px-6 h-12 text-base font-bold flex items-center gap-2 border-2 border-white/20"
                  >
                    <Compass className="w-5 h-5" />
                    Recentrar
                  </Button>
                </div>
              )}

              {/* Bottom Status Bar - Black */}
              <div className="absolute bottom-0 left-0 right-0 z-[1002] bg-[#111111] p-4 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 text-white pb-8 pointer-events-auto">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={exitNavigation}
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
                      {(routeDetails.distance / 1000).toFixed(1)} km • {new Date(Date.now() + routeDetails.duration * 1000 + 180000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (ETA)
                    </div>
                  </div>

                  <div className="w-12" />
                </div>
              </div>
            </>
          )}
        </TooltipProvider>

        {/* Traffic Legend */}
        {showTrafficLegend && !isNavigating && (
          <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-slate-700 text-xs transition-colors duration-300 pointer-events-auto">
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
      </div>

      <style jsx global>{`
        /* MapLibre Popup Styling matching our Tailwind design system and Layout Settings */
        .maplibregl-popup {
          z-index: 1000 !important;
        }

        .maplibregl-popup-content {
          border-radius: 16px !important;
          padding: 14px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          background-color: #ffffff !important;
          color: #1e293b !important;
          font-family: inherit !important;
          
          /* Sizing from layout variables */
          width: var(--popup-width-mobile, 260px) !important;
          max-width: none !important;
          font-size: var(--popup-font-size-mobile, 12px) !important;
          
          /* Scaling from layout variables */
          transform-origin: bottom center;
          transform: scale(var(--popup-scale-mobile, 1)) !important;
          transition: transform 0.2s ease;
        }

        @media (min-width: 768px) {
          .maplibregl-popup-content {
            width: var(--popup-width-desktop, 280px) !important;
            font-size: var(--popup-font-size-desktop, 14px) !important;
            transform: scale(var(--popup-scale-desktop, 1)) !important;
          }
        }

        .dark .maplibregl-popup-content {
          background-color: #0d1527 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #cbd5e1 !important;
        }

        /* Force element sizes to inherit */
        .maplibregl-popup-content * {
          font-family: inherit !important;
          font-size: inherit !important;
        }
        
        .maplibregl-popup-content h3 {
          font-size: 1.15em !important;
          font-weight: 700 !important;
          margin-bottom: 8px !important;
          color: #ef4444 !important;
        }
        
        .maplibregl-popup-content button {
          font-size: 0.9em !important;
        }

        .maplibregl-popup-tip {
          border-bottom-color: #ffffff !important;
        }

        .dark .maplibregl-popup-tip {
          border-bottom-color: #0d1527 !important;
        }

        .nav-arrow-inner {
          transition: transform 0.1s linear;
        }

        /* Custom Popup Sizing and Proportions */
        .custom-popup-container {
          width: 100%;
          padding: 4px;
          display: flex;
          flex-direction: column;
        }

        .custom-popup-img-container {
          margin-bottom: 12px;
          border-radius: 8px;
          overflow: hidden;
          height: 144px;
          width: 100%;
          background-color: #f3f4f6;
          position: relative;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-popup-img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          background-color: #ffffff;
        }

        .dark .custom-popup-img-container {
          background-color: #1e293b;
        }
        
        .dark .custom-popup-img {
          background-color: #0f172a;
        }

        .custom-popup-title-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .custom-popup-title {
          margin: 0 !important;
          color: #ef4444 !important;
          font-weight: 700 !important;
          line-height: 1.25 !important;
        }

        .custom-popup-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .custom-popup-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.25;
        }

        .custom-popup-row svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .custom-popup-text {
          color: #4b5563;
        }

        .dark .custom-popup-text {
          color: #cbd5e1;
        }

        .custom-popup-link {
          color: #2563eb;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
          display: block;
        }

        .custom-popup-link:hover {
          text-decoration: underline;
        }

        .custom-popup-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .custom-popup-btn {
          background-color: #dc2626;
          color: #ffffff;
          height: 36px;
          padding: 8px 16px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .custom-popup-btn:hover {
          background-color: #b91c1c;
        }

        .custom-popup-btn-yellow {
          background-color: #eab308;
          color: #ffffff;
          height: 36px;
          padding: 8px 16px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .custom-popup-btn-yellow:hover {
          background-color: #ca8a04;
        }

        /* Configured top margins for controls */
        .layer-control-container {
          top: var(--layer-control-top-mobile, 10px);
        }
        @media (min-width: 768px) {
          .layer-control-container {
            top: var(--layer-control-top-desktop, 10px);
          }
        }

        .map-controls-container {
          top: var(--buttons-top-mobile, 160px);
        }
        @media (min-width: 768px) {
          .map-controls-container {
            top: var(--buttons-top-desktop, 160px);
          }
        }

        /* Next Street Speech Bubble */
        .next-street-bubble {
          position: relative;
          background-color: #1a73e8 !important;
          color: #ffffff !important;
          padding: 6px 12px !important;
          border-radius: 12px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
          border: 2px solid #ffffff !important;
          white-space: nowrap !important;
          text-align: center !important;
        }
        .next-street-bubble::after {
          content: '' !important;
          position: absolute !important;
          bottom: -8px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          border-width: 8px 6px 0 !important;
          border-style: solid !important;
          border-color: #ffffff transparent !important;
          display: block !important;
          width: 0 !important;
        }
        .next-street-bubble::before {
          content: '' !important;
          position: absolute !important;
          bottom: -5px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          border-width: 6px 4.5px 0 !important;
          border-style: solid !important;
          border-color: #1a73e8 transparent !important;
          display: block !important;
          width: 0 !important;
          z-index: 1 !important;
        }

        /* Pulse Keyframes for GPS Halo */
        @keyframes pulse {
          0% {
            transform: scale(0.85);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.85);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(PizzaMap);
