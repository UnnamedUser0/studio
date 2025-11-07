'use client';
import type { Pizzeria } from '@/lib/types';
import PizzeriaCard from './pizzeria-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '../ui/button';
import { X, Loader2 } from 'lucide-react';

type PizzeriaListProps = {
  pizzerias: Pizzeria[];
  onPizzeriaSelect: (pizzeria: Pizzeria) => void;
  isSearching: boolean;
  onClearSearch: () => void;
  isLoading: boolean;
};

export default function PizzeriaList({ pizzerias, onPizzeriaSelect, isSearching, onClearSearch, isLoading }: PizzeriaListProps) {
  const title = isSearching ? 'Resultados de Búsqueda' : 'Mejores Pizzerías';
  const description = isSearching 
    ? `Se encontraron ${pizzerias.length} pizzerías.` 
    : 'Explora las pizzerías mejor calificadas de Hermosillo.';

  return (
    <>
      <SheetHeader className="p-6 border-b text-left">
        <div className="flex justify-between items-center">
          <div>
            <SheetTitle className="font-headline text-3xl">{title}</SheetTitle>
            <SheetDescription>
              {description}
            </SheetDescription>
          </div>
          {isSearching && (
            <Button variant="ghost" size="icon" onClick={onClearSearch}>
              <X className="h-5 w-5" />
              <span className="sr-only">Limpiar búsqueda</span>
            </Button>
          )}
        </div>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pizzerias.length > 0 ? (
            pizzerias.map((pizzeria) => (
              <PizzeriaCard key={pizzeria.id} pizzeria={pizzeria} onClick={() => onPizzeriaSelect(pizzeria)} />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>{isSearching ? 'No se encontraron resultados.' : 'No hay pizzerías para mostrar.'}</p>
              {isSearching && <p className="text-sm">Intenta con otro término de búsqueda.</p>}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
