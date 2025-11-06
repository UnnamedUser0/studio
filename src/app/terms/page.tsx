import Footer from '@/components/layout/footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow container py-20">
        <h1 className="font-headline text-5xl text-center">Términos y Condiciones</h1>
        <div className="mt-8 max-w-3xl mx-auto space-y-4 text-muted-foreground">
            <p>Bienvenido a PizzApp. Al utilizar nuestra aplicación, aceptas cumplir con los siguientes términos y condiciones de uso.</p>
            <h2 className="text-xl font-bold text-foreground pt-4">1. Uso de la Aplicación</h2>
            <p>PizzApp es una guía para descubrir y opinar sobre pizzerías. No nos hacemos responsables por la calidad del servicio o producto de los establecimientos listados.</p>
            <h2 className="text-xl font-bold text-foreground pt-4">2. Contenido del Usuario</h2>
            <p>Eres responsable de las opiniones y calificaciones que publicas. No se permite contenido ofensivo, falso o que infrinja derechos de autor.</p>
            <h2 className="text-xl font-bold text-foreground pt-4">3. Propiedad Intelectual</h2>
            <p>El contenido de PizzApp, incluyendo logos, textos y diseño, está protegido por derechos de autor y no puede ser reproducido sin permiso.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
