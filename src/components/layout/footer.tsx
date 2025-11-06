import Link from 'next/link';
import { Pizza } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-muted/50 text-muted-foreground border-t">
      <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Pizza className="h-5 w-5 text-primary" />
          <p className="text-sm font-bold">PizzApp &copy; {new Date().getFullYear()}</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/about" className="hover:text-primary transition-colors">
            Sobre Nosotros
          </Link>
          <Link href="/help" className="hover:text-primary transition-colors">
            Centro de Ayuda
          </Link>
          <Link href="/contact" className="hover:text-primary transition-colors">
            Contacto
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Política de Privacidad
          </Link>
        </nav>
      </div>
    </footer>
  );
}
