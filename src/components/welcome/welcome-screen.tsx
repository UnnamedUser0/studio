'use client';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
// Dynamically import the 3D scene to avoid SSR issues
const Pizza3DScene = dynamic(() => import('./pizza-3d-scene'), { ssr: false });
import PizzaCursorEffect from './pizza-cursor-effect';
import { Pizza } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (

        <div className="fixed inset-0 z-[2000] bg-background flex flex-col items-center justify-start overflow-y-auto pt-10">
            {/* Cursor effect removed */}

            <div className="relative z-10 flex flex-col items-center max-w-5xl w-full p-8 text-center h-auto justify-start">

                {/* Logo - Main Title Position */}
                <div className="flex items-center justify-center gap-2 mb-24 scale-150 origin-center">
                    <Pizza className="h-12 w-12 text-primary" />
                    <div className="w-[25ch] text-left">
                        <span className="font-bold font-headline text-5xl inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation text-foreground pb-3 leading-normal">
                            PizzApp
                        </span>
                    </div>
                </div>

                {/* 3D Model - Central Hero (Larger) */}
                <div className="w-full h-[80vh] relative mb-32">
                    <Pizza3DScene />
                </div>

                {/* Main Content */}
                <div className="space-y-8 max-w-3xl mx-auto animate-fade-in-up">
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
                            className="text-lg px-8 py-6 rounded-full hover:bg-muted transition-all"
                            onClick={() => window.open('https://github.com', '_blank')} // Placeholder or secondary action
                        >
                            Saber más
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
