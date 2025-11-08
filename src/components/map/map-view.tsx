'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import getDistance from 'geolib/es/getDistance';

import SmartSearch from '@/components/search/smart-search';
import PizzeriaList from '@/components/pizzeria/pizzeria-list';
import PizzeriaDetail from '@/components/pizzeria/pizzeria-detail';
import { Button } from '@/components/ui/button';
import { List, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import PizzeriaCard from '@/components/pizzeria/pizzeria-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Pizzeria } from '@/lib/types';

const PizzaMap = dynamic(() => import('@/components/map/pizza-map'), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const TestimonialsCarousel = dynamic(() => import('@/components/testimonial/testimonials-carousel'), {
  ssr: false,
  loading: () => <Skeleton className="h-[250px] w-full" />,
});

const WhyChoosePizzapp = dynamic(() => import('@/components/layout/why-choose-pizzapp'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

type Geocode = { lat: number, lng: number };

export default function MapView() {
  const [selectedPizzeria, setSelectedPizzeria] = useState<Pizzeria | null>(null);
  const [visiblePizzerias, setVisiblePizzerias] = useState<Pizzeria[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCenter, setSearchCenter] = useState<Geocode | null>(null);

  const firestore = useFirestore();

  const pizzeriasQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'pizzerias') : null, 
  [firestore]);
  const { data: allPizzerias, isLoading: isLoadingPizzerias } = useCollection<Pizzeria>(pizzeriasQuery);

  const topPizzeriasQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'pizzerias'), orderBy('rating', 'desc'), limit(3)) : null,
  [firestore]);
  const { data: pizzeriasForRanking, isLoading: isLoadingRanking } = useCollection<Pizzeria>(topPizzeriasQuery);
  
  useEffect(() => {
    if (allPizzerias) {
      // Set initial pizzerias only if not searching
      if (!isSearching && !searchCenter) {
        setVisiblePizzerias(allPizzerias);
      }
    }
  }, [allPizzerias, isSearching, searchCenter]);

  const handleSelectPizzeria = (pizzeria: Pizzeria) => {
    setSelectedPizzeria(pizzeria);
  };

  const handleSearch = (results: Pizzeria[], geocode: Geocode | null) => {
    setSearchCenter(geocode);

    if (geocode) {
      // Proximity search: sort all pizzerias by distance, don't activate "isSearching" mode
      const sortedByDistance = [...(allPizzerias || [])]
        .map(pizzeria => ({
          ...pizzeria,
          distance: getDistance(
            { latitude: geocode.lat, longitude: geocode.lng },
            { latitude: pizzeria.lat, longitude: pizzeria.lng }
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
      
      setVisiblePizzerias(sortedByDistance);
      setIsSearching(false); // Proximity search is for exploration, not filtering
      setSelectedPizzeria(null);

    } else {
      // Text search
      setIsSearching(true);
      setVisiblePizzerias(results);
      if (results.length === 1) {
        setSelectedPizzeria(results[0]);
      } else {
        setSelectedPizzeria(null);
      }
    }
  };
  
  const handleClearSearch = () => {
    setVisiblePizzerias(allPizzerias || []);
    setIsSearching(false);
    setSelectedPizzeria(null);
    setSearchCenter(null);
  }

  const handleCloseDetail = () => {
    setSelectedPizzeria(null);
  }

  // Pizzerias to show on the map should always be the latest visible set
  const pizzeriasToShowOnMap = visiblePizzerias;
  // Pizzerias in the list are either search results or the top ranking ones
  const pizzeriasToShowInList = (isSearching || searchCenter) ? visiblePizzerias.slice(0, 20) : (pizzeriasForRanking || []);

  return (
    <>
      <div className="h-[60vh] w-full">
        <PizzaMap 
          pizzerias={pizzeriasToShowOnMap}
          onMarkerClick={handleSelectPizzeria} 
          selectedPizzeria={selectedPizzeria}
          searchCenter={searchCenter}
        />
      </div>

      <div className="absolute top-4 left-4 z-[1000]">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" className="shadow-lg animate-fade-in-down">
              <List className="mr-2 h-5 w-5" />
              {(isSearching || searchCenter) ? 'Ver Resultados' : 'Explorar Pizzerías'}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-[440px] p-0 flex flex-col">
            <PizzeriaList 
                pizzerias={pizzeriasToShowInList}
                onPizzeriaSelect={handleSelectPizzeria} 
                isSearching={isSearching || !!searchCenter}
                onClearSearch={handleClearSearch}
                isLoading={isLoadingPizzerias}
            />
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm md:max-w-md lg:max-w-lg px-4">
        <SmartSearch onSearch={handleSearch} allPizzerias={allPizzerias || []} onClear={handleClearSearch} />
      </div>

      {!isSearching && !searchCenter && (
         <div id="ranking" className="container py-12">
            <h2 className="text-3xl font-headline text-center mb-24">Ranking de las 3 Mejores Pizzerías de Hermosillo</h2>
            {isLoadingRanking ? (
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
                    
                    <div className="absolute bottom-[80px] w-[calc(100%+20px)] left-[-10px] h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>
                    <div className="absolute bottom-[96px] w-[calc(33.33%+20px)] left-[calc(33.33%-10px)] h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>
                    <div className="absolute bottom-[144px] w-[calc(33.33%+20px)] left-[calc(33.33%-10px)] h-4 bg-primary/80 rounded-t-lg shadow-inner z-0"></div>

                    <div className="absolute bottom-0 top-0 left-1/3 w-px bg-black/20 z-10 h-[144px]"></div>
                    <div className="absolute bottom-0 top-0 left-2/3 w-px bg-black/20 z-10 h-[144px]"></div>

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
      )}
      
      {!isSearching && !searchCenter && (
        <div id="testimonials" className="bg-muted/50 py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Lo que nuestra comunidad opina</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Descubre por qué a los amantes de la pizza les encanta PizzApp.
                </p>
            </div>
            <TestimonialsCarousel />
          </div>
        </div>
      )}

      {!isSearching && !searchCenter && (
        <WhyChoosePizzapp />
      )}

      <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side="right" className="w-[90vw] max-w-[440px] p-0 flex flex-col" aria-describedby={undefined}>
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
