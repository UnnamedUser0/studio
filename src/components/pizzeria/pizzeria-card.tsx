'use client';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import type { Pizzeria } from '@/lib/pizzeria-data';

type PizzeriaCardProps = {
  pizzeria: Pizzeria;
  onClick: () => void;
  rankingPlace?: number;
};

export default function PizzeriaCard({ pizzeria, onClick, rankingPlace }: PizzeriaCardProps) {
  const getPlaceColor = (place: number) => {
    switch (place) {
      case 1: return 'bg-yellow-400 border-yellow-500'; // Gold
      case 2: return 'bg-slate-300 border-slate-400'; // Silver
      case 3: return 'bg-orange-400 border-orange-500'; // Bronze
      default: return 'bg-gray-200';
    }
  }

  return (
    <div className="relative h-full">
      {rankingPlace && (
        <div className={`absolute -top-5 -right-3 z-10 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 ${getPlaceColor(rankingPlace)}`}>
          {rankingPlace}
        </div>
      )}
      <Card 
          className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full" 
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
    </div>
  );
}
