'use client';
import { useEffect, useRef, useState } from 'react';

interface Particle {
    x: number;
    y: number;
    id: number;
}

export default function PizzaCursorEffect() {
    const [particles, setParticles] = useState<Particle[]>([]);
    const particleId = useRef(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Check if hovering over a button or clickable element
            const target = e.target as HTMLElement;
            const isClickable = target.closest('button') || target.closest('a') || target.getAttribute('role') === 'button';

            if (isClickable) {
                return;
            }

            // Add new particle
            const newParticle = { x: e.clientX, y: e.clientY, id: particleId.current++ };
            setParticles(prev => {
                // Keep last 15 for performance
                const newParticles = [...prev, newParticle];
                if (newParticles.length > 15) {
                    return newParticles.slice(newParticles.length - 15);
                }
                return newParticles;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[2001] overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute text-xl animate-fade-out-up select-none"
                    style={{ left: p.x, top: p.y }}
                >
                    🍕
                </div>
            ))}
        </div>
    );
}
