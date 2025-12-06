'use client';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, UtensilsCrossed, Star } from 'lucide-react';
import type { Pizzeria } from '@/lib/types';
import { cn } from '@/lib/utils';

import { LayoutSettings } from '@/components/admin/layout-editor';

type PizzeriaCardProps = {
  pizzeria: Pizzeria;
  onClick: () => void;
  rankingPlace?: number;
  compact?: boolean;
  onViewMenu?: () => void;
  onNavigate?: () => void;
  onRate?: () => void;
  layoutSettings?: LayoutSettings;
};

export default function PizzeriaCard({ pizzeria, onClick, rankingPlace, compact, onViewMenu, onNavigate, onRate, layoutSettings }: PizzeriaCardProps) {

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
  const reviewsCount = pizzeria.reviewCount || 0;
  const rating = pizzeria.rating || 0;
  const imageUrl = pizzeria.imageUrl || 'https://picsum.photos/seed/default/400/400';
  const imageHint = pizzeria.imageHint || 'pizza';

  const cardScale = layoutSettings?.cardScale || 1;
  const buttonScale = layoutSettings?.buttonScale || 1;
  const buttonLayout = layoutSettings?.buttonLayout || 'grid';

  return (
    <div className="relative h-full w-full" style={{ fontSize: `${cardScale}rem` }}>
      <Card
        className={cn(
          "overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full z-10 flex flex-col",
          getGlowClass(rankingPlace)
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      >
        <CardContent className={cn("p-0 flex items-center flex-1", compact && "flex-col items-start")}>
          <div className={cn("relative flex-shrink-0", compact ? "w-full" : "w-28 h-28")} style={compact ? { height: `${6 * cardScale}rem` } : {}}>
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
            <h3 className={cn("font-headline font-semibold truncate")} style={{ fontSize: compact ? `${0.875 * cardScale}rem` : `${1.125 * cardScale}rem` }}>{pizzeria.name}</h3>
            {!compact && <p className="text-muted-foreground truncate" style={{ fontSize: `${0.875 * cardScale}rem` }}>{pizzeria.address}</p>}
            <div className="flex items-center mt-1">
              <Star className="text-accent fill-accent" style={{ width: `${1 * cardScale}rem`, height: `${1 * cardScale}rem` }} />
              <span className="ml-1 font-bold text-foreground" style={{ fontSize: `${0.75 * cardScale}rem` }}>{rating.toFixed(1)}</span>
              {!compact && <span className="ml-2 text-muted-foreground" style={{ fontSize: `${0.875 * cardScale}rem` }}>({reviewsCount} opiniones)</span>}
            </div>
          </div>
        </CardContent>
        {(onViewMenu || onNavigate || onRate) && !compact && (
          <div className="p-3 pt-0 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className={cn("gap-1.5", buttonLayout === 'grid' ? "grid grid-cols-2" : "flex flex-col")}>
              {onViewMenu && (
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm"
                  onClick={onViewMenu}
                  style={{ transform: `scale(${buttonScale})`, transformOrigin: 'center' }}
                >
                  Ver menú
                </Button>
              )}
              {onNavigate && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full bg-black text-white hover:bg-gray-800 shadow-sm"
                  onClick={onNavigate}
                  style={{ transform: `scale(${buttonScale})`, transformOrigin: 'center' }}
                >
                  Cómo llegar
                </Button>
              )}
            </div>
            {onRate && (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                onClick={onRate}
                style={{ transform: `scale(${buttonScale})`, transformOrigin: 'center' }}
              >
                <Star className="mr-1.5 fill-current" style={{ width: `${0.75 * buttonScale}rem`, height: `${0.75 * buttonScale}rem` }} />
                Calificar
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
