
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});


import { ScrollReveal } from '@/components/ui/scroll-reveal';

// ... imports

export default function ContactPage() {
  return (
    <div className="container py-12 md:py-20 flex items-center justify-center">
      <ScrollReveal className="w-full max-w-2xl">
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-4xl">Contacta con Nosotros</CardTitle>
            <CardDescription className="text-lg">
              ¿Tienes preguntas o sugerencias? Rellena el formulario y te responderemos pronto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Tu nombre" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" placeholder="tu@correo.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input id="subject" placeholder="Ej: Sugerir una pizzería" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea id="message" placeholder="Escribe tu mensaje aquí..." rows={5} />
              </div>
              <div className="text-center">
                <Button type="submit" size="lg">Enviar Mensaje</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
