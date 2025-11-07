'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import type { Pizzeria } from '@/lib/types';

const HERMOSILLO_CENTER: L.LatLngTuple = [29.085, -110.977];

type PizzaMapProps = {
  pizzerias: Pizzeria[];
  onMarkerClick: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
};

// This component is used to programmatically change the map view
function ChangeView({ center, zoom }: { center: L.LatLngTuple, zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, {
            animate: true,
            duration: 1.5
        });
    }, [center, zoom, map]);
    return null;
}

export default function PizzaMap({ pizzerias, onMarkerClick, selectedPizzeria }: PizzaMapProps) {
  let mapCenter = HERMOSILLO_CENTER;
  let mapZoom = 12;

  if (selectedPizzeria) {
    mapCenter = [selectedPizzeria.lat, selectedPizzeria.lng];
    mapZoom = 16;
  }

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

  return (
    <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {selectedPizzeria && (
        <ChangeView center={[selectedPizzeria.lat, selectedPizzeria.lng]} zoom={16} />
      )}
      
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
    </MapContainer>
  );
}
