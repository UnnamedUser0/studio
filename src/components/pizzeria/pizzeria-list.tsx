'use client';
import { pizzerias } from '@/lib/pizzeria-data';
import type { Pizzeria } from '@/lib/pizzeria-data';
import PizzeriaCard from './pizzeria-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

type PizzeriaListProps = {
  onPizzeriaSelect: (pizzeria: Pizzeria) => void;
};

export default function PizzeriaList({ onPizzeriaSelect }: PizzeriaListProps) {
  return (
    <>
      <SheetHeader className="p-6 border-b text-left">
        <SheetTitle className="font-headline text-3xl">Pizzerías</SheetTitle>
        <SheetDescription>Explora las pizzerías mejor valoradas de Hermosillo.</SheetDescription>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {pizzerias.sort((a,b) => b.rating - a.rating).map((pizzeria) => (
            <PizzeriaCard key={pizzeria.id} pizzeria={pizzeria} onClick={() => onPizzeriaSelect(pizzeria)} />
          ))}
        </div>
      </ScrollArea>
    </>
  );
}
