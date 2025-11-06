import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Footer from '@/components/layout/footer';
import Link from 'next/link';

const helpTopics = [
    {
        question: 'Primeros Pasos: ¿Cómo exploro las pizzerías?',
        answer: 'Puedes explorar de dos maneras principales: usando el mapa interactivo en la página de inicio para ver las ubicaciones, o abriendo la lista de "Explorar Pizzerías" para ver el ranking de las mejores calificadas. Haz clic en cualquier pizzería para ver sus detalles.',
    },
    {
        question: '¿Cómo funciona el buscador inteligente?',
        answer: 'Simplemente escribe el nombre de una pizzería, una dirección, una colonia o incluso un tipo de pizza en la barra de búsqueda. Nuestra IA te dará sugerencias y encontrará los resultados más relevantes para ti.',
    },
    {
        question: '¿Cómo puedo dejar una opinión o calificación?',
        answer: 'Para dejar una opinión, primero debes iniciar sesión. Una vez que hayas accedido a tu cuenta, selecciona una pizzería, y en el panel de detalles encontrarás un formulario para escribir tu comentario y asignar una calificación de 1 a 5 estrellas.',
    },
    {
        question: '¿Necesito una cuenta para todo?',
        answer: 'No. Puedes explorar el mapa, buscar y ver toda la información de las pizzerías sin necesidad de una cuenta. Solo necesitas registrarte e iniciar sesión para poder calificar y dejar comentarios.',
    },
    {
        question: 'Soy dueño de una pizzería, ¿cómo puedo agregar mi negocio?',
        answer: 'Actualmente, el panel para que los dueños de negocios administren sus locales está en desarrollo. ¡Muy pronto podrás registrar tu pizzería y gestionar tu información directamente desde la plataforma!',
    },
    {
        question: '¿Cómo puedo contactar a soporte?',
        answer: 'Si tienes más preguntas o necesitas ayuda, no dudes en visitar nuestra página de Contacto. Puedes enviarnos un correo a la dirección indicada allí. Para ir, haz clic aquí: <Link href="/contact" className="text-primary underline">Contacto</Link>.',
    },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-full">
        <div className="flex-grow container py-12 md:py-20">
            <div className="max-w-3xl mx-auto text-center">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Centro de Ayuda</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Aquí encontrarás respuestas a tus preguntas sobre cómo usar PizzApp.
                </p>
            </div>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto mt-12">
                {helpTopics.map((topic, i) => (
                    <AccordionItem value={`item-${i}`} key={i}>
                        <AccordionTrigger className="text-left text-lg hover:no-underline">{topic.question}</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground space-y-2">
                           <p>{topic.answer}</p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
        <Footer />
    </div>
  );
}
