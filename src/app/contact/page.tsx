import Footer from '@/components/layout/footer';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-grow container py-20 text-center">
        <h1 className="font-headline text-5xl">Contacto</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          ¿Tienes preguntas o sugerencias? Contáctanos en <a href="mailto:hola@pizzapp.com" className="text-primary underline">hola@pizzapp.com</a>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
