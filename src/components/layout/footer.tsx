import Link from 'next/link';
import { Pizza, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const footerSections = [
    {
        title: 'Enlaces Rápidos',
        links: [
            { text: 'Inicio', href: '/' },
            { text: 'Buscar Pizzerías', href: '/#ranking' },
            { text: 'Preguntas Frecuentes', href: '/faq' },
            { text: 'Centro de Ayuda', href: '/help' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { text: 'Términos de Uso', href: '/terms' },
            { text: 'Política de Privacidad', href: '/privacy' },
        ],
    },
    {
        title: 'Contacto',
        links: [
            { text: 'Formulario de Contacto', href: '/contact' },
            { text: 'info@pizzapp.com', href: 'mailto:info@pizzapp.com' },
        ],
    },
];

const socialLinks = [
    { icon: <Facebook className="h-5 w-5" />, href: '#', 'aria-label': 'Facebook' },
    { icon: <Instagram className="h-5 w-5" />, href: '#', 'aria-label': 'Instagram' },
    { icon: <Twitter className="h-5 w-5" />, href: '#', 'aria-label': 'Twitter' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pizzapp Section */}
            <div className="space-y-4">
                <Link href="/" className="flex items-center space-x-2">
                    <Pizza className="h-8 w-8 text-primary" />
                    <div className="relative">
                      <span className="font-bold font-headline text-2xl text-white inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation">
                        PizzApp
                      </span>
                    </div>
                </Link>
                <p className="text-sm">
                    Encuentra las mejores pizzerías en Hermosillo con un solo clic. Tu guía definitiva para la pizza.
                </p>
                <div className="flex space-x-4 pt-2">
                    {socialLinks.map((link, index) => (
                        <Button
                            key={index}
                            asChild
                            variant="outline"
                            size="icon"
                            className="rounded-full bg-gray-800 text-gray-400 border-gray-700 hover:bg-primary hover:text-white hover:border-primary"
                        >
                            <a 
                                href={link.href} 
                                aria-label={link['aria-label']}
                            >
                                {link.icon}
                            </a>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Links Sections */}
            {footerSections.map((section, index) => (
                <div key={index} className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold text-white relative">
                        {section.title}
                        <span className="absolute -bottom-1 left-0 h-0.5 w-10 bg-primary"></span>
                    </h3>
                    <ul className="space-y-2">
                        {section.links.map((link, linkIndex) => (
                            <li key={linkIndex}>
                                <Link href={link.href} className="text-sm hover:text-primary hover:underline transition-colors">
                                    {link.text}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="container py-4 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} PizzApp. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
