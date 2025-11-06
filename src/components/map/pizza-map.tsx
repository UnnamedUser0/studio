'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

import L from 'leaflet';
import type { Pizzeria } from '@/lib/pizzeria-data';
import { renderToStaticMarkup } from 'react-dom/server';
import { PizzaSliceIcon } from '@/components/icons/pizza-slice-icon';

type PizzaMapProps = {
  pizzerias: Pizzeria[];
  onMarkerClick: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
  visiblePizzeriasOnSearch: Pizzeria[];
};

const HERMOSILLO_COORDS: L.LatLngTuple = [29.085, -110.977];

export default function PizzaMap({ pizzerias, onMarkerClick, selectedPizzeria, visiblePizzeriasOnSearch }: PizzaMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const customIcon = (isSelected: boolean) => {
    const iconMarkup = renderToStaticMarkup(
      <PizzaSliceIcon className={`
        h-8 w-8 transition-all duration-300 transform
        ${isSelected 
          ? 'text-white fill-primary stroke-background' 
          : 'text-primary-foreground fill-accent stroke-primary'
        }
      `}/>
    );
    return L.divIcon({
      html: iconMarkup,
      className: 'bg-transparent border-none',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(HERMOSILLO_COORDS, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers and view
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers from pizzerias prop
    pizzerias.forEach((pizzeria) => {
      const isSelected = selectedPizzeria?.id === pizzeria.id;
      const marker = L.marker([pizzeria.lat, pizzeria.lng], {
        icon: customIcon(isSelected),
      })
      .addTo(map)
      .on('click', () => onMarkerClick(pizzeria));
      
      markersRef.current.push(marker);
    });

    // Update map view logic
    if (selectedPizzeria) {
        map.setView([selectedPizzeria.lat, selectedPizzeria.lng], 15, { animate: true, pan: { duration: 0.5 } });
    } else if (visiblePizzeriasOnSearch.length > 0) {
        const bounds = L.latLngBounds(visiblePizzeriasOnSearch.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else {
        map.setView(HERMOSILLO_COORDS, 12, { animate: true, pan: { duration: 0.5 } });
    }

  }, [pizzerias, selectedPizzeria, onMarkerClick, visiblePizzeriasOnSearch]);

  return <div ref={mapContainerRef} className="h-full w-full" style={{ zIndex: 0 }} />;
}
