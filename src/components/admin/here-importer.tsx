'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { addPizzeria } from '@/app/actions';
import { Loader2, DownloadCloud, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Pizzeria } from '@/lib/types';
import getDistance from 'geolib/es/getDistance';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

export default function HereImporter({ existingPizzerias }: { existingPizzerias: Pizzeria[] }) {
    const [isLoading, setIsLoading] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const fetchHereData = async () => {
        if (!apiKey) {
            toast({
                variant: 'destructive',
                title: 'Falta API Key',
                description: 'Por favor ingresa tu API Key de HERE WeGo.',
            });
            return;
        }

        setIsLoading(true);
        try {
            // Hermosillo coordinates
            const at = '29.072967,-110.955919';
            const q = 'pizza';
            const url = `https://discover.search.hereapi.com/v1/discover?at=${at}&q=${q}&limit=100&apiKey=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!data.items) throw new Error('No data received from HERE API');

            let newCount = 0;
            const batchPromises = [];

            for (const item of data.items) {
                const lat = item.position.lat;
                const lng = item.position.lng;
                const name = item.title;

                if (!lat || !lng || !name) continue;

                // Check for duplicates
                const isDuplicate = existingPizzerias.some(p => {
                    const distance = getDistance(
                        { latitude: p.lat, longitude: p.lng },
                        { latitude: lat, longitude: lng }
                    );
                    return distance < 50 || p.name.toLowerCase() === name.toLowerCase();
                });

                if (!isDuplicate) {
                    const address = item.address.label || 'Dirección no disponible';

                    const newPizzeria = {
                        name: name,
                        address: address,
                        lat: lat,
                        lng: lng,
                        category: 'Pizza',
                        source: 'HERE WeGo',
                        // rating is not needed for addPizzeria, it defaults or is handled
                    };

                    batchPromises.push(addPizzeria(newPizzeria));
                    newCount++;
                }
            }

            await Promise.all(batchPromises);

            toast({
                title: 'Importación completada',
                description: `Se han importado ${newCount} nuevas pizzerías desde HERE WeGo.`,
            });
            setIsOpen(false);

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Hubo un error al importar los datos. Verifica tu API Key.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Importar de HERE
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Importar desde HERE WeGo</DialogTitle>
                    <DialogDescription>
                        Ingresa tu API Key de HERE Maps para buscar e importar pizzerías.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">HERE API Key</Label>
                        <div className="relative">
                            <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="apiKey"
                                placeholder="Ingresa tu API Key"
                                className="pl-8"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                type="password"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Necesitas una cuenta de desarrollador en developer.here.com
                        </p>
                    </div>
                    <Button onClick={fetchHereData} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Comenzar Importación'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
