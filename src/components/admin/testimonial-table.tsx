'use client';
import type { Testimonial } from '@/lib/types';
import TestimonialCard from '../testimonial/testimonial-card';

interface TestimonialTableProps {
  testimonials: Testimonial[];
}

export default function TestimonialTable({ testimonials }: TestimonialTableProps) {

  if (testimonials.length === 0) {
    return <p className="text-center text-muted-foreground p-4">No hay testimonios de usuarios todavía.</p>
  }
  
  return (
    <div className="space-y-4">
        {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
    </div>
  );
}
