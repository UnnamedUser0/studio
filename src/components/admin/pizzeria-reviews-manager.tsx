'use client';
import { useState, useEffect } from 'react';
import { Pizzeria, Review } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReviewCard from '@/components/pizzeria/review-card';
import { Loader2, MessageSquare } from 'lucide-react';
import { getReviews } from '@/app/actions';

interface PizzeriaReviewsManagerProps {
    pizzerias: Pizzeria[];
}

export default function PizzeriaReviewsManager({ pizzerias }: PizzeriaReviewsManagerProps) {
    const [selectedPizzeria, setSelectedPizzeria] = useState<Pizzeria | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pizzerias.map((pizzeria) => (
                    <Card
                        key={pizzeria.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setSelectedPizzeria(pizzeria)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {pizzeria.name}
                            </CardTitle>
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="text-xs">{pizzeria.reviewCount || 0}</span>
                                <MessageSquare className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pizzeria.rating?.toFixed(1) || 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">
                                {pizzeria.address}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Sheet open={!!selectedPizzeria} onOpenChange={(open) => !open && setSelectedPizzeria(null)}>
                <SheetContent className="w-[90vw] max-w-[600px] flex flex-col p-0 sm:max-w-[600px]">
                    {selectedPizzeria && (
                        <PizzeriaReviewsSheetContent pizzeria={selectedPizzeria} />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

function PizzeriaReviewsSheetContent({ pizzeria }: { pizzeria: Pizzeria }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getReviews(pizzeria.id).then((data) => {
            const adaptedReviews = data.map(r => ({
                id: r.id.toString(),
                author: r.user.name || r.user.email?.split('@')[0] || 'Anónimo',
                userId: r.userId,
                pizzeriaId: r.pizzeriaId,
                rating: r.rating,
                comment: r.comment || '',
                createdAt: r.createdAt.toISOString(),
                avatarUrl: r.user.image || undefined,
            }));
            setReviews(adaptedReviews);
            setIsLoading(false);
        });
    }, [pizzeria.id]);

    return (
        <>
            <SheetHeader className="p-6 border-b">
                <SheetTitle>Opiniones de {pizzeria.name}</SheetTitle>
                <SheetDescription>
                    Gestiona las opiniones de los usuarios para esta pizzería.
                </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} pizzeriaId={pizzeria.id} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        No hay opiniones para esta pizzería.
                    </div>
                )}
            </ScrollArea>
        </>
    );
}
