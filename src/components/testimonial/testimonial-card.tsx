'use client';
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Testimonial } from '@/lib/types';
import { Quote, Trash2, MessageSquareReply, CornerDownLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { deleteTestimonial, replyTestimonial } from '@/app/actions';

type TestimonialCardProps = {
  testimonial: Testimonial;
  canManageContent?: boolean;
};

export default function TestimonialCard({ testimonial, canManageContent }: TestimonialCardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState(testimonial.reply?.text || '');

  const permissions = (session?.user as any)?.permissions as string | null;
  const userEmail = session?.user?.email;
  const SUPER_ADMIN_EMAIL = "va21070541@bachilleresdesonora.edu.mx";

  const hasPermission = (perm: string) => {
    if (userEmail === SUPER_ADMIN_EMAIL) return true;
    if (!permissions) return false;
    return permissions.split(',').map(p => p.trim()).includes(perm);
  };

  const isAdmin = canManageContent !== undefined
    ? canManageContent
    : ((session?.user as any)?.isAdmin === true && hasPermission('manage_content'));

  const avatarSeed = testimonial.email || testimonial.author;

  const handleDelete = async () => {
    if (!isAdmin) return;

    try {
      await deleteTestimonial(Number(testimonial.id));
      toast({
        title: 'Testimonio eliminado',
        description: 'El testimonio ha sido borrado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el testimonio.',
        variant: 'destructive',
      });
    }
  };

  const handleReply = async () => {
    if (!isAdmin || !replyText) return;

    try {
      await replyTestimonial(Number(testimonial.id), replyText);
      toast({
        title: 'Respuesta publicada',
        description: 'Tu respuesta ha sido añadida al testimonio.',
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
    <Card className="h-full flex flex-col justify-between border-2 border-primary/10 hover:border-primary/30 transition-colors duration-300 shadow-sm">
      <div>
        <CardContent className="p-6 flex-grow">
          <Quote className="h-8 w-8 text-primary/30 mb-4" />
          <p className="text-muted-foreground mb-4">&quot;{testimonial.comment}&quot;</p>

          {testimonial.reply && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-accent">
              <p className="text-sm font-semibold text-accent">Respuesta del equipo:</p>
              <p className="text-sm text-muted-foreground italic">&quot;{testimonial.reply.text}&quot;</p>
            </div>
          )}
        </CardContent>
        <div className="bg-muted/50 p-6 border-t-2 border-primary/10">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage
                src={
                  (session?.user?.email && testimonial.email === session.user.email && session.user.image)
                    ? session.user.image
                    : (testimonial.avatarUrl || `https://api.dicebear.com/8.x/micah/svg?seed=${avatarSeed}`)
                }
                alt={testimonial.author}
              />
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
