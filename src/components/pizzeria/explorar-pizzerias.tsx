'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Pizzeria } from '@/lib/types';
import { Star, MapPin, List } from 'lucide-react';
import MenuModal from './menu-modal';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PizzeriaList from './pizzeria-list';
import Autoplay from "embla-carousel-autoplay"

import LayoutEditor, { LayoutSettings } from '@/components/admin/layout-editor';

export default function ExplorarPizzerias({
    pizzerias,
    onLocate,
    isAdmin,
    initialLayoutSettings
}: {
    pizzerias: Pizzeria[];
    onLocate: (pizzeria: Pizzeria) => void;
    isAdmin?: boolean;
    initialLayoutSettings?: LayoutSettings;
}) {
    const [selectedPizzeriaForMenu, setSelectedPizzeriaForMenu] = useState<Pizzeria | null>(null);
    const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(initialLayoutSettings || {
        sheetWidth: 75,
        cardScale: 1,
        buttonScale: 1,
        buttonLayout: 'grid'
    });

    useEffect(() => {
        if (initialLayoutSettings) {
            setLayoutSettings(initialLayoutSettings);
        }
    }, [initialLayoutSettings]);

    return (
        <section id="explorar-pizzerias" className="py-16 bg-muted/30 relative">
            {isAdmin && (
                <LayoutEditor
                    initialSettings={layoutSettings}
                    onSettingsChange={setLayoutSettings}
                />
            )}
            <div className="container">
                <ScrollReveal>
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-headline font-bold">Explorar Pizzerías</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Descubre todas las opciones que tenemos para ti.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="relative px-12">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 3000,
                            }),
                        ]}
                        className="w-full"
                    >
                        <CarouselContent>
                            {pizzerias.map((pizzeria) => (
                                <CarouselItem key={pizzeria.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                                    <div className="h-full py-2">
                                        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group border-0 shadow-md">
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={pizzeria.imageUrl || "/placeholder-pizza.jpg"}
                                                    alt={pizzeria.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                            </div>

                                            <CardContent className="flex-grow flex flex-col p-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-headline text-xl font-bold line-clamp-1">{pizzeria.name}</h3>
                                                </div>

                                                <div className="flex items-center text-muted-foreground text-sm mb-4">
                                                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                                    <span className="line-clamp-1">{pizzeria.address}</span>
                                                </div>

                                                <div className="flex items-center mb-6">
                                                    <div className="flex text-yellow-400">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-4 h-4 ${star <= Math.round(pizzeria.rating) ? "fill-current" : "text-gray-300"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                                                        {pizzeria.rating.toFixed(1)} ({pizzeria.reviewCount} reseñas)
                                                    </span>
                                                </div>

                                                <div className="mt-auto flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                                                            onClick={() => setSelectedPizzeriaForMenu(pizzeria)}
                                                        >
                                                            Ver menú
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            className="flex-1 bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg transition-all"
                                                            onClick={() => onLocate(pizzeria)}
                                                        >
                                                            Cómo llegar
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                                        onClick={() => onLocate(pizzeria)} // Opening detail view allows rating
                                                    >
                                                        <Star className="w-4 h-4 mr-2 fill-current" />
                                                        Calificar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="-left-12" />
                        <CarouselNext className="-right-12" />
                    </Carousel>
                </div>

                <div className="mt-12 text-center">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="lg" variant="outline" className="gap-2">
                                <List className="w-5 h-5" />
                                <span className="hidden sm:inline">Ver todas las pizzerías</span>
                                <span className="sm:hidden">Ver todas</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="p-0 flex flex-col transition-all duration-300"
                            style={{
                                width: `${layoutSettings.sheetWidth}vw`,
                                maxWidth: '100vw'
                            }}
                        >
                            <PizzeriaList
                                pizzerias={pizzerias}
                                onPizzeriaSelect={(p) => {
                                    onLocate(p);
                                }}
                                isSearching={false}
                                onClearSearch={() => { }}
                                isLoading={false}
                                onViewMenu={(p) => setSelectedPizzeriaForMenu(p)}
                                onNavigate={(p) => onLocate(p)}
                                onRate={(p) => onLocate(p)}
                                layoutSettings={layoutSettings}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {selectedPizzeriaForMenu && (
                <MenuModal
                    isOpen={!!selectedPizzeriaForMenu}
                    onClose={() => setSelectedPizzeriaForMenu(null)}
                    pizzeriaId={selectedPizzeriaForMenu.id}
                    pizzeriaName={selectedPizzeriaForMenu.name}
                    isAdmin={isAdmin}
                />
            )}
        </section>
    );
}
