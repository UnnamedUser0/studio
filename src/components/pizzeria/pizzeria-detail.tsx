'use client';

import Image from 'next/image';
import { Loader2, Pizza, Phone, Globe, Share2 } from 'lucide-react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import type { Pizzeria } from '@/lib/types';
import { useState, useEffect } from 'react';
import { getMenuItems } from '@/app/actions/menu';

type PizzeriaDetailProps = {
    pizzeria: Pizzeria;
};

type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    category: string | null;
    legend: string | null;
    pizzeriaId: string;
};

export default function PizzeriaDetail({ pizzeria }: PizzeriaDetailProps) {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const menuItems = await getMenuItems(pizzeria.id);
                setItems(menuItems);
            } catch (error) {
                console.error("Error fetching menu:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [pizzeria.id]);

    const imageUrl = pizzeria.imageUrl || 'https://picsum.photos/seed/default/400/400';
    const imageHint = pizzeria.imageHint || 'pizza';

    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        const category = item.category || 'General';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    const categories = Object.keys(groupedItems).sort();

    return (
        <>
            <SheetHeader className="p-0 border-b relative">
                <div className="relative h-56 w-full">
                    <Image
                        src={imageUrl}
                        alt={pizzeria.name}
                        data-ai-hint={imageHint}
                        fill
                        sizes="(max-width: 640px) 90vw, 440px"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
                    <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-background to-transparent pt-12">
                        <SheetTitle className="font-headline text-3xl mb-1">{pizzeria.name}</SheetTitle>
                        <p className="text-muted-foreground flex items-center gap-1 text-sm">
                            <span className="truncate">{pizzeria.address}</span>
                        </p>
                    </div>
                </div>
            </SheetHeader>

            <div className="px-6 py-4 space-y-4 bg-card/50">
                {/* Coordinates & Technical Info */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-muted-foreground bg-muted p-2 rounded-md">
                    <div className="flex flex-col">
                        <span className="uppercase tracking-wider opacity-70">Latitud</span>
                        <span>{pizzeria.lat.toFixed(5)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="uppercase tracking-wider opacity-70">Longitud</span>
                        <span>{pizzeria.lng.toFixed(5)}</span>
                    </div>
                </div>

                {/* Contact Links */}
                <div className="flex flex-col gap-2 pt-2">
                    {pizzeria.phoneNumber && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <a href={`tel:${pizzeria.phoneNumber}`} className="hover:underline font-medium break-all">{pizzeria.phoneNumber}</a>
                        </div>
                    )}
                    {pizzeria.website && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <a href={pizzeria.website} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium truncate flex-1">
                                {pizzeria.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                        </div>
                    )}
                    {pizzeria.socialMedia && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
                                <Share2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                            </div>
                            <a href={pizzeria.socialMedia} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium truncate flex-1">Redes Sociales</a>
                        </div>
                    )}
                </div>

                {/* Description */}
                {pizzeria.description && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <h4 className="font-headline text-sm font-semibold mb-2">Descripción</h4>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                            {pizzeria.description}
                        </div>
                    </div>
                )}
            </div>

        </>
    );
}
