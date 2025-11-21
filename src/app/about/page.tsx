
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});


export default function AboutPage() {
  return (
    <div className="container py-20 text-center">
      <h1 className="font-headline text-5xl">Sobre Nosotros</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
        PizzApp nació de la pasión por la pizza y el deseo de conectar a los amantes de la buena comida con los mejores lugares de Hermosillo.
      </p>
    </div>
  );
}
