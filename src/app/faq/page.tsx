'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { IconPicker, IconByName } from '@/components/admin/icon-picker';
import { useToast } from '@/hooks/use-toast';
import {
  getFaqCategories,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  createFaqQuestion,
  updateFaqQuestion,
  deleteFaqQuestion
} from '@/app/actions/faq';

type FaqQuestion = {
  id: string;
  question: string;
  answer: string;
};

type FaqCategory = {
  id: string;
  title: string;
  iconName: string;
  questions: FaqQuestion[];
};

const DEFAULT_CATEGORIES = [
  {
    title: 'Uso de la Aplicación',
    iconName: 'Smartphone',
    questions: [
      {
        question: '¿Cómo busco pizzerías en PizzApp?',
        answer: 'Puedes usar la barra de búsqueda en la parte superior para escribir el nombre, la dirección o una colonia. También puedes explorar el mapa interactivo en la página de inicio para ver las pizzerías cercanas a ti.',
      },
      {
        question: '¿Necesito registrarme para usar PizzApp?',
        answer: 'No es necesario registrarse para explorar pizzerías, ver sus menús o ubicaciones. Sin embargo, para dejar opiniones, calificar y guardar tus lugares favoritos, sí necesitarás crear una cuenta gratuita.',
      },
      {
        question: '¿Qué información puedo ver sobre una pizzería?',
        answer: 'Para cada pizzería, puedes ver su dirección, ubicación en el mapa, calificación promedio, y las opiniones y comentarios dejados por otros usuarios de la comunidad.',
      },
    ],
  },
  {
    title: 'Datos y Mapas',
    iconName: 'MapPin',
    questions: [
      {
        question: '¿De dónde proviene la información de las pizzerías?',
        answer: 'La información inicial es recopilada por nuestro equipo y validada constantemente por la comunidad. Los dueños de negocios también podrán reclamar y actualizar sus perfiles próximamente.',
      },
      {
        question: '¿Por qué algunas pizzerías no aparecen en la búsqueda?',
        answer: 'Nuestro buscador inteligente intenta encontrar la mejor coincidencia. Si una pizzería es nueva o no está en nuestra base de datos, es posible que no aparezca. ¡Puedes sugerirnos nuevos lugares a través de nuestra página de contacto!',
      },
      {
        question: '¿Cómo puedo reportar información incorrecta?',
        answer: 'Si encuentras un error en la dirección, horario o cualquier otro dato de una pizzería, te agradecemos que nos lo hagas saber a través del formulario en nuestra página de Contacto.',
      },
    ],
  },
  {
    title: 'Soporte y Contacto',
    iconName: 'Headset',
    questions: [
      {
        question: '¿A quién puedo contactar si tengo un problema con la aplicación?',
        answer: 'Nuestro equipo de soporte está disponible para ayudarte. Puedes enviarnos un mensaje a través del formulario en la sección de Contacto y te responderemos a la brevedad.',
      },
      {
        question: 'Soy dueño, ¿puedo agregar mi pizzería a PizzApp?',
        answer: '¡Claro que sí! Estamos finalizando el portal para dueños de negocios. Mientras tanto, puedes enviarnos la información de tu pizzería a través de la página de Contacto para que la agreguemos.',
      },
      {
        question: '¿PizzApp cobra comisiones por pedidos?',
        answer: 'No. Actualmente, PizzApp es una guía para descubrir y calificar pizzerías. No procesamos pedidos ni cobramos comisiones. Solo te conectamos con los mejores lugares de la ciudad.',
      },
    ],
  },
];

const CustomAccordionTrigger = ({ children }: { children: React.ReactNode }) => (
  <AccordionTrigger className="text-left hover:no-underline p-0">
    <div className="flex justify-between items-center w-full">
      <span className="text-base font-medium pr-4">{children}</span>
      <div className="h-7 w-7 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary group-data-[state=open]:rotate-45 transition-transform duration-300">
        <Plus className="h-5 w-5" />
      </div>
    </div>
  </AccordionTrigger>
);

