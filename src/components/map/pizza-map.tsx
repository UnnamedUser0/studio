'use client';

import { useEffect, useRef, useState, memo, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Pizzeria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, LocateFixed, MapPin, Ruler, Star, Settings, Navigation, X, ArrowLeft, MoreVertical, Volume2, Compass, AlertTriangle, Search, Leaf, CornerUpLeft, CornerUpRight, ArrowUp, Phone, Globe, Share2, Layers, Play, Pause, RotateCcw, FastForward, Car, CheckCircle2, Sparkles, SlidersHorizontal, Clock, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import getDistance from 'geolib/es/getDistance';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
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

export const HERMOSILLO_SIMULATION_ZONES = [
  { id: 'centro', name: 'Centro / Catedral', lat: 29.0729, lng: -110.9559, desc: 'Zona Centro, Av. Rosales y Pino Suárez' },
  { id: 'norte', name: 'Norte / Bachoco', lat: 29.1235, lng: -110.9632, desc: 'Blvd. Morelos y López Portillo' },
  { id: 'poniente', name: 'Poniente / Villa de Seris', lat: 29.0620, lng: -110.9605, desc: 'Paseo Río Sonora y Villa de Seris' },
  { id: 'sur', name: 'Sur / Parque Industrial', lat: 29.0280, lng: -110.9450, desc: 'Carretera a Guaymas y Perisur' },
  { id: 'oriente', name: 'Oriente / Col. Pitic', lat: 29.0980, lng: -110.9320, desc: 'Blvd. Kino y Eusebio Kino' },
  { id: 'noroeste', name: 'Noroeste / Solidaridad', lat: 29.1150, lng: -111.0020, desc: 'Blvd. Solidaridad y Progreso' },
  { id: 'aeropuerto', name: 'Aeropuerto / Poniente', lat: 29.0950, lng: -111.0450, desc: 'Blvd. García Morales Poniente' },
];

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
  popupCenterOffset2D?: number;
  popupCenterOffset2DMobile?: number;
  popupCenterOffset3D?: number;
  popupCenterOffset3DMobile?: number;
  iconAnchorX?: number;
  iconAnchorY?: number;
  disableDistanceFilter?: boolean;
  explicitPizzeriasToShow?: Pizzeria[];
  onNavigationStateChange?: (navigating: boolean) => void;
  onCloseDetail?: () => void;
  onRouteActiveChange?: (active: boolean) => void;
};

type Coord = { lat: number; lng: number };

export interface RecommendedRoute {
  id: number;
  label: string;
  via: string;
  distance: number;
  duration: number;
  coordinates: [number, number][]; // [lng, lat]
  coordsLatLng: [number, number][]; // [lat, lng]
  steps: any[];
  geometry: any;
  isFastest: boolean;
  trafficDelayText?: string;
}

export interface TrafficLight {
  id: string;
  lat: number;
  lng: number;
  streetName: string;
  cycleOffset: number;
  phase: 'green' | 'yellow' | 'red';
  secondsLeft: number;
}

