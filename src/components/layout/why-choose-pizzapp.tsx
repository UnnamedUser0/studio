'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { IconPicker, IconByName } from '@/components/admin/icon-picker';
import { getFeatures, createFeature, updateFeature, deleteFeature } from '@/app/actions/features';
import { useToast } from '@/hooks/use-toast';

type Feature = {
    id: string;
    title: string;
    description: string;
    iconName: string;
};

const DEFAULT_FEATURES = [
    {
        title: 'Localización Precisa',
        description: 'Encuentra pizzerías cercanas a tu ubicación exacta con nuestro mapa interactivo.',
        iconName: 'MapPin'
    },
    {
        title: 'Reseñas Verificadas',
        description: 'Opiniones reales de usuarios para que siempre elijas la mejor opción.',
        iconName: 'Star'
    },
    {
        title: 'Rutas Inteligentes',
        description: 'Obtén indicaciones directas a tu pizzería favorita con un solo clic.',
        iconName: 'Route'
    },
    {
        title: 'Menús Actualizados',
        description: 'Consulta menús antes de ir para saber qué delicias te esperan.',
        iconName: 'UtensilsCrossed'
    }
];

export default function WhyChoosePizzapp({ isAdmin }: { isAdmin?: boolean }) {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '', iconName: 'Star' });
    const { toast } = useToast();

    const fetchFeatures = async () => {
        try {
            const data = await getFeatures();
            setFeatures(data);
        } catch (error) {
            console.error("Failed to fetch features", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    const handleSubmit = async () => {
        try {
            if (editingFeature) {
                await updateFeature(editingFeature.id, formData);
                toast({ title: "Actualizado", description: "Tarjeta actualizada correctamente." });
            } else {
                await createFeature(formData);
                toast({ title: "Creado", description: "Nueva tarjeta agregada." });
            }
            setIsDialogOpen(false);
            fetchFeatures();
        } catch (error) {
            toast({ title: "Error", description: "Hubo un problema al guardar.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta tarjeta?")) return;
        try {
            await deleteFeature(id);
            toast({ title: "Eliminado", description: "Tarjeta eliminada." });
            fetchFeatures();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
        }
    };

    const handleSeed = async () => {
        setLoading(true);
        try {
            for (const feature of DEFAULT_FEATURES) {
                await createFeature(feature);
            }
            toast({ title: "Completado", description: "Tarjetas por defecto agregadas." });
            fetchFeatures();
        } catch (error) {
            toast({ title: "Error", description: "Error al crear tarjetas por defecto.", variant: "destructive" });
            setLoading(false);
        }
    };

    const openEdit = (feature: Feature) => {
        setEditingFeature(feature);
        setFormData({ title: feature.title, description: feature.description, iconName: feature.iconName });
        setIsDialogOpen(true);
    };

    const openNew = () => {
        setEditingFeature(null);
        setFormData({ title: '', description: '', iconName: 'Star' });
        setIsDialogOpen(true);
    };

    if (loading) return <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;

    return (
        <section id="why-choose-us" className="py-16 bg-background relative">
            <div className="container">
                <ScrollReveal>
                    <div className="max-w-3xl mx-auto text-center mb-12 relative">
                        <h2 className="text-3xl md:text-4xl font-headline font-bold">¿Por qué elegir PizzApp?</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Hacemos que encontrar tu próxima pizza sea fácil y emocionante.
                        </p>
                        {isAdmin && (
                            <div className="flex justify-center gap-2 mt-6">
                                {features.length === 0 && (
                                    <Button onClick={handleSeed} variant="outline" size="sm">
                                        <RefreshCw className="w-4 h-4 mr-2" /> Cargar Defaults
                                    </Button>
                                )}
                                <Button onClick={openNew} size="sm">
                                    <Plus className="w-4 h-4 mr-2" /> Agregar
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollReveal>

                {features.length === 0 && !loading ? (
                    <div className="text-center text-muted-foreground py-8">
                        No hay tarjetas para mostrar.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <ScrollReveal key={feature.id} delay={index * 100} className="h-full">
                                <Card className="text-center shadow-lg rounded-xl flex flex-col bg-muted/30 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl h-full relative group">
                                    {isAdmin && (
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => openEdit(feature)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={() => handleDelete(feature.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <CardHeader className="items-center">
                                        <div className="bg-primary/10 rounded-full p-4">
                                            <IconByName name={feature.iconName} className="h-8 w-8 text-primary" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow flex flex-col">
                                        <CardTitle className="font-headline text-2xl mb-2">{feature.title}</CardTitle>
                                        <p className="text-muted-foreground flex-grow">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </ScrollReveal>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFeature ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Localización Precisa"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descripción de la característica..."
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
        </section>
    );
}
