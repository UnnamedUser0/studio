
'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestionMarkIcon } from '@/components/icons/question-mark-icon';
import { HeadsetIcon } from '@/components/icons/headset-icon';
import { ShieldIcon } from '@/components/icons/shield-icon';
import { DocumentIcon } from '@/components/icons/document-icon';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

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

const additionalResources = [
    {
        href: "https://wiki.openstreetmap.org/wiki/Overpass_API",
        text: "Documentación de la API Overpass",
        subtext: "(Datos de Pizzerías)"
    },
    {
        href: "https://operations.osmfoundation.org/policies/nominatim/",
        text: "Políticas de Uso de Nominatim",
        subtext: "(Geocodificación)"
    },
    {
        href: "https://leafletjs.com/reference.html",
        text: "Documentación de Leaflet",
        subtext: "(Biblioteca del Mapa)"
    }
];

function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
    </svg>
  );
}

export default function HelpPage() {
  return (
    <div className="container py-12 md:py-20">
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

      <div className="mt-16">
          <Card className="shadow-lg rounded-xl">
              <CardContent className="p-8 md:p-12">
                  <div className="max-w-2xl mx-auto text-center">
                      <h2 className="font-headline text-3xl font-bold relative inline-block">
                          Recursos Adicionales
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-primary rounded-full" />
                      </h2>
                      <p className="mt-6 text-muted-foreground">
                          Para obtener más información sobre cómo funciona Pizzapp y los datos que utilizamos, visita los siguientes recursos:
                      </p>
                  </div>
                  <div className="mt-8 max-w-lg mx-auto">
                      <ul className="space-y-4">
                          {additionalResources.map((resource, index) => (
                              <li key={index} className="border-b border-dashed pb-4">
                                  <Link href={resource.href} target="_blank" rel="noopener noreferrer" className="flex items-center group">
                                      <LinkIcon className="h-5 w-5 text-primary/70 mr-4 flex-shrink-0" />
                                      <span className="text-foreground group-hover:text-primary underline-offset-4 group-hover:underline">
                                          {resource.text} <span className="text-muted-foreground group-hover:text-primary/80">{resource.subtext}</span>
                                      </span>
                                  </Link>
                              </li>
                          ))}
                      </ul>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
