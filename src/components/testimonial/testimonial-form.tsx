'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { addTestimonial } from '@/app/actions';

export default function TestimonialForm({ onSuccess }: { onSuccess: () => void }) {
    const { data: session } = useSession();
    const user = session?.user;
    const { toast } = useToast();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment || !name) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Por favor, completa tu nombre y comentario.',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await addTestimonial({
                name,
                email: email || undefined,
                comment,
                role: 'Usuario de PizzApp',
                avatarUrl: user?.image || undefined
            });

            toast({
                title: '¡Gracias por tu opinión!',
                description: 'Tu testimonio ha sido enviado y aparecerá pronto.',
            });

            // Reset form and close dialog
            setComment('');
            onSuccess();
        } catch (error) {
            console.error("Error adding testimonial: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Hubo un problema al enviar tu comentario. Inténtalo de nuevo.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label htmlFor="comment" className="font-semibold">Comentario *</Label>
                <Textarea
                    id="comment"
                    placeholder="Escribe tu opinión sobre PizzApp aquí..."
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    className="mt-2"
                    disabled={isSubmitting}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="name" className="font-semibold">Nombre *</Label>
                    <Input
                        id="name"
                        placeholder="Tu nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-2"
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <Label htmlFor="email" className="font-semibold">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2"
                        disabled={isSubmitting}
                    />
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Tu dirección de correo electrónico no será publicada. Los campos obligatorios están marcados con *.
            </p>
            <div className="text-right">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Publicar el comentario'}
                </Button>
            </div>
        </form>
    );
}
