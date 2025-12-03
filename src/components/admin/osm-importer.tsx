'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, DownloadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Pizzeria } from '@/lib/types';
import getDistance from 'geolib/es/getDistance';
import { addPizzeria } from '@/app/actions';

export default function OsmImporter({ existingPizzerias }: { existingPizzerias: Pizzeria[] }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchOsmData = async () => {
        setIsLoading(true);
        try {
            // Hermosillo BBox: 28.9,-111.1,29.2,-110.8
            const query = `
                [out:json];
                (
                  node["cuisine"="pizza"](28.9,-111.1,29.2,-110.8);
                  way["cuisine"="pizza"](28.9,-111.1,29.2,-110.8);
                );
                out center;
            `;
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (!data.elements) throw new Error('No data received from OSM');

            let newCount = 0;
            const batchPromises = [];

            for (const element of data.elements) {
                const lat = element.lat || element.center?.lat;
                const lng = element.lon || element.center?.lon;
                const name = element.tags?.name;

                if (!lat || !lng || !name) continue;

                // Check for duplicates
                const isDuplicate = existingPizzerias.some(p => {
                    // Check distance (< 50m)
                    const distance = getDistance(
                        { latitude: p.lat, longitude: p.lng },
                        { latitude: lat, longitude: lng }
                    );
                    // Consider duplicate if very close OR same name
                    return distance < 50 || p.name.toLowerCase() === name.toLowerCase();
                });

                if (!isDuplicate) {
                    const address = element.tags['addr:street']
                        ? `${element.tags['addr:street']} ${element.tags['addr:housenumber'] || ''}, Hermosillo`
                        : 'Dirección no disponible';

                    const newPizzeria = {
                        name: name,
                        address: address,
                        lat: lat,
                        lng: lng,
                        category: 'Pizza',
                        source: 'OpenStreetMap',
                    };

                    batchPromises.push(addPizzeria(newPizzeria));
                    newCount++;
                }
            }

            await Promise.all(batchPromises);

            toast({
                title: 'Importación completada',
                description: `Se han importado ${newCount} nuevas pizzerías desde OpenStreetMap.`,
            });

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Hubo un error al importar los datos.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button onClick={fetchOsmData} disabled={isLoading} variant="outline">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
            Importar de OSM
        </Button>
    );
}
