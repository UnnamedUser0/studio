'use client';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
// Dynamically import the 3D scene to avoid SSR issues
const Pizza3DScene = dynamic(() => import('./pizza-3d-scene'), { ssr: false });

import { Pizza } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
const WelcomeAdminPanel = dynamic(() => import('./welcome-admin-panel'), { ssr: false });

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: '¿Cómo busco pizzerías en PizzApp?',
        answer: 'Puedes usar la barra de búsqueda en la parte superior para escribir el nombre, la dirección o una colonia. También puedes explorar el mapa interactivo en la página de inicio para ver las pizzerías cercanas a ti.',
    },
    {
        question: '¿Necesito registrarme para usar PizzApp?',
        answer: 'No es necesario registrarse para explorar pizzerías, ver sus menús o ubicaciones. Sin embargo, para dejar opiniones, calificar y guardar tus lugares favoritos, sí necesitarás crear una cuenta gratuita.',
    },
    {
        question: '¿Qué información puedo ver sobre una pizzería?',
        answer: 'Para cada pizzería, puedes ver su dirección, ubicación en el mapa, calificación promedio, y las opiniones y comentarios dejados por otros usuarios de la comunidad.',
    },
    {
        question: '¿De dónde proviene la información de las pizzerías?',
        answer: 'La información inicial es recopilada por nuestro equipo y validada constantemente por la comunidad. Los dueños de negocios también podrán reclamar y actualizar sus perfiles próximamente.',
    },
    {
        question: '¿Por qué algunas pizzerías no aparecen en la búsqueda?',
        answer: 'Nuestro buscador inteligente intenta encontrar la mejor coincidencia. Si una pizzería es nueva o no está en nuestra base de datos, es posible que no aparezca. ¡Puedes sugerirnos nuevos lugares a través de nuestra página de contacto!',
    },
    {
        question: '¿Cómo puedo reportar información incorrecta?',
        answer: 'Si encuentras un error en la dirección, horario o cualquier otro dato de una pizzería, te agradecemos que nos lo hagas saber a través del formulario en nuestra página de Contacto.',
    },
    {
        question: '¿A quién puedo contactar si tengo un problema con la aplicación?',
        answer: 'Nuestro equipo de soporte está disponible para ayudarte. Puedes enviarnos un mensaje a través del formulario en la sección de Contacto y te responderemos a la brevedad.',
    },
    {
        question: 'Soy dueño, ¿puedo agregar mi pizzería a PizzApp?',
        answer: '¡Claro que sí! Estamos finalizando el portal para dueños de negocios. Mientras tanto, puedes enviarnos la información de tu pizzería a través de la página de Contacto para que la agreguemos.',
    },
    {
        question: '¿PizzApp cobra comisiones por pedidos?',
        answer: 'No. Actualmente, PizzApp es una guía para descubrir y calificar pizzerías. No procesamos pedidos ni cobramos comisiones. Solo te conectamos con los mejores lugares de la ciudad.',
    },
];

