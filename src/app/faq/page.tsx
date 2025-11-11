import dynamic from 'next/dynamic';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, MapPin, Headset, Plus, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

const faqCategories = [
  {
    title: 'Uso de la Aplicación',
    icon: <Smartphone className="h-6 w-6" />,
    questions: [
      {
        question: '¿Cómo busco pizzerías en PizzApp?',
        answer: 'Puedes usar la barra de búsqueda en la parte superior para escribir el nombre, la dirección o una colonia. También puedes explorar el mapa interactivo en la página de inicio para ver las pizzerías cercanas a ti.',
      },
      {
        question: '¿Necesito registrarme para usar PizzApp?',
        answer: 'No es necesario registrarse para explorar pizzerías, ver sus menús o ubicaciones. Sin embargo, para dejar opiniones, calificar y guardar tus lugares favoritos, sí necesitarás crear una cuenta gratuita.',
      },
      {
        question: '¿Qué información puedo ver sobre una pizzería?',
        answer: 'Para cada pizzería, puedes ver su dirección, ubicación en el mapa, calificación promedio, y las opiniones y comentarios dejados por otros usuarios de la comunidad.',
      },
    ],
  },
  {
    title: 'Datos y Mapas',
    icon: <MapPin className="h-6 w-6" />,
    questions: [
      {
        question: '¿De dónde proviene la información de las pizzerías?',
        answer: 'La información inicial es recopilada por nuestro equipo y validada constantemente por la comunidad. Los dueños de negocios también podrán reclamar y actualizar sus perfiles próximamente.',
      },
      {
        question: '¿Por qué algunas pizzerías no aparecen en la búsqueda?',
        answer: 'Nuestro buscador inteligente intenta encontrar la mejor coincidencia. Si una pizzería es nueva o no está en nuestra base de datos, es posible que no aparezca. ¡Puedes sugerirnos nuevos lugares a través de nuestra página de contacto!',
      },
      {
        question: '¿Cómo puedo reportar información incorrecta?',
        answer: 'Si encuentras un error en la dirección, horario o cualquier otro dato de una pizzería, te agradecemos que nos lo hagas saber a través del formulario en nuestra página de Contacto.',
      },
    ],
  },
  {
    title: 'Soporte y Contacto',
    icon: <Headset className="h-6 w-6" />,
    questions: [
      {
        question: '¿A quién puedo contactar si tengo un problema con la aplicación?',
        answer: 'Nuestro equipo de soporte está disponible para ayudarte. Puedes enviarnos un mensaje a través del formulario en la sección de Contacto y te responderemos a la brevedad.',
      },
      {
        question: 'Soy dueño, ¿puedo agregar mi pizzería a PizzApp?',
        answer: '¡Claro que sí! Estamos finalizando el portal para dueños de negocios. Mientras tanto, puedes enviarnos la información de tu pizzería a través de la página de Contacto para que la agreguemos.',
      },
      {
        question: '¿PizzApp cobra comisiones por pedidos?',
        answer: 'No. Actualmente, PizzApp es una guía para descubrir y calificar pizzerías. No procesamos pedidos ni cobramos comisiones. Solo te conectamos con los mejores lugares de la ciudad.',
      },
    ],
  },
];

const CustomAccordionTrigger = ({ children }: { children: React.ReactNode }) => (
    <AccordionTrigger className="text-left hover:no-underline p-0">
        <div className="flex justify-between items-center w-full">
            <span className="text-base font-medium pr-4">{children}</span>
            <div className="h-7 w-7 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary group-data-[state=open]:rotate-45 transition-transform duration-300">
                <Plus className="h-5 w-5"/>
            </div>
        </div>
    </AccordionTrigger>
);


export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
        <div className="flex-grow container py-12 md:py-20">
            <div className="max-w-3xl mx-auto text-center">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Preguntas Frecuentes</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Encuentra respuestas a las dudas más comunes sobre PizzApp.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                {faqCategories.map((category, index) => (
                    <Card key={index} className="shadow-lg rounded-xl border-t-4 border-primary">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg h-12 w-12 flex items-center justify-center">
                                    {category.icon}
                                </div>
                                <CardTitle className="font-headline text-2xl text-foreground">{category.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <Accordion type="single" collapsible className="w-full space-y-4">
                                {category.questions.map((faq, i) => (
                                    <AccordionItem value={`item-${i}`} key={i} className="border-b-0">
                                        <div className="p-4 rounded-lg border bg-background hover:border-primary/50 transition-colors group">
                                            <CustomAccordionTrigger>{faq.question}</CustomAccordionTrigger>
                                            <AccordionContent className="pt-4 text-base text-muted-foreground">
                                                {faq.answer}
                                            </AccordionContent>
                                        </div>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-16">
                <Card className="shadow-xl rounded-xl bg-gradient-to-br from-card to-muted/40">
                    <CardContent className="p-8 md:p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-14 w-14 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                <MessageCircle className="h-8 w-8" />
                            </div>
                        </div>
                        <h2 className="font-headline text-3xl font-bold">¿No encontraste la respuesta que buscabas?</h2>
                        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
                            Estamos aquí para ayudarte. Ponte en contacto con nuestro equipo de soporte.
                        </p>
                        <div className="mt-8">
                            <Button asChild size="lg">
                                <Link href="/contact">Contacta con nosotros</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
        <Footer />
    </div>
  );
}
