'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '@/app/actions/menu';
import { uploadAvatar } from '@/app/actions';

type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    category: string | null;
};

export default function MenuModal({
    isOpen,
    onClose,
    pizzeriaId,
    pizzeriaName,
    isAdmin
}: {
    isOpen: boolean;
    onClose: () => void;
    pizzeriaId: string;
    pizzeriaName: string;
    isAdmin?: boolean;
}) {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', imageUrl: '', category: 'Pizza' });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && pizzeriaId) {
            fetchItems();
        }
    }, [isOpen, pizzeriaId]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await getMenuItems(pizzeriaId);
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch menu items", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            const url = await uploadAvatar(formDataUpload);
            setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            console.error("Upload error:", error);
            toast({ title: "Error", description: "Error al subir imagen. Ver consola.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const price = parseFloat(formData.price);
            if (isNaN(price)) {
                toast({ title: "Error", description: "Precio inválido.", variant: "destructive" });
                return;
            }

            const data = {
                name: formData.name,
                description: formData.description,
                price,
                imageUrl: formData.imageUrl,
                category: formData.category,
                pizzeriaId
            };

            if (editingItem) {
                await updateMenuItem(editingItem.id, data);
                toast({ title: "Actualizado", description: "Producto actualizado." });
            } else {
                await createMenuItem(data);
                toast({ title: "Creado", description: "Producto agregado." });
            }
            setIsFormOpen(false);
            fetchItems();
        } catch (error) {
            toast({ title: "Error", description: "Error al guardar.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este producto?")) return;
        try {
            await deleteMenuItem(id);
            toast({ title: "Eliminado", description: "Producto eliminado." });
            fetchItems();
        } catch (error) {
            toast({ title: "Error", description: "Error al eliminar.", variant: "destructive" });
        }
    };

    const openNew = () => {
        setEditingItem(null);
        setFormData({ name: '', description: '', price: '', imageUrl: '', category: 'Pizza' });
        setIsFormOpen(true);
    };

    const openEdit = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price.toString(),
            imageUrl: item.imageUrl || '',
            category: item.category || 'Pizza'
        });
        setIsFormOpen(true);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Menú - {pizzeriaName}</DialogTitle>
                </DialogHeader>

                {isAdmin && !isFormOpen && (
                    <div className="px-6 py-2 border-b bg-muted/20 flex justify-end">
                        <Button size="sm" onClick={openNew}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar Producto
                        </Button>
                    </div>
                )}

                {isFormOpen ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
                                <X className="w-4 h-4 mr-2" /> Cancelar
                            </Button>
                            <h3 className="font-medium">{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="relative group w-32 h-32 bg-muted rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-muted-foreground" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs">Cambiar Foto</span>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Pizza Pepperoni" />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ingredientes, tamaño, etc." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Precio ($)</Label>
                                    <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoría</Label>
                                    <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Pizza, Bebida..." />
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleSubmit} disabled={uploading}>
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Producto'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
                        ) : items.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                No hay productos en el menú.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                                        <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <Pizza className="w-8 h-8 opacity-20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold truncate">{item.name}</h4>
                                                <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                                                    {item.category || 'General'}
                                                </span>
                                                {isAdmin && (
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(item)}>
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
