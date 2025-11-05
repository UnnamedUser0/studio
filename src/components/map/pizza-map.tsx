'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { pizzerias } from '@/lib/pizzeria-data';
import type { Pizzeria } from '@/lib/pizzeria-data';
import { PizzaSliceIcon } from '@/components/icons/pizza-slice-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

type PizzaMapProps = {
  onMarkerClick: (pizzeria: Pizzeria) => void;
  selectedPizzeria: Pizzeria | null;
};

const HERMOSILLO_COORDS = { lat: 29.085, lng: -110.977 };

export default function PizzaMap({ onMarkerClick, selectedPizzeria }: PizzaMapProps) {
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  }, []);

  if (apiKey === undefined) {
    return <Skeleton className="h-full w-full" />;
  }

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/50 text-center p-4">
        <h3 className='font-headline text-xl text-foreground mb-2'>Error de Configuración del Mapa</h3>
        <p className="text-muted-foreground max-w-md">
          La clave de API de Google Maps no está configurada. Para mostrar el mapa, por favor, añade tu clave al archivo <code className='font-code p-1 bg-primary/10 rounded-sm text-primary'>.env.local</code> como <code className='font-code p-1 bg-primary/10 rounded-sm text-primary'>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        center={selectedPizzeria ? { lat: selectedPizzeria.lat, lng: selectedPizzeria.lng } : HERMOSILLO_COORDS}
        zoom={selectedPizzeria ? 15 : 13}
        mapId="pizzapp_map_main"
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        className="transition-all duration-500"
        tilt={45}
        mapTypeId='roadmap'
      >
        {pizzerias.map((pizzeria) => (
          <AdvancedMarker
            key={pizzeria.id}
            position={{ lat: pizzeria.lat, lng: pizzeria.lng }}
            onClick={() => onMarkerClick(pizzeria)}
          >
            <PizzaSliceIcon className={`
              h-8 w-8 transition-all duration-300 transform hover:scale-125
              ${selectedPizzeria?.id === pizzeria.id 
                ? 'text-white fill-primary stroke-background' 
                : 'text-primary-foreground fill-accent stroke-primary'
              }
            `}/>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
