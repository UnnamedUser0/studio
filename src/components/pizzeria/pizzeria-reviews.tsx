'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star, Loader2, CheckCircle, MessageSquareReply, Trash2, Phone, Globe, Share2 } from 'lucide-react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addReview, getReviews, deleteReview, replyReview } from '@/app/actions';
import type { Pizzeria, Review } from '@/lib/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

const AddReview = ({ pizzeriaId, onReviewAdded }: { pizzeriaId: string, onReviewAdded: () => void }) => {
    const { data: session } = useSession();
    const user = session?.user;
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handlePublish = async () => {
        if (!user || !user.id || rating === 0 || !comment) return;

        try {
            await addReview(pizzeriaId, rating, comment, user.id);
            toast({
                title: "¡Opinión enviada!",
                description: "Gracias por compartir tu experiencia."
            });

            setComment('');
            setRating(0);
            setSubmitted(true);
            onReviewAdded();
            setTimeout(() => setSubmitted(false), 3000);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo enviar la opinión.",
                variant: "destructive"
            });
        }
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
                    placeholder={`¿Qué te pareció, ${user.name || user.email}?`}
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

const ReviewCard = ({ review, pizzeriaId, onReviewUpdated }: { review: Review, pizzeriaId: string, onReviewUpdated?: () => void }) => {
    const { data: session } = useSession();
    const isAdmin = session?.user?.isAdmin;
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const { toast } = useToast();

    const handleDelete = async () => {
        if (!confirm('¿Eliminar esta opinión?')) return;
        try {
            await deleteReview(parseInt(review.id));
            toast({ title: "Opinión eliminada" });
            if (onReviewUpdated) onReviewUpdated();
        } catch (e) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const handleReply = async () => {
        if (!replyText) return;
        try {
            await replyReview(parseInt(review.id), replyText);
            toast({ title: "Respuesta enviada" });
            setIsReplying(false);
            if (onReviewUpdated) onReviewUpdated();
        } catch (e) {
            toast({ title: "Error al responder", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={review.avatarUrl} />
                            <AvatarFallback>{review.author[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{review.author}</p>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-gray-200 fill-gray-200"}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: es })}
                    </span>
                </div>
                <p className="text-sm">{review.comment}</p>

                {review.reply && (
                    <div className="bg-muted p-3 rounded-md text-sm ml-4 border-l-2 border-primary">
                        <p className="font-semibold text-xs text-primary mb-1">Respuesta del propietario:</p>
                        <p>{review.reply.text}</p>
                    </div>
                )}

                {isAdmin && !review.reply && (
                    <div className="pt-2 border-t flex justify-end gap-2">
                        {isReplying ? (
                            <div className="w-full space-y-2">
                                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Escribe una respuesta..." className="text-sm" />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancelar</Button>
                                    <Button size="sm" onClick={handleReply}>Responder</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Button size="sm" variant="ghost" onClick={() => setIsReplying(true)}>
                                    <MessageSquareReply className="w-4 h-4 mr-1" /> Responder
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                                    <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                                </Button>
                            </>
                        )}
                    </div>
                )}
                {isAdmin && review.reply && (
                    <div className="pt-2 border-t flex justify-end">
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4 mr-1" /> Eliminar Opinión
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function PizzeriaReviews({ pizzeria }: { pizzeria: Pizzeria }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReviews = () => {
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
                reply: r.replyText ? {
                    text: r.replyText,
                    repliedAt: r.repliedAt ? r.repliedAt.toISOString() : new Date().toISOString()
                } : undefined
            }));
            setReviews(adaptedReviews);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        fetchReviews();
    }, [pizzeria.id]);

    const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : pizzeria.rating || 0;

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
            <div className="flex flex-wrap gap-4 px-6 py-4 text-sm text-muted-foreground border-b bg-muted/20 shrink-0">
                {pizzeria.phoneNumber && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${pizzeria.phoneNumber}`} className="hover:underline hover:text-primary transition-colors">{pizzeria.phoneNumber}</a>
                    </div>
                )}
                {pizzeria.website && (
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <a href={pizzeria.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">Sitio Web</a>
                    </div>
                )}
                {pizzeria.socialMedia && (
                    <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        <a href={pizzeria.socialMedia} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">Red Social</a>
                    </div>
                )}
            </div>
            <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <h3 className="font-headline text-xl text-foreground">Calificación General</h3>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <div className="flex items-center text-2xl font-bold">
                                <Star className="w-6 h-6 text-accent fill-accent mr-2" />
                                {averageRating.toFixed(1)}
                            </div>
                            <p className="text-muted-foreground">basado en {reviews?.length || 0} opiniones</p>
                        </CardContent>
                    </Card>

                    <div id="reviews-list">
                        <h3 className="font-headline text-xl mb-4 text-foreground">Opiniones de la Comunidad</h3>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                            ) : (
                                reviews && reviews.map(review => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        pizzeriaId={pizzeria.id}
                                        onReviewUpdated={fetchReviews}
                                    />
                                ))
                            )}
                            {reviews?.length === 0 && !isLoading && (
                                <p className="text-center text-muted-foreground py-4">Sé el primero en dejar una opinión.</p>
                            )}
                            <AddReview pizzeriaId={pizzeria.id} onReviewAdded={fetchReviews} />
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </>
    );
}
