
'use client';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import getDistance from 'geolib/es/getDistance';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

import MapView from '@/components/map/map-view';
import { Loader2, MessageSquarePlus, List } from 'lucide-react';
import { Pizzeria, Testimonial, User, Geocode } from '@/lib/types';
import PizzeriaCard from '@/components/pizzeria/pizzeria-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetTrigger, SheetContent, SheetContentNoOverlay } from '@/components/ui/sheet';
import PizzeriaList from '@/components/pizzeria/pizzeria-list';
import { pizzeriasData } from '@/lib/pizzerias-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import WelcomeScreen from '@/components/welcome/welcome-screen';
import type { RankingStyles } from '@/components/admin/ranking-styler';

const WhyChoosePizzapp = dynamic(() => import('@/components/layout/why-choose-pizzapp'));
const TestimonialsCarousel = dynamic(() => import('@/components/testimonial/testimonials-carousel'));
const TestimonialForm = dynamic(() => import('@/components/testimonial/testimonial-form'));
const RankingManager = dynamic(() => import('@/components/admin/ranking-manager'));
const ExplorarPizzerias = dynamic(() => import('@/components/pizzeria/explorar-pizzerias'));
const RankingStyler = dynamic(() => import('@/components/admin/ranking-styler').then(mod => mod.RankingStyler));
const PizzeriaReviews = dynamic(() => import('@/components/pizzeria/pizzeria-reviews'));
const PizzeriaDetail = dynamic(() => import('@/components/pizzeria/pizzeria-detail'));
const MenuModal = dynamic(() => import('@/components/pizzeria/menu-modal'));

