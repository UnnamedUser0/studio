'use client';
import { useEffect, useRef } from 'react';
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

export default function PizzaMap({ pizzerias, onMarkerClick, selectedPizzeria }: PizzaMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && selectedPizzeria) {
      mapRef.current.flyTo([selectedPizzeria.lat, selectedPizzeria.lng], 16, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [selectedPizzeria]);

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
    <MapContainer
      center={HERMOSILLO_CENTER}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      whenCreated={(mapInstance) => {
        mapRef.current = mapInstance;
      }}
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
    </MapContainer>
  );
}