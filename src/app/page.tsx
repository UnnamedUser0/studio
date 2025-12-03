
'use client';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import getDistance from 'geolib/es/getDistance';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

import MapView from '@/components/map/map-view';
import { Loader2, MessageSquarePlus, List } from 'lucide-react';
import { Pizzeria, Testimonial, User } from '@/lib/types';
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
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import WelcomeScreen from '@/components/welcome/welcome-screen';
import RankingManager from '@/components/admin/ranking-manager';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

type Geocode = { lat: number, lng: number };

function HomeContent() {
  const [selectedPizzeria, setSelectedPizzeria] = useState<Pizzeria | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCenter, setSearchCenter] = useState<Geocode | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);

  const [showWelcome, setShowWelcome] = useState(false);
  const [isCheckingWelcome, setIsCheckingWelcome] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkWelcome = () => {
      const forceWelcome = searchParams.get('welcome') === 'true';
      const hasSeen = localStorage.getItem('hasSeenWelcome');

      if (forceWelcome) {
        setShowWelcome(true);
      } else if (!hasSeen) {
        setShowWelcome(true);
      } else {
        setShowWelcome(false);
      }
      setIsCheckingWelcome(false);
    };
    checkWelcome();
  }, [searchParams]);

  const handleEnterApp = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcome(false);
    // Remove query param if present
    if (searchParams.get('welcome') === 'true') {
      router.replace('/');
    }
  };

  const { data: session } = useSession();
  const user = session?.user;

  // Fetch User Profile to check admin
  const [userProfile, setUserProfile] = useState<User | null>(null);
  useEffect(() => {
    if (user?.id) {
      import('@/app/actions').then(({ getUserProfile }) => {
        getUserProfile(user.id!).then((profile) => {
          // Adapt Prisma User to App User type if needed, or just use what's needed
          setUserProfile(profile as unknown as User);
        });
      });
    }
  }, [user?.id]);

  const isAdmin = userProfile?.isAdmin === true;

  // Fetch Ranking Settings
  const [rankingSettings, setRankingSettings] = useState<{ pizzeriaIds: string[] } | null>(null);
  useEffect(() => {
    import('@/app/actions').then(({ getRankingSettings }) => {
      getRankingSettings().then(setRankingSettings);
    });
  }, []);

  const [dbPizzerias, setDbPizzerias] = useState<Pizzeria[]>([]);

  useEffect(() => {
    import('@/app/actions').then(({ getAllPizzerias }) => {
      getAllPizzerias().then((data) => {
        const adapted = data.map((p: any) => ({
          ...p,
          rating: p.rating,
          category: p.category || 'Pizza',
          source: p.source || 'Database',
          imageHint: 'pizza',
          imageUrl: p.imageUrl || undefined,
          reviews: [],
          reviewCount: p.reviewCount
        })) as unknown as Pizzeria[];
        setDbPizzerias(adapted);
      });
    });
  }, []);

  const allPizzerias: Pizzeria[] = useMemo(() => {
    const staticPizzerias = pizzeriasData as unknown as Pizzeria[];
    if (!dbPizzerias || dbPizzerias.length === 0) {
      // Fallback to static with 0 rating if DB is empty/loading, or maybe we want to show 0 for static
      // The user wants REAL ratings. Static data has no real ratings.
      // We should probably show static data with 0 rating if not in DB.
      return staticPizzerias.map((p, index) => {
        const image = PlaceHolderImages[index % PlaceHolderImages.length];
        return {
          ...p,
          imageUrl: image.imageUrl,
          imageHint: image.imageHint,
          rating: 0,
          reviewCount: 0
        };
      });
    }

    const dbIds = new Set(dbPizzerias.map(p => p.id));

    // Map static pizzerias to include images but 0 rating
    const mappedStatic = staticPizzerias.map((p, index) => {
      const image = PlaceHolderImages[index % PlaceHolderImages.length];
      return {
        ...p,
        imageUrl: image.imageUrl,
        imageHint: image.imageHint,
        rating: 0,
        reviewCount: 0
      };
    });

    const filteredStatic = mappedStatic.filter(p => !dbIds.has(p.id));

    // Merge: DB pizzerias take precedence. 
    // We also need to assign images to DB pizzerias if they don't have one
    const mappedDb = dbPizzerias.map((p, index) => {
      // Try to find matching static to get consistent image if possible, or just use placeholder logic
      // The index logic might be inconsistent if we mix sources.
      // Let's just use the ID hash or similar if we want consistency, or just random.
      // For now, let's just use the same placeholder logic but we need an index.
      // We can just use the index in the final array?
      // Let's just keep it simple.
      if (p.imageUrl) return p;

      // Find if it was in static data to preserve "identity" if possible
      const staticMatch = staticPizzerias.find(sp => sp.id === p.id);
      if (staticMatch) {
        const staticIndex = staticPizzerias.indexOf(staticMatch);
        const image = PlaceHolderImages[staticIndex % PlaceHolderImages.length];
        return { ...p, imageUrl: image.imageUrl, imageHint: image.imageHint };
      }

      const image = PlaceHolderImages[index % PlaceHolderImages.length];
      return { ...p, imageUrl: image.imageUrl, imageHint: image.imageHint };
    });

    return [...mappedDb, ...filteredStatic].sort((a, b) => b.rating - a.rating);
  }, [dbPizzerias]);

  const [visiblePizzerias, setVisiblePizzerias] = useState<Pizzeria[]>([]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const pizzeriasForRanking = useMemo(() => {
    if (!allPizzerias) return [];

    // If we have manual ranking settings, use them
    if (rankingSettings?.pizzeriaIds && rankingSettings.pizzeriaIds.length > 0) {
      const ranked = rankingSettings.pizzeriaIds
        .map(id => allPizzerias.find(p => p.id === id))
        .filter((p): p is Pizzeria => !!p); // Filter out undefined

      if (ranked.length > 0) return ranked;
    }

    const sorted = [...allPizzerias].sort((a, b) => b.rating - a.rating);
    return sorted.slice(0, 3);
  }, [allPizzerias, rankingSettings]);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  useEffect(() => {
    import('@/app/actions').then(({ getTestimonials }) => {
      getTestimonials().then((data) => {
        // Adapt Prisma Testimonial to App Testimonial type
        const mappedTestimonials: Testimonial[] = data.map((t: any) => ({
          id: t.id.toString(),
          author: t.name,
          email: t.email || undefined,
          role: t.role || 'Usuario',
          comment: t.content,
          createdAt: t.createdAt.toISOString(),
          avatarUrl: t.avatarUrl,
          reply: t.replyText ? {
            text: t.replyText,
            repliedAt: t.repliedAt ? t.repliedAt.toISOString() : new Date().toISOString()
          } : undefined
        }));
        setTestimonials(mappedTestimonials);
      });
    });
  }, []);

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

  if (!hasMounted || isCheckingWelcome) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onEnter={handleEnterApp} />;
  }

  return (
    <>
      <div className="relative w-full h-full flex-grow flex flex-col">
        {/* ... Sheet and MapView ... */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              className="absolute top-20 left-4 z-[1001] shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-px transition-all duration-300 pointer-events-auto h-8 text-xs px-3 md:h-10 md:text-sm md:px-4"
            >
              <List className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              {isSearching ? 'Ver Resultados' : 'Explorar Pizzerías'}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-[600px] p-0 flex flex-col">
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
          <div className="h-[55vh] md:h-[70vh] w-full">
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
                <ScrollReveal>
                  <div className="flex flex-col items-center justify-center mb-24">
                    <h2 className="text-3xl font-headline text-center">Ranking de las 3 Mejores Pizzerías de Hermosillo</h2>
                    {isAdmin && allPizzerias && (
                      <div className="mt-4">
                        <RankingManager
                          allPizzerias={allPizzerias}
                          currentRankingIds={rankingSettings?.pizzeriaIds}
                        />
                      </div>
                    )}
                  </div>
                  {!allPizzerias ? (
                    <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : (
                    pizzeriasForRanking && pizzeriasForRanking.length >= 3 && (
                      <div className="relative w-[calc(100%+4rem)] -ml-8 md:w-full md:ml-auto md:mx-auto max-w-5xl h-[450px] scale-100 origin-bottom mt-12">
                        {/* Base Platform - Wider and brighter highlights */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[98%] h-6 bg-primary/30 rounded-full blur-md"></div>
                        <div className="absolute bottom-0 left-[1%] w-[40%] h-3 bg-gradient-to-r from-primary to-transparent rounded-full blur-[3px] opacity-80"></div>
                        <div className="absolute bottom-0 right-[1%] w-[40%] h-3 bg-gradient-to-l from-primary to-transparent rounded-full blur-[3px] opacity-80"></div>

                        <div className="absolute bottom-4 md:bottom-6 w-[85%] md:w-full left-1/2 -translate-x-1/2 flex items-end justify-center gap-2 md:gap-8 px-2">
                          {/* 2nd Place (Left) */}
                          <div className="relative w-1/3 max-w-[200px] flex flex-col justify-end group">
                            {/* Card Container */}
                            <div className="absolute bottom-[110px] md:bottom-[140px] left-1/2 -translate-x-1/2 w-[140px] md:w-[300px] z-20 transition-transform duration-300 hover:-translate-y-2">
                              <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-gray-300 to-gray-100 rounded-lg blur opacity-40"></div>
                                <div className="md:hidden">
                                  <PizzeriaCard
                                    pizzeria={pizzeriasForRanking[1]!}
                                    onClick={() => handleSelectPizzeria(pizzeriasForRanking[1]!)}
                                    rankingPlace={2}
                                    compact
                                  />
                                </div>
                                <div className="hidden md:block">
                                  <PizzeriaCard
                                    pizzeria={pizzeriasForRanking[1]!}
                                    onClick={() => handleSelectPizzeria(pizzeriasForRanking[1]!)}
                                    rankingPlace={2}
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Podium Block */}
                            <div className="h-24 md:h-32 w-full bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 rounded-t-lg relative shadow-lg border-t-4 border-slate-300 flex items-center justify-center mx-auto max-w-full">
                              <span className="font-bold text-5xl md:text-6xl text-slate-100/50 drop-shadow-md">2</span>
                            </div>
                          </div>

                          {/* 1st Place (Center) - Adjusted Height */}
                          <div className="relative w-1/3 max-w-[200px] flex flex-col justify-end z-10 group">
                            {/* Card Container */}
                            <div className="absolute bottom-[280px] left-1/2 -translate-x-1/2 w-[160px] md:w-[320px] z-30 transition-transform duration-300 hover:-translate-y-2">
                              <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-lg blur opacity-50 animate-pulse"></div>
                                <div className="md:hidden">
                                  <PizzeriaCard
                                    pizzeria={pizzeriasForRanking[0]!}
                                    onClick={() => handleSelectPizzeria(pizzeriasForRanking[0]!)}
                                    rankingPlace={1}
                                    compact
                                  />
                                </div>
                                <div className="hidden md:block">
                                  <PizzeriaCard
                                    pizzeria={pizzeriasForRanking[0]!}
                                    onClick={() => handleSelectPizzeria(pizzeriasForRanking[0]!)}
                                    rankingPlace={1}
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Podium Block */}
                            <div className="h-64 w-full bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-lg relative shadow-xl border-t-4 border-yellow-300 flex items-center justify-center overflow-hidden mx-auto max-w-full">
                              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                              <span className="font-bold text-6xl md:text-8xl text-white drop-shadow-lg">1</span>
                            </div>
                          </div>

                          {/* 3rd Place (Right) */}
                          <div className="relative w-1/3 max-w-[200px] flex flex-col justify-end group">
                            {/* Card Container */}
                            <div className="absolute bottom-[90px] md:bottom-[110px] left-1/2 -translate-x-1/2 w-[140px] md:w-[300px] z-20 transition-transform duration-300 hover:-translate-y-2">
                              <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-300 to-orange-200 rounded-lg blur opacity-40"></div>
                                <div className="md:hidden">
                                  <PizzeriaCard
                                    pizzeria={pizzeriasForRanking[2]!}
                                    onClick={() => handleSelectPizzeria(pizzeriasForRanking[2]!)}
                                    rankingPlace={3}
                                    compact
                                  />
                                </div>
                                <div className="hidden md:block">
                                  <PizzeriaCard
                                    pizzeria={pizzeriasForRanking[2]!}
                                    onClick={() => handleSelectPizzeria(pizzeriasForRanking[2]!)}
                                    rankingPlace={3}
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Podium Block */}
                            <div className="h-20 md:h-24 w-full bg-gradient-to-b from-orange-400 to-orange-600 rounded-t-lg relative shadow-lg border-t-4 border-orange-300 flex items-center justify-center mx-auto max-w-full">
                              <span className="font-bold text-4xl md:text-5xl text-orange-100/80 drop-shadow-md">3</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </ScrollReveal>
              </div>

              <div id="testimonials" className="bg-muted/50 py-16">
                <div className="container">
                  <ScrollReveal>
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
                          <DialogContent className="sm:max-w-[800px]">
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
                  </ScrollReveal>
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

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
