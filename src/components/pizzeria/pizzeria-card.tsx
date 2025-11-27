'use client';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import type { Pizzeria } from '@/lib/types';
import { cn } from '@/lib/utils';

type PizzeriaCardProps = {
  pizzeria: Pizzeria;
  onClick: () => void;
  rankingPlace?: number;
  compact?: boolean;
};

export default function PizzeriaCard({ pizzeria, onClick, rankingPlace, compact }: PizzeriaCardProps) {

  const getGlowClass = (place?: number) => {
    if (!place) return '';
    switch (place) {
      case 1: return 'glow-gold';
      case 2: return 'glow-silver';
      case 3: return 'glow-bronze';
      default: return '';
    }
  }

  // Fallback for missing reviews
  const reviewsCount = 0; // Temporarily set to 0 as reviews are now loaded separately
  const rating = pizzeria.rating || 0;
  const imageUrl = pizzeria.imageUrl || 'https://picsum.photos/seed/default/400/400';
  const imageHint = pizzeria.imageHint || 'pizza';

  return (
    <div className="relative h-full w-full">
      <Card
        className={cn(
          "overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full z-10",
          getGlowClass(rankingPlace)
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      >
        <CardContent className={cn("p-0 flex items-center", compact && "flex-col items-start")}>
          <div className={cn("relative flex-shrink-0", compact ? "w-full h-24" : "w-28 h-28")}>
            <Image
              src={imageUrl}
              alt={pizzeria.name}
              data-ai-hint={imageHint}
              fill
              sizes={compact ? "100vw" : "112px"}
              className="object-cover"
            />
          </div>
          <div className={cn("flex-1 min-w-0", compact ? "p-2 w-full" : "p-4")}>
            <h3 className={cn("font-headline font-semibold truncate", compact ? "text-sm" : "text-lg")}>{pizzeria.name}</h3>
            {!compact && <p className="text-sm text-muted-foreground truncate">{pizzeria.address}</p>}
            <div className="flex items-center mt-1">
              <Star className="w-3 h-3 md:w-4 md:h-4 text-accent fill-accent" />
              <span className="ml-1 font-bold text-foreground text-xs md:text-sm">{rating.toFixed(1)}</span>
              {!compact && <span className="ml-2 text-sm text-muted-foreground">({reviewsCount} opiniones)</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