export default function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
    const [mounted, setMounted] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const { data: session } = useSession();
    const user = session?.user;

    useEffect(() => {
        setMounted(true);

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        import('@/app/actions').then(({ getLayoutSettings }) => {
            getLayoutSettings().then((data) => {
                if (data) setSettings(data);
            });
        });

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let isMounted = true;
        if (user?.id) {
            import('@/app/actions').then(({ getUserProfile }) => {
                getUserProfile(user.id!).then((profile) => {
                    if (isMounted) {
                        const admin = (user as any)?.isAdmin === true || profile?.isAdmin === true;
                        setIsAdmin(admin);
                    }
                }).catch(() => {
                    if (isMounted) {
                        setIsAdmin((user as any)?.isAdmin === true);
                    }
                });
            });
        } else {
            setIsAdmin(false);
        }
        return () => {
            isMounted = false;
        };
    }, [user]);

    if (!mounted) return null;

    const suffix = isMobile ? 'Mobile' : '';
    const getVal = (key: string, defaultVal: any) => {
        return settings?.[`${key}${suffix}`] !== undefined ? settings[`${key}${suffix}`] : defaultVal;
    };

    // 3D Model Dynamic Props
    const scale3D = getVal('welcome3DScale', isMobile ? 3.2 : 3.0);
    const spaceWidth = getVal('welcome3DWidth', 100);
    const height3D = getVal('welcome3DHeight', isMobile ? 48 : 65);
    const spaceOffsetX = getVal('welcome3DSpaceOffsetX', 0);
    const spaceOffsetY = getVal('welcome3DSpaceOffsetY', 0);
    const fov3D = getVal('welcome3DFov', isMobile ? 42 : 45);
    const rotationSpeed3D = getVal('welcome3DRotationSpeed', 2.0);

    // Top Elements (Logo) Dynamic Props
    const logoScale = getVal('welcomeLogoScale', isMobile ? 1.25 : 1.5);
    const logoOffsetY = getVal('welcomeLogoOffsetY', 0);
    const logoOffsetX = getVal('welcomeLogoOffsetX', 0);
    const logoMarginBottom = getVal('welcomeLogoMarginBottom', isMobile ? 8 : 16);

    // Bottom Elements (Content & Buttons) Dynamic Props
    const contentScale = getVal('welcomeContentScale', 1.0);
    const contentOffsetY = getVal('welcomeContentOffsetY', 0);
    const contentOffsetX = getVal('welcomeContentOffsetX', 0);
    const contentMarginTop = getVal('welcomeContentMarginTop', isMobile ? 4 : 0);
    const contentSpacing = getVal('welcomeContentSpacing', isMobile ? 16 : 32);
    const buttonsLayout = getVal('welcomeButtonsLayout', 'row');

    const handleReset = () => {
        import('@/app/actions').then(({ getLayoutSettings }) => {
            getLayoutSettings().then((data) => {
                if (data) {
                    setSettings({
                        ...data,
                        welcome3DScale: 3.0,
                        welcome3DScaleMobile: 3.2,
                        welcome3DWidth: 100,
                        welcome3DWidthMobile: 100,
                        welcome3DHeight: 65,
                        welcome3DHeightMobile: 48,
                        welcome3DSpaceOffsetX: 0,
                        welcome3DSpaceOffsetXMobile: 0,
                        welcome3DSpaceOffsetY: 0,
                        welcome3DSpaceOffsetYMobile: 0,
                        welcome3DFov: 45,
                        welcome3DFovMobile: 42,
                        welcome3DRotationSpeed: 2.0,
                        welcome3DRotationSpeedMobile: 2.0,
                        welcomeLogoScale: 1.5,
                        welcomeLogoScaleMobile: 1.25,
                        welcomeLogoOffsetY: 0,
                        welcomeLogoOffsetYMobile: 0,
                        welcomeLogoOffsetX: 0,
                        welcomeLogoOffsetXMobile: 0,
                        welcomeLogoMarginBottom: 16,
                        welcomeLogoMarginBottomMobile: 8,
                        welcomeContentScale: 1.0,
                        welcomeContentScaleMobile: 1.0,
                        welcomeContentOffsetY: 0,
                        welcomeContentOffsetYMobile: 0,
                        welcomeContentOffsetX: 0,
                        welcomeContentOffsetXMobile: 0,
                        welcomeContentMarginTop: 0,
                        welcomeContentMarginTopMobile: 4,
                        welcomeContentSpacing: 32,
                        welcomeContentSpacingMobile: 16,
                        welcomeButtonsLayout: 'row',
                        welcomeButtonsLayoutMobile: 'row'
                    });
                }
            });
        });
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-background flex flex-col items-center justify-start overflow-y-auto pt-6 md:pt-10 px-4">
            {/* Admin Floating Control Panel */}
            <WelcomeAdminPanel
                settings={settings || {}}
                onSettingsChange={(newSettings) => setSettings(newSettings)}
                onReset={handleReset}
                isAdmin={isAdmin}
            />

            <div className="relative z-10 flex flex-col items-center max-w-5xl w-full text-center h-auto justify-start">

                {/* Logo - Main Title Position */}
                <div
                    className="flex items-center justify-center gap-2 origin-center relative z-20 transition-transform duration-75 shrink-0"
                    style={{
                        transform: `translate(${logoOffsetX}px, ${logoOffsetY}px) scale(${logoScale})`,
                        marginBottom: `${logoMarginBottom}px`,
                    }}
                >
                    <Pizza className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                    <div className="w-[7.5ch] text-left font-bold font-headline text-4xl md:text-5xl">
                        <span className="inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation text-foreground pb-2 md:pb-3 leading-normal">
                            PizzApp
                        </span>
                    </div>
                </div>

                {/* 3D Model - Central Hero Space */}
                <div
                    className="relative transition-all duration-75 flex items-center justify-center shrink-0 origin-center"
                    style={{
                        width: `${spaceWidth}%`,
                        maxWidth: `${spaceWidth}%`,
                        height: `${height3D}vh`,
                        transform: `translate(${spaceOffsetX}px, ${spaceOffsetY}px)`,
                    }}
                >
                    <Pizza3DScene
                        scale={scale3D}
                        fov={fov3D}
                        rotationSpeed={rotationSpeed3D}
                    />
                </div>

                {/* Main Content */}
                <div
                    className="max-w-3xl mx-auto animate-fade-in-up pb-12 relative z-20 transition-all duration-75"
                    style={{
                        transform: `translate(${contentOffsetX}px, ${contentOffsetY}px) scale(${contentScale})`,
                        transformOrigin: 'top center',
                        marginTop: `${contentMarginTop}px`,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: `${contentSpacing / 2}px`
                        }}
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold font-headline tracking-tight text-foreground leading-tight">
                            Vive la mejor experiencia de <br />
                            <span className="text-primary">Pizza en la ciudad</span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light">
                            Descubre, califica y disfruta de las mejores pizzerías de Hermosillo con nuestra plataforma de nueva generación.
                        </p>
                    </div>

                    <div
                        style={{
                            marginTop: `${contentSpacing / 2}px`,
                            display: 'flex',
                            flexDirection: buttonsLayout === 'column' ? 'column' : 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px'
                        }}
                    >
                        <Button
                            size="lg"
                            className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                            onClick={onEnter}
                        >
                            Entrar a PizzApp
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-full hover:bg-muted transition-all group"
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            Saber más
                            <ChevronDown className={`ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 ${showInfo ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>

                    {/* Expanded Info Section */}
                    {showInfo && (
                        <div className="mt-12 md:mt-16 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* About Section */}
                            <div className="mb-12 md:mb-16 bg-muted/30 p-6 md:p-8 rounded-2xl border border-border/50">
                                <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4 md:mb-6 text-foreground">Sobre PizzApp</h2>
                                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                                    PizzApp es la plataforma definitiva para los amantes de la pizza en Hermosillo. Nuestra misión es conectar a los comensales con las mejores pizzerías locales, ofreciendo una experiencia visual única y herramientas útiles para descubrir, calificar y compartir tus lugares favoritos. Ya sea que busques una pizzería clásica o una joya oculta, PizzApp te guía en cada bocado.
                                </p>
                            </div>

                            {/* FAQ Section */}
                            <div className="space-y-6">
                                <h2 className="text-2xl md:text-3xl font-bold font-headline mb-6 md:mb-8 text-center text-foreground">Preguntas Frecuentes</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq, index) => (
                                        <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50">
                                            <AccordionTrigger className="text-base md:text-lg font-medium hover:text-primary transition-colors text-left">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground text-sm md:text-base pb-4">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

