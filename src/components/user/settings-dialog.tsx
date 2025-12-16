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
import { Settings, Trash2, Shield, FileText, Upload, Camera, Lock } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserAvatar, deleteUserAccount, uploadAvatar, updateUserProfile, changeUserPassword } from '@/app/actions';
import { getAboutContent } from '@/app/actions/about';
import AboutContentManager from '@/components/admin/about-content-manager';
import { Edit } from 'lucide-react';

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
    const [name, setName] = useState('');
    const [gender, setGender] = useState<string>('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [aboutContent, setAboutContent] = useState({
        termsTitle: 'Términos de Uso',
        termsDescription: 'Bienvenido a PizzApp. Al usar nuestra aplicación, aceptas respetar a la comunidad y compartir información verídica.',
        termsPoints: 'No publicar contenido ofensivo.|Respetar las opiniones de otros usuarios.|El uso indebido de la plataforma resultará en la suspensión de la cuenta.',
        privacyTitle: 'Política de Privacidad',
        privacyDescription: 'En PizzApp nos tomamos tu privacidad en serio.',
        privacyPoints: 'Solo recopilamos la información necesaria para mejorar tu experiencia.|No compartimos tus datos personales con terceros sin tu consentimiento.|Puedes solicitar la eliminación de tus datos en cualquier momento.',
        appVersion: 'PizzApp v1.0.0',
        copyrightText: '© 2024 PizzApp Inc.',
    });
    const [isAboutEditorOpen, setIsAboutEditorOpen] = useState(false);

    const permissions = (user as any)?.permissions || "";
    const canManageContent = (user as any)?.isAdmin && (
        (user as any)?.email === "va21070541@bachilleresdesonora.edu.mx" ||
        permissions.includes('manage_content')
    );

    useEffect(() => {
        if (user?.image) {
            setAvatarUrl(user.image);
        }
        if (user?.name) {
            setName(user.name);
        }
    }, [user]);

    // Load about content when dialog opens
    useEffect(() => {
        if (open) {
            getAboutContent().then((content) => {
                setAboutContent({
                    termsTitle: content.termsTitle,
                    termsDescription: content.termsDescription,
                    termsPoints: content.termsPoints,
                    privacyTitle: content.privacyTitle,
                    privacyDescription: content.privacyDescription,
                    privacyPoints: content.privacyPoints,
                    appVersion: content.appVersion,
                    copyrightText: content.copyrightText,
                });
            }).catch((error) => {
                console.error('Error loading about content:', error);
            });
        }
    }, [open]);

    if (!user) return null;

    const handleUpdateProfile = async () => {
        if (!user.id) return;
        setLoading(true);
        try {
            let newAvatarUrl = avatarUrl;

            // Generate avatar if gender is selected or if name changed and no custom avatar set
            if (gender || (name !== user.name && !avatarUrl?.includes('uploads'))) {
                const seed = name || 'random';
                if (gender === 'male') {
                    newAvatarUrl = `https://avatar.iran.liara.run/public/boy?username=${seed}`;
                } else if (gender === 'female') {
                    newAvatarUrl = `https://avatar.iran.liara.run/public/girl?username=${seed}`;
                } else {
                    // Default/Other/Random
                    newAvatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
                }
            }

            await updateUserProfile(user.id, name, newAvatarUrl || undefined);
            await update({ name: name, image: newAvatarUrl });
            setAvatarUrl(newAvatarUrl);

            toast({
                title: "Perfil actualizado",
                description: "Tus datos han sido guardados correctamente.",
                className: "bg-green-500 text-white border-none",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el perfil.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

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

    const handleChangePassword = async () => {
        if (!user.id) return;
        if (newPassword !== confirmPassword) {
            toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            await changeUserPassword(user.id, currentPassword, newPassword);
            toast({
                title: "Contraseña actualizada",
                description: "Tu contraseña ha sido modificada exitosamente.",
                className: "bg-green-500 text-white border-none",
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "No se pudo cambiar la contraseña.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                                        <div className="space-y-1 flex-1">
                                            <div className="grid gap-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="name" className="text-xs">Nombre</Label>
                                                        <Input
                                                            id="name"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            placeholder="Tu nombre"
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="gender" className="text-xs">Género</Label>
                                                        <Select value={gender} onValueChange={setGender}>
                                                            <SelectTrigger id="gender" className="h-8">
                                                                <SelectValue placeholder="Seleccionar" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="male">Masculino</SelectItem>
                                                                <SelectItem value="female">Femenino</SelectItem>
                                                                <SelectItem value="other">Otro</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={handleUpdateProfile}
                                                    disabled={loading || (name === user.name && !gender)}
                                                    className="w-full"
                                                >
                                                    Actualizar Perfil y Avatar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Avatar Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Avatares Predeterminados</h3>
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
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium">Gestión de Cuenta</h3>

                                {/* Change Password Section */}
                                <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Cambiar Contraseña
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="current-password">Contraseña Actual</Label>
                                            <Input
                                                id="current-password"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="new-password">Nueva Contraseña</Label>
                                            <Input
                                                id="new-password"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleChangePassword}
                                            disabled={loading || !currentPassword || !newPassword}
                                            className="w-full"
                                        >
                                            Actualizar Contraseña
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    Aquí puedes gestionar la seguridad y el estado de tu cuenta.
                                </p>

                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-lg font-medium text-destructive">Zona de Peligro</h3>
                                    <div className="space-y-3">
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
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            {aboutContent.termsTitle}
                                        </h3>
                                        {canManageContent && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 text-xs"
                                                onClick={() => setIsAboutEditorOpen(true)}
                                            >
                                                <Edit className="w-3 h-3" />
                                                Editar Contenido
                                            </Button>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground border p-4 rounded-lg bg-muted/30">
                                        <p>{aboutContent.termsDescription}</p>
                                        <ul className="list-disc ml-4 mt-2 space-y-1">
                                            {aboutContent.termsPoints.split('|').map((point, index) => (
                                                <li key={index}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-medium flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        {aboutContent.privacyTitle}
                                    </h3>
                                    <div className="text-sm text-muted-foreground border p-4 rounded-lg bg-muted/30">
                                        <p>{aboutContent.privacyDescription}</p>
                                        <ul className="list-disc ml-4 mt-2 space-y-1">
                                            {aboutContent.privacyPoints.split('|').map((point, index) => (
                                                <li key={index}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-center text-xs text-muted-foreground pt-8">
                                    <p>{aboutContent.appVersion}</p>
                                    <p>{aboutContent.copyrightText}</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Nested Dialog for Editing Content */}
            <Dialog open={isAboutEditorOpen} onOpenChange={setIsAboutEditorOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Contenido "Acerca de"</DialogTitle>
                    </DialogHeader>
                    <AboutContentManager />
                </DialogContent>
            </Dialog>
        </>
    );
}
