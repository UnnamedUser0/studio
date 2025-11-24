'use client';

import { useEffect, useRef, useState } from 'react';
import { Pizzeria } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type HereMapProps = {
    pizzerias: Pizzeria[];
    onMarkerClick: (pizzeria: Pizzeria) => void;
    selectedPizzeria: Pizzeria | null;
    searchCenter: { lat: number; lng: number } | null;
    onLocateUser: (coords: { lat: number, lng: number }) => void;
};

declare global {
    interface Window {
        H: any;
    }
}

export default function HereMap({ pizzerias, onMarkerClick, selectedPizzeria, searchCenter, onLocateUser }: HereMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const uiInstance = useRef<any>(null);
    const markersGroup = useRef<any>(null);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const { toast } = useToast();

    // Load HERE Maps scripts
    useEffect(() => {
        const loadScript = (src: string) => {
            return new Promise<void>((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.body.appendChild(script);
            });
        };

        const loadStyles = (href: string) => {
            if (document.querySelector(`link[href="${href}"]`)) return;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }

        const initScripts = async () => {
            try {
                loadStyles('https://js.api.here.com/v3/3.1/mapsjs-ui.css');
                await loadScript('https://js.api.here.com/v3/3.1/mapsjs-core.js');
                await loadScript('https://js.api.here.com/v3/3.1/mapsjs-service.js');
                await loadScript('https://js.api.here.com/v3/3.1/mapsjs-ui.js');
                await loadScript('https://js.api.here.com/v3/3.1/mapsjs-mapevents.js');
                setScriptsLoaded(true);
            } catch (error) {
                console.error('Error loading HERE Maps scripts:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudieron cargar los mapas de HERE.',
                });
            }
        };

        initScripts();
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!scriptsLoaded || !mapRef.current || mapInstance.current) return;

        const H = window.H;
        if (!H) return;

        // Check for API Key
        const apiKey = process.env.NEXT_PUBLIC_HERE_API_KEY || 'NO_API_KEY_FOUND';
        // Note: If no key is found, the map might show a watermark or fail. 
        // Ideally we should prompt the user, but for now we assume it's in env or we use a placeholder.
        // If the user hasn't set it, they will see an error on the map or it won't load tiles.

        const platform = new H.service.Platform({
            apikey: apiKey
        });

        const defaultLayers = platform.createDefaultLayers();

        // Initialize map
        const map = new H.Map(
            mapRef.current,
            defaultLayers.vector.normal.map,
            {
                center: { lat: 29.085, lng: -110.977 }, // Hermosillo
                zoom: 13,
                pixelRatio: window.devicePixelRatio || 1
            }
        );

        // Enable 3D interactions
        const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

        // Create UI components
        const ui = H.ui.UI.createDefault(map, defaultLayers);
        uiInstance.current = ui;

        // Resize listener
        window.addEventListener('resize', () => map.getViewPort().resize());

        mapInstance.current = map;
        markersGroup.current = new H.map.Group();
        map.addObject(markersGroup.current);

        // Set 3D tilt
        map.getViewModel().setLookAtData({
            tilt: 45,
            heading: 0
        });

        return () => {
            map.dispose();
            window.removeEventListener('resize', () => map.getViewPort().resize());
        };
    }, [scriptsLoaded]);

    // Update Markers
    useEffect(() => {
        if (!mapInstance.current || !pizzerias || !window.H) return;
        const H = window.H;
        const group = markersGroup.current;

        group.removeAll();

        pizzerias.forEach(pizzeria => {
            if (!pizzeria.lat || !pizzeria.lng) return;

            const isSelected = selectedPizzeria?.id === pizzeria.id;

            // Custom marker icon logic could go here, using standard markers for now
            // Or creating a DOM icon

            const icon = new H.map.Icon(
                isSelected
                    ? 'https://cdn-icons-png.flaticon.com/128/1046/1046751.png'
                    : 'https://cdn-icons-png.flaticon.com/128/3595/3595458.png',
                { size: isSelected ? { w: 45, h: 45 } : { w: 35, h: 35 } }
            );

            const marker = new H.map.Marker(
                { lat: pizzeria.lat, lng: pizzeria.lng },
                { icon: icon }
            );

            marker.setData(pizzeria);
            marker.addEventListener('tap', () => {
                onMarkerClick(pizzeria);
            });

            group.addObject(marker);
        });

    }, [pizzerias, selectedPizzeria, scriptsLoaded]);

    // Handle View Changes
    useEffect(() => {
        if (!mapInstance.current || !window.H) return;
        const map = mapInstance.current;

        if (selectedPizzeria) {
            map.getViewModel().setLookAtData({
                position: { lat: selectedPizzeria.lat, lng: selectedPizzeria.lng },
                zoom: 16,
                tilt: 45
            }, true);
        } else if (searchCenter) {
            map.getViewModel().setLookAtData({
                position: { lat: searchCenter.lat, lng: searchCenter.lng },
                zoom: 15,
                tilt: 45
            }, true);
        }
    }, [selectedPizzeria, searchCenter, scriptsLoaded]);

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Geolocalización no soportada por tu navegador.',
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onLocateUser({ lat: latitude, lng: longitude });

                if (mapInstance.current) {
                    mapInstance.current.getViewModel().setLookAtData({
                        position: { lat: latitude, lng: longitude },
                        zoom: 16,
                        tilt: 45
                    }, true);

                    // Add user marker
                    const H = window.H;
                    const userIcon = new H.map.Icon('https://cdn-icons-png.flaticon.com/128/3178/3178610.png', { size: { w: 25, h: 25 } });
                    const userMarker = new H.map.Marker({ lat: latitude, lng: longitude }, { icon: userIcon });
                    mapInstance.current.addObject(userMarker);
                }
            },
            (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Error de ubicación',
                    description: error.message,
                });
            }
        );
    }

    return (
        <div className="relative h-full w-full z-0">
            <div ref={mapRef} style={{ height: '100%', width: '100%', background: '#e5e3df' }} />
            <div className="absolute top-4 right-4 z-[1001]">
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
            {!process.env.NEXT_PUBLIC_HERE_API_KEY && (
                <div className="absolute bottom-4 left-4 right-4 bg-yellow-100 text-yellow-800 p-2 rounded text-xs text-center z-[1001] opacity-80 hover:opacity-100 transition-opacity">
                    Advertencia: NEXT_PUBLIC_HERE_API_KEY no configurada. El mapa podría no cargar correctamente.
                </div>
            )}
        </div>
    );
}
