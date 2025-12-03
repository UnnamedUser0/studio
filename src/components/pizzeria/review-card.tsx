'use client';
import { Star, Trash2, MessageSquareReply, CornerDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Review } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { deleteReview, replyReview } from '@/app/actions';

export default function ReviewCard({ review, pizzeriaId }: { review: Review, pizzeriaId: string }) {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
    const [replyText, setReplyText] = useState(review.reply?.text || '');

    const isAdmin = (session?.user as any)?.isAdmin === true;

    const handleDelete = async () => {
        if (!isAdmin) return;

        try {
            await deleteReview(Number(review.id));
            toast({
                title: 'Opinión eliminada',
                description: 'La opinión ha sido borrada.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo eliminar la opinión.',
                variant: 'destructive',
            });
        }
    }

    const handleReply = async () => {
        if (!isAdmin || !replyText) return;

        try {
            await replyReview(Number(review.id), replyText);
            toast({
                title: 'Respuesta publicada',
                description: 'Tu respuesta ha sido añadida a la opinión.',
            });
            setIsReplyDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo publicar la respuesta.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Card>
            <CardHeader className="flex-row gap-4 items-start p-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage
                        src={
                            (session?.user?.id && review.userId === session.user.id && session.user.image)
                                ? session.user.image
                                : (review.avatarUrl || `https://api.dicebear.com/8.x/micah/svg?seed=${review.userId}`)
                        }
                        alt={review.author}
                    />
                    <AvatarFallback>{review.author ? review.author.charAt(0) : 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{review.author || 'Anónimo'}</p>
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-4 h-4 ${review.rating >= star ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                        {new Date(review.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {/* Admin buttons moved to CardFooter */}
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                {review.reply && (
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-accent">
                        <p className="text-sm font-semibold text-accent">Respuesta del propietario:</p>
                        <p className="text-sm text-muted-foreground italic">&quot;{review.reply.text}&quot;</p>
                    </div>
                )}
            </CardContent>
            {
                isAdmin && (
                    <CardFooter className="p-2 bg-muted/50 border-t justify-end gap-2">
                        <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MessageSquareReply className="h-4 w-4 mr-2" />
                                    {review.reply ? 'Editar' : 'Responder'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Responder a {review.author}</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div>
                                        <Label htmlFor="reply-text" className="sr-only">Tu respuesta</Label>
                                        <Textarea
                                            id="reply-text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Escribe tu respuesta aquí..."
                                            rows={4}
                                        />
                                    </div>
                                    <blockquote className="border-l-2 pl-4 italic text-sm text-muted-foreground">
                                        &quot;{review.comment}&quot;
                                    </blockquote>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="ghost">Cancelar</Button>
                                    </DialogClose>
                                    <Button onClick={handleReply} disabled={!replyText}>
                                        <CornerDownLeft className="h-4 w-4 mr-2" />
                                        Publicar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Borrar
                        </Button>
                    </CardFooter>
                )
            }
        </Card >
    );
}
