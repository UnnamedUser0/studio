'use client';

import { useState } from 'react';
import type { Pizzeria } from '@/lib/pizzeria-data';
import PizzaMap from '@/components/map/pizza-map';
import SmartSearch from '@/components/search/smart-search';
import PizzeriaList from '@/components/pizzeria/pizzeria-list';
import PizzeriaDetail from '@/components/pizzeria/pizzeria-detail';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Home() {
  const [selectedPizzeria, setSelectedPizzeria] = useState<Pizzeria | null>(null);

  const handleSelectPizzeria = (pizzeria: Pizzeria) => {
    setSelectedPizzeria(pizzeria);
  };

  return (
    <div className="h-full w-full">
      <div className="absolute inset-0">
        <PizzaMap onMarkerClick={handleSelectPizzeria} selectedPizzeria={selectedPizzeria} />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" className="shadow-lg animate-fade-in-down">
              <List className="mr-2 h-5 w-5" />
              Explorar Pizzerías
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-[440px] p-0 flex flex-col">
            <PizzeriaList onPizzeriaSelect={handleSelectPizzeria} />
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm md:max-w-md lg:max-w-lg px-4">
        <SmartSearch />
      </div>

      <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && setSelectedPizzeria(null)}>
        <SheetContent side="right" className="w-[90vw] max-w-[440px] p-0 flex flex-col" aria-describedby={undefined}>
          {selectedPizzeria && <PizzeriaDetail pizzeria={selectedPizzeria} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
