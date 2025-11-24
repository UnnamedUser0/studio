import Link from 'next/link';
import { Pizza, Facebook, Instagram, ArrowRight } from 'lucide-react';
import { XIcon } from '../icons/x-icon';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link
      href={href}
      className="group flex items-center text-sm text-slate-400 hover:text-primary transition-all duration-300"
    >
      <ArrowRight className="h-3 w-3 mr-2 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
      <span className="transition-transform duration-300 group-hover:translate-x-1">
        {children}
      </span>
    </Link>
  </li>
);

export default function Footer() {
  const socialLinks = [
    { name: 'Facebook', icon: <Facebook className="h-5 w-5" />, href: 'https://facebook.com' },
    { name: 'Instagram', icon: <Instagram className="h-5 w-5" />, href: 'https://instagram.com' },
    { name: 'Twitter', icon: <XIcon className="h-4 w-4 fill-current" />, href: 'https://twitter.com' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Logo and Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Pizza className="h-7 w-7 text-primary" />
              <div className="w-[7ch]">
                <span className="font-bold font-headline text-xl inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation text-white">
                  PizzApp
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Encuentra las mejores pizzerías en Hermosillo con un solo clic. Tu guía definitiva para la pizza.
            </p>
            <div className="flex space-x-3 pt-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "bg-slate-800 text-slate-400 hover:bg-primary hover:text-white rounded-full transition-all duration-300 hover:-translate-y-1 hover:glow-primary"
                  )}
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-headline text-lg font-semibold text-white relative mb-6">
              Enlaces Rápidos
              <span className="absolute -bottom-2 left-0 h-1 w-12 bg-primary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <FooterLink href="/">Inicio</FooterLink>
              <FooterLink href="/search">Buscar Pizzerías</FooterLink>
              <FooterLink href="/faq">Preguntas Frecuentes</FooterLink>
              <FooterLink href="/help">Centro de Ayuda</FooterLink>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-headline text-lg font-semibold text-white relative mb-6">
              Legal
              <span className="absolute -bottom-2 left-0 h-1 w-12 bg-primary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <FooterLink href="/terms">Términos de Uso</FooterLink>
              <FooterLink href="/privacy">Política de Privacidad</FooterLink>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-headline text-lg font-semibold text-white relative mb-6">
              Contacto
              <span className="absolute -bottom-2 left-0 h-1 w-12 bg-primary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <FooterLink href="/contact">Formulario de Contacto</FooterLink>
              <FooterLink href="mailto:info@pizzapp.com">info@pizzapp.com</FooterLink>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Pizzapp. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
