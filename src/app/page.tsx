
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import getDistance from 'geolib/es/getDistance';
import dynamic from 'next/dynamic';

import MapView from '@/components/map/map-view';
import { Loader2, MessageSquarePlus, List } from 'lucide-react';
import { Pizzeria, Testimonial } from '@/lib/types';
import PizzeriaCard from '@/components/pizzeria/pizzeria-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import PizzeriaList from '@/components/pizzeria/pizzeria-list';
import { pizzeriasData } from '@/lib/pizzerias-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import WhyChoosePizzapp from '@/components/layout/why-choose-pizzapp';
import TestimonialsCarousel from '@/components/testimonial/testimonials-carousel';
import TestimonialForm from '@/components/testimonial/testimonial-form';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

type Geocode = { lat: number, lng: number };

export default function Home() {
  const [selectedPizzeria, setSelectedPizzeria] = useState<Pizzeria | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCenter, setSearchCenter] = useState<Geocode | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);

  const allPizzerias = useMemo(() => {
    if (!pizzeriasData) return [];
    return pizzeriasData.map((pizzeria, index) => {
      const image = PlaceHolderImages[index % PlaceHolderImages.length];
      const stableRating = 3.5 + ((pizzeria.id.charCodeAt(0) * 7) % 15) / 10;
      return {
        ...pizzeria,
        imageUrl: image.imageUrl,
        imageHint: image.imageHint,
        rating: Math.min(5, stableRating)
      };
    });
  }, []);

  const [visiblePizzerias, setVisiblePizzerias] = useState<Pizzeria[]>([]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const firestore = useFirestore();

  const pizzeriasForRanking = useMemo(() => {
    if (!allPizzerias) return [];
    const sorted = [...allPizzerias].sort((a, b) => b.rating - a.rating);
    return sorted.slice(0, 3);
  }, [allPizzerias]);

  const testimonialsQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'testimonials'), orderBy('createdAt', 'desc')) : null,
    [firestore]);
  const { data: testimonials, isLoading: isLoadingTestimonials } = useCollection<Testimonial>(testimonialsQuery);

  const handleSelectPizzeria = useCallback((pizzeria: Pizzeria) => {
    setSelectedPizzeria(pizzeria);
  }, []);

  const handleSearch = useCallback((results: Pizzeria[], geocode?: Geocode) => {
    setIsSearching(true);
    setVisiblePizzerias(results);

    if (geocode) {
      setSearchCenter(geocode);
      setSelectedPizzeria(null);
    } else if (results.length > 0) {
      setSearchCenter({ lat: results[0].lat, lng: results[0].lng });
    }
  }, []);

  const handleLocateUser = useCallback((coords: Geocode) => {
    setIsSearching(true);
    setSearchCenter(coords);
    if (allPizzerias) {
      const sortedByDistance = [...allPizzerias]
        .map(pizzeria => ({
          ...pizzeria,
          distance: getDistance(
            { latitude: coords.lat, longitude: coords.lng },
            { latitude: pizzeria.lat, longitude: pizzeria.lng }
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
      const nearby = sortedByDistance.slice(0, 20);
      setVisiblePizzerias(nearby);
      setSelectedPizzeria(null);
    }
  }, [allPizzerias]);

  const handleClearSearch = useCallback(() => {
    setVisiblePizzerias([]);
    setIsSearching(false);
    setSelectedPizzeria(null);
    setSearchCenter(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPizzeria(null);
  }, []);

  const pizzeriasToShowInList = isSearching ? visiblePizzerias : (pizzeriasForRanking || []);

  if (!hasMounted) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-full flex-grow flex flex-col">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              className="absolute top-20 left-4 z-[1001] shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-px transition-all duration-300 pointer-events-auto"
            >
              <List className="mr-2 h-5 w-5" />
              {isSearching ? 'Ver Resultados' : 'Explorar Pizzerías'}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-[440px] p-0 flex flex-col">
            <PizzeriaList
              pizzerias={pizzeriasToShowInList}
              onPizzeriaSelect={handleSelectPizzeria}
              isSearching={isSearching}
              onClearSearch={handleClearSearch}
              isLoading={!allPizzerias}
            />
          </SheetContent>
        </Sheet>

        <main className="flex-grow flex flex-col">
          <div className="h-[70vh] w-full">
            <MapView
              visiblePizzerias={visiblePizzerias}
              onSelectPizzeria={handleSelectPizzeria}
              selectedPizzeria={selectedPizzeria}
              searchCenter={searchCenter}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              onCloseDetail={handleCloseDetail}
              onLocateUser={handleLocateUser}
              allPizzerias={allPizzerias}
            />
          </div>

          {!isSearching && (
            <div className="bg-background relative">
              <div id="ranking" className="container py-12">
                <h2 className="text-3xl font-headline text-center mb-24">Ranking de las 3 Mejores Pizzerías de Hermosillo</h2>
                {!allPizzerias ? (
                  <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                  pizzeriasForRanking && pizzeriasForRanking.length >= 3 && (
                    <div className="relative w-full max-w-4xl mx-auto h-[250px]">
                      <div className="absolute bottom-0 w-full flex items-end">
                        <div className="w-1/3 h-24 bg-primary relative flex justify-center">
                          <span className="absolute bottom-4 font-bold text-5xl text-white/80" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>2</span>
                        </div>
                        <div className="w-1/3 h-36 bg-primary relative flex justify-center">
                          <span className="absolute bottom-4 font-bold text-6xl text-white" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.5)' }}>1</span>
                        </div>
                        <div className="w-1/3 h-20 bg-primary relative flex justify-center">
                          <span className="absolute bottom-4 font-bold text-4xl text-white/70" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>3</span>
                        </div>
                      </div>

                      <div className="absolute bottom-[80px] w-full flex items-end">
                        <div className="w-1/3 h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>
                        <div className="w-1/3 h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>
                        <div className="w-1/3 h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>
                      </div>
                      <div className="absolute bottom-[96px] left-[calc(0%+16.66%-128px)] w-[256px] z-20">
                        <PizzeriaCard
                          pizzeria={pizzeriasForRanking[1]}
                          onClick={() => handleSelectPizzeria(pizzeriasForRanking[1])}
                          rankingPlace={2}
                        />
                      </div>
                      <div className="absolute bottom-[144px] left-[calc(33.33%+16.66%-128px)] w-[256px] z-20">
                        <PizzeriaCard
                          pizzeria={pizzeriasForRanking[0]}
                          onClick={() => handleSelectPizzeria(pizzeriasForRanking[0])}
                          rankingPlace={1}
                        />
                      </div>
                      <div className="absolute bottom-[80px] left-[calc(66.66%+16.66%-128px)] w-[256px] z-20">
                        <PizzeriaCard
                          pizzeria={pizzeriasForRanking[2]}
                          onClick={() => handleSelectPizzeria(pizzeriasForRanking[2])}
                          rankingPlace={3}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div id="testimonials" className="bg-muted/50 py-16">
                <div className="container">
                  <div className="max-w-3xl mx-auto text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Lo que nuestra comunidad opina</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                      Descubre por qué a los amantes de la pizza les encanta PizzApp.
                    </p>
                  </div>

                  {hasMounted && testimonials && testimonials.length > 0 && (
                    <TestimonialsCarousel testimonials={testimonials} />
                  )}

                  {hasMounted && (
                    <div className="text-center mt-12">
                      <Dialog open={isTestimonialDialogOpen} onOpenChange={setIsTestimonialDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="lg" variant="outline">
                            <MessageSquarePlus className="mr-2 h-5 w-5" />
                            Deja tu propia opinión
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                          <DialogHeader>
                            <DialogTitle className="font-headline text-3xl">Deja una respuesta</DialogTitle>
                            <DialogDescription>
                              Usa esta sección para contarnos qué te parece PizzApp. ¡Tu feedback es muy valioso!
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <TestimonialForm onSuccess={() => setIsTestimonialDialogOpen(false)} />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>

              <WhyChoosePizzapp />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
