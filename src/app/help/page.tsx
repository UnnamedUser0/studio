
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconPicker, IconByName } from '@/components/admin/icon-picker';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getHelpCards,
  createHelpCard,
  updateHelpCard,
  deleteHelpCard
} from '@/app/actions/help';

type HelpCard = {
  id: string;
  title: string;
  description: string;
  iconName: string;
  buttonText: string;
  link: string;
};

const DEFAULT_CARDS = [
  {
    iconName: 'HelpCircle',
    title: 'Preguntas Frecuentes',
    description: 'Consulta nuestra sección de preguntas frecuentes para encontrar respuestas rápidas a los problemas más comunes.',
    buttonText: 'Ver FAQ',
    link: '/faq',
  },
  {
    iconName: 'Headset',
    title: 'Contacta con Nosotros',
    description: '¿No encuentras lo que buscas? Nuestro equipo de soporte está listo para ayudarte personalmente.',
    buttonText: 'Contactar',
    link: '/contact',
  },
  {
    iconName: 'Shield',
    title: 'Política de Privacidad',
    description: 'Lee nuestra política de privacidad para entender cómo manejamos tus datos personales.',
    buttonText: 'Leer Política',
    link: '/privacy',
  },
  {
    iconName: 'FileText',
    title: 'Términos de Uso',
    description: 'Consulta los términos y condiciones que rigen el uso de la aplicación PizzApp.',
    buttonText: 'Ver Términos',
    link: '/terms',
  },
];

const additionalResources = [
  {
    href: "https://wiki.openstreetmap.org/wiki/Overpass_API",
    text: "Documentación de la API Overpass",
    subtext: "(Datos de Pizzerías)"
  },
  {
    href: "https://operations.osmfoundation.org/policies/nominatim/",
    text: "Políticas de Uso de Nominatim",
    subtext: "(Geocodificación)"
  },
  {
    href: "https://leafletjs.com/reference.html",
    text: "Documentación de Leaflet",
    subtext: "(Biblioteca del Mapa)"
  }
];

function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
    </svg>
  );
}

export default function HelpPage() {
  const { data: session } = useSession();
  // @ts-ignore
  const isAdmin = session?.user?.isAdmin === true;
  const { toast } = useToast();

  const [cards, setCards] = useState<HelpCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<HelpCard | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    iconName: 'HelpCircle',
    buttonText: '',
    link: ''
  });

  const fetchData = async () => {
    try {
      const data = await getHelpCards();
      setCards(data);
    } catch (error) {
      console.error("Failed to fetch help cards", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeed = async () => {
    setLoading(true);
    try {
      for (const card of DEFAULT_CARDS) {
        await createHelpCard(card);
      }
      toast({ title: "Completado", description: "Tarjetas por defecto cargadas." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Error al cargar defaults.", variant: "destructive" });
      setLoading(false);
    }
  };

  const openDialog = (card?: HelpCard) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        title: card.title,
        description: card.description,
        iconName: card.iconName,
        buttonText: card.buttonText,
        link: card.link
      });
    } else {
      setEditingCard(null);
      setFormData({
        title: '',
        description: '',
        iconName: 'HelpCircle',
        buttonText: '',
        link: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingCard) {
        await updateHelpCard(editingCard.id, formData);
        toast({ title: "Actualizado", description: "Tarjeta actualizada." });
      } else {
        await createHelpCard(formData);
        toast({ title: "Creado", description: "Nueva tarjeta creada." });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Error al guardar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta tarjeta?")) return;
    try {
      await deleteHelpCard(id);
      toast({ title: "Eliminado", description: "Tarjeta eliminada." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container py-12 md:py-20">
      <ScrollReveal>
        <div className="max-w-3xl mx-auto text-center mb-16 relative">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Centro de Soporte</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Estamos aquí para ayudarte. Encuentra los recursos que necesitas.
          </p>
          {isAdmin && (
            <div className="mt-6 flex justify-center gap-2">
              {cards.length === 0 && (
                <Button onClick={handleSeed} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" /> Cargar Defaults
                </Button>
              )}
              <Button onClick={() => openDialog()} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Agregar Tarjeta
              </Button>
            </div>
          )}
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card, index) => (
          <ScrollReveal key={card.id} delay={index * 100} className="h-full">
            <Card className="text-center shadow-lg rounded-xl flex flex-col hover:border-primary/50 transition-colors h-full relative group">
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(card)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(card.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <CardHeader className="items-center">
                <div className="bg-primary/10 rounded-full p-4">
                  <IconByName name={card.iconName} className="h-8 w-8 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <CardTitle className="font-headline text-2xl mb-2">{card.title}</CardTitle>
                <CardDescription className="flex-grow mb-6">{card.description}</CardDescription>
                <Button asChild variant="outline">
                  <Link href={card.link}>{card.buttonText}</Link>
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <div className="mt-16">
        <ScrollReveal delay={400}>
          <Card className="shadow-lg rounded-xl">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-headline text-3xl font-bold relative inline-block">
                  Recursos Adicionales
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-primary rounded-full" />
                </h2>
                <p className="mt-6 text-muted-foreground">
                  Para obtener más información sobre cómo funciona Pizzapp y los datos que utilizamos, visita los siguientes recursos:
                </p>
              </div>
              <div className="mt-8 max-w-lg mx-auto">
                <ul className="space-y-4">
                  {additionalResources.map((resource, index) => (
                    <li key={index} className="border-b border-dashed pb-4">
                      <Link href={resource.href} target="_blank" rel="noopener noreferrer" className="flex items-center group">
                        <LinkIcon className="h-5 w-5 text-primary/70 mr-4 flex-shrink-0" />
                        <span className="text-foreground group-hover:text-primary underline-offset-4 group-hover:underline">
                          {resource.text} <span className="text-muted-foreground group-hover:text-primary/80">{resource.subtext}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Preguntas Frecuentes"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción..."
              />
            </div>
            <div className="space-y-2">
              <Label>Texto del Botón</Label>
              <Input
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                placeholder="Ej: Ver FAQ"
              />
            </div>
            <div className="space-y-2">
              <Label>Enlace</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="Ej: /faq o https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Icono</Label>
              <IconPicker
                value={formData.iconName}
                onChange={(icon) => setFormData({ ...formData, iconName: icon })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
