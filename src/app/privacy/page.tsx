import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow container py-20">
        <h1 className="font-headline text-5xl text-center">Política de Privacidad</h1>
        <div className="mt-8 max-w-3xl mx-auto space-y-4 text-muted-foreground">
            <p>En PizzApp, respetamos tu privacidad. Esta página contendrá los detalles de la información que recopilamos y cómo la utilizamos.</p>
            <p>La información del usuario, como el correo electrónico proporcionado durante el inicio de sesión, se utiliza únicamente para la autenticación de la cuenta y para permitir funciones como la publicación de opiniones. No compartimos tus datos personales con terceros.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
