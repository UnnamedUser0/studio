import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestionMarkIcon } from '@/components/icons/question-mark-icon';
import { HeadsetIcon } from '@/components/icons/headset-icon';
import { ShieldIcon } from '@/components/icons/shield-icon';
import { DocumentIcon } from '@/components/icons/document-icon';
import Footer from '@/components/layout/footer';

const supportCards = [
  {
    icon: <QuestionMarkIcon className="h-8 w-8 text-primary" />,
    title: 'Preguntas Frecuentes',
    description: 'Consulta nuestra sección de preguntas frecuentes para encontrar respuestas rápidas a los problemas más comunes.',
    buttonText: 'Ver FAQ',
    link: '/faq',
  },
  {
    icon: <HeadsetIcon className="h-8 w-8 text-primary" />,
    title: 'Contacta con Nosotros',
    description: '¿No encuentras lo que buscas? Nuestro equipo de soporte está listo para ayudarte personalmente.',
    buttonText: 'Contactar',
    link: '/contact',
  },
  {
    icon: <ShieldIcon className="h-8 w-8 text-primary" />,
    title: 'Política de Privacidad',
    description: 'Lee nuestra política de privacidad para entender cómo manejamos tus datos personales.',
    buttonText: 'Leer Política',
    link: '/privacy',
  },
  {
    icon: <DocumentIcon className="h-8 w-8 text-primary" />,
    title: 'Términos de Uso',
    description: 'Consulta los términos y condiciones que rigen el uso de la aplicación PizzApp.',
    buttonText: 'Ver Términos',
    link: '/terms',
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <div className="flex-grow container py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Centro de Soporte</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Estamos aquí para ayudarte. Encuentra los recursos que necesitas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {supportCards.slice(0, 3).map((card, index) => (
            <Card key={index} className="text-center shadow-lg rounded-xl flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="items-center">
                <div className="bg-primary/10 rounded-full p-4">
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <CardTitle className="font-headline text-2xl mb-2">{card.title}</CardTitle>
                <CardDescription className="flex-grow mb-6">{card.description}</CardDescription>
                <Button asChild variant="outline">
                  <Link href={card.link}>{card.buttonText}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
           <div className="md:col-span-2 lg:col-span-1 lg:col-start-2">
             <Card className="text-center shadow-lg rounded-xl flex flex-col hover:border-primary/50 transition-colors h-full">
                <CardHeader className="items-center">
                    <div className="bg-primary/10 rounded-full p-4">
                    {supportCards[3].icon}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                    <CardTitle className="font-headline text-2xl mb-2">{supportCards[3].title}</CardTitle>
                    <CardDescription className="flex-grow mb-6">{supportCards[3].description}</CardDescription>
                    <Button asChild variant="outline">
                    <Link href={supportCards[3].link}>{supportCards[3].buttonText}</Link>
                    </Button>
                </CardContent>
             </Card>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
