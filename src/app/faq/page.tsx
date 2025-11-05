import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Footer from '@/components/layout/footer';

const faqs = [
    {
        question: '¿Qué es PizzApp?',
        answer: 'PizzApp es una aplicación web diseñada para ayudarte a encontrar las mejores pizzerías en Hermosillo, Sonora. Usamos un mapa interactivo y un buscador inteligente para que descubras tu próxima pizza favorita.',
    },
    {
        question: '¿Cómo funciona el buscador inteligente?',
        answer: 'Nuestro buscador utiliza inteligencia artificial para darte sugerencias relevantes incluso si no escribes el nombre completo o la dirección exacta. Intenta buscar por nombre de pizzería, tipo de pizza o nombre de una colonia.',
    },
    {
        question: '¿Necesito una cuenta para usar la app?',
        answer: 'Puedes explorar el mapa, buscar y ver información de las pizzerías sin una cuenta. Sin embargo, para dejar opiniones y calificar pizzerías, necesitarás iniciar sesión.',
    },
    {
        question: '¿Cómo se calcula el ranking de pizzerías?',
        answer: 'El ranking se basa en las calificaciones promedio y el número de opiniones dejadas por los usuarios de la comunidad de PizzApp.',
    },
    {
        question: 'Soy dueño de una pizzería, ¿cómo puedo agregar mi negocio?',
        answer: 'Actualmente estamos trabajando en una función para que los dueños de negocios puedan registrar y administrar sus pizzerías. ¡Mantente atento a futuras actualizaciones!',
    },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-full">
        <div className="flex-grow container py-12 md:py-20">
            <div className="max-w-3xl mx-auto text-center">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Preguntas Frecuentes</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    ¿Tienes dudas? Aquí resolvemos las más comunes.
                </p>
            </div>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto mt-12">
                {faqs.map((faq, i) => (
                    <AccordionItem value={`item-${i}`} key={i}>
                        <AccordionTrigger className="text-left text-lg hover:no-underline">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
        <Footer />
    </div>
  );
}
