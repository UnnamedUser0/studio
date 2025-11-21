import Link from 'next/link';
import { Pizza, Facebook, Instagram } from 'lucide-react';
import { XIcon } from '../icons/x-icon';

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
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Pizza className="h-8 w-8 text-primary" />
              <span className="font-bold font-headline text-2xl text-white">PizzApp</span>
            </Link>
            <p className="text-sm text-slate-400">
              Encuentra las mejores pizzerías en Hermosillo con un solo clic. Tu guía definitiva para la pizza.
            </p>
            <div className="flex space-x-3 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="text-slate-400 hover:text-primary bg-slate-800 h-10 w-10 rounded-full flex items-center justify-center transition-colors"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Spacer for larger screens */}
          <div className="hidden md:block md:col-span-1"></div>

          {/* Columns 2 & 3: Links */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="font-headline text-lg font-semibold text-white relative mb-4">
                Enlaces Rápidos
                <span className="absolute -bottom-1 left-0 h-0.5 w-10 bg-primary"></span>
              </h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Inicio</Link></li>
                <li><Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Buscar Pizzerías</Link></li>
                <li><Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
                <li><Link href="/help" className="text-sm text-slate-400 hover:text-white transition-colors">Centro de Ayuda</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold text-white relative mb-4">
                Legal
                <span className="absolute -bottom-1 left-0 h-0.5 w-10 bg-primary"></span>
              </h3>
              <ul className="space-y-3">
                <li><Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Términos de Uso</Link></li>
                <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Política de Privacidad</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="font-headline text-lg font-semibold text-white relative mb-4">
                Contacto
                <span className="absolute -bottom-1 left-0 h-0.5 w-10 bg-primary"></span>
              </h3>
              <ul className="space-y-3">
                <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Formulario de Contacto</Link></li>
                <li><a href="mailto:info@pizzapp.com" className="text-sm text-slate-400 hover:text-white transition-colors">info@pizzapp.com</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-12 pt-6 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Pizzapp. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
