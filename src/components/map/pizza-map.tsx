'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import type { Pizzeria } from '@/lib/pizzeria-data';
import { divIcon } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { PizzaSliceIcon } from '@/components/icons/pizza-slice-icon';
import { useEffect } from 'react';

type PizzaMapProps = {
  pizzerias: Pizzeria[];
  onMarkerClick: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
};

const HERMOSILLO_COORDS: [number, number] = [29.085, -110.977];

// Component to handle map view changes
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
      pan: {
        duration: 0.5,
      },
    });
  }, [center, zoom, map]);
  return null;
}

export default function PizzaMap({ pizzerias, onMarkerClick, selectedPizzeria }: PizzaMapProps) {
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
    return divIcon({
      html: iconMarkup,
      className: 'bg-transparent border-none',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };
  
  const center: [number, number] = selectedPizzeria
    ? [selectedPizzeria.lat, selectedPizzeria.lng]
    : (pizzerias.length === 1 ? [pizzerias[0].lat, pizzerias[0].lng] : HERMOSILLO_COORDS);
  
  const zoom = selectedPizzeria ? 15 : (pizzerias.length > 0 ? 13 : 12);

  // By providing a key that changes only when we want a full re-render,
  // we can avoid the "Map container is already initialized" error.
  // A simple key from selectedPizzeria's id or the number of pizzerias will work.
  const mapKey = selectedPizzeria?.id || pizzerias.length;

  return (
    <MapContainer key={mapKey} center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full" style={{ zIndex: 0 }}>
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pizzerias.map((pizzeria) => (
        <Marker
          key={pizzeria.id}
          position={[pizzeria.lat, pizzeria.lng]}
          eventHandlers={{
            click: () => {
              onMarkerClick(pizzeria);
            },
          }}
          icon={customIcon(selectedPizzeria?.id === pizzeria.id)}
        />
      ))}
    </MapContainer>
  );
}
