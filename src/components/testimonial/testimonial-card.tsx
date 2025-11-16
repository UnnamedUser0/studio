'use client';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Testimonial } from '@/lib/types';
import { Quote, Trash2, MessageSquareReply } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '../ui/button';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'va21070541@bachilleresdesonora.edu.mx';

type TestimonialCardProps = {
  testimonial: Testimonial;
};

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isAdmin = user?.email === ADMIN_EMAIL;
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

  return (
    <Card className="h-full flex flex-col justify-between border-2 border-primary/10 hover:border-primary/30 transition-colors duration-300 shadow-sm">
      <div>
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
      </div>
      {isAdmin && (
        <CardFooter className="p-2 bg-muted/50 border-t-2 border-primary/10 justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => alert('Funcionalidad de respuesta no implementada.')}>
            <MessageSquareReply className="h-4 w-4 mr-2" />
            Responder
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Borrar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
