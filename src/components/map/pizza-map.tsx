'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import * as L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import type { Pizzeria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';

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
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/3178/3178610.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
});

type PizzaMapProps = {
  pizzerias: Pizzeria[];
  onMarkerClick: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
  searchCenter: { lat: number; lng: number } | null;
};

export default function PizzaMap({ pizzerias, onMarkerClick, selectedPizzeria, searchCenter }: PizzaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const myLocationMarkerRef = useRef<L.Marker | null>(null);


  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true });

    map.once('locationfound', (e: L.LocationEvent) => {
        if (myLocationMarkerRef.current) {
            myLocationMarkerRef.current.setLatLng(e.latlng);
        } else {
            myLocationMarkerRef.current = L.marker(e.latlng, { icon: myLocationIcon }).addTo(map);
        }
        map.flyTo(e.latlng, 15);
    });

    map.once('locationerror', (e: L.ErrorEvent) => {
        alert(e.message);
    });
  };


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

      L.control.layers(baseMaps).addTo(map);
    }
    
    // Cleanup function to remove the map instance
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  // Effect for updating markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    pizzerias.forEach(pizzeria => {
      const isSelected = selectedPizzeria?.id === pizzeria.id;
      const marker = L.marker([pizzeria.lat, pizzeria.lng], {
        icon: isSelected ? selectedIcon : defaultIcon,
      })
        .addTo(map)
        .on('click', () => onMarkerClick(pizzeria));
      
      if (isSelected) {
        marker.setZIndexOffset(1000);
      }

      markersRef.current.push(marker);
    });
  }, [pizzerias, selectedPizzeria, onMarkerClick]);

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
       map.flyTo(HERMOSILLO_CENTER, 12, {
        animate: true,
        duration: 1.5
       });
    }
  }, [selectedPizzeria, searchCenter]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
      <div className="absolute top-24 right-4 z-[1000]">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={handleLocateMe} 
          className="shadow-lg rounded-full h-10 w-10"
          aria-label="Find my location"
        >
          <LocateFixed className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