function HomeContent() {
  const [selectedPizzeria, setSelectedPizzeria] = useState<Pizzeria | null>(null); // Used for Menu Sheet (Map/Explore)
  const [selectedPizzeriaForMenu, setSelectedPizzeriaForMenu] = useState<Pizzeria | null>(null); // Used for Menu Modal (Ranking)
  const [selectedPizzeriaForReviews, setSelectedPizzeriaForReviews] = useState<Pizzeria | null>(null); // Used for Reviews Sheet
  const [isSearching, setIsSearching] = useState(false);
  const [searchCenter, setSearchCenter] = useState<Geocode | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  // Fetch Ranking Styles
  const [rankingStyles, setRankingStyles] = useState<RankingStyles>({
    cardScale: 1,
    cardScale1st: 1.1,
    cardScale2nd: 1,
    cardScale3rd: 1,
    cardWidth: 320,
    cardWidth2nd: 300,
    cardWidth3rd: 300,
    imageHeight: 112,
    imageWidth: 112,
    textSize: 1,
    buttonScale: 1,
    showSideActions: true,

    podiumHeight1st: 256,
    podiumHeight2nd: 128,
    podiumHeight3rd: 96,
    cardElevation1st: 20,
    cardElevation2nd: 12,
    cardElevation3rd: 12,

    mobilePodiumHeight1st: 160,
    mobilePodiumHeight2nd: 80,
    mobilePodiumHeight3rd: 60,

    mobileCardElevation1st: 20,
    mobileCardElevation2nd: 10,
    mobileCardElevation3rd: 10,

    mobileCardScale1st: 0.5,
    mobileCardScale2nd: 0.45,
    mobileCardScale3rd: 0.45,
    mobileCardWidth: 280,
    mobileCardWidth2nd: 280,
    mobileCardWidth3rd: 280,
    mobileImageHeight: 90,
  });

  useEffect(() => {
    import('@/app/actions').then(({ getRankingStyles }) => {
      getRankingStyles().then((styles) => {
        if (styles) {
          setRankingStyles(prev => ({ ...prev, ...styles }));
        }
      });
    });
  }, []);

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

  const SUPER_ADMIN_EMAIL = "va21070541@bachilleresdesonora.edu.mx";
  const userEmail = user?.email;
  const permissions = userProfile?.permissions;

  const hasPermission = (perm: string) => {
    if (userEmail === SUPER_ADMIN_EMAIL) return true;
    if (!permissions) return false;
    return permissions.split(',').map(p => p.trim()).includes(perm);
  };

  const isAdmin = userProfile?.isAdmin === true;
  const canManagePizzerias = isAdmin && hasPermission('manage_pizzerias');
  const canManageContent = isAdmin && hasPermission('manage_content');

  // Fetch Ranking Settings
  const [rankingSettings, setRankingSettings] = useState<{ pizzeriaIds: string[] } | null>(null);
  useEffect(() => {
    import('@/app/actions').then(({ getRankingSettings }) => {
      getRankingSettings().then(setRankingSettings);
    });
  }, []);

  // Fetch Layout Settings
  const [layoutSettings, setLayoutSettings] = useState<any>(null);
  useEffect(() => {
    import('@/app/actions').then(({ getLayoutSettings }) => {
      getLayoutSettings().then(setLayoutSettings);
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
    const mappedDb = dbPizzerias.map((p, index) => {
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

  const handleRatePizzeria = useCallback((pizzeria: Pizzeria) => {
    setSelectedPizzeriaForReviews(pizzeria);
  }, []);

  const handleSearch = useCallback((results: Pizzeria[], geocode?: Geocode) => {
    setIsSearching(true);

    if (results.length === 0 && geocode) {
      // If searching for a location, show pizzerias within 2.5km
      const nearby = allPizzerias.filter(p => {
        if (!p.lat || !p.lng) return false;
        const distance = getDistance(
          { latitude: geocode.lat, longitude: geocode.lng },
          { latitude: p.lat, longitude: p.lng }
        );
        return distance <= 2500;
      });
      setVisiblePizzerias(nearby);
    } else {
      setVisiblePizzerias(results);
    }

    if (geocode) {
      setSearchCenter(geocode);
    } else if (results.length > 0) {
      setSearchCenter({ lat: results[0].lat, lng: results[0].lng });
    }
  }, [allPizzerias]);

  const handleClearSearch = useCallback(() => {
    setIsSearching(false);
    setVisiblePizzerias([]);
    setSearchCenter(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPizzeria(null);
  }, []);

  const handleLocateUser = useCallback((coords: { lat: number, lng: number }) => {
    // setUserLocation(coords);
  }, []);

  const [routeDestination, setRouteDestination] = useState<{ lat: number, lng: number } | null>(null);

  const handleNavigate = useCallback((pizzeria: Pizzeria) => {
    if (!pizzeria.lat || !pizzeria.lng) return;
    setRouteDestination({ lat: pizzeria.lat, lng: pizzeria.lng });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const pizzeriasToShowInList = isSearching ? visiblePizzerias : (pizzeriasForRanking || []);

  // Calculate map height styles
  const mapHeightStyle = useMemo(() => {
    if (!layoutSettings) return {};
    return {
      '--map-height-mobile': `${layoutSettings.mapHeightMobile || 55}vh`,
      '--map-height-desktop': `${layoutSettings.mapHeight || 70}vh`,
      '--search-width-desktop': `${layoutSettings.searchWidth || 50}%`,
      '--search-width-mobile': `${layoutSettings.searchWidthMobile || 90}%`,
      '--search-height-desktop': `${(layoutSettings.searchHeight || 12) * 0.25}rem`,
      '--search-height-mobile': `${(layoutSettings.searchHeightMobile || 10) * 0.25}rem`,
      '--buttons-top-desktop': `${layoutSettings.buttonsTop || 160}px`,
      '--buttons-top-mobile': `${layoutSettings.buttonsTopMobile || 160}px`,
      '--layer-control-top-desktop': `${layoutSettings.layerControlTop || 10}px`,
      '--layer-control-top-mobile': `${layoutSettings.layerControlTopMobile || 10}px`,
      '--popup-width-desktop': `${layoutSettings.popupWidth || 280}px`,
      '--popup-width-mobile': `${layoutSettings.popupWidthMobile || 260}px`,
      '--popup-scale-desktop': `${layoutSettings.popupScale || 1}`,
      '--popup-scale-mobile': `${layoutSettings.popupScaleMobile || 1}`,
      '--popup-font-size-desktop': `${layoutSettings.popupFontSize || 14}px`,
      '--popup-font-size-mobile': `${layoutSettings.popupFontSizeMobile || 12}px`,
    } as React.CSSProperties;
  }, [layoutSettings]);

  const mobileRankingStyles = useMemo<RankingStyles>(() => ({
    ...rankingStyles,
    cardScale1st: rankingStyles.mobileCardScale1st ?? 1,
    cardScale2nd: rankingStyles.mobileCardScale2nd ?? 0.95,
    cardScale3rd: rankingStyles.mobileCardScale3rd ?? 0.95,
    cardWidth: rankingStyles.mobileCardWidth ?? 280,
    cardWidth2nd: rankingStyles.mobileCardWidth2nd ?? rankingStyles.mobileCardWidth ?? 280,
    cardWidth3rd: rankingStyles.mobileCardWidth3rd ?? rankingStyles.mobileCardWidth ?? 280,
    imageHeight: rankingStyles.mobileImageHeight ?? 96,
    textSize: rankingStyles.mobileTextSize ?? 0.9,
    buttonScale: rankingStyles.mobileButtonScale ?? 0.9,
    // Mobile specific overrides
    cardScale: 1,
    imageWidth: 96, // Fixed smaller image width for mobile row layout
  }), [rankingStyles]);

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
        <main className="flex-grow flex flex-col">
          <div className="w-full h-[var(--map-height-mobile,_55vh)] md:h-[var(--map-height-desktop,_70vh)] transition-[height] duration-300" style={mapHeightStyle}>
            <MapView
              visiblePizzerias={isSearching ? visiblePizzerias : allPizzerias}
              onSelectPizzeria={handleSelectPizzeria}
              selectedPizzeria={selectedPizzeria}
              searchCenter={searchCenter}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              onCloseDetail={handleCloseDetail}
              onLocateUser={handleLocateUser}
              allPizzerias={allPizzerias}
              routeDestination={routeDestination}
              onViewMenu={handleSelectPizzeria}
              onRate={handleRatePizzeria}
              isAdmin={canManagePizzerias || canManageContent} // Pass admin status (allow access if has pizzerias OR content permissions, or basically is admin)
            />
          </div>

          <div className="bg-background relative">
            <div id="ranking" className="container py-12 overflow-x-clip">
              <ScrollReveal>
                <div className="flex flex-col items-center justify-center mb-24">
                  <h2 className="text-3xl font-headline text-center">Ranking de las 3 Mejores Pizzerías de Hermosillo</h2>
                  {canManagePizzerias && allPizzerias && (
                    <div className="mt-4 flex gap-2">
                      <RankingManager
                        allPizzerias={allPizzerias}
                        currentRankingIds={rankingSettings?.pizzeriaIds}
                      />
                      <RankingStyler
                        styles={rankingStyles}
                        onStylesChange={setRankingStyles}
                      />
                    </div>
                  )}
                </div>
                {!allPizzerias ? (
                  <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                  pizzeriasForRanking && pizzeriasForRanking.length >= 3 && (
                    <div
                      className="relative w-full md:ml-auto md:mx-auto max-w-5xl h-[var(--rh-m)] md:h-[var(--rh)] scale-100 origin-bottom mt-12 transition-[height] duration-300"
                      style={{
                        '--rh': `${rankingStyles.containerHeight ?? 600}px`,
                        '--rh-m': `${rankingStyles.mobileContainerHeight ?? 600}px`,
                        '--ph-1': `${rankingStyles.podiumHeight1st ?? 256}px`,
                        '--ph-1-m': `${rankingStyles.mobilePodiumHeight1st ?? 160}px`,
                        '--ph-2': `${rankingStyles.podiumHeight2nd ?? 128}px`,
                        '--ph-2-m': `${rankingStyles.mobilePodiumHeight2nd ?? 80}px`,
                        '--ph-3': `${rankingStyles.podiumHeight3rd ?? 96}px`,
                        '--ph-3-m': `${rankingStyles.mobilePodiumHeight3rd ?? 60}px`,
                        '--ce-1': `${rankingStyles.cardElevation1st ?? 20}px`,
                        '--ce-1-m': `${rankingStyles.mobileCardElevation1st ?? 20}px`,
                        '--ce-2': `${rankingStyles.cardElevation2nd ?? 12}px`,
                        '--ce-2-m': `${rankingStyles.mobileCardElevation2nd ?? 10}px`,
                        '--ce-3': `${rankingStyles.cardElevation3rd ?? 12}px`,
                        '--ce-3-m': `${rankingStyles.mobileCardElevation3rd ?? 10}px`,
                      } as React.CSSProperties}
                    >
                      {/* Base Platform - Wider and brighter highlights */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[98%] h-6 bg-primary/30 rounded-full blur-md"></div>
                      <div className="absolute bottom-0 left-[1%] w-[40%] h-3 bg-gradient-to-r from-primary to-transparent rounded-full blur-[3px] opacity-80"></div>
                      <div className="absolute bottom-0 right-[1%] w-[40%] h-3 bg-gradient-to-l from-primary to-transparent rounded-full blur-[3px] opacity-80"></div>

                      <div className="absolute bottom-4 md:bottom-6 w-[85%] md:w-full left-1/2 -translate-x-1/2 flex items-end justify-center gap-2 md:gap-8 px-2">
                        {/* 2nd Place (Left) */}
                        <div className="relative w-1/3 max-w-[200px] flex flex-col justify-end group">
                          {/* Card Container - Expands to Left */}
                          {/* Card Container - Expands to Left */}
                          <div
                            className="absolute right-1/2 translate-x-1/2 md:translate-x-0 md:right-0 z-50 transition-all duration-300 hover:-translate-y-2 bottom-[calc(var(--ph-2-m)+var(--ce-2-m))] md:bottom-[calc(var(--ph-2)+var(--ce-2))]"
                            style={{ width: `${rankingStyles.cardWidth2nd}px` }}
                          >
                            <div className="relative">
                              <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-gray-300 to-gray-100 rounded-lg blur opacity-40"></div>
                              {/* Mobile Card: Centered and Scaled */}
                              <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom transition-transform duration-300"
                                style={{ width: `${rankingStyles.mobileCardWidth2nd ?? rankingStyles.mobileCardWidth ?? 280}px`, maxWidth: '90vw' }}> {/* Fixed width canvas for mobile card */}
                                <PizzeriaCard
                                  pizzeria={pizzeriasForRanking[1]!}
                                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[1]!)}
                                  rankingPlace={2}
                                  inverted
                                  sideActionsPosition="left"
                                  rankingStyles={mobileRankingStyles}
                                  customScale={mobileRankingStyles.cardScale2nd} /* This applies the scaling transformation */
                                  sideActions={rankingStyles.showSideActions ? (
                                    <div className="flex flex-col gap-2 w-24">
                                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm" onClick={(e) => { e.stopPropagation(); setSelectedPizzeriaForMenu(pizzeriasForRanking[1]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Ver menú</Button>
                                      <Button size="sm" variant="secondary" className="w-full bg-black text-white hover:bg-gray-800 shadow-sm" onClick={(e) => { e.stopPropagation(); handleNavigate(pizzeriasForRanking[1]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Cómo llegar</Button>
                                      <Button size="sm" variant="outline" className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20" onClick={(e) => { e.stopPropagation(); handleRatePizzeria(pizzeriasForRanking[1]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Calificar</Button>
                                    </div>
                                  ) : undefined}
                                />
                              </div>
                              <div className="hidden md:block relative">
                                <PizzeriaCard
                                  pizzeria={pizzeriasForRanking[1]!}
                                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[1]!)}
                                  rankingPlace={2}
                                  inverted
                                  sideActionsPosition="left"
                                  rankingStyles={rankingStyles}
                                  customScale={rankingStyles.cardScale2nd}
                                  sideActions={rankingStyles.showSideActions ? (
                                    <div className="flex flex-col gap-2 w-28">
                                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm" onClick={(e) => { e.stopPropagation(); setSelectedPizzeriaForMenu(pizzeriasForRanking[1]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Ver menú</Button>
                                      <Button size="sm" variant="secondary" className="w-full bg-black text-white hover:bg-gray-800 shadow-sm" onClick={(e) => { e.stopPropagation(); handleNavigate(pizzeriasForRanking[1]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Cómo llegar</Button>
                                      <Button size="sm" variant="outline" className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20" onClick={(e) => { e.stopPropagation(); handleRatePizzeria(pizzeriasForRanking[1]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Calificar</Button>
                                    </div>
                                  ) : undefined}
                                />
                              </div>
                            </div>
                          </div>
                          {/* Podium Block */}
                          <div className="w-full bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 rounded-t-lg relative shadow-lg border-t-4 border-slate-300 flex items-center justify-center mx-auto max-w-full transition-all duration-300 h-[var(--ph-2-m)] md:h-[var(--ph-2)]">
                            <span className="font-bold text-5xl md:text-6xl text-slate-100/50 drop-shadow-md">2</span>
                          </div>
                        </div>

                        {/* 1st Place (Center) - Adjusted Height */}
                        <div className="relative w-1/3 max-w-[200px] flex flex-col justify-end group">
                          {/* Card Container - Centered */}
                          {/* Card Container - Centered */}
                          <div
                            className="absolute left-1/2 -translate-x-1/2 z-[60] transition-transform duration-300 hover:-translate-y-2 bottom-[calc(var(--ph-1-m)+var(--ce-1-m))] md:bottom-[calc(var(--ph-1)+var(--ce-1))]"
                            style={{ width: `${rankingStyles.cardWidth}px` }}
                          >
                            <div className="relative">
                              <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-lg blur opacity-50 animate-pulse"></div>
                              {/* Mobile Card: Centered and Scaled */}
                              <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom transition-transform duration-300"
                                style={{ width: `${rankingStyles.mobileCardWidth ?? 280}px`, maxWidth: '90vw' }}>
                                <PizzeriaCard
                                  pizzeria={pizzeriasForRanking[0]!}
                                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[0]!)}
                                  rankingPlace={1}
                                  sideActionsPosition="right"
                                  rankingStyles={mobileRankingStyles}
                                  customScale={mobileRankingStyles.cardScale1st}
                                  sideActions={rankingStyles.showSideActions ? (
                                    <div className="flex flex-col gap-2 w-24">
                                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-sm" onClick={(e) => { e.stopPropagation(); setSelectedPizzeriaForMenu(pizzeriasForRanking[0]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Ver menú</Button>
                                      <Button size="sm" variant="secondary" className="bg-black text-white hover:bg-gray-800 shadow-sm" onClick={(e) => { e.stopPropagation(); handleNavigate(pizzeriasForRanking[0]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Cómo llegar</Button>
                                      <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20" onClick={(e) => { e.stopPropagation(); handleRatePizzeria(pizzeriasForRanking[0]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Calificar</Button>
                                    </div>
                                  ) : undefined}
                                />
                              </div>
                              <div className="hidden md:block relative">
                                <PizzeriaCard
                                  pizzeria={pizzeriasForRanking[0]!}
                                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[0]!)}
                                  rankingPlace={1}
                                  sideActionsPosition="right"
                                  rankingStyles={rankingStyles}
                                  customScale={rankingStyles.cardScale1st}
                                  sideActions={rankingStyles.showSideActions ? (
                                    <div className="flex flex-col gap-2 w-28">
                                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-sm" onClick={(e) => { e.stopPropagation(); setSelectedPizzeriaForMenu(pizzeriasForRanking[0]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Ver menú</Button>
                                      <Button size="sm" variant="secondary" className="bg-black text-white hover:bg-gray-800 shadow-sm" onClick={(e) => { e.stopPropagation(); handleNavigate(pizzeriasForRanking[0]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Cómo llegar</Button>
                                      <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20" onClick={(e) => { e.stopPropagation(); handleRatePizzeria(pizzeriasForRanking[0]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Calificar</Button>
                                    </div>
                                  ) : undefined}
                                />
                              </div>
                            </div>
                          </div>
                          {/* Podium Block */}
                          <div className="w-full bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-lg relative shadow-xl border-t-4 border-yellow-300 flex items-center justify-center overflow-hidden mx-auto max-w-full transition-all duration-300 h-[var(--ph-1-m)] md:h-[var(--ph-1)]">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                            <span className="font-bold text-6xl md:text-8xl text-white drop-shadow-lg">1</span>
                          </div>
                        </div>

                        {/* 3rd Place (Right) */}
                        <div className="relative w-1/3 max-w-[200px] flex flex-col justify-end group">
                          {/* Card Container - Expands to Right */}
                          {/* Card Container - Expands to Right */}
                          <div
                            className="absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 z-50 transition-all duration-300 hover:-translate-y-2 bottom-[calc(var(--ph-3-m)+var(--ce-3-m))] md:bottom-[calc(var(--ph-3)+var(--ce-3))]"
                            style={{ width: `${rankingStyles.cardWidth3rd}px` }}
                          >
                            <div className="relative">
                              <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-orange-300 to-orange-200 rounded-lg blur opacity-40"></div>
                              {/* Mobile Card: Centered and Scaled */}
                              <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom transition-transform duration-300"
                                style={{ width: `${rankingStyles.mobileCardWidth3rd ?? rankingStyles.mobileCardWidth ?? 280}px`, maxWidth: '90vw' }}>
                                <PizzeriaCard
                                  pizzeria={pizzeriasForRanking[2]!}
                                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[2]!)}
                                  rankingPlace={3}
                                  sideActionsPosition="right"
                                  rankingStyles={mobileRankingStyles}
                                  customScale={mobileRankingStyles.cardScale3rd}
                                  sideActions={rankingStyles.showSideActions ? (
                                    <div className="flex flex-col gap-2 w-24">
                                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm" onClick={(e) => { e.stopPropagation(); setSelectedPizzeriaForMenu(pizzeriasForRanking[2]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Ver menú</Button>
                                      <Button size="sm" variant="secondary" className="w-full bg-black text-white hover:bg-gray-800 shadow-sm" onClick={(e) => { e.stopPropagation(); handleNavigate(pizzeriasForRanking[2]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Cómo llegar</Button>
                                      <Button size="sm" variant="outline" className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20" onClick={(e) => { e.stopPropagation(); handleRatePizzeria(pizzeriasForRanking[2]!); }} style={{ transform: `scale(${rankingStyles.mobileButtonScale ?? 0.9})`, transformOrigin: 'center' }}>Calificar</Button>
                                    </div>
                                  ) : undefined}
                                />
                              </div>
                              <div className="hidden md:block relative">
                                <PizzeriaCard
                                  pizzeria={pizzeriasForRanking[2]!}
                                  onClick={() => handleSelectPizzeria(pizzeriasForRanking[2]!)}
                                  rankingPlace={3}
                                  sideActionsPosition="right"
                                  rankingStyles={rankingStyles}
                                  customScale={rankingStyles.cardScale3rd}
                                  sideActions={rankingStyles.showSideActions ? (
                                    <div className="flex flex-col gap-2 w-28">
                                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm" onClick={(e) => { e.stopPropagation(); setSelectedPizzeriaForMenu(pizzeriasForRanking[2]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Ver menú</Button>
                                      <Button size="sm" variant="secondary" className="w-full bg-black text-white hover:bg-gray-800 shadow-sm" onClick={(e) => { e.stopPropagation(); handleNavigate(pizzeriasForRanking[2]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Cómo llegar</Button>
                                      <Button size="sm" variant="outline" className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20" onClick={(e) => { e.stopPropagation(); handleRatePizzeria(pizzeriasForRanking[2]!); }} style={{ transform: `scale(${rankingStyles.buttonScale})` }}>Calificar</Button>
                                    </div>
                                  ) : undefined}
                                />
                              </div>
                            </div>
                          </div>
                          {/* Podium Block */}
                          <div className="w-full bg-gradient-to-b from-orange-400 to-orange-600 rounded-t-lg relative shadow-lg border-t-4 border-orange-300 flex items-center justify-center mx-auto max-w-full transition-all duration-300 h-[var(--ph-3-m)] md:h-[var(--ph-3)]">
                            <span className="font-bold text-5xl md:text-6xl text-orange-100/50 drop-shadow-md">3</span>
                          </div>


                        </div>
                      </div>
                    </div>
                  )
                )}
              </ScrollReveal>
            </div>

            {allPizzerias && (
              <ExplorarPizzerias
                pizzerias={allPizzerias}
                onLocate={handleNavigate}
                onRate={handleRatePizzeria}
                isAdmin={canManagePizzerias}
                initialLayoutSettings={layoutSettings}
              />
            )}

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
                    <TestimonialsCarousel testimonials={testimonials} canManageContent={canManageContent} />
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

            <WhyChoosePizzapp isAdmin={canManageContent} />

            {/* Mobile Spacer to avoid content being hidden by fixed bottom elements */}
            <div className="h-24 md:hidden"></div>
          </div>
        </main>
      </div>

      {/* Existing Menu Sheet (triggered by selectedPizzeria) */}
      <Sheet open={!!selectedPizzeria} onOpenChange={() => setSelectedPizzeria(null)}>
        <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col">
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>

      {/* New Reviews Sheet */}
      <Sheet modal={false} open={!!selectedPizzeriaForReviews} onOpenChange={() => setSelectedPizzeriaForReviews(null)}>
        <SheetContentNoOverlay className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col">
          {selectedPizzeriaForReviews && <PizzeriaReviews pizzeria={selectedPizzeriaForReviews} />}
        </SheetContentNoOverlay>
      </Sheet>

      {selectedPizzeriaForMenu && (
        <MenuModal
          isOpen={!!selectedPizzeriaForMenu}
          onClose={() => setSelectedPizzeriaForMenu(null)}
          pizzeriaId={selectedPizzeriaForMenu.id}
          pizzeriaName={selectedPizzeriaForMenu.name}
          isAdmin={canManagePizzerias}
        />
      )}
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
