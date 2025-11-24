'use client';
import { Star, Trash2, MessageSquareReply, CornerDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Review, User } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ReviewCard({ review, pizzeriaId }: { review: Review, pizzeriaId: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
    const [replyText, setReplyText] = useState(review.reply?.text || '');

    const userProfileRef = useMemoFirebase(() =>
        user ? doc(firestore, 'users', user.uid) : null,
        [firestore, user]
    );
    const { data: userProfile } = useDoc<User>(userProfileRef);
    const isAdmin = userProfile?.isAdmin === true;

    const handleDelete = () => {
        if (!firestore) return;
        const reviewRef = doc(firestore, 'pizzerias', pizzeriaId, 'reviews', review.id);

        deleteDoc(reviewRef).then(() => {
            toast({
                title: 'Opinión eliminada',
                description: 'La opinión ha sido borrada.',
            });
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: reviewRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    const handleReply = () => {
        if (!firestore || !isAdmin || !replyText) return;

        const reviewRef = doc(firestore, 'pizzerias', pizzeriaId, 'reviews', review.id);
        const replyData = {
            reply: {
                text: replyText,
                repliedAt: new Date().toISOString(),
            },
        };

        updateDoc(reviewRef, replyData).then(() => {
            toast({
                title: 'Respuesta publicada',
                description: 'Tu respuesta ha sido añadida a la opinión.',
            });
            setIsReplyDialogOpen(false);
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: reviewRef.path,
                operation: 'update',
                requestResourceData: replyData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    return (
        <Card>
            <CardHeader className="flex-row gap-4 items-start p-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/8.x/micah/svg?seed=${review.userId}`} alt={review.author} />
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
