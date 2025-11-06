'use client';

import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { testimonials } from '@/lib/testimonial-data';
import TestimonialCard from './testimonial-card';

export default function TestimonialsCarousel() {
  const plugin = React.useRef(Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true }));

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      opts={{
        align: 'start',
        loop: true,
      }}
    >
      <CarouselContent>
        {testimonials.map((testimonial) => (
          <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1 h-full">
              <TestimonialCard testimonial={testimonial} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
