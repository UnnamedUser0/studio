'use client';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import type { Pizzeria } from '@/lib/pizzeria-data';

type PizzeriaCardProps = {
  pizzeria: Pizzeria;
  onClick: () => void;
};

export default function PizzeriaCard({ pizzeria, onClick }: PizzeriaCardProps) {
  return (
    <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300" 
        onClick={onClick}
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <CardContent className="p-0 flex items-center">
        <div className="relative w-28 h-28 flex-shrink-0">
          <Image 
            src={pizzeria.imageUrl} 
            alt={pizzeria.name}
            data-ai-hint={pizzeria.imageHint}
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="p-4 flex-1 min-w-0">
          <h3 className="font-headline text-lg font-semibold truncate">{pizzeria.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{pizzeria.address}</p>
          <div className="flex items-center mt-2">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="ml-1.5 font-bold text-foreground">{pizzeria.rating.toFixed(1)}</span>
            <span className="ml-2 text-sm text-muted-foreground">({pizzeria.reviews.length} opiniones)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
