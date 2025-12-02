'use client';

import { useState } from 'react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { updateProfile, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, User, LogOut, Trash2, Shield, FileText, Smartphone } from 'lucide-react';
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

const AVATAR_SEEDS = [
    'micah', 'avataaars', 'bottts', 'cat', 'dog', 'identicon',
    'initials', 'lorelei', 'notionists', 'open-peeps', 'personas', 'pixel-art'
];

const PREDEFINED_AVATARS = [
    'Felix', 'Aneka', 'Zoe', 'Marc', 'Bandit', 'Coco', 'Dixie',
    'Garfield', 'Bella', 'Charlie', 'Luna', 'Oreo'
];

export default function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    const maskEmail = (email: string) => {
        const [name, domain] = email.split('@');
        if (name.length <= 2) return email;
        const maskedName = name.substring(0, 2) + '*'.repeat(name.length - 2);
        return `${maskedName}@${domain}`;
    };

    const handleUpdateAvatar = async (seed: string) => {
        if (!user || !auth) return;
        setLoading(true);
        try {
            const photoURL = `https://api.dicebear.com/8.x/micah/svg?seed=${seed}`;
            await updateProfile(user, { photoURL });

            // Force user reload to update local state
            await user.reload();
            // Force token refresh to ensure listeners pick up changes
            await user.getIdToken(true);

            // Also update in Firestore if you keep a user record there
            if (firestore) {
                await updateDoc(doc(firestore, 'users', user.uid), { photoURL });
            }

            // Manually update any avatar images on the page with the new URL immediately
            const avatarImages = document.querySelectorAll('img[alt="' + (user.displayName || user.email || '') + '"]');
            avatarImages.forEach((img: any) => {
                img.src = photoURL;
            });

            toast({
                title: "¡Avatar Actualizado! 🎉",
                description: "Tu nueva imagen de perfil se ve genial.",
                className: "bg-green-500 text-white border-none",
                duration: 3000,
            });

            // Small delay to allow state propagation
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error("Error updating avatar:", error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el avatar. Inténtalo de nuevo.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutAll = async () => {
        // Note: True "logout from all devices" requires backend admin SDK to revoke refresh tokens.
        // Here we will just sign out the current session and show a message.
        try {
            await auth?.signOut();
            toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error", description: "Hubo un problema al cerrar sesión.", variant: "destructive" });
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || !firestore) return;
        setLoading(true);
        try {
            // Delete user data from Firestore
            await deleteDoc(doc(firestore, 'users', user.uid));
            // Delete user authentication
            await deleteUser(user);
            toast({ title: "Cuenta eliminada", description: "Lamentamos verte partir. Tu cuenta ha sido eliminada." });
            onOpenChange(false);
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                toast({ title: "Error", description: "Por seguridad, debes volver a iniciar sesión antes de eliminar tu cuenta.", variant: "destructive" });
            } else {
                toast({ title: "Error", description: "No se pudo eliminar la cuenta.", variant: "destructive" });
            }
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
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="profile">Perfil</TabsTrigger>
                            <TabsTrigger value="about">Acerca de</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="profile" className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* User Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Información Personal</h3>
                            <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16 border-2 border-primary">
                                        <AvatarImage src={user.photoURL || `https://api.dicebear.com/8.x/micah/svg?seed=${user.email}`} />
                                        <AvatarFallback>YO</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="font-medium text-lg">{user.displayName || 'Usuario'}</p>
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
                            <h3 className="text-lg font-medium">Cambiar Avatar</h3>
                            <ScrollArea className="h-32 border rounded-md p-4">
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

                        {/* Danger Zone */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium text-destructive">Zona de Peligro</h3>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogoutAll}>
                                    <Smartphone className="w-4 h-4" />
                                    Cerrar sesión en todos los dispositivos
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
