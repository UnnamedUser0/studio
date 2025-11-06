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
};

const HERMOSILLO_COORDS: [number, number] = [29.085, -110.977];

export default function PizzaMap({ pizzerias, onMarkerClick, selectedPizzeria }: PizzaMapProps) {
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

  // Update view and markers when pizzerias or selection change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    pizzerias.forEach((pizzeria) => {
      const isSelected = selectedPizzeria?.id === pizzeria.id;
      const marker = L.marker([pizzeria.lat, pizzeria.lng], {
        icon: customIcon(isSelected),
      })
      .addTo(map)
      .on('click', () => onMarkerClick(pizzeria));
      
      markersRef.current.push(marker);
    });

    // Update view
    const center: [number, number] = selectedPizzeria
      ? [selectedPizzeria.lat, selectedPizzeria.lng]
      : (pizzerias.length === 1 ? [pizzerias[0].lat, pizzerias[0].lng] : HERMOSILLO_COORDS);
    
    const zoom = selectedPizzeria ? 15 : (pizzerias.length > 0 ? 13 : 12);
    
    map.setView(center, zoom, { animate: true, pan: { duration: 0.5 } });

  }, [pizzerias, selectedPizzeria, onMarkerClick]);

  return <div ref={mapContainerRef} className="h-full w-full" style={{ zIndex: 0 }} />;
}
