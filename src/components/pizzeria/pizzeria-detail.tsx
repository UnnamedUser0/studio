'use client';

import Image from 'next/image';
import { Loader2, Pizza } from 'lucide-react';
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
                <div className="relative h-48 w-full">
                    <Image
                        src={imageUrl}
                        alt={pizzeria.name}
                        data-ai-hint={imageHint}
                        fill
                        sizes="(max-width: 640px) 90vw, 440px"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="p-6 pt-2 absolute bottom-0 w-full">
                    <SheetTitle className="font-headline text-3xl text-primary-foreground">{pizzeria.name}</SheetTitle>
                    <SheetDescription className="text-muted-foreground/80">{pizzeria.address}</SheetDescription>
                </div>
            </SheetHeader>
            <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-headline text-xl mb-4 text-foreground">Menú</h3>

                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Pizza className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>El menú digital aún no está disponible.</p>
                                <p className="text-sm">Visita el local para ver sus especialidades.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {categories.map(category => {
                                    const categoryItems = groupedItems[category];
                                    if (!categoryItems || categoryItems.length === 0) return null;
                                    return (
                                        <div key={category} className="space-y-3">
                                            <h4 className="font-bold text-lg text-primary border-b pb-1">{category}</h4>
                                            <div className="grid gap-3">
                                                {categoryItems.map(item => (
                                                    <Card key={item.id} className="overflow-hidden">
                                                        <CardContent className="p-3 flex gap-3">
                                                            {item.imageUrl && (
                                                                <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden">
                                                                    <Image
                                                                        src={item.imageUrl}
                                                                        alt={item.name}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <h5 className="font-bold truncate">{item.name}</h5>
                                                                    <span className="font-semibold text-primary shrink-0">${item.price.toFixed(2)}</span>
                                                                </div>
                                                                {item.description && (
                                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </>
    );
}