const getMapStyle = () => {
  return {
    version: 8,
    sources: {
      "osm": {
        type: "raster",
        tiles: [
          "https://mt0.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}",
          "https://mt1.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}",
          "https://mt2.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}",
          "https://mt3.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}"
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: "Map data &copy; Google"
      },
      "satellite": {
        type: "raster",
        tiles: [
          "https://mt0.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}",
          "https://mt1.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}",
          "https://mt2.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}",
          "https://mt3.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}"
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: "Map data &copy; Google"
      },
      "terrain": {
        type: "raster",
        tiles: [
          "https://mt0.google.com/vt/lyrs=p&hl=es&x={x}&y={y}&z={z}",
          "https://mt1.google.com/vt/lyrs=p&hl=es&x={x}&y={y}&z={z}",
          "https://mt2.google.com/vt/lyrs=p&hl=es&x={x}&y={y}&z={z}",
          "https://mt3.google.com/vt/lyrs=p&hl=es&x={x}&y={y}&z={z}"
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: "Terrain &copy; Google"
      },
      "traffic": {
        type: "raster",
        tiles: [
          "https://mt0.google.com/vt/lyrs=h,traffic&hl=es&x={x}&y={y}&z={z}",
          "https://mt1.google.com/vt/lyrs=h,traffic&hl=es&x={x}&y={y}&z={z}",
          "https://mt2.google.com/vt/lyrs=h,traffic&hl=es&x={x}&y={y}&z={z}",
          "https://mt3.google.com/vt/lyrs=h,traffic&hl=es&x={x}&y={y}&z={z}"
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: "Traffic &copy; Google"
      }
    },
    layers: [
      {
        id: "background-base",
        type: "background",
        paint: {
          "background-color": "#f1f5f9"
        }
      },
      {
        id: "osm-layer",
        type: "raster",
        source: "osm",
        layout: { visibility: "visible" },
        paint: { "raster-opacity": 1 }
      },
      {
        id: "satellite-layer",
        type: "raster",
        source: "satellite",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 1 }
      },
      {
        id: "terrain-layer",
        type: "raster",
        source: "terrain",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 1 }
      },
      {
        id: "traffic-layer",
        type: "raster",
        source: "traffic",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 0.95 }
      }
    ]
  } as maplibregl.StyleSpecification;
};

const updateLayersVisibility = (map: maplibregl.Map, baseLayer: string, showTraffic: boolean) => {
  if (map.getLayer('osm-layer')) {
    map.setLayoutProperty('osm-layer', 'visibility', baseLayer === 'Estándar' ? 'visible' : 'none');
  }
  if (map.getLayer('satellite-layer')) {
    map.setLayoutProperty('satellite-layer', 'visibility', baseLayer === 'Satélite' ? 'visible' : 'none');
  }
  if (map.getLayer('terrain-layer')) {
    map.setLayoutProperty('terrain-layer', 'visibility', baseLayer === 'Relieve' ? 'visible' : 'none');
  }
  if (map.getLayer('traffic-layer')) {
    map.setLayoutProperty('traffic-layer', 'visibility', showTraffic ? 'visible' : 'none');
  }
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

const computePolylineDistances = (coords: [number, number][]) => {
  const cumDists = [0];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = getDistance(
      { latitude: coords[i][0], longitude: coords[i][1] },
      { latitude: coords[i + 1][0], longitude: coords[i + 1][1] }
    );
    total += d;
    cumDists.push(total);
  }
  return { cumDists, totalDistance: total };
};

const getInterpolatedPosition = (
  coords: [number, number][],
  cumDists: number[],
  targetDist: number
) => {
  if (coords.length === 0) return { lat: 29.085, lng: -110.977, bearing: 0, isTurn: false, segIdx: 0, progress: 0 };
  if (coords.length === 1 || targetDist <= 0) {
    const bearing = coords.length > 1
      ? calculateBearing(coords[0][0], coords[0][1], coords[1][0], coords[1][1])
      : 0;
    return { lat: coords[0][0], lng: coords[0][1], bearing, isTurn: false, segIdx: 0, progress: 0 };
  }

  const totalDist = cumDists[cumDists.length - 1];
  if (targetDist >= totalDist) {
    const lastIdx = coords.length - 1;
    const prevIdx = Math.max(0, lastIdx - 1);
    const bearing = calculateBearing(coords[prevIdx][0], coords[prevIdx][1], coords[lastIdx][0], coords[lastIdx][1]);
    return { lat: coords[lastIdx][0], lng: coords[lastIdx][1], bearing, isTurn: false, segIdx: lastIdx, progress: 1 };
  }

  let segIdx = 0;
  for (let i = 0; i < cumDists.length - 1; i++) {
    if (targetDist >= cumDists[i] && targetDist <= cumDists[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const segStartDist = cumDists[segIdx];
  const segEndDist = cumDists[segIdx + 1];
  const segLen = segEndDist - segStartDist;
  const ratio = segLen > 0 ? (targetDist - segStartDist) / segLen : 0;

  const p1 = coords[segIdx];
  const p2 = coords[segIdx + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * ratio;
  const lng = p1[1] + (p2[1] - p1[1]) * ratio;

  // Tangent bearing along current segment with look-ahead smoothing
  let lookAheadDist = targetDist + 15;
  let nextLat = p2[0];
  let nextLng = p2[1];
  for (let j = segIdx; j < cumDists.length - 1; j++) {
    if (lookAheadDist <= cumDists[j + 1]) {
      const segLenJ = cumDists[j + 1] - cumDists[j];
      const ratioJ = segLenJ > 0 ? (lookAheadDist - cumDists[j]) / segLenJ : 0;
      nextLat = coords[j][0] + (coords[j + 1][0] - coords[j][0]) * ratioJ;
      nextLng = coords[j][1] + (coords[j + 1][1] - coords[j][1]) * ratioJ;
      break;
    }
  }

  const bearing = calculateBearing(lat, lng, nextLat, nextLng);

  // Turn detection for realistic acceleration/deceleration curve
  const nextSegIdx = Math.min(coords.length - 2, segIdx + 1);
  const currentSegBearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
  const nextSegBearing = calculateBearing(coords[nextSegIdx][0], coords[nextSegIdx][1], coords[nextSegIdx + 1][0], coords[nextSegIdx + 1][1]);
  let angleDiff = Math.abs(nextSegBearing - currentSegBearing);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;
  const distToVertex = segEndDist - targetDist;
  const isTurn = angleDiff > 25 && distToVertex < 35;

  return { lat, lng, bearing, isTurn, segIdx, progress: totalDist > 0 ? targetDist / totalDist : 0 };
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

  let activeIdx = 0;
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
      activeIdx = i;
    }
  }

  const closestStep = steps[activeIdx];
  if (!closestStep) return null;

  const closestStepLatLng = { lat: closestStep.maneuver.location[1], lng: closestStep.maneuver.location[0] };
  const distToManeuver = getDistance(
    { latitude: userLatLng.lat, longitude: userLatLng.lng },
    { latitude: closestStepLatLng.lat, longitude: closestStepLatLng.lng }
  );

  if (distToManeuver < 25 && activeIdx < steps.length - 1) {
    const nextStep = steps[activeIdx + 1];
    if (nextStep?.maneuver?.location) {
      return {
        step: nextStep,
        distance: getDistance(
          { latitude: userLatLng.lat, longitude: userLatLng.lng },
          { latitude: nextStep.maneuver.location[1], longitude: nextStep.maneuver.location[0] }
        ),
        index: activeIdx + 1
      };
    }
  }

  return {
    step: closestStep,
    distance: distToManeuver,
    index: activeIdx
  };
};

const getTurnIcon = (type: string, modifier: string, sizeClass = "w-12 h-12") => {
  const mod = modifier?.toLowerCase() || '';
  const t = type?.toLowerCase() || '';

  if (t === 'arrive') return <MapPin className={`${sizeClass} text-white stroke-[3px]`} />;
  if (t === 'depart') return <Navigation className={`${sizeClass} text-white stroke-[3px] rotate-45`} />;

  if (mod.includes('left')) {
    return <CornerUpLeft className={`${sizeClass} text-white stroke-[3px]`} />;
  }
  if (mod.includes('right')) {
    return <CornerUpRight className={`${sizeClass} text-white stroke-[3px]`} />;
  }
  return <ArrowUp className={`${sizeClass} text-white stroke-[3px]`} />;
};

const getTurnInstructionParts = (step: any, destinationName: string) => {
  if (!step) return { action: 'Continúa por', street: 'la ruta' };
  const type = step.maneuver?.type?.toLowerCase();
  const modifier = step.maneuver?.modifier;
  const name = step.name || '';

  if (type === 'arrive') {
    return { action: 'Llegarás a', street: destinationName };
  }
  if (type === 'depart') {
    return { action: 'Inicia el viaje en', street: name || 'la ruta' };
  }

  const spanishModifier = modifier === 'left' ? 'Gira a la izquierda en' :
                          modifier === 'right' ? 'Gira a la derecha en' :
                          modifier === 'slight left' ? 'Ligeramente a la izquierda en' :
                          modifier === 'slight right' ? 'Ligeramente a la derecha en' :
                          modifier === 'sharp left' ? 'Giro cerrado a la izquierda en' :
                          modifier === 'sharp right' ? 'Giro cerrado a la derecha en' : '';

  if (spanishModifier) {
    return { action: spanishModifier, street: name || 'la siguiente calle' };
  }

  return { action: 'Continúa en', street: name || 'la ruta' };
};

const getTurnInstruction = (step: any, destinationName: string) => {
  if (!step) return 'Continúa por la ruta';
  const type = step.maneuver?.type?.toLowerCase();
  const modifier = step.maneuver?.modifier;
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
  popupCenterOffset2D = 180,
  popupCenterOffset2DMobile = 150,
  popupCenterOffset3D = 250,
  popupCenterOffset3DMobile = 200,
  iconAnchorX = 25,
  iconAnchorY = 25,
  disableDistanceFilter = false,
  explicitPizzeriasToShow = [],
  onSettingsChange,
  onNavigationStateChange,
  onRouteActiveChange,
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
  const isManualLocationRef = useRef<boolean>(false);
  const visiblePizzeriasRef = useRef<Pizzeria[]>([]);
  const activePopupPizzeriaIdRef = useRef<string | null>(null);

  const popupCenterOffset2DRef = useRef(popupCenterOffset2D);
  const popupCenterOffset2DMobileRef = useRef(popupCenterOffset2DMobile);
  const popupCenterOffset3DRef = useRef(popupCenterOffset3D);
  const popupCenterOffset3DMobileRef = useRef(popupCenterOffset3DMobile);
  const popupOffsetYRef = useRef(popupOffsetY);
  const popupOffsetYMobileRef = useRef(popupOffsetYMobile);

  popupCenterOffset2DRef.current = popupCenterOffset2D;
  popupCenterOffset2DMobileRef.current = popupCenterOffset2DMobile;
  popupCenterOffset3DRef.current = popupCenterOffset3D;
  popupCenterOffset3DMobileRef.current = popupCenterOffset3DMobile;
  popupOffsetYRef.current = popupOffsetY;
  popupOffsetYMobileRef.current = popupOffsetYMobile;

  const { toast } = useToast();
  
  // Base style layers state
  const [currentBaseLayer, setCurrentBaseLayer] = useState<'Estándar' | 'Satélite' | 'Relieve'>('Estándar');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showTrafficLegend, setShowTrafficLegend] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<{ lat: number, lng: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      setIsLocalhost(h === 'localhost' || h === '127.0.0.1' || h === '::1');
    }
  }, []);
  const [routeDetails, setRouteDetails] = useState<{ distance: number, duration: number } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [mapRotation, setMapRotation] = useState(0);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<{
    icon: React.ReactNode;
    action: string;
    street: string;
    distanceText: string;
    next?: {
      icon: React.ReactNode;
      text: string;
    } | null;
  } | null>(null);

  const [isLocked, setIsLocked] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [currentStreet, setCurrentStreet] = useState<string>('');

  // Trip Simulation State and Refs
  const simAnimationFrameRef = useRef<number | null>(null);
  const simLastTimestampRef = useRef<number>(0);
  const simTraveledMetersRef = useRef<number>(0);
  const simTotalDistanceRef = useRef<number>(0);
  const simCumulativeDistancesRef = useRef<number[]>([]);
  const simSpeedMultiplierRef = useRef<number>(2);
  const simIsPausedRef = useRef<boolean>(false);
  const fullRouteCoordinatesRef = useRef<[number, number][]>([]);
  const smoothedHeadingRef = useRef<number>(0);
  const simCurrentSpeedRef = useRef<number>(50);

  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [selectedStartZone, setSelectedStartZone] = useState<string>('centro');
  const [selectedTargetPizzeriaId, setSelectedTargetPizzeriaId] = useState<string>('');
  const [simulationArrivalData, setSimulationArrivalData] = useState<{
    pizzeriaName: string;
    totalDistanceKm: string;
    elapsedSeconds: number;
  } | null>(null);

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

  // Intelligent Recommended Routes
  const [recommendedRoutes, setRecommendedRoutes] = useState<RecommendedRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const recommendedRoutesRef = useRef<RecommendedRoute[]>([]);
  useEffect(() => {
    recommendedRoutesRef.current = recommendedRoutes;
  }, [recommendedRoutes]);

  // Traffic Lights along Route (with live real-time countdown)
  const [trafficLights, setTrafficLights] = useState<TrafficLight[]>([]);
  const trafficLightsRef = useRef<TrafficLight[]>([]);
  const trafficLightMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [approachingTrafficLight, setApproachingTrafficLight] = useState<{
    id: string;
    streetName: string;
    phase: 'green' | 'yellow' | 'red';
    secondsLeft: number;
    distanceMeters: number;
  } | null>(null);

  // DiDi Traffic Light HUD Draggable Position & Scale State (Free 2D movement & variadic resize)
  const [tlHudPos, setTlHudPos] = useState<{ x: number; y: number }>({ x: 20, y: 140 });
  const [tlHudScale, setTlHudScale] = useState<number>(1.0);
  const isDraggingTlHudRef = useRef(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTlHudDragging, setIsTlHudDragging] = useState(false);

  // Draggable Simulator Button State
  const [simBtnPos, setSimBtnPos] = useState<{ x: number; y: number }>({ x: 16, y: 80 });
  const isSimPointerDownRef = useRef(false);
  const isDraggingSimBtnRef = useRef(false);
  const dragSimStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({ x: 0, y: 0, startX: 0, startY: 0 });
  const [isSimBtnDragging, setIsSimBtnDragging] = useState(false);

  // Draggable Settings & Layout Configuration Button State
  const [settingsBtnPos, setSettingsBtnPos] = useState<{ x: number; y: number }>({ x: 16, y: 380 });
  const isSettingsPointerDownRef = useRef(false);
  const isDraggingSettingsBtnRef = useRef(false);
  const dragSettingsStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({ x: 0, y: 0, startX: 0, startY: 0 });
  const [isSettingsBtnDragging, setIsSettingsBtnDragging] = useState(false);

  // Restore saved position & scale from localStorage
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem('didi_traffic_light_hud_pos');
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const safeX = Math.max(8, Math.min(window.innerWidth - 210, parsed.x));
          const safeY = Math.max(8, Math.min(window.innerHeight - 90, parsed.y));
          setTlHudPos({ x: safeX, y: safeY });
        }
      }
      const savedScale = localStorage.getItem('didi_traffic_light_hud_scale');
      if (savedScale) {
        const parsedScale = parseFloat(savedScale);
        if (!isNaN(parsedScale) && parsedScale >= 0.5 && parsedScale <= 3.0) {
          setTlHudScale(parsedScale);
        }
      }

      const savedSim = localStorage.getItem('map_simulator_btn_pos');
      if (savedSim) {
        const parsedSim = JSON.parse(savedSim);
        if (typeof parsedSim.x === 'number' && typeof parsedSim.y === 'number') {
          const safeX = Math.max(8, Math.min(window.innerWidth - 130, parsedSim.x));
          const safeY = Math.max(8, Math.min(window.innerHeight - 60, parsedSim.y));
          setSimBtnPos({ x: safeX, y: safeY });
        }
      } else if (typeof window !== 'undefined') {
        setSimBtnPos({ x: window.innerWidth - 140, y: 80 });
      }

      const savedSettings = localStorage.getItem('map_settings_btn_pos');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (typeof parsedSettings.x === 'number' && typeof parsedSettings.y === 'number') {
          const safeX = Math.max(8, Math.min(window.innerWidth - 60, parsedSettings.x));
          const safeY = Math.max(8, Math.min(window.innerHeight - 60, parsedSettings.y));
          setSettingsBtnPos({ x: safeX, y: safeY });
        }
      } else if (typeof window !== 'undefined') {
        setSettingsBtnPos({ x: window.innerWidth - 60, y: 380 });
      }
    } catch (e) {
      console.warn('Error reading draggable button configs:', e);
    }
  }, []);

  // Función sin parámetros para mover/restaurar el HUD de Semáforo en Vivo libremente
  const resetTrafficLightHudPosition = () => {
    const defaultPos = { x: 20, y: 140 };
    setTlHudPos(defaultPos);
    try {
      localStorage.removeItem('didi_traffic_light_hud_pos');
    } catch (e) {
      console.warn('Error clearing didi_traffic_light_hud_pos:', e);
    }
  };

  const tlHudScaleRef = useRef(1.0);
  useEffect(() => {
    tlHudScaleRef.current = tlHudScale;
  }, [tlHudScale]);

  // Función sin límite de parámetros para cambiar de tamaño el HUD de Semáforo en Vivo
  const resizeTrafficLightHud = (...args: any[]) => {
    let newScale = 1.0;

    if (args.length === 0) {
      // Sin parámetros: cicla entre escalas predeterminadas (0.8x -> 1.0x -> 1.25x -> 1.5x -> 1.75x)
      const presets = [0.8, 1.0, 1.25, 1.5, 1.75];
      const current = tlHudScaleRef.current;
      const currentIdx = presets.findIndex(p => Math.abs(p - current) < 0.08);
      const next = presets[(currentIdx + 1) % presets.length];
      tlHudScaleRef.current = next;
      setTlHudScale(next);
      try { localStorage.setItem('didi_traffic_light_hud_scale', next.toString()); } catch (_) {}
      setTimeout(() => {
        toast({
          title: "Tamaño de Semáforo HUD",
          description: `Escala ajustada a ${Math.round(next * 100)}%`
        });
      }, 0);
      return;
    }

    // Procesamiento flexible con 1 o múltiples argumentos
    const firstArg = args[0];
    if (typeof firstArg === 'number' && !isNaN(firstArg)) {
      newScale = firstArg > 10 ? firstArg / 100 : firstArg;
    } else if (typeof firstArg === 'string') {
      const lower = firstArg.toLowerCase().trim();
      if (lower === 'small' || lower === 'pequeño' || lower === 'sm' || lower === 's') newScale = 0.8;
      else if (lower === 'normal' || lower === 'medium' || lower === 'md' || lower === 'm') newScale = 1.0;
      else if (lower === 'large' || lower === 'grande' || lower === 'lg' || lower === 'l') newScale = 1.35;
      else if (lower === 'xl' || lower === 'extragrande' || lower === 'huge') newScale = 1.65;
      else if (lower.endsWith('%')) newScale = parseFloat(lower) / 100;
      else if (!isNaN(parseFloat(firstArg))) newScale = parseFloat(firstArg);
    } else if (typeof firstArg === 'object' && firstArg !== null) {
      if (typeof firstArg.scale === 'number') newScale = firstArg.scale;
      else if (typeof firstArg.size === 'number') newScale = firstArg.size;
      else if (typeof firstArg.zoom === 'number') newScale = firstArg.zoom;
      else if (typeof firstArg.width === 'number') newScale = firstArg.width / 160;
    }

    // Argumentos adicionales opcionales (ej. multiplicador, ancho, alto)
    if (args.length >= 2 && typeof args[1] === 'number' && !isNaN(args[1])) {
      if (args[1] > 10) {
        newScale = Math.max(0.5, Math.min(3.0, args[1] / 160));
      }
    }

    const boundedScale = Math.max(0.5, Math.min(3.0, newScale));
    tlHudScaleRef.current = boundedScale;
    setTlHudScale(boundedScale);
    try {
      localStorage.setItem('didi_traffic_light_hud_scale', boundedScale.toString());
    } catch (_) {}

    setTimeout(() => {
      toast({
        title: "Tamaño de Semáforo Actualizado",
        description: `Escala establecida al ${(boundedScale * 100).toFixed(0)}%`
      });
    }, 0);
  };

  // Expose parameterless & variadic functions on window for global access/testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetTrafficLightHudPosition = resetTrafficLightHudPosition;
      (window as any).resizeTrafficLightHud = resizeTrafficLightHud;
      (window as any).setTrafficLightHudScale = resizeTrafficLightHud;
      (window as any).changeTrafficLightHudSize = resizeTrafficLightHud;
    }
  }, []);

  const handleTlHudPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingTlHudRef.current = true;
    setIsTlHudDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartOffsetRef.current = {
      x: e.clientX - tlHudPos.x,
      y: e.clientY - tlHudPos.y
    };
  };

  const handleTlHudPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingTlHudRef.current) return;
    e.preventDefault();
    const newX = e.clientX - dragStartOffsetRef.current.x;
    const newY = e.clientY - dragStartOffsetRef.current.y;
    const boundedX = Math.max(8, Math.min(window.innerWidth - 210, newX));
    const boundedY = Math.max(8, Math.min(window.innerHeight - 90, newY));
    setTlHudPos({ x: boundedX, y: boundedY });
  };

  const handleTlHudPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingTlHudRef.current) return;
    isDraggingTlHudRef.current = false;
    setIsTlHudDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    try {
      localStorage.setItem('didi_traffic_light_hud_pos', JSON.stringify(tlHudPos));
    } catch (err) {
      console.warn('Error saving didi_traffic_light_hud_pos:', err);
    }
  };

  // Draggable Simulator Button Handlers
  const handleSimBtnPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isSimPointerDownRef.current = true;
    isDraggingSimBtnRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragSimStartRef.current = {
      x: e.clientX - simBtnPos.x,
      y: e.clientY - simBtnPos.y,
      startX: e.clientX,
      startY: e.clientY
    };
  };

  const handleSimBtnPointerMove = (e: React.PointerEvent) => {
    if (!isSimPointerDownRef.current) return;
    const distMoved = Math.hypot(e.clientX - dragSimStartRef.current.startX, e.clientY - dragSimStartRef.current.startY);
    if (distMoved > 4) {
      isDraggingSimBtnRef.current = true;
      setIsSimBtnDragging(true);
      const newX = e.clientX - dragSimStartRef.current.x;
      const newY = e.clientY - dragSimStartRef.current.y;
      const boundedX = Math.max(8, Math.min(window.innerWidth - 130, newX));
      const boundedY = Math.max(8, Math.min(window.innerHeight - 60, newY));
      setSimBtnPos({ x: boundedX, y: boundedY });
    }
  };

  const handleSimBtnPointerUp = (e: React.PointerEvent) => {
    if (!isSimPointerDownRef.current) return;
    isSimPointerDownRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    if (isDraggingSimBtnRef.current) {
      isDraggingSimBtnRef.current = false;
      setIsSimBtnDragging(false);
      try {
        localStorage.setItem('map_simulator_btn_pos', JSON.stringify(simBtnPos));
      } catch (err) {}
    } else {
      setIsSimBtnDragging(false);
      setIsSimulatorModalOpen(true);
    }
  };

  // Draggable Settings & Layout Configuration Button Handlers
  const handleSettingsBtnPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isSettingsPointerDownRef.current = true;
    isDraggingSettingsBtnRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragSettingsStartRef.current = {
      x: e.clientX - settingsBtnPos.x,
      y: e.clientY - settingsBtnPos.y,
      startX: e.clientX,
      startY: e.clientY
    };
  };

  const handleSettingsBtnPointerMove = (e: React.PointerEvent) => {
    if (!isSettingsPointerDownRef.current) return;
    const distMoved = Math.hypot(e.clientX - dragSettingsStartRef.current.startX, e.clientY - dragSettingsStartRef.current.startY);
    if (distMoved > 4) {
      isDraggingSettingsBtnRef.current = true;
      setIsSettingsBtnDragging(true);
      const newX = e.clientX - dragSettingsStartRef.current.x;
      const newY = e.clientY - dragSettingsStartRef.current.y;
      const boundedX = Math.max(8, Math.min(window.innerWidth - 60, newX));
      const boundedY = Math.max(8, Math.min(window.innerHeight - 60, newY));
      setSettingsBtnPos({ x: boundedX, y: boundedY });
    }
  };

  const handleSettingsBtnPointerUp = (e: React.PointerEvent) => {
    if (!isSettingsPointerDownRef.current) return;
    isSettingsPointerDownRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    if (isDraggingSettingsBtnRef.current) {
      isDraggingSettingsBtnRef.current = false;
      setIsSettingsBtnDragging(false);
      try {
        localStorage.setItem('map_settings_btn_pos', JSON.stringify(settingsBtnPos));
      } catch (err) {}
    } else {
      setIsSettingsBtnDragging(false);
      setIsSettingsOpen(true);
    }
  };

  // 1-second live countdown interval for all traffic lights (DiDi Style)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLights = trafficLightsRef.current;
      if (currentLights.length === 0 || !mapInstanceRef.current) return;

      const map = mapInstanceRef.current;
      const updated = currentLights.map(tl => {
        const cycleTotal = 45; // 24s green, 4s yellow, 17s red
        const currentSec = (Math.floor(Date.now() / 1000) + tl.cycleOffset) % cycleTotal;
        let phase: 'green' | 'yellow' | 'red' = 'green';
        let secondsLeft = 0;
        if (currentSec < 24) {
          phase = 'green';
          secondsLeft = 24 - currentSec;
        } else if (currentSec < 28) {
          phase = 'yellow';
          secondsLeft = 28 - currentSec;
        } else {
          phase = 'red';
          secondsLeft = 45 - currentSec;
        }
        return { ...tl, phase, secondsLeft };
      });

      trafficLightsRef.current = updated;

      // Sync approaching traffic light state with current ticker
      setApproachingTrafficLight(prev => {
        if (!prev) return null;
        const matching = updated.find(l => l.id === prev.id);
        if (matching) {
          return { ...prev, phase: matching.phase, secondsLeft: matching.secondsLeft };
        }
        return prev;
      });

      // Sync with MapLibre markers (DiDi Capsule Design)
      if (trafficLightMarkersRef.current.length !== updated.length) {
        trafficLightMarkersRef.current.forEach(m => m.remove());
        trafficLightMarkersRef.current = updated.map(tl => {
          const el = document.createElement('div');
          el.className = 'didi-traffic-light-node pointer-events-none transition-all duration-300 select-none';
          const lensColor = tl.phase === 'green' ? '#00B377' : tl.phase === 'yellow' ? '#F59E0B' : '#EF4444';
          const digitsText = tl.secondsLeft < 10 ? `0${tl.secondsLeft}` : `${tl.secondsLeft}`;

          el.innerHTML = `
            <div class="didi-marker-capsule" style="background:#18202A; border:2px solid rgba(255,255,255,0.45); border-radius:9999px; padding:3px 8px 3px 4px; display:flex; align-items:center; gap:6px; box-shadow:0 6px 16px rgba(0,0,0,0.6); position:relative;">
              <div class="didi-marker-lens" style="width:22px; height:22px; border-radius:9999px; background:${lensColor}; box-shadow:0 0 10px ${lensColor}; display:flex; align-items:center; justify-content:center;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              </div>
              <span class="didi-marker-digits" style="color:#ffffff; font-size:14px; font-weight:900; font-family:'Orbitron', monospace, ui-monospace, sans-serif; line-height:1; letter-spacing:0.5px;">${digitsText}</span>
              <div class="didi-marker-tail" style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:6px solid #18202A;"></div>
            </div>
          `;
          return new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([tl.lng, tl.lat])
            .addTo(map);
        });
      } else {
        trafficLightMarkersRef.current.forEach((marker, idx) => {
          const tl = updated[idx];
          if (!tl) return;
          const el = marker.getElement();
          const lens = el.querySelector('.didi-marker-lens') as HTMLElement;
          const digits = el.querySelector('.didi-marker-digits') as HTMLElement;
          if (lens) {
            const lensColor = tl.phase === 'green' ? '#00B377' : tl.phase === 'yellow' ? '#F59E0B' : '#EF4444';
            lens.style.background = lensColor;
            lens.style.boxShadow = `0 0 10px ${lensColor}`;
            if (tl.phase === 'red') {
              lens.innerHTML = `<div style="width:7px; height:7px; background:#ffffff; border-radius:1.5px;"></div>`;
            } else {
              lens.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              `;
            }
          }
          if (digits) {
            digits.innerText = tl.secondsLeft < 10 ? `0${tl.secondsLeft}` : `${tl.secondsLeft}`;
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isAdjustingLocation, setIsAdjustingLocation] = useState(false);
  const activeRouteRef = useRef<{ lat: number, lng: number } | null>(null);

  const userLocationRef = useRef<{ lat: number, lng: number } | null>(null);
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  useEffect(() => {
    onRouteActiveChange?.(activeRoute !== null);
  }, [activeRoute, onRouteActiveChange]);

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
    if (myLocationMarkerRef.current) {
      const el = myLocationMarkerRef.current.getElement();
      updateUserMarkerElement(el, isNavigating);
    }
  }, [currentStreet, isNavigating]);

  useEffect(() => {
    onNavigationStateChange?.(isNavigating);
  }, [isNavigating, onNavigationStateChange]);

  const updateNavigationInstructions = (userLatLng: Coord, steps: any[], destName: string) => {
    const result = getCurrentStep(userLatLng, steps);
    if (!result) return;

    const { step, distance, index } = result;
    const icon = getTurnIcon(step.maneuver?.type || '', step.maneuver?.modifier || '');
    const { action, street } = getTurnInstructionParts(step, destName);
    const distanceText = distance >= 1000
      ? `${(distance / 1000).toFixed(1)} km`
      : `${Math.round(distance)} m`;

    const nextStep = steps[index + 1];
    let next = null;
    if (nextStep && nextStep.maneuver?.type) {
      const nextIcon = getTurnIcon(nextStep.maneuver?.type || '', nextStep.maneuver?.modifier || '', 'w-4 h-4');
      next = {
        icon: nextIcon,
        text: nextStep.name || 'Siguiente calle'
      };
    }

    setCurrentInstruction({ icon, action, street, distanceText, next });

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
        <div class="user-marker-inner nav-arrow-inner" style="
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <!-- Pulse Halo (GPS Accuracy) -->
          <div style="
            position: absolute;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: rgba(37, 99, 235, 0.15);
            border: 1.5px solid rgba(37, 99, 235, 0.3);
            animation: pulse 2s infinite ease-in-out;
            pointer-events: none;
          "></div>
          
          <!-- White Circle Base -->
          <div style="
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #ffffff;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          ">
            <!-- Blue Chevron Arrow pointing straight UP -->
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L22 22L12 17L2 22L12 2Z" fill="#1A73E8" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <!-- Street Banner Pill directly attached below the White Circle -->
          ${currentStreet ? `
            <div style="
              position: absolute;
              bottom: -16px;
              left: 50%;
              transform: translateX(-50%);
              white-space: nowrap;
              background-color: #ffffff;
              color: #1a73e8;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 800;
              box-shadow: 0 4px 10px rgba(0,0,0,0.25);
              border: 1px solid rgba(0,0,0,0.1);
              pointer-events: none;
              font-family: inherit;
              z-index: 1000;
            ">
              ${currentStreet}
            </div>
          ` : ''}
        </div>
      `;
      el.style.width = '80px';
      el.style.height = '80px';
    } else {
      el.innerHTML = `
        <div class="user-marker-inner" style="
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
        
        isManualLocationRef.current = true; // Mark as manually adjusted
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
          localStorage.setItem('isManualLocationLocked', 'true');
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

  const handleLocateMe = (clearManual = false) => {
    if (clearManual) {
      isManualLocationRef.current = false;
      try {
        localStorage.removeItem('isManualLocationLocked');
      } catch (e) {
        console.warn("Storage access failed:", e);
      }
    }

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
      if (isManualLocationRef.current) return; // Ignore if manual location is active

      let { latitude, longitude, accuracy, speed } = position.coords;

      const distFromCenter = getDistance(
        { latitude, longitude },
        { latitude: HERMOSILLO_CENTER[0], longitude: HERMOSILLO_CENTER[1] }
      );

      if (distFromCenter > 30000) {
        console.warn("Location outside Hermosillo detected.", { latitude, longitude });
        toast({
          title: 'Ubicación lejana detectada',
          description: 'Tu ubicación está fuera de Hermosillo y no será utilizada.',
        });
        return; // Ignore locations outside Hermosillo
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
          if (isManualLocationRef.current) return; // Ignore if manual location is active

          let { latitude: lat, longitude: lng, accuracy: acc, speed: newSpeed } = betterPosition.coords;
          const speedKmh = newSpeed ? Math.round(newSpeed * 3.6) : 0;

          const distFromCenter = getDistance(
            { latitude: lat, longitude: lng },
            { latitude: HERMOSILLO_CENTER[0], longitude: HERMOSILLO_CENTER[1] }
          );

          if (distFromCenter > 30000) {
            return; // Ignore coordinates outside Hermosillo
          }

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
      if (isManualLocationRef.current) return; // Ignore if manual location is active

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
    if (!map) return;

    let origin = originOverride || userLocationRef.current;

    // Try to get fresh location if not origin, not overridden and not manual location
    if (!origin && !originOverride && !isManualLocationRef.current && navigator.geolocation) {
      try {
        const freshPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 10000
          });
        });
        const { latitude, longitude } = freshPos.coords;
        const distFromCenter = getDistance(
          { latitude, longitude },
          { latitude: HERMOSILLO_CENTER[0], longitude: HERMOSILLO_CENTER[1] }
        );
        if (distFromCenter <= 30000) {
          origin = { lat: latitude, lng: longitude };
          setUserLocation(origin);
          updateUserMarker([longitude, latitude], true);
          if (onLocateUser) {
            onLocateUser(origin);
          }
          try {
            localStorage.setItem('userLocation', JSON.stringify(origin));
          } catch (e) {
            console.warn("Storage access failed:", e);
          }
        }
      } catch (err) {
        console.warn("Could not get fresh geolocation on drawRoute, using fallback:", err);
      }
    }

    if (!origin) {
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
          title: 'Calculando mejores rutas...',
          description: 'Analizando opciones de tráfico y rapidez.',
        });
      }

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`
      );

      if (!response.ok) throw new Error('Error al obtener la ruta');

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        if (activePopupRef.current) {
          isProgrammaticCloseRef.current = true;
          activePopupRef.current.remove();
          isProgrammaticCloseRef.current = false;
        }

        const startCoord: [number, number] = [origin.lng, origin.lat];
        const endCoord: [number, number] = [destination.lng, destination.lat];

        // Parse all intelligent route options returned by routing engine
        const parsedRoutes: RecommendedRoute[] = data.routes.map((r: any, idx: number) => {
          let coords: [number, number][] = [...r.geometry.coordinates];
          if (getDistance({ latitude: origin!.lat, longitude: origin!.lng }, { latitude: coords[0][1], longitude: coords[0][0] }) > 2) {
            coords = [startCoord, ...coords];
          }
          if (getDistance({ latitude: destination.lat, longitude: destination.lng }, { latitude: coords[coords.length - 1][1], longitude: coords[coords.length - 1][0] }) > 2) {
            coords = [...coords, endCoord];
          }
          const coordsLatLng: [number, number][] = coords.map((c: any) => [c[1], c[0]]);
          const isFastest = idx === 0;
          const diffSeconds = r.duration - data.routes[0].duration;
          const trafficDelayText = diffSeconds > 45 ? `+${Math.round(diffSeconds / 60)} min` : undefined;
          const viaSummary = r.legs?.[0]?.summary || (idx === 0 ? 'Ruta más directa' : `Vía alterna ${idx}`);

          return {
            id: idx,
            label: isFastest ? 'Ruta más rápida' : `Alternativa ${idx + 1}`,
            via: viaSummary,
            distance: r.distance,
            duration: r.duration,
            coordinates: coords,
            coordsLatLng,
            steps: r.legs?.flatMap((leg: any) => leg.steps) || [],
            geometry: r.geometry,
            isFastest,
            trafficDelayText
          };
        });

        setRecommendedRoutes(parsedRoutes);
        setSelectedRouteIndex(0);
        recommendedRoutesRef.current = parsedRoutes;

        const mainRoute = parsedRoutes[0];
        routeCoordinatesRef.current = mainRoute.coordsLatLng;
        fullRouteCoordinatesRef.current = mainRoute.coordsLatLng;

        // Draw alternative routes (semi-transparent slate layer)
        const otherRoutes = parsedRoutes.filter((_, i) => i !== 0);
        const altFeatures = otherRoutes.map(item => ({
          type: 'Feature',
          properties: { routeId: item.id },
          geometry: { type: 'LineString', coordinates: item.coordinates }
        }));

        if (map.getSource('alternative-routes')) {
          (map.getSource('alternative-routes') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: altFeatures as any
          });
        } else {
          map.addSource('alternative-routes', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: altFeatures as any }
          });
          map.addLayer({
            id: 'alternative-routes-layer',
            type: 'line',
            source: 'alternative-routes',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#64748B',
              'line-width': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 10, 20, 14] as any,
              'line-opacity': 0.75
            }
          });
        }

        // Draw active primary route (deep vibrant blue layer)
        if (map.getSource('route')) {
          const source = map.getSource('route') as maplibregl.GeoJSONSource;
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              ...mainRoute.geometry,
              coordinates: mainRoute.coordinates
            }
          });
        } else {
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                ...mainRoute.geometry,
                coordinates: mainRoute.coordinates
              }
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
              'line-color': '#002CF3', // Deep intense blue
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 6,
                16, 14,
                20, 22
              ] as any,
              'line-opacity': 0.95
            }
          });
        }

        // Generate traffic lights with animated countdowns along this route
        generateTrafficLights(mainRoute.coordsLatLng, mainRoute.steps);

        if (!isNavigating) {
          const bounds = mainRoute.coordinates.reduce((acc: maplibregl.LngLatBounds, coord: number[]) => {
            return acc.extend(coord as [number, number]);
          }, new maplibregl.LngLatBounds(mainRoute.coordinates[0], mainRoute.coordinates[0]));

          map.fitBounds(bounds, { padding: 50 });
        }

        setRouteSteps(mainRoute.steps);
        initialRouteDistanceRef.current = mainRoute.distance;
        initialRouteDurationRef.current = mainRoute.duration;

        const destinationPizzeria = pizzerias.find(
          p => Math.abs(p.lat - destination.lat) < 0.0001 && Math.abs(p.lng - destination.lng) < 0.0001
        );
        destinationNameRef.current = destinationPizzeria?.name || 'tu destino';

        setActiveRoute(destination);
        setRouteDetails({
          distance: mainRoute.distance,
          duration: mainRoute.duration
        });

        const userLatLng = { lat: origin.lat, lng: origin.lng };
        updateNavigationInstructions(userLatLng, mainRoute.steps, destinationNameRef.current);

        if (!isNavigating) {
          toast({
            title: parsedRoutes.length > 1 ? `🍕 ${parsedRoutes.length} rutas encontradas` : 'Ruta trazada',
            description: `Ruta más rápida: ${(mainRoute.distance / 1000).toFixed(1)} km, ~${(mainRoute.duration / 60).toFixed(0)} min (${mainRoute.via})`,
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

  const generateTrafficLights = (coords: [number, number][], steps: any[]) => {
    trafficLightMarkersRef.current.forEach(m => m.remove());
    trafficLightMarkersRef.current = [];

    if (!coords || coords.length < 6) {
      setTrafficLights([]);
      trafficLightsRef.current = [];
      setApproachingTrafficLight(null);
      return;
    }

    const lights: TrafficLight[] = [];
    const count = Math.min(5, Math.max(2, Math.floor(coords.length / 12)));
    const interval = Math.floor(coords.length / (count + 1));

    for (let i = 1; i <= count; i++) {
      const idx = Math.min(coords.length - 2, i * interval);
      const coord = coords[idx];
      const step = steps.find((s: any) => s.maneuver?.location && Math.abs(s.maneuver.location[1] - coord[0]) < 0.004);
      const streetName = step?.name || `Cruce ${i}`;
      lights.push({
        id: `tl-${i}-${idx}`,
        lat: coord[0],
        lng: coord[1],
        streetName,
        cycleOffset: (i * 14) % 45,
        phase: 'green',
        secondsLeft: 20
      });
    }

    setTrafficLights(lights);
    trafficLightsRef.current = lights;
  };

  const selectAlternativeRoute = (index: number) => {
    const r = recommendedRoutesRef.current[index];
    if (!r || !mapInstanceRef.current) return;

    setSelectedRouteIndex(index);
    routeCoordinatesRef.current = r.coordsLatLng;
    fullRouteCoordinatesRef.current = r.coordsLatLng;
    setRouteSteps(r.steps);
    setRouteDetails({
      distance: r.distance,
      duration: r.duration
    });
    initialRouteDistanceRef.current = r.distance;
    initialRouteDurationRef.current = r.duration;

    const map = mapInstanceRef.current;
    if (map.getSource('route')) {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { ...r.geometry, coordinates: r.coordinates }
      });
    }

    const otherRoutes = recommendedRoutesRef.current.filter((_, i) => i !== index);
    const altFeatures = otherRoutes.map(item => ({
      type: 'Feature',
      properties: { routeId: item.id },
      geometry: { type: 'LineString', coordinates: item.coordinates }
    }));

    if (map.getSource('alternative-routes')) {
      (map.getSource('alternative-routes') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: altFeatures as any
      });
    }

    generateTrafficLights(r.coordsLatLng, r.steps);

    if (userLocationRef.current) {
      updateNavigationInstructions(userLocationRef.current, r.steps, destinationNameRef.current);
    }

    toast({
      title: `Ruta cambiada: ${r.label}`,
      description: `${(r.distance / 1000).toFixed(1)} km • ${Math.round(r.duration / 60)} min (${r.via})`
    });
  };

  const getRouteBearing = (userLat: number, userLng: number) => {
    const latlngs = fullRouteCoordinatesRef.current.length > 0 ? fullRouteCoordinatesRef.current : routeCoordinatesRef.current;
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

    const fullCoords = fullRouteCoordinatesRef.current.length > 0 ? fullRouteCoordinatesRef.current : routeCoordinatesRef.current;
    if (isNavigatingRef.current && fullCoords.length > 0) {
      const snapped = getClosestPointOnPolyline(
        { lat: targetLat, lng: targetLng },
        fullCoords.map(c => ({ lat: c[0], lng: c[1] }))
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

      // Uber/DiDi angular smoothing
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

      // Erase passed route behind the user (Uber/DiDi system)
      if (isNavigatingRef.current && fullRouteCoordinatesRef.current.length > 1) {
        let minDist = Infinity;
        let segIdx = 0;
        for (let i = 0; i < fullRouteCoordinatesRef.current.length - 1; i++) {
          const d = distanceToSegment(
            { lat: currentLat, lng: currentLng },
            { lat: fullRouteCoordinatesRef.current[i][0], lng: fullRouteCoordinatesRef.current[i][1] },
            { lat: fullRouteCoordinatesRef.current[i + 1][0], lng: fullRouteCoordinatesRef.current[i + 1][1] }
          );
          if (d < minDist) {
            minDist = d;
            segIdx = i;
          }
        }
        const remainingGeoJsonCoords: [number, number][] = [
          [currentLng, currentLat],
          ...fullRouteCoordinatesRef.current.slice(segIdx + 1).map(c => [c[1], c[0]])
        ];
        if (map.getSource('route')) {
          (map.getSource('route') as maplibregl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: remainingGeoJsonCoords
            }
          });
        }
      }

      // Check approaching traffic light ahead
      if (trafficLightsRef.current.length > 0) {
        let closest: TrafficLight | null = null;
        let minD = Infinity;
        for (const tl of trafficLightsRef.current) {
          const d = getDistance({ latitude: currentLat, longitude: currentLng }, { latitude: tl.lat, longitude: tl.lng });
          if (d < 120 && d < minD) {
            minD = d;
            closest = tl;
          }
        }
        if (closest) {
          setApproachingTrafficLight({ ...closest, distanceMeters: Math.round(minD) });
        } else {
          setApproachingTrafficLight(null);
        }
      }

      if (isNavigatingRef.current && isLockedRef.current) {
        const height = map.getContainer().clientHeight;
        const pixelOffset: [number, number] = [0, height * 0.22];
        map.jumpTo({
          center: [currentLng, currentLat],
          zoom: 19.5,
          pitch: 60,
          bearing: currentHeading,
          offset: pixelOffset
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

    const map = mapInstanceRef.current;
    if (map && userLocation) {
      let navLoc = { lat: userLocation.lat, lng: userLocation.lng };
      const fullCoords = fullRouteCoordinatesRef.current.length > 0 ? fullRouteCoordinatesRef.current : routeCoordinatesRef.current;
      if (fullCoords.length > 0) {
        navLoc = getClosestPointOnPolyline(
          navLoc,
          fullCoords.map(c => ({ lat: c[0], lng: c[1] }))
        );
      }

      let bearing = getRouteBearing(navLoc.lat, navLoc.lng);
      if (bearing === 0 && activeRoute) {
        bearing = calculateBearing(navLoc.lat, navLoc.lng, activeRoute.lat, activeRoute.lng);
      }
      setMapRotation(bearing);
      currentHeadingRef.current = bearing;
      smoothedHeadingRef.current = bearing;
      animatedCoordsRef.current = { lat: navLoc.lat, lng: navLoc.lng };

      const height = map.getContainer().clientHeight;
      const pixelOffset: [number, number] = [0, height * 0.22];
      
      map.easeTo({
        center: [navLoc.lng, navLoc.lat],
        zoom: 19.5,
        pitch: 60,
        bearing: bearing,
        offset: pixelOffset,
        duration: 400
      });

      updateUserMarker([navLoc.lng, navLoc.lat], true);
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setRotation(bearing);
      }
      if (routeSteps.length > 0) {
        updateNavigationInstructions(navLoc, routeSteps, destinationNameRef.current);
      }
    }

    toast({
      title: "Iniciando navegación",
      description: "Sigue la ruta en el mapa."
    });
  };

  const cleanupSimulation = () => {
    if (simAnimationFrameRef.current) {
      cancelAnimationFrame(simAnimationFrameRef.current);
      simAnimationFrameRef.current = null;
    }
    setIsSimulating(false);
    setIsSimulationPaused(false);
    simIsPausedRef.current = false;
  };

  const cleanupNavigationTimers = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    cleanupSimulation();
  };

  const startTripSimulation = async (startZoneOrCoords?: string | Coord, targetPizzeriaParam?: Pizzeria) => {
    cleanupSimulation();
    setSimulationArrivalData(null);

    // Determine start origin
    let origin: Coord = { lat: 29.0729, lng: -110.9559 }; // Centro default
    if (typeof startZoneOrCoords === 'string') {
      const zone = HERMOSILLO_SIMULATION_ZONES.find(z => z.id === startZoneOrCoords);
      if (zone) origin = { lat: zone.lat, lng: zone.lng };
    } else if (startZoneOrCoords && typeof startZoneOrCoords === 'object') {
      origin = startZoneOrCoords;
    } else if (userLocation) {
      origin = userLocation;
    }

    // Determine target pizzeria
    let target = targetPizzeriaParam;
    if (!target && selectedTargetPizzeriaId) {
      target = pizzerias.find(p => p.id === selectedTargetPizzeriaId);
    }
    if (!target && activeRoute) {
      target = pizzerias.find(p => Math.abs(p.lat - activeRoute.lat) < 0.0001 && Math.abs(p.lng - activeRoute.lng) < 0.0001);
    }
    if (!target && pizzerias.length > 0) {
      target = pizzerias[0];
    }
    if (!target) {
      toast({
        variant: 'destructive',
        title: 'Selecciona un destino',
        description: 'Debes elegir una pizzería para simular la ruta.'
      });
      return;
    }

    // Set origin location
    isManualLocationRef.current = true;
    setUserLocation(origin);
    updateUserMarker([origin.lng, origin.lat], true);

    const zoneName = typeof startZoneOrCoords === 'string'
      ? HERMOSILLO_SIMULATION_ZONES.find(z => z.id === startZoneOrCoords)?.name || 'Zona seleccionada'
      : 'Punto de partida';

    toast({
      title: 'Trazando ruta para simulación...',
      description: `De ${zoneName} a ${target.name}`
    });

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${target.lng},${target.lat}?overview=full&geometries=geojson&steps=true`
      );

      if (!response.ok) throw new Error('Error al obtener la ruta de OSRM');
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No se encontró una ruta válida');
      }

      if (activePopupRef.current) {
        isProgrammaticCloseRef.current = true;
        activePopupRef.current.remove();
        isProgrammaticCloseRef.current = false;
      }

      const route = data.routes[0];
      let coordinates = [...route.geometry.coordinates];
      const startCoord = [origin.lng, origin.lat];
      const endCoord = [target.lng, target.lat];

      if (getDistance({ latitude: origin.lat, longitude: origin.lng }, { latitude: coordinates[0][1], longitude: coordinates[0][0] }) > 2) {
        coordinates = [startCoord, ...coordinates];
      }
      if (getDistance({ latitude: target.lat, longitude: target.lng }, { latitude: coordinates[coordinates.length - 1][1], longitude: coordinates[coordinates.length - 1][0] }) > 2) {
        coordinates = [...coordinates, endCoord];
      }

      const coordsLatLng: [number, number][] = coordinates.map((c: any) => [c[1], c[0]]);
      routeCoordinatesRef.current = coordsLatLng;
      fullRouteCoordinatesRef.current = coordsLatLng;

      // Update map route layer
      const map = mapInstanceRef.current;
      if (map) {
        if (map.getSource('route')) {
          (map.getSource('route') as maplibregl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: { ...route.geometry, coordinates }
          });
        } else {
          map.addSource('route', {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { ...route.geometry, coordinates } }
          });
          map.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#002CF3',
              'line-width': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 14, 20, 22] as any,
              'line-opacity': 0.95
            }
          });
        }
      }

      const steps = route.legs?.flatMap((leg: any) => leg.steps) || [];
      setRouteSteps(steps);
      destinationNameRef.current = target.name;
      setActiveRoute({ lat: target.lat, lng: target.lng });
      setRouteDetails({ distance: route.distance, duration: route.duration });
      initialRouteDistanceRef.current = route.distance;
      initialRouteDurationRef.current = route.duration;

      // Polyline math
      const { cumDists, totalDistance } = computePolylineDistances(coordsLatLng);
      simCumulativeDistancesRef.current = cumDists;
      simTotalDistanceRef.current = totalDistance;
      simTraveledMetersRef.current = 0;

      // Start Navigation state
      setIsNavigating(true);
      isNavigatingRef.current = true;
      changeLockState(true);
      setIsSimulating(true);
      setIsSimulationPaused(false);
      simIsPausedRef.current = false;
      setSimulationProgress(0);
      setIsSimulatorModalOpen(false);

      // Camera initial position and orientation
      const initPos = getInterpolatedPosition(coordsLatLng, cumDists, 0);
      setMapRotation(initPos.bearing);
      currentHeadingRef.current = initPos.bearing;
      smoothedHeadingRef.current = initPos.bearing;
      simCurrentSpeedRef.current = 50;
      animatedCoordsRef.current = { lat: initPos.lat, lng: initPos.lng };

      if (map) {
        const height = map.getContainer().clientHeight;
        map.easeTo({
          center: [initPos.lng, initPos.lat],
          zoom: 19.5,
          pitch: 60,
          bearing: initPos.bearing,
          offset: [0, height * 0.22],
          duration: 400
        });
      }

      updateUserMarker([initPos.lng, initPos.lat], true);
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setRotation(initPos.bearing);
      }
      updateNavigationInstructions({ lat: initPos.lat, lng: initPos.lng }, steps, target.name);

      // Generate traffic lights along simulation route
      generateTrafficLights(coordsLatLng, steps);

      // Start Simulation Animation Loop
      simLastTimestampRef.current = performance.now();

      const runSimLoop = (time: number) => {
        const deltaTime = Math.min((time - simLastTimestampRef.current) / 1000, 0.05);
        simLastTimestampRef.current = time;

        if (!simIsPausedRef.current && simTotalDistanceRef.current > 0) {
          const pos = getInterpolatedPosition(
            fullRouteCoordinatesRef.current,
            simCumulativeDistancesRef.current,
            simTraveledMetersRef.current
          );

          // Dynamic speed easing (Uber/DiDi style smooth acceleration and braking)
          const targetSpeedKmh = pos.isTurn ? 24 : 52;
          const speedEase = 1 - Math.exp(-4 * deltaTime);
          simCurrentSpeedRef.current += (targetSpeedKmh - simCurrentSpeedRef.current) * speedEase;

          const speedMultiplier = simSpeedMultiplierRef.current;
          const speedMps = (simCurrentSpeedRef.current * 1000) / 3600;
          const deltaDistance = speedMps * deltaTime * speedMultiplier;

          simTraveledMetersRef.current += deltaDistance;

          // Uber / DiDi rotational damping (smooth turning camera and vehicle marker)
          let diff = pos.bearing - smoothedHeadingRef.current;
          while (diff < -180) diff += 360;
          while (diff > 180) diff -= 360;
          const rotSmoothing = 1 - Math.exp(-9 * deltaTime);
          smoothedHeadingRef.current = (smoothedHeadingRef.current + diff * rotSmoothing + 360) % 360;

          if (simTraveledMetersRef.current >= simTotalDistanceRef.current) {
            // Reached destination
            simTraveledMetersRef.current = simTotalDistanceRef.current;
            setSimulationProgress(1);
            setCurrentSpeed(0);

            const finalPos = getInterpolatedPosition(
              fullRouteCoordinatesRef.current,
              simCumulativeDistancesRef.current,
              simTotalDistanceRef.current
            );
            updateUserMarker([finalPos.lng, finalPos.lat]);

            // Clear remaining route line upon arrival
            if (mapInstanceRef.current?.getSource('route')) {
              (mapInstanceRef.current.getSource('route') as maplibregl.GeoJSONSource).setData({
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: [[finalPos.lng, finalPos.lat]] }
              });
            }

            setSimulationArrivalData({
              pizzeriaName: target!.name,
              totalDistanceKm: (simTotalDistanceRef.current / 1000).toFixed(1),
              elapsedSeconds: Math.round(route.duration)
            });

            toast({
              title: `🎉 ¡Has llegado a ${target!.name}!`,
              description: `Viaje simulado completado con éxito (${(simTotalDistanceRef.current / 1000).toFixed(1)} km).`
            });
            return;
          }

          setSimulationProgress(pos.progress);
          setCurrentSpeed(Math.round(simCurrentSpeedRef.current));

          const currentLatLng = { lat: pos.lat, lng: pos.lng };
          animatedCoordsRef.current = currentLatLng;
          currentHeadingRef.current = smoothedHeadingRef.current;

          updateUserMarker([pos.lng, pos.lat]);
          if (myLocationMarkerRef.current) {
            myLocationMarkerRef.current.setRotation(smoothedHeadingRef.current);
          }

          // 1. Erase passed route behind the vehicle in real time (Uber/DiDi system)
          const remainingGeoJsonCoords: [number, number][] = [
            [pos.lng, pos.lat],
            ...fullRouteCoordinatesRef.current.slice(pos.segIdx + 1).map(c => [c[1], c[0]])
          ];
          if (mapInstanceRef.current?.getSource('route')) {
            (mapInstanceRef.current.getSource('route') as maplibregl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: remainingGeoJsonCoords
              }
            });
          }

          // Check approaching traffic light ahead
          if (trafficLightsRef.current.length > 0) {
            let closest: TrafficLight | null = null;
            let minD = Infinity;
            for (const tl of trafficLightsRef.current) {
              const d = getDistance({ latitude: pos.lat, longitude: pos.lng }, { latitude: tl.lat, longitude: tl.lng });
              if (d < 120 && d < minD) {
                minD = d;
                closest = tl;
              }
            }
            if (closest) {
              setApproachingTrafficLight({ ...closest, distanceMeters: Math.round(minD) });
            } else {
              setApproachingTrafficLight(null);
            }
          }

          // 2. Camera 3D follow (ultra-fluid 60fps tracking)
          const currentMap = mapInstanceRef.current;
          if (currentMap && isLockedRef.current) {
            const h = currentMap.getContainer().clientHeight;
            currentMap.jumpTo({
              center: [pos.lng, pos.lat],
              bearing: smoothedHeadingRef.current,
              pitch: 60,
              zoom: 19.5,
              offset: [0, h * 0.22]
            });
            setMapRotation(smoothedHeadingRef.current);
          }

          // 3. Update remaining distance and ETA
          const remainingMeters = Math.max(0, simTotalDistanceRef.current - simTraveledMetersRef.current);
          const remainingSeconds = Math.max(0, (remainingMeters / simTotalDistanceRef.current) * route.duration);
          setRouteDetails({
            distance: remainingMeters,
            duration: remainingSeconds
          });

          // 4. Instructions update
          updateNavigationInstructions(currentLatLng, steps, target!.name);
        }

        simAnimationFrameRef.current = requestAnimationFrame(runSimLoop);
      };

      simAnimationFrameRef.current = requestAnimationFrame(runSimLoop);

    } catch (err: any) {
      console.error('Error starting trip simulation:', err);
      toast({
        variant: 'destructive',
        title: 'Error en la simulación',
        description: err.message || 'No se pudo iniciar el viaje simulado.'
      });
      cleanupSimulation();
    }
  };

  const handleTogglePauseSimulation = () => {
    const nextPaused = !isSimulationPaused;
    setIsSimulationPaused(nextPaused);
    simIsPausedRef.current = nextPaused;
    if (!nextPaused) {
      simLastTimestampRef.current = performance.now();
    }
  };

  const handleSetSimulationSpeed = (speed: number) => {
    setSimulationSpeed(speed);
    simSpeedMultiplierRef.current = speed;
  };

  const handleSeekSimulation = (newRatio: number) => {
    if (!isSimulating || simTotalDistanceRef.current <= 0) return;
    const targetMeters = Math.max(0, Math.min(simTotalDistanceRef.current, newRatio * simTotalDistanceRef.current));
    simTraveledMetersRef.current = targetMeters;
    setSimulationProgress(newRatio);

    const pos = getInterpolatedPosition(
      fullRouteCoordinatesRef.current,
      simCumulativeDistancesRef.current,
      targetMeters
    );

    const currentLatLng = { lat: pos.lat, lng: pos.lng };
    animatedCoordsRef.current = currentLatLng;
    smoothedHeadingRef.current = pos.bearing;
    currentHeadingRef.current = pos.bearing;

    updateUserMarker([pos.lng, pos.lat]);
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.setRotation(pos.bearing);
    }

    // Erase passed route behind vehicle
    const remainingGeoJsonCoords: [number, number][] = [
      [pos.lng, pos.lat],
      ...fullRouteCoordinatesRef.current.slice(pos.segIdx + 1).map(c => [c[1], c[0]])
    ];
    if (mapInstanceRef.current?.getSource('route')) {
      (mapInstanceRef.current.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: remainingGeoJsonCoords
        }
      });
    }

    const currentMap = mapInstanceRef.current;
    if (currentMap && isLockedRef.current) {
      const h = currentMap.getContainer().clientHeight;
      currentMap.jumpTo({
        center: [pos.lng, pos.lat],
        bearing: pos.bearing,
        pitch: 60,
        zoom: 19.5,
        offset: [0, h * 0.22]
      });
      setMapRotation(pos.bearing);
    }

    const remainingMeters = Math.max(0, simTotalDistanceRef.current - targetMeters);
    const initialDur = initialRouteDurationRef.current || 120;
    const remainingSeconds = (remainingMeters / simTotalDistanceRef.current) * initialDur;
    setRouteDetails({
      distance: remainingMeters,
      duration: remainingSeconds
    });

    updateNavigationInstructions(currentLatLng, routeSteps, destinationNameRef.current);
  };

  const exitNavigation = () => {
    cleanupNavigationTimers();
    cleanupSimulation();
    setSimulationArrivalData(null);
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
      
      const fullCoords = fullRouteCoordinatesRef.current.length > 0 ? fullRouteCoordinatesRef.current : routeCoordinatesRef.current;
      if (fullCoords.length > 0) {
        // Restore full route geometry on map
        if (map.getSource('route')) {
          (map.getSource('route') as maplibregl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: fullCoords.map(c => [c[1], c[0]])
            }
          });
        }

        const bounds = fullCoords.reduce((acc, coord) => {
          return acc.extend([coord[1], coord[0]]);
        }, new maplibregl.LngLatBounds(
          [fullCoords[0][1], fullCoords[0][0]],
          [fullCoords[0][1], fullCoords[0][0]]
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
    cleanupSimulation();
    setSimulationArrivalData(null);
    setCurrentInstruction(null);
    setCurrentStreet('');
    if (nextManeuverMarkerRef.current) {
      nextManeuverMarkerRef.current.remove();
      nextManeuverMarkerRef.current = null;
    }

    const map = mapInstanceRef.current;
    if (map) {
      if (map.getLayer('alternative-routes-layer')) map.removeLayer('alternative-routes-layer');
      if (map.getSource('alternative-routes')) map.removeSource('alternative-routes');
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

    setRecommendedRoutes([]);
    trafficLightMarkersRef.current.forEach(m => m.remove());
    trafficLightMarkersRef.current = [];
    setTrafficLights([]);
    setApproachingTrafficLight(null);
    fullRouteCoordinatesRef.current = [];
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
    return () => {
      cleanupSimulation();
    };
  }, []);

  useEffect(() => {
    const targetDest = routeDestination || activeRoute;
    if (targetDest && userLocation && !isNavigating) {
      drawRoute(targetDest);
    }
  }, [routeDestination, userLocation, activeRoute, isNavigating]);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getMapStyle(),
        center: [HERMOSILLO_CENTER[1], HERMOSILLO_CENTER[0]],
        zoom: 12,
        pitch: 0,
        bearing: 0,
        maxZoom: 22,
        attributionControl: false
      });
      
      mapInstanceRef.current = map;

      // Close popup when clicking on empty space of the map
      map.on('click', () => {
        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }
      });

      // Unlock map center tracking on manual interactions (drag, zoom, rotate, pitch, touch, click)
      const unlockMap = (e: any) => {
        if (isNavigatingRef.current && (e?.originalEvent || e?.type === 'touchstart' || e?.type === 'mousedown')) {
          changeLockState(false);
        }
      };

      map.on('dragstart', unlockMap);
      map.on('zoomstart', unlockMap);
      map.on('rotatestart', unlockMap);
      map.on('pitchstart', unlockMap);
      map.on('touchstart', unlockMap);
      map.on('mousedown', unlockMap);

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
        let savedManualLock = null;
        try {
          savedLoc = localStorage.getItem('userLocation');
          savedManualLock = localStorage.getItem('isManualLocationLocked');
        } catch (e) {
          console.warn("Storage access failed:", e);
        }
        if (savedManualLock === 'true') {
          isManualLocationRef.current = true;
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

        // Proactively request current geolocation on load to ensure accurate user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (isManualLocationRef.current) return;
              const { latitude, longitude } = position.coords;
              const distFromCenter = getDistance(
                { latitude, longitude },
                { latitude: HERMOSILLO_CENTER[0], longitude: HERMOSILLO_CENTER[1] }
              );
              if (distFromCenter <= 30000) {
                const freshLoc = { lat: latitude, lng: longitude };
                setUserLocation(freshLoc);
                updateUserMarker([longitude, latitude], true);
                if (onLocateUser) {
                  onLocateUser(freshLoc);
                }
                try {
                  localStorage.setItem('userLocation', JSON.stringify(freshLoc));
                } catch (e) {
                  console.warn("Storage access failed:", e);
                }
              }
            },
            (error) => console.log('Initial location request failed:', error.message),
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
          );
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

      if (typeof pizzeria.lat !== 'number' || typeof pizzeria.lng !== 'number') return false;

      // Always show active route destination
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

      if (searchCenter) {
        const distToSearch = getDistance(
          { latitude: searchCenter.lat, longitude: searchCenter.lng },
          { latitude: pizzeria.lat, longitude: pizzeria.lng }
        );
        if (distToSearch <= 2500) return true;
      }

      if (userLocation) {
        const distance = getDistance(
          { latitude: userLocation.lat, longitude: userLocation.lng },
          { latitude: pizzeria.lat, longitude: pizzeria.lng }
        );
        return distance <= 2500;
      }

      return false;
    });
  }, [pizzerias, selectedPizzeria, showAll, searchCenter, userLocation, routeDestination, activeRoute, disableDistanceFilter, explicitPizzeriasToShow]);

  visiblePizzeriasRef.current = visiblePizzerias;

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

    if (pizzeria.description) {
      const descRow = document.createElement('div');
      descRow.className = "custom-popup-row";
      descRow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
      const descText = document.createElement('span');
      descText.className = "custom-popup-text";
      descText.style.fontStyle = "italic";
      descText.textContent = pizzeria.description;
      descRow.appendChild(descText);
      infoContainer.appendChild(descRow);
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
    const currentOffset = isMobile ? (popupOffsetYMobileRef.current ?? -35) : (popupOffsetYRef.current ?? -35);

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
      activePopupPizzeriaIdRef.current = null;
      if (selectedPizzeria?.id === pizzeria.id) {
        onCloseDetail?.();
      }
    });

    activePopupRef.current = popup;
    activePopupPizzeriaIdRef.current = pizzeria.id;
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
      const isRouteDestination = !!(
        (activeRoute && Math.abs(activeRoute.lat - pizzeria.lat) < 0.0001 && Math.abs(activeRoute.lng - pizzeria.lng) < 0.0001) ||
        (routeDestination && Math.abs(routeDestination.lat - pizzeria.lat) < 0.0001 && Math.abs(routeDestination.lng - pizzeria.lng) < 0.0001)
      );

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
          // Always look up the latest pizzeria data by ID to avoid stale closure references
          const latestPizzeria = visiblePizzeriasRef.current.find(p => p.id === pizzeria.id) || pizzeria;

          // Open the popup directly on the map, do not trigger panel sheet immediately
          openPizzeriaPopup(latestPizzeria, newMarker);
          
          const isMobile = window.innerWidth < 768;
          const pitch = map.getPitch();
          const offsetPixels = pitch > 20
            ? (isMobile ? popupCenterOffset3DMobileRef.current : popupCenterOffset3DRef.current)
            : (isMobile ? popupCenterOffset2DMobileRef.current : popupCenterOffset2DRef.current);

          map.easeTo({
            center: [latestPizzeria.lng, latestPizzeria.lat],
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

    // Update active popup offset in real-time if it exists
    if (activePopupRef.current) {
      const isMobile = window.innerWidth < 768;
      const currentOffset = isMobile ? (popupOffsetYMobile ?? -35) : (popupOffsetY ?? -35);
      activePopupRef.current.setOffset([0, currentOffset]);
    }

    const prevSelected = prevSelectedPizzeriaRef.current;
    prevSelectedPizzeriaRef.current = selectedPizzeria;

    let targetPizzeria: Pizzeria | null = selectedPizzeria;
    if (!targetPizzeria && activePopupRef.current && activePopupPizzeriaIdRef.current) {
      targetPizzeria = visiblePizzeriasRef.current.find(p => p.id === activePopupPizzeriaIdRef.current) || null;
    }

    if (targetPizzeria) {
      const isMobile = window.innerWidth < 768;
      const pitch = map.getPitch();
      const offsetPixels = pitch > 20
        ? (isMobile ? popupCenterOffset3DMobile : popupCenterOffset3D)
        : (isMobile ? popupCenterOffset2DMobile : popupCenterOffset2D);

      map.easeTo({
        center: [targetPizzeria.lng, targetPizzeria.lat],
        zoom: 16,
        offset: [0, -offsetPixels],
        duration: isSettingsOpen ? 0 : 1500
      });

      const marker = markersMapRef.current.get(targetPizzeria.id);
      if (marker && targetPizzeria === selectedPizzeria) {
        const isAlreadyOpen = activePopupRef.current && activePopupPizzeriaIdRef.current === selectedPizzeria.id;
        if (!isAlreadyOpen) {
          openPizzeriaPopup(selectedPizzeria, marker);
        }
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
  }, [selectedPizzeria, searchCenter, userLocation, isNavigating, mapCenterOffset, popupOffsetY, popupOffsetYMobile, popupCenterOffset2D, popupCenterOffset2DMobile, popupCenterOffset3D, popupCenterOffset3DMobile]);

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

  useEffect(() => {
    if (userLocation) {
      updateUserMarker([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation]);

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

        {/* Map Controls Container (Fullscreen only now) - Positioned with buttons-top variables */}
        {!isNavigating && (
          <div
            className="absolute right-4 z-[1001] flex flex-col gap-2 transition-all duration-300 pointer-events-auto map-controls-container"
          >
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

          </div>
        )}

        {/* Independent Locate Me (Recentrar) button */}
        {!isNavigating && (
          <div className="absolute z-[1001] pointer-events-auto map-locate-btn-container">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleLocateMe(true)}
              className="shadow-lg rounded-full h-8 w-8 md:h-10 md:w-10 bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-900 border-0"
              aria-label="Recentrar ubicación"
            >
              <LocateFixed className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        )}

        {/* Draggable Settings & Layout Configuration Button (Available always, including during navigation/simulation) */}
        {isAdmin && (
          <div
            style={{
              position: 'fixed',
              left: `${settingsBtnPos.x}px`,
              top: `${settingsBtnPos.y}px`,
              zIndex: 1004,
              touchAction: 'none'
            }}
            onPointerDown={handleSettingsBtnPointerDown}
            onPointerMove={handleSettingsBtnPointerMove}
            onPointerUp={handleSettingsBtnPointerUp}
            onPointerCancel={handleSettingsBtnPointerUp}
            className={cn(
              "select-none cursor-grab active:cursor-grabbing transition-transform duration-75 pointer-events-auto",
              isSettingsBtnDragging && "scale-110 shadow-2xl"
            )}
            title="Arrastra con el mouse para mover la Configuración de Diseño • Clic para abrir"
          >
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  if (isDraggingSettingsBtnRef.current) e.preventDefault();
                }}
                className="shadow-2xl rounded-full h-8 w-8 md:h-10 md:w-10 border-2 border-white/30 bg-red-600 hover:bg-red-700 text-white"
                title="Configuración del Mapa y Diseño"
                aria-label="Configuración"
              >
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configuración del Mapa y Diseño</DialogTitle>
                </DialogHeader>
                <LayoutSettingsManager onSettingsChange={onSettingsChange} />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Independent "Ver todas/cercanas" button */}
        {!isNavigating && userLocation && (
          <div className="absolute z-[1001] pointer-events-auto map-view-all-container">
            <Button
              variant={showAll ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="shadow-lg rounded-full h-8 md:h-10 px-3 text-xs md:text-sm font-medium bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-900 border-0"
            >
              {showAll ? "Ver cercanas" : "Ver todas"}
            </Button>
          </div>
        )}

        {/* Draggable Trip Simulator Launch Button (Available only in localhost for testing) */}
        {isLocalhost && (
          <div
            style={{
              position: 'fixed',
              left: `${simBtnPos.x}px`,
              top: `${simBtnPos.y}px`,
              zIndex: 1004,
              touchAction: 'none'
            }}
            onPointerDown={handleSimBtnPointerDown}
            onPointerMove={handleSimBtnPointerMove}
            onPointerUp={handleSimBtnPointerUp}
            onPointerCancel={handleSimBtnPointerUp}
            className={cn(
              "select-none cursor-grab active:cursor-grabbing transition-transform duration-75 pointer-events-auto",
              isSimBtnDragging && "scale-105 shadow-2xl"
            )}
            title="Arrastra con el mouse para mover el botón de Simulador • Clic para abrir"
          >
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                if (isDraggingSimBtnRef.current) e.preventDefault();
              }}
              className="shadow-2xl rounded-full h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-2 border-white/25 flex items-center gap-2"
              title="Simulador de Viajes (Probar rutas por zonas)"
            >
              <Car className="h-4 w-4" />
              <span>Simulador</span>
            </Button>
          </div>
        )}

        {/* Intelligent Recommended Routes Selector Pills */}
        {activeRoute && !isNavigating && recommendedRoutes.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[1002] bottom-28 md:bottom-24 flex items-center gap-2 max-w-[92vw] overflow-x-auto p-1.5 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
            {recommendedRoutes.map((r, idx) => {
              const isSelected = selectedRouteIndex === idx;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectAlternativeRoute(idx)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm",
                    isSelected
                      ? "bg-blue-600 text-white shadow-blue-500/40 shadow-md scale-105 ring-2 ring-white/30"
                      : "bg-white/10 hover:bg-white/20 text-slate-200"
                  )}
                >
                  <span>{r.isFastest ? "⚡ Más rápida" : `🚗 ${r.via}`}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-extrabold", isSelected ? "bg-black/30 text-blue-100" : "bg-black/40 text-slate-300")}>
                    {Math.round(r.duration / 60)} min
                  </span>
                  {r.trafficDelayText && (
                    <span className="text-[10px] text-amber-300 font-bold">{r.trafficDelayText}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Start Trip / Navigation Controls */}
        {activeRoute && !isNavigating && (
          <div className="absolute left-1/2 z-[1002] flex items-center gap-2 md:gap-3 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto start-trip-container">
            <Button
              onClick={startNavigation}
              className="bg-[#4285F4] hover:bg-[#3367d6] text-white shadow-xl rounded-full px-5 md:px-6 h-12 text-sm md:text-base font-semibold border-2 border-white/20"
            >
              <Navigation className="mr-2 h-5 w-5 fill-current" />
              Iniciar viaje
            </Button>
            {isLocalhost && (
              <Button
                onClick={() => {
                  const dest = pizzerias.find(p => Math.abs(p.lat - activeRoute.lat) < 0.0001 && Math.abs(p.lng - activeRoute.lng) < 0.0001);
                  startTripSimulation(userLocation || 'centro', dest);
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl rounded-full px-4 md:px-5 h-12 text-sm md:text-base font-bold border-2 border-white/20 flex items-center gap-2"
              >
                <Play className="h-4 w-4 fill-current" />
                Simular
              </Button>
            )}
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
              <div className="absolute z-[1002] animate-in slide-in-from-top-4 duration-300 pointer-events-auto nav-instruction-container flex flex-col items-stretch gap-0">
                <div className={cn(
                  "bg-[#00695C] text-white p-4 shadow-lg flex items-center min-h-[80px] border border-white/10 w-full transition-all duration-200",
                  currentInstruction?.next ? "rounded-t-xl rounded-b-none" : "rounded-xl"
                )}>
                  <div className="flex-shrink-0 mr-4 bg-white/10 p-3 rounded-xl">
                    {currentInstruction?.icon || <Navigation className="w-12 h-12 text-white stroke-[3px]" />}
                  </div>

                  <div className="flex flex-col justify-center overflow-hidden flex-grow">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black leading-none tracking-wide text-teal-200">
                        {currentInstruction?.distanceText || '--- m'}
                      </span>
                      <span className="text-sm font-semibold text-teal-100 uppercase tracking-wider opacity-90">
                        {currentInstruction?.action || 'Continúa en'}
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold leading-tight truncate mt-1">
                      {currentInstruction?.street || 'la ruta seleccionada'}
                    </h3>
                  </div>
                </div>

                {/* "Luego" (Then) Next Maneuver sub-bar */}
                {currentInstruction?.next && (
                  <div className="bg-[#004D40] text-white/90 px-4 py-2.5 rounded-b-xl shadow-lg flex items-center gap-2 border-t border-white/10 w-full min-h-[40px] animate-in slide-in-from-top-2 duration-200 nav-next-sub-bar">
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider shrink-0">Luego:</span>
                    <div className="flex-shrink-0 bg-white/15 p-1 rounded-md text-white">
                      {currentInstruction.next.icon}
                    </div>
                    <span className="text-sm font-bold truncate flex-grow text-teal-50">
                      {currentInstruction.next.text}
                    </span>
                  </div>
                )}
              </div>

              {/* DiDi Floating Live Traffic Light HUD (Draggable freely: up, down, sides & Scalable) */}
              {approachingTrafficLight && (
                <div
                  style={{
                    position: 'fixed',
                    left: `${tlHudPos.x}px`,
                    top: `${tlHudPos.y}px`,
                    zIndex: 1003,
                    touchAction: 'none',
                    transform: `scale(${tlHudScale * (isTlHudDragging ? 1.05 : 1)})`,
                    transformOrigin: 'top left'
                  }}
                  onPointerDown={handleTlHudPointerDown}
                  onPointerMove={handleTlHudPointerMove}
                  onPointerUp={handleTlHudPointerUp}
                  onPointerCancel={handleTlHudPointerUp}
                  className={cn(
                    "group select-none cursor-grab active:cursor-grabbing transition-transform duration-75 animate-in fade-in zoom-in-95 pointer-events-auto",
                    isTlHudDragging && "shadow-2xl"
                  )}
                  title="Arrastra para mover el semáforo DiDi libremente • Doble clic para cambiar de tamaño"
                  onDoubleClick={() => resizeTrafficLightHud()}
                >
                  <div className="relative flex items-center bg-[#18202A] text-white rounded-full pl-2 pr-4 py-2 border-[2.5px] border-slate-400/50 shadow-[0_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-md gap-3">
                    {/* DiDi Glowing Lens with Arrow */}
                    <div className={cn(
                      "w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-lg transition-colors duration-300",
                      approachingTrafficLight.phase === 'green' && "bg-[#00B377] shadow-[0_0_16px_rgba(0,179,119,0.85)]",
                      approachingTrafficLight.phase === 'yellow' && "bg-[#F59E0B] shadow-[0_0_16px_rgba(245,158,11,0.85)]",
                      approachingTrafficLight.phase === 'red' && "bg-[#EF4444] shadow-[0_0_16px_rgba(239,68,68,0.85)]"
                    )}>
                      {approachingTrafficLight.phase === 'green' && (
                        <ArrowUp className="w-6 h-6 stroke-[3.5px] text-white" />
                      )}
                      {approachingTrafficLight.phase === 'yellow' && (
                        <ArrowUp className="w-6 h-6 stroke-[3.5px] text-white opacity-95" />
                      )}
                      {approachingTrafficLight.phase === 'red' && (
                        <div className="w-4 h-4 bg-white rounded-sm" />
                      )}
                    </div>

                    {/* DiDi Digital 7-Segment Countdown */}
                    <div className="flex flex-col items-start justify-center">
                      <span className="didi-digital-number text-2xl md:text-3xl font-black text-white leading-none tracking-wider tabular-nums font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {approachingTrafficLight.secondsLeft < 10 ? `0${approachingTrafficLight.secondsLeft}` : approachingTrafficLight.secondsLeft}
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold tracking-tight opacity-90 truncate max-w-[120px] mt-0.5">
                        {approachingTrafficLight.distanceMeters}m • {approachingTrafficLight.streetName}
                      </span>
                    </div>

                    {/* Speech tail pointing towards road */}
                    <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#18202A] filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"></div>
                  </div>
                </div>
              )}

              {/* Navigation Fullscreen Toggle Button */}
              <div className="absolute right-4 top-4 z-[1001] pointer-events-auto">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={onToggleFullscreen}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-2xl bg-black/80 text-white hover:bg-black/90 border border-white/20"
                  title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                  aria-label="Alternar pantalla completa"
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
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
                          isLockedRef.current = true;
                          const h = map.getContainer().clientHeight;
                          map.easeTo({
                            zoom: 19.5,
                            pitch: 60,
                            bearing: currentHeadingRef.current,
                            center: [animatedCoordsRef.current.lng, animatedCoordsRef.current.lat],
                            offset: [0, h * 0.22],
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
              <div className="absolute left-4 z-[1001] w-16 h-16 bg-black/80 rounded-full flex flex-col items-center justify-center border-2 border-white/10 shadow-xl backdrop-blur-sm pointer-events-auto nav-speed-bubble">
                <span className="text-white font-bold text-xl leading-none">{currentSpeed}</span>
                <span className="text-white/70 text-[10px] uppercase font-bold">km/h</span>
              </div>

              {/* Bottom Status Bar with Simulation Controls */}
              <div className="absolute z-[1002] bg-[#111111] p-4 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 text-white pb-6 pointer-events-auto nav-dashboard-container flex flex-col gap-3">
                {/* Simulation Control Toolbar (Only when simulating) */}
                {isSimulating && (
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-2 shadow-inner">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleTogglePauseSimulation}
                          className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1"
                        >
                          {isSimulationPaused ? <Play className="h-3.5 w-3.5 fill-current text-green-400" /> : <Pause className="h-3.5 w-3.5 fill-current text-yellow-400" />}
                          <span>{isSimulationPaused ? 'Reanudar' : 'Pausar'}</span>
                        </Button>

                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg">
                          {[1, 2, 5, 10, 20].map((spd) => (
                            <button
                              key={spd}
                              onClick={() => handleSetSimulationSpeed(spd)}
                              className={cn(
                                "px-2 py-0.5 rounded text-[11px] font-bold transition-colors",
                                simulationSpeed === spd
                                  ? "bg-blue-600 text-white shadow"
                                  : "text-gray-400 hover:text-white"
                              )}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-gray-300">
                        {Math.round(simulationProgress * 100)}%
                      </div>
                    </div>

                    {/* Interactive Progress Slider */}
                    <div className="px-1">
                      <Slider
                        value={[Math.round(simulationProgress * 100)]}
                        max={100}
                        step={1}
                        onValueChange={([val]) => handleSeekSimulation(val / 100)}
                        className="cursor-pointer py-1"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    onClick={exitNavigation}
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-12 w-12 hover:bg-white/10 text-white"
                    title="Salir de navegación"
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

                  <div className="w-12 flex justify-end">
                    {isSimulating && (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-400 bg-emerald-950/40 text-[10px] px-1.5 py-0.5">
                        SIM
                      </Badge>
                    )}
                  </div>
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

        {/* Simulator Setup Dialog (Available only on localhost for development/testing) */}
        {isLocalhost && (
          <Dialog open={isSimulatorModalOpen} onOpenChange={setIsSimulatorModalOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
              <DialogHeader className="pb-2">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <Car className="h-6 w-6 text-blue-600" />
                  Simulador de Viajes a Pizzerías
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                  Prueba la navegación interactiva simulando una ruta desde distintas zonas de Hermosillo.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* 1. Selector de Zona de Origen */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    1. Selecciona Zona de Partida (Origen)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {HERMOSILLO_SIMULATION_ZONES.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setSelectedStartZone(zone.id)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left text-xs transition-all duration-200 flex flex-col justify-between",
                          selectedStartZone === zone.id
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-500 shadow-sm ring-1 ring-blue-600"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                        )}
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">{zone.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{zone.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Selector de Pizzería Destino */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    2. Selecciona Pizzería Destino
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-800/30">
                    {pizzerias.map((p) => {
                      const isSelected = selectedTargetPizzeriaId === p.id || (!selectedTargetPizzeriaId && p === pizzerias[0]);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedTargetPizzeriaId(p.id)}
                          className={cn(
                            "w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between",
                            isSelected
                              ? "bg-blue-600 text-white font-bold shadow-sm"
                              : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                          )}
                        >
                          <div className="truncate mr-2">
                            <span className="block font-semibold truncate">{p.name}</span>
                            <span className={cn("text-[10px] truncate block", isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
                              {p.address}
                            </span>
                          </div>
                          {p.rating && (
                            <span className="shrink-0 flex items-center gap-0.5 text-[11px]">
                              ⭐ {p.rating.toFixed(1)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Selector de Velocidad Inicial */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    3. Velocidad de Simulación
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { val: 1, label: '1x (Real)' },
                      { val: 2, label: '2x (Rápido)' },
                      { val: 5, label: '5x' },
                      { val: 10, label: '10x' },
                      { val: 20, label: '20x' },
                    ].map((s) => (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => setSimulationSpeed(s.val)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold text-center border transition-all",
                          simulationSpeed === s.val
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botón de Inicio */}
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSimulatorModalOpen(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const target = pizzerias.find(p => p.id === selectedTargetPizzeriaId) || pizzerias[0];
                      startTripSimulation(selectedStartZone, target);
                    }}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Iniciar Simulación
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Arrival Celebration Modal */}
        <Dialog open={simulationArrivalData !== null} onOpenChange={(open) => { if (!open) setSimulationArrivalData(null); }}>
          <DialogContent className="max-w-sm p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner">
              🍕
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
              ¡Has llegado a tu destino!
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
              {simulationArrivalData?.pizzeriaName}
            </DialogDescription>

            <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-around text-xs">
              <div>
                <span className="block text-slate-400 font-medium">Distancia</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{simulationArrivalData?.totalDistanceKm} km</span>
              </div>
              <div className="w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="block text-slate-400 font-medium">Tiempo Est.</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {Math.round((simulationArrivalData?.elapsedSeconds || 60) / 60)} min
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                onClick={() => {
                  const p = pizzerias.find(piz => piz.name === simulationArrivalData?.pizzeriaName);
                  setSimulationArrivalData(null);
                  exitNavigation();
                  if (p && onViewMenu) onViewMenu(p);
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow"
              >
                Ver Menú de la Pizzería
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSimulationArrivalData(null);
                    startTripSimulation(selectedStartZone);
                  }}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reiniciar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSimulationArrivalData(null);
                    exitNavigation();
                    setIsSimulatorModalOpen(true);
                  }}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  Otra Zona
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
          right: var(--buttons-right-mobile, 16px) !important;
        }
        @media (min-width: 768px) {
          .map-controls-container {
            top: var(--buttons-top-desktop, 160px);
            right: var(--buttons-right-desktop, 16px) !important;
          }
        }

        .map-view-all-container {
          top: var(--view-all-top-mobile, 260px) !important;
          right: var(--view-all-right-mobile, 16px) !important;
        }
        @media (min-width: 768px) {
          .map-view-all-container {
            top: var(--view-all-top-desktop, 260px) !important;
            right: var(--view-all-right-desktop, 16px) !important;
          }
        }

        .map-settings-btn-container {
          top: var(--map-settings-top-mobile, 400px) !important;
          right: var(--map-settings-right-mobile, 16px) !important;
        }
        @media (min-width: 768px) {
          .map-settings-btn-container {
            top: var(--map-settings-top-desktop, 400px) !important;
            right: var(--map-settings-right-desktop, 16px) !important;
          }
        }

        .map-locate-btn-container {
          top: var(--locate-btn-top-mobile, 160px) !important;
          right: var(--locate-btn-right-mobile, 16px) !important;
          transform: scale(var(--locate-btn-scale-mobile, 1.0)) !important;
          transform-origin: top right !important;
        }
        @media (min-width: 768px) {
          .map-locate-btn-container {
            top: var(--locate-btn-top-desktop, 160px) !important;
            right: var(--locate-btn-right-desktop, 16px) !important;
            transform: scale(var(--locate-btn-scale-desktop, 1.0)) !important;
            transform-origin: top right !important;
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
        /* Navigation UI custom styling */
        .nav-instruction-container {
          left: 1rem;
          max-width: 440px;
          width: min(calc(100% - 2rem), calc((var(--nav-instruction-width-mobile, 100%) - 2rem) / var(--nav-instruction-scale-mobile, 1)));
          top: var(--nav-instruction-top-mobile, 16px);
          transform: translateX(var(--nav-instruction-left-mobile, 0px)) scale(var(--nav-instruction-scale-mobile, 1));
          transform-origin: top left;
        }
        @media (min-width: 768px) {
          .nav-instruction-container {
            left: 1rem;
            max-width: 440px;
            width: min(calc(100% - 2rem), calc((var(--nav-instruction-width-desktop, 100%) - 2rem) / var(--nav-instruction-scale-desktop, 1)));
            top: var(--nav-instruction-top-desktop, 16px);
            transform: translateX(var(--nav-instruction-left-desktop, 0px)) scale(var(--nav-instruction-scale-desktop, 1));
            transform-origin: top left;
          }
        }

        .nav-dashboard-container {
          left: 50%;
          width: calc(var(--nav-dashboard-width-mobile, 100%) / var(--nav-dashboard-scale-mobile, 1));
          bottom: var(--nav-dashboard-bottom-mobile, 0px);
          transform: translateX(calc(-50% + var(--nav-dashboard-left-mobile, 0px))) scale(var(--nav-dashboard-scale-mobile, 1));
          transform-origin: bottom center;
        }
        @media (min-width: 768px) {
          .nav-dashboard-container {
            width: calc(var(--nav-dashboard-width-desktop, 100%) / var(--nav-dashboard-scale-desktop, 1));
            bottom: var(--nav-dashboard-bottom-desktop, 0px);
            transform: translateX(calc(-50% + var(--nav-dashboard-left-desktop, 0px))) scale(var(--nav-dashboard-scale-desktop, 1));
          }
        }


        .nav-speed-bubble {
          bottom: var(--nav-speed-bottom-mobile, 112px);
          transform: translateX(var(--nav-speed-left-mobile, 0px)) scale(var(--nav-speed-scale-mobile, 1));
          transform-origin: bottom center;
        }
        @media (min-width: 768px) {
          .nav-speed-bubble {
            bottom: var(--nav-speed-bottom-desktop, 112px);
            transform: translateX(var(--nav-speed-left-desktop, 0px)) scale(var(--nav-speed-scale-desktop, 1));
          }
        }

        .user-marker-inner {
          transform-origin: center;
          transform: scale(var(--user-marker-scale-mobile, 1.0));
        }
        @media (min-width: 768px) {
          .user-marker-inner {
            transform: scale(var(--user-marker-scale-desktop, 1.0));
          }
        }

        /* Custom Font Sizes */
        .nav-instruction-container h3 {
          font-size: var(--nav-instruction-font-size-mobile, 18px) !important;
        }
        .nav-instruction-container span.text-2xl {
          font-size: calc(var(--nav-instruction-font-size-mobile, 18px) * 1.2) !important;
        }
        @media (min-width: 768px) {
          .nav-instruction-container h3 {
            font-size: var(--nav-instruction-font-size-desktop, 24px) !important;
          }
          .nav-instruction-container span.text-2xl {
            font-size: calc(var(--nav-instruction-font-size-desktop, 24px) * 1.2) !important;
          }
        }

        .nav-dashboard-container .text-3xl {
          font-size: var(--nav-dashboard-font-size-mobile, 22px) !important;
        }
        .nav-dashboard-container .text-xl {
          font-size: calc(var(--nav-dashboard-font-size-mobile, 22px) * 0.75) !important;
        }
        .nav-dashboard-container .text-sm {
          font-size: calc(var(--nav-dashboard-font-size-mobile, 22px) * 0.6) !important;
        }
        @media (min-width: 768px) {
          .nav-dashboard-container .text-3xl {
            font-size: var(--nav-dashboard-font-size-desktop, 30px) !important;
          }
          .nav-dashboard-container .text-xl {
            font-size: calc(var(--nav-dashboard-font-size-desktop, 30px) * 0.75) !important;
          }
          .nav-dashboard-container .text-sm {
            font-size: calc(var(--nav-dashboard-font-size-desktop, 30px) * 0.6) !important;
          }
        }

        .nav-next-sub-bar {
          transform: translate(var(--nav-next-left-mobile, 0px), var(--nav-next-top-mobile, 0px)) scale(var(--nav-next-scale-mobile, 1));
          transform-origin: top center;
          width: var(--nav-next-width-mobile, 100%) !important;
          margin-left: auto;
          margin-right: auto;
        }
        .nav-next-sub-bar span, .nav-next-sub-bar div {
          font-size: var(--nav-next-font-size-mobile, 14px) !important;
        }
        @media (min-width: 768px) {
          .nav-next-sub-bar {
            transform: translate(var(--nav-next-left-desktop, 0px), var(--nav-next-top-desktop, 0px)) scale(var(--nav-next-scale-desktop, 1));
            width: var(--nav-next-width-desktop, 100%) !important;
          }
          .nav-next-sub-bar span, .nav-next-sub-bar div {
            font-size: var(--nav-next-font-size-desktop, 14px) !important;
          }
        }

        .start-trip-container {
          bottom: var(--start-trip-bottom-mobile, 40px);
          transform: translateX(calc(-50% + var(--start-trip-left-mobile, 0px))) scale(var(--start-trip-scale-mobile, 1.0));
          transform-origin: bottom center;
        }
        @media (min-width: 768px) {
          .start-trip-container {
            bottom: var(--start-trip-bottom-desktop, 40px);
            transform: translateX(calc(-50% + var(--start-trip-left-desktop, 0px))) scale(var(--start-trip-scale-desktop, 1.0));
          }
        }

        /* DiDi Traffic Light Font & Styles */
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

        .didi-digital-number {
          font-family: 'Orbitron', monospace, ui-monospace, sans-serif !important;
          font-variant-numeric: tabular-nums;
          letter-spacing: 1px;
        }

        .didi-marker-capsule {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .didi-marker-capsule:hover {
          transform: scale(1.1);
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default memo(PizzaMap);
