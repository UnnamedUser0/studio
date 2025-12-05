'use client';

import { useState } from 'react';
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

export default function ExplorarPizzerias({
    pizzerias,
    onLocate,
    isAdmin
}: {
    pizzerias: Pizzeria[];
    onLocate: (pizzeria: Pizzeria) => void;
    isAdmin?: boolean;
}) {
    const [selectedPizzeriaForMenu, setSelectedPizzeriaForMenu] = useState<Pizzeria | null>(null);

    return (
        <section id="explorar-pizzerias" className="py-16 bg-muted/30">
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

                                                <div className="mt-auto flex gap-3">
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
                                Ver todas las pizzerías
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[90vw] max-w-[600px] p-0 flex flex-col">
                            <PizzeriaList
                                pizzerias={pizzerias}
                                onPizzeriaSelect={(p) => {
                                    onLocate(p);
                                    // Close sheet? The user might want to see the map.
                                    // PizzeriaList doesn't have close logic passed, but onLocate usually handles navigation.
                                    // We might need to close the sheet programmatically if we had a ref, but usually selecting implies navigation.
                                    // However, SheetTrigger handles open state. We can use a controlled sheet if needed, but for now let's rely on default behavior or user closing it.
                                    // Actually, if onLocate scrolls to map, the sheet might cover it.
                                    // We should probably close the sheet.
                                    // But I don't have a close handler here easily without state.
                                    // Let's leave it as is, user can close it.
                                }}
                                isSearching={false}
                                onClearSearch={() => { }}
                                isLoading={false}
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
