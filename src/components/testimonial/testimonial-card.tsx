'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Testimonial } from '@/lib/types';
import { Quote } from 'lucide-react';

type TestimonialCardProps = {
  testimonial: Testimonial;
};

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const avatarSeed = testimonial.email || testimonial.author;
  
  return (
    <Card className="h-full flex flex-col justify-between border-2 border-primary/10 hover:border-primary/30 transition-colors duration-300 shadow-sm">
      <CardContent className="p-6 flex-grow">
        <Quote className="h-8 w-8 text-primary/30 mb-4" />
        <p className="text-muted-foreground mb-6">&quot;{testimonial.comment}&quot;</p>
      </CardContent>
      <div className="bg-muted/50 p-6 border-t-2 border-primary/10">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={`https://api.dicebear.com/8.x/micah/svg?seed=${avatarSeed}`} alt={testimonial.author} />
            <AvatarFallback>{testimonial.author.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{testimonial.author}</p>
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

    