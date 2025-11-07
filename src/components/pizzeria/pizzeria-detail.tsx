'use client';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Pizzeria, Review } from '@/lib/pizzeria-data';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const StarRatingInput = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-5 h-5 cursor-pointer transition-colors ${rating >= star ? 'text-accent fill-accent' : 'text-muted-foreground/50 hover:text-accent'}`}
                onClick={() => setRating(star)}
            />
        ))}
    </div>
);


const ReviewCard = ({ review }: {review: Review}) => (
    <Card>
        <CardHeader className="flex-row gap-4 items-center p-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={`https://api.dicebear.com/8.x/micah/svg?seed=${review.author}`} alt={review.author} />
                <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className="font-semibold">{review.author}</p>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                              key={star}
                              className={`w-4 h-4 ${review.rating >= star ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`}
                          />
                      ))}
                  </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground">{review.comment}</p>
        </CardContent>
    </Card>
)

const AddReview = () => {
    const { user } = useUser();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    if (!user) {
        return (
            <Card className="text-center">
                <CardContent className="p-6">
                    <p className="text-muted-foreground">Debes <a href="/login" className="text-primary underline">iniciar sesión</a> para dejar una opinión.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <h4 className="font-headline text-lg">Deja tu opinión</h4>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    placeholder={`¿Qué te pareció, ${user.displayName || user.email}?`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex justify-between items-center">
                    <StarRatingInput rating={rating} setRating={setRating} />
                    <Button>Publicar</Button>
                </div>
            </CardContent>
        </Card>
    )

}

type PizzeriaDetailProps = {
  pizzeria: Pizzeria;
};

export default function PizzeriaDetail({ pizzeria }: PizzeriaDetailProps) {
  return (
    <>
      <SheetHeader className="p-0 border-b relative">
        <div className="relative h-48 w-full">
            <Image 
                src={pizzeria.imageUrl} 
                alt={pizzeria.name}
                data-ai-hint={pizzeria.imageHint}
                fill
                sizes="(max-width: 640px) 90vw, 440px"
                className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="p-6 pt-2 absolute bottom-0 w-full">
            <SheetTitle className="font-headline text-3xl text-primary-foreground">{pizzeria.name}</SheetTitle>
            <SheetDescription className="text-muted-foreground/80">{pizzeria.address}</SheetDescription>
        </div>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div id="ranking">
            <h3 className="font-headline text-xl mb-4 text-foreground">Opiniones</h3>
            <div className="space-y-4">
                {pizzeria.reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                <AddReview />
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