export default function FAQPage() {
  const { data: session } = useSession();
  // @ts-ignore
  const isAdmin = session?.user?.isAdmin === true;
  const { toast } = useToast();

  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ title: '', iconName: 'HelpCircle' });

  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FaqQuestion | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState({ question: '', answer: '' });

  const fetchData = async () => {
    try {
      const data = await getFaqCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch FAQs", error);
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
      for (const cat of DEFAULT_CATEGORIES) {
        await createFaqCategory({ title: cat.title, iconName: cat.iconName });
        // Note: In a real app we'd need the ID of the created category to add questions.
        // For simplicity, we'll just reload and let the user add questions or improve the seed logic server-side.
        // But since we can't easily get the ID back from the void action without changing it,
        // we will just seed categories first.
        // Actually, let's improve this: we'll just seed categories.
      }
      // Re-fetch to get IDs
      const newCats = await getFaqCategories();

      // Now try to match and add questions (simple heuristic)
      for (const cat of DEFAULT_CATEGORIES) {
        const dbCat = newCats.find(c => c.title === cat.title);
        if (dbCat) {
          for (const q of cat.questions) {
            await createFaqQuestion({ ...q, categoryId: dbCat.id });
          }
        }
      }

      toast({ title: "Completado", description: "FAQs por defecto cargadas." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Error al cargar defaults.", variant: "destructive" });
      setLoading(false);
    }
  };

  // Category Handlers
  const openCategoryDialog = (category?: FaqCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ title: category.title, iconName: category.iconName });
    } else {
      setEditingCategory(null);
      setCategoryForm({ title: '', iconName: 'HelpCircle' });
    }
    setIsCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async () => {
    try {
      if (editingCategory) {
        await updateFaqCategory(editingCategory.id, categoryForm);
        toast({ title: "Actualizado", description: "Categoría actualizada." });
      } else {
        await createFaqCategory(categoryForm);
        toast({ title: "Creado", description: "Nueva categoría creada." });
      }
      setIsCategoryDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Error al guardar categoría.", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría y todas sus preguntas?")) return;
    try {
      await deleteFaqCategory(id);
      toast({ title: "Eliminado", description: "Categoría eliminada." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  // Question Handlers
  const openQuestionDialog = (categoryId: string, question?: FaqQuestion) => {
    setSelectedCategoryId(categoryId);
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({ question: question.question, answer: question.answer });
    } else {
      setEditingQuestion(null);
      setQuestionForm({ question: '', answer: '' });
    }
    setIsQuestionDialogOpen(true);
  };

  const handleQuestionSubmit = async () => {
    try {
      if (editingQuestion) {
        await updateFaqQuestion(editingQuestion.id, questionForm);
        toast({ title: "Actualizado", description: "Pregunta actualizada." });
      } else if (selectedCategoryId) {
        await createFaqQuestion({ ...questionForm, categoryId: selectedCategoryId });
        toast({ title: "Creado", description: "Nueva pregunta agregada." });
      }
      setIsQuestionDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Error al guardar pregunta.", variant: "destructive" });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    try {
      await deleteFaqQuestion(id);
      toast({ title: "Eliminado", description: "Pregunta eliminada." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container py-12 md:py-20">
      <ScrollReveal>
        <div className="max-w-3xl mx-auto text-center relative">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Preguntas Frecuentes</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Encuentra respuestas a las dudas más comunes sobre PizzApp.
          </p>
          {isAdmin && (
            <div className="mt-6 flex justify-center gap-2">
              {categories.length === 0 && (
                <Button onClick={handleSeed} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" /> Cargar Defaults
                </Button>
              )}
              <Button onClick={() => openCategoryDialog()} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
              </Button>
            </div>
          )}
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
        {categories.map((category, index) => (
          <ScrollReveal key={category.id} delay={index * 100} className="h-full">
            <Card className="shadow-lg rounded-xl border-t-4 border-primary h-full flex flex-col relative group">
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCategoryDialog(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg h-12 w-12 flex items-center justify-center">
                    <IconByName name={category.iconName} className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-2xl text-foreground">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {category.questions.map((faq, i) => (
                    <AccordionItem value={`item-${i}`} key={faq.id} className="border-b-0 relative group/item">
                      <div className="p-4 rounded-lg border bg-background hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow pr-8">
                            <CustomAccordionTrigger>{faq.question}</CustomAccordionTrigger>
                          </div>
                          {isAdmin && (
                            <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity absolute right-2 top-2">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openQuestionDialog(category.id, faq); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(faq.id); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <AccordionContent className="pt-4 text-base text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
                {isAdmin && (
                  <Button variant="ghost" className="w-full mt-4 border-dashed border-2" onClick={() => openQuestionDialog(category.id)}>
                    <Plus className="h-4 w-4 mr-2" /> Agregar Pregunta
                  </Button>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <div className="mt-16">
        <ScrollReveal delay={300}>
          <Card className="shadow-xl rounded-xl bg-gradient-to-br from-card to-muted/40">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageCircle className="h-8 w-8" />
                </div>
              </div>
              <h2 className="font-headline text-3xl font-bold">¿No encontraste la respuesta que buscabas?</h2>
              <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
                Estamos aquí para ayudarte. Ponte en contacto con nuestro equipo de soporte.
              </p>
              <div className="mt-8">
                <Button asChild size="lg">
                  <Link href="/contact">Contacta con nosotros</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={categoryForm.title}
                onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                placeholder="Ej: Uso de la Aplicación"
              />
            </div>
            <div className="space-y-2">
              <Label>Icono</Label>
              <IconPicker
                value={categoryForm.iconName}
                onChange={(icon) => setCategoryForm({ ...categoryForm, iconName: icon })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCategorySubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pregunta</Label>
              <Input
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="¿Cómo...?"
              />
            </div>
            <div className="space-y-2">
              <Label>Respuesta</Label>
              <Textarea
                value={questionForm.answer}
                onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                placeholder="Respuesta detallada..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleQuestionSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
