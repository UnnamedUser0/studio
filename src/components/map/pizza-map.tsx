'use client';

import { useState, useEffect } from 'react';
import { ReactBingmaps } from 'react-bingmaps';
import type { Pizzeria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Map, Globe } from 'lucide-react';

type PizzaMapProps = {
  pizzerias: Pizzeria[];
  onMarkerClick: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
};

const HERMOSILLO_CENTER = [29.085, -110.977];

// Directly use the environment variable as it's loaded by Next.js
const bingMapsKey = process.env.NEXT_PUBLIC_BING_MAPS_API_KEY;

export default function PizzaMap({ pizzerias, onMarkerClick, selectedPizzeria }: PizzaMapProps) {
  const [mapType, setMapType] = useState<'road' | 'aerial'>('road');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="h-full w-full bg-muted animate-pulse" />;
  }
  
  if (!bingMapsKey || bingMapsKey === 'YOUR_API_KEY_HERE') {
    return (
      <div className="h-full w-full bg-muted flex flex-col items-center justify-center text-center p-4">
        <h3 className="font-headline text-xl text-foreground mb-2">Configuración del Mapa Requerida</h3>
        <p className="text-muted-foreground">
          Para mostrar el mapa de Bing, por favor, añade tu clave de API en el archivo `.env` como `NEXT_PUBLIC_BING_MAPS_API_KEY`.
        </p>
      </div>
    );
  }

  const pushPins = pizzerias.map(pizzeria => ({
    location: [pizzeria.lat, pizzeria.lng],
    option: { 
      color: selectedPizzeria?.id === pizzeria.id ? 'red' : 'orange'
    },
    addHandler: {
      type: 'click',
      callback: () => onMarkerClick(pizzeria),
    },
  }));
  
  let center = HERMOSILLO_CENTER;
  let zoom = 12;
  let boundary = undefined;

  if (selectedPizzeria) {
    center = [selectedPizzeria.lat, selectedPizzeria.lng];
    zoom = 15;
  } else if (pizzerias.length > 0) {
     const locations = pizzerias.map(p => ({ latitude: p.lat, longitude: p.lng }));
     boundary = {
        location: locations,
        option: {
            padding: 100
        }
     }
  }


  return (
    <div className="h-full w-full relative">
      <ReactBingmaps
        bingmapKey={bingMapsKey}
        pushPins={pushPins}
        center={center}
        zoom={zoom}
        mapTypeId={mapType}
        boundary={boundary}
        mapOptions={{
            showLocateMeButton: false,
            showMapTypeSelector: false,
            showZoomButtons: true,
        }}
      />
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button 
          size="icon" 
          onClick={() => setMapType('road')} 
          variant={mapType === 'road' ? 'default' : 'secondary'}
          className="shadow-lg"
        >
          <Map className="h-5 w-5" />
          <span className="sr-only">Vista de Carreteras</span>
        </Button>
        <Button 
          size="icon" 
          onClick={() => setMapType('aerial')}
          variant={mapType === 'aerial' ? 'default' : 'secondary'}
          className="shadow-lg"
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">Vista Aérea</span>
        </Button>
      </div>
    </div>
  );
}
