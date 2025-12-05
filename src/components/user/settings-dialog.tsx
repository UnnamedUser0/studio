'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Trash2, Shield, FileText, Smartphone, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { updateUserAvatar, deleteUserAccount, uploadAvatar } from '@/app/actions';

const PREDEFINED_AVATARS = [
    'Felix', 'Aneka', 'Zoe', 'Marc', 'Bandit', 'Coco', 'Dixie',
    'Garfield', 'Bella', 'Charlie', 'Luna', 'Oreo', 'Molly', 'Max',
    'Buddy', 'Daisy', 'Rocky', 'Bear', 'Jack', 'Ginger', 'Pepper'
];

export default function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { data: session, update } = useSession();
    const user = session?.user;
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.image) {
            setAvatarUrl(user.image);
        }
    }, [user]);

    if (!user) return null;

    const maskEmail = (email: string) => {
        const [name, domain] = email.split('@');
        if (name.length <= 2) return email;
        const maskedName = name.substring(0, 2) + '*'.repeat(name.length - 2);
        return `${maskedName}@${domain}`;
    };

    const updateAvatarUrl = async (photoURL: string) => {
        if (!user.id) return;

        setAvatarUrl(photoURL);

        try {
            await updateUserAvatar(user.id, photoURL);
            await update({ image: photoURL }); // Update session

            toast({
                title: "¡Avatar Actualizado! 🎉",
                description: "Tu nueva imagen de perfil se ve genial.",
                className: "bg-green-500 text-white border-none",
                duration: 3000,
            });
        } catch (error) {
            console.error("Error updating avatar:", error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el avatar. Inténtalo de nuevo.",
                variant: "destructive"
            });
        }
    };

    const handleUpdateAvatar = async (seed: string) => {
        setLoading(true);
        try {
            const photoURL = `https://api.dicebear.com/8.x/micah/svg?seed=${seed}`;
            await updateAvatarUrl(photoURL);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: "Error",
                description: "Por favor selecciona un archivo de imagen válido.",
                variant: "destructive"
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                title: "Error",
                description: "La imagen es demasiado grande. El máximo es 5MB.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const photoURL = await uploadAvatar(formData);
            await updateAvatarUrl(photoURL);
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            toast({
                title: "Error al subir imagen",
                description: `No se pudo subir la imagen: ${error.message || 'Error desconocido'}`,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleLogoutAll = async () => {
        try {
            await signOut();
            toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error", description: "Hubo un problema al cerrar sesión.", variant: "destructive" });
        }
    };

    const handleDeleteAccount = async () => {
        if (!user.id) return;
        setLoading(true);
        try {
            await deleteUserAccount(user.id);
            await signOut();
            toast({ title: "Cuenta eliminada", description: "Lamentamos verte partir. Tu cuenta ha sido eliminada." });
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: "Error", description: "No se pudo eliminar la cuenta.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings className="w-5 h-5" />
                        Configuración
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-2">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="profile">Perfil</TabsTrigger>
                            <TabsTrigger value="account">Cuenta</TabsTrigger>
                            <TabsTrigger value="about">Acerca de</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="profile" className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* User Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Información Personal</h3>
                            <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Avatar className="h-20 w-20 border-2 border-primary">
                                            <AvatarImage src={avatarUrl || user.image || `https://api.dicebear.com/8.x/micah/svg?seed=${user.email}`} />
                                            <AvatarFallback>YO</AvatarFallback>
                                        </Avatar>
                                        <button
                                            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg hover:bg-primary/90 transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={loading}
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleUploadAvatar}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-lg">{user.name || 'Usuario'}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            {maskEmail(user.email || '')}
                                            <Shield className="w-3 h-3 text-green-500" />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Avatar Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Cambiar Avatar</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading}
                                >
                                    <Upload className="w-4 h-4" />
                                    Subir Foto
                                </Button>
                            </div>
                            <ScrollArea className="h-48 border rounded-md p-4">
                                <div className="flex flex-wrap gap-4 justify-center">
                                    {PREDEFINED_AVATARS.map((seed) => (
                                        <button
                                            key={seed}
                                            onClick={() => handleUpdateAvatar(seed)}
                                            className="relative group rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                                            disabled={loading}
                                        >
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={`https://api.dicebear.com/8.x/micah/svg?seed=${seed}`} />
                                                <AvatarFallback>?</AvatarFallback>
                                            </Avatar>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    <TabsContent value="account" className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Gestión de Cuenta</h3>
                            <p className="text-sm text-muted-foreground">
                                Aquí puedes gestionar la seguridad y el estado de tu cuenta.
                            </p>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-medium text-destructive">Zona de Peligro</h3>
                                <div className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogoutAll}>
                                        <Smartphone className="w-4 h-4" />
                                        Cerrar sesión
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full justify-start gap-2">
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar Cuenta
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y removerá tus datos de nuestros servidores.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Sí, eliminar cuenta
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="about" className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Términos de Uso
                                </h3>
                                <div className="text-sm text-muted-foreground border p-4 rounded-lg bg-muted/30">
                                    <p>Bienvenido a PizzApp. Al usar nuestra aplicación, aceptas respetar a la comunidad y compartir información verídica.</p>
                                    <ul className="list-disc ml-4 mt-2 space-y-1">
                                        <li>No publicar contenido ofensivo.</li>
                                        <li>Respetar las opiniones de otros usuarios.</li>
                                        <li>El uso indebido de la plataforma resultará en la suspensión de la cuenta.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Política de Privacidad
                                </h3>
                                <div className="text-sm text-muted-foreground border p-4 rounded-lg bg-muted/30">
                                    <p>En PizzApp nos tomamos tu privacidad en serio.</p>
                                    <ul className="list-disc ml-4 mt-2 space-y-1">
                                        <li>Solo recopilamos la información necesaria para mejorar tu experiencia.</li>
                                        <li>No compartimos tus datos personales con terceros sin tu consentimiento.</li>
                                        <li>Puedes solicitar la eliminación de tus datos en cualquier momento.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="text-center text-xs text-muted-foreground pt-8">
                                <p>PizzApp v1.0.0</p>
                                <p>© 2024 PizzApp Inc.</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
