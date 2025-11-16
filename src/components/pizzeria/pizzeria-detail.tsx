'use client';
import Image from 'next/image';
import { Star, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Pizzeria, Review, User } from '@/lib/types';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

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

const ReviewCard = ({ review, pizzeriaId }: { review: Review, pizzeriaId: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => 
        user ? doc(firestore, 'users', user.uid) : null,
        [user, firestore]
    );
    const { data: userProfile } = useDoc<User>(userProfileRef);
    const isAdmin = userProfile?.isAdmin === true;

    const handleDelete = () => {
        if (!firestore) return;
        const reviewRef = doc(firestore, 'pizzerias', pizzeriaId, 'reviews', review.id);
        deleteDocumentNonBlocking(reviewRef);
    }

    return (
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
                 {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete review">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">{review.comment}</p>
            </CardContent>
        </Card>
    );
}

const AddReview = ({ pizzeriaId }: { pizzeriaId: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handlePublish = () => {
      if (!user || !firestore || rating === 0 || !comment) return;

      const reviewRef = collection(firestore, 'pizzerias', pizzeriaId, 'reviews');
      const newReview: Omit<Review, 'id'> = {
        author: user.displayName || user.email || 'Anónimo',
        userId: user.uid,
        pizzeriaId: pizzeriaId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };
      addDocumentNonBlocking(reviewRef, newReview);
      
      toast({
          title: "¡Opinión enviada!",
          description: "Gracias por compartir tu experiencia."
      });

      setComment('');
      setRating(0);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000); // Reset after 3 seconds
    };

    if (!user) {
        return (
            <Card className="text-center">
                <CardContent className="p-6">
                    <p className="text-muted-foreground">Debes <a href="/login" className="text-primary underline">iniciar sesión</a> para dejar una opinión.</p>
                </CardContent>
            </Card>
        )
    }

    if (submitted) {
        return (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-6 text-center text-green-700 dark:text-green-300">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">¡Gracias por tu opinión!</p>
                    <p className="text-sm">Tu comentario ha sido publicado.</p>
                </CardContent>
            </Card>
        );
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
                    <Button onClick={handlePublish} disabled={rating === 0 || !comment}>Publicar</Button>
                </div>
            </CardContent>
        </Card>
    )
}

type PizzeriaDetailProps = {
  pizzeria: Pizzeria;
};

export default function PizzeriaDetail({ pizzeria }: PizzeriaDetailProps) {
  const firestore = useFirestore();
  const reviewsQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'pizzerias', pizzeria.id, 'reviews') : null,
  [firestore, pizzeria.id]);
  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);
  
  const imageUrl = pizzeria.imageUrl || 'https://picsum.photos/seed/default/400/400';
  const imageHint = pizzeria.imageHint || 'pizza';

  return (
    <>
      <SheetHeader className="p-0 border-b relative">
        <div className="relative h-48 w-full">
            <Image 
                src={imageUrl} 
                alt={pizzeria.name}
                data-ai-hint={imageHint}
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
                {isLoading ? (
                  <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
                ) : (
                  reviews && reviews.map(review => <ReviewCard key={review.id} review={review} pizzeriaId={pizzeria.id} />)
                )}
                {reviews?.length === 0 && !isLoading && (
                  <p className="text-center text-muted-foreground py-4">Sé el primero en dejar una opinión.</p>
                )}
                <AddReview pizzeriaId={pizzeria.id}/>
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
