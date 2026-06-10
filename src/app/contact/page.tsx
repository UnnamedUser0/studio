'use client'

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { sendContactMessage } from '@/app/actions/contact';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

export default function ContactPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo demasiado grande",
          description: "La imagen no debe superar los 5MB.",
          variant: "destructive"
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, completa todos los campos del formulario.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await sendContactMessage({
        ...formData,
        image: image || undefined
      });
      toast({
        title: "¡Mensaje Enviado! 🎉",
        description: "Tu consulta de soporte ha sido registrada. Te responderemos a la brevedad.",
        className: "bg-green-500 text-white border-none",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setImage(null);
      
      // Reset file input if present
      const fileInput = document.getElementById('image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al enviar",
        description: err.message || "Ocurrió un error al enviar el mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 md:py-20 flex flex-col items-center justify-center">
      <ScrollReveal className="w-full max-w-2xl">
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-4xl">Contacta con Nosotros</CardTitle>
            <CardDescription className="text-lg mt-2">
              ¿Tienes preguntas o sugerencias? Rellena el formulario y te responderemos pronto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    placeholder="Tu nombre" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="tu@correo.com" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input 
                  id="subject" 
                  placeholder="Ej: Sugerir una pizzería" 
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea 
                  id="message" 
                  placeholder="Escribe tu mensaje aquí..." 
                  rows={5} 
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Adjuntar Imagen (Opcional)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="image" 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="cursor-pointer flex-1"
                  />
                  {image && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => {
                        setImage(null);
                        const fileInput = document.getElementById('image') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      disabled={loading}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
                {image && (
                  <div className="mt-2 relative w-32 h-32 border rounded overflow-hidden">
                    <img src={image} alt="Vista previa" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Mensaje"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
