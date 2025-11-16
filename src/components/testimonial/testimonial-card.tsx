'use client';
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Testimonial, User } from '@/lib/types';
import { Quote, Trash2, MessageSquareReply, CornerDownLeft } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '../ui/button';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

type TestimonialCardProps = {
  testimonial: Testimonial;
};

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState(testimonial.reply?.text || '');
  
  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile } = useDoc<User>(userProfileRef);
  const isAdmin = userProfile?.isAdmin === true;
  
  const avatarSeed = testimonial.email || testimonial.author;

  const handleDelete = () => {
    if (!firestore || !isAdmin) return;

    const testimonialRef = doc(firestore, 'testimonials', testimonial.id);
    deleteDocumentNonBlocking(testimonialRef);

    toast({
      title: 'Testimonio eliminado',
      description: 'El testimonio ha sido borrado correctamente.',
    });
  };

  const handleReply = () => {
    if (!firestore || !isAdmin || !replyText) return;

    const testimonialRef = doc(firestore, 'testimonials', testimonial.id);
    const replyData = {
      reply: {
        text: replyText,
        repliedAt: new Date().toISOString(),
      },
    };

    updateDocumentNonBlocking(testimonialRef, replyData);

    toast({
      title: 'Respuesta publicada',
      description: 'Tu respuesta ha sido añadida al testimonio.',
    });
    setIsReplyDialogOpen(false);
  };

  return (
    <Card className="h-full flex flex-col justify-between border-2 border-primary/10 hover:border-primary/30 transition-colors duration-300 shadow-sm">
      <div>
        <CardContent className="p-6 flex-grow">
          <Quote className="h-8 w-8 text-primary/30 mb-4" />
          <p className="text-muted-foreground mb-4">&quot;{testimonial.comment}&quot;</p>
          
          {testimonial.reply && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-accent">
                <p className="text-sm font-semibold text-accent-foreground/90">Respuesta del equipo:</p>
                <p className="text-sm text-muted-foreground italic">&quot;{testimonial.reply.text}&quot;</p>
            </div>
          )}
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
      </div>
      {isAdmin && (
        <CardFooter className="p-2 bg-muted/50 border-t-2 border-primary/10 justify-end gap-2">
           <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <MessageSquareReply className="h-4 w-4 mr-2" />
                {testimonial.reply ? 'Editar Respuesta' : 'Responder'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Responder a {testimonial.author}</DialogTitle>
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
                  &quot;{testimonial.comment}&quot;
                </blockquote>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleReply} disabled={!replyText}>
                  <CornerDownLeft className="h-4 w-4 mr-2" />
                  Publicar Respuesta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Borrar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
