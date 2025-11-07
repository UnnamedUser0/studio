'use client';
import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import type { Pizzeria } from '@/lib/types';

const HERMOSILLO_CENTER: L.LatLngTuple = [29.085, -110.977];

type PizzaMapProps = {
  pizzerias: Pizzeria[];
  onMarkerClick: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
};

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

// This component will handle map view changes
function ChangeView({ center, zoom }: { center: L.LatLngTuple; zoom: number }) {
  const map = useMap();
  map.flyTo(center, zoom, {
      animate: true,
      duration: 1.5
  });
  return null;
}


export default function PizzaMap({ pizzerias, onMarkerClick, selectedPizzeria }: PizzaMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const center = selectedPizzeria
    ? [selectedPizzeria.lat, selectedPizzeria.lng] as L.LatLngTuple
    : HERMOSILLO_CENTER;
  
  const zoom = selectedPizzeria ? 16 : 12;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {pizzerias.map(pizzeria => (
        <Marker
          key={pizzeria.id}
          position={[pizzeria.lat, pizzeria.lng]}
          eventHandlers={{
            click: () => {
              onMarkerClick(pizzeria);
            },
          }}
          icon={selectedPizzeria?.id === pizzeria.id ? selectedIcon : defaultIcon}
        >
        </Marker>
      ))}

      <ChangeView center={center} zoom={zoom} />

    </MapContainer>
  );
}
