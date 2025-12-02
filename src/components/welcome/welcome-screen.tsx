'use client';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
// Dynamically import the 3D scene to avoid SSR issues
const Pizza3DScene = dynamic(() => import('./pizza-3d-scene'), { ssr: false });

import { Pizza } from 'lucide-react';
import { useEffect, useState } from 'react';

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

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (

        <div className="fixed inset-0 z-[2000] bg-background flex flex-col items-center justify-start overflow-y-auto pt-2 md:pt-4">
            {/* Cursor effect removed */}

            <div className="relative z-10 flex flex-col items-center max-w-5xl w-full p-8 text-center h-auto justify-start">

                {/* Logo - Main Title Position */}
                <div className="flex items-center justify-center gap-2 -mb-32 md:mb-4 scale-150 origin-center relative z-20">
                    <Pizza className="h-12 w-12 text-primary" />
                    <div className="w-[7ch] text-left font-bold font-headline text-5xl">
                        <span className="inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation text-foreground pb-3 leading-normal">
                            PizzApp
                        </span>
                    </div>
                </div>

                {/* 3D Model - Central Hero (Larger) */}
                <div className="w-full h-[80vh] md:h-[70vh] relative mb-2">
                    <Pizza3DScene />
                </div>

                {/* Main Content */}
                <div className="space-y-4 md:space-y-8 max-w-3xl mx-auto animate-fade-in-up pb-12 -mt-32 md:mt-0 relative z-20">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight text-foreground">
                            Vive la mejor experiencia de <br />
                            <span className="text-primary">Pizza en la ciudad</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mt-4 font-light">
                            Descubre, califica y disfruta de las mejores pizzerías de Hermosillo con nuestra plataforma de nueva generación.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            size="lg"
                            className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                            onClick={onEnter}
                        >
                            Entrar a PizzApp
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="text-lg px-8 py-6 rounded-full hover:bg-muted transition-all group"
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            Saber más
                            <ChevronDown className={`ml-2 h-5 w-5 transition-transform duration-300 ${showInfo ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>

                    {/* Expanded Info Section */}
                    {showInfo && (
                        <div className="mt-16 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* About Section */}
                            <div className="mb-16 bg-muted/30 p-8 rounded-2xl border border-border/50">
                                <h2 className="text-3xl font-bold font-headline mb-6 text-foreground">Sobre PizzApp</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    PizzApp es la plataforma definitiva para los amantes de la pizza en Hermosillo. Nuestra misión es conectar a los comensales con las mejores pizzerías locales, ofreciendo una experiencia visual única y herramientas útiles para descubrir, calificar y compartir tus lugares favoritos. Ya sea que busques una pizzería clásica o una joya oculta, PizzApp te guía en cada bocado.
                                </p>
                            </div>

                            {/* FAQ Section */}
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold font-headline mb-8 text-center text-foreground">Preguntas Frecuentes</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq, index) => (
                                        <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50">
                                            <AccordionTrigger className="text-lg font-medium hover:text-primary transition-colors text-left">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground text-base pb-4">
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
    )
}
