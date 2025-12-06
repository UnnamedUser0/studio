'use client'

import { useState, useEffect } from 'react'
import { toggleAdminRole, updatePermissions, getManageableUsers } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type AdminUser = {
    id: string
    name: string | null
    email: string | null
    image: string | null
    isAdmin: boolean
    permissions: string | null
    lastActiveAt: Date | null
}

import { Trash2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ... imports

import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const AVAILABLE_PERMISSIONS = [
    { id: 'manage_pizzerias', label: 'Gestionar Pizzerías' },
    { id: 'manage_reviews', label: 'Gestionar Reseñas' },
    { id: 'view_analytics', label: 'Ver Analíticas' },
    { id: 'manage_users', label: 'Gestionar Usuarios' },
    { id: 'manage_content', label: 'Gestionar Contenido' },
]

export function GrantingClient({ initialUsers }: { initialUsers: AdminUser[] }) {
    const [users, setUsers] = useState<AdminUser[]>(initialUsers)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)

    // New state for permissions
    const [permissionMode, setPermissionMode] = useState<'all' | 'none' | 'custom'>('custom')
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

    const { toast } = useToast()

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const updatedUsers = await getManageableUsers()
                setUsers(updatedUsers)
            } catch (error) {
                console.error("Failed to fetch users", error)
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
        try {
            await toggleAdminRole(userId, !currentStatus)
            toast({ title: "Éxito", description: "Rol de administrador actualizado" })
            setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: !currentStatus } : u))
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el rol", variant: "destructive" })
        }
    }

    const handleEditPermissions = (user: AdminUser) => {
        setEditingUser(user)
        const perms = (user.permissions && user.permissions.trim() !== "")
            ? user.permissions.split(',').map(p => p.trim())
            : []
        setSelectedPermissions(perms)

        // Determine initial mode
        if (perms.length === 0) {
            setPermissionMode('none')
        } else if (perms.length >= AVAILABLE_PERMISSIONS.length && AVAILABLE_PERMISSIONS.every(p => perms.includes(p.id))) {
            setPermissionMode('all')
        } else {
            setPermissionMode('custom')
        }
    }

    const handleModeChange = (mode: 'all' | 'none' | 'custom') => {
        setPermissionMode(mode)
        if (mode === 'all') {
            setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.id))
        } else if (mode === 'none') {
            setSelectedPermissions([])
        }
    }

    const savePermissions = async () => {
        if (!editingUser) return
        const permissionsString = selectedPermissions.join(',')
        try {
            await updatePermissions(editingUser.id, permissionsString)
            toast({ title: "Éxito", description: "Permisos actualizados" })
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, permissions: permissionsString } : u))
            setEditingUser(null)
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar permisos", variant: "destructive" })
        }
    }

    const handleDeleteUser = async () => {
        if (!deletingUser) return
        try {
            const { deleteUser } = await import('@/app/actions/admin')
            await deleteUser(deletingUser.id)
            toast({ title: "Éxito", description: "Usuario eliminado correctamente" })
            setUsers(users.filter(u => u.id !== deletingUser.id))
            setDeletingUser(null)
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el usuario", variant: "destructive" })
        }
    }

    const isOnline = (date: Date | null) => {
        if (!date) return false
        const diff = new Date().getTime() - new Date(date).getTime()
        return diff < 1 * 60 * 1000 // 1 minute threshold
    }

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Permisos</TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {user.image && <img src={user.image} alt="" className="w-6 h-6 rounded-full" />}
                                    {user.name}
                                </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                {isOnline(user.lastActiveAt) ? (
                                    <Badge className="bg-green-500 hover:bg-green-600">En línea</Badge>
                                ) : (
                                    <Badge variant="outline">Desconectado</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <Switch
                                    checked={user.isAdmin}
                                    onCheckedChange={() => handleToggleAdmin(user.id, user.isAdmin)}
                                    disabled={user.email === "va21070541@bachilleresdesonora.edu.mx"}
                                />
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                                {user.permissions || "Ninguno"}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditPermissions(user)}>
                                        Editar Permisos
                                    </Button>
                                    {user.email !== "va21070541@bachilleresdesonora.edu.mx" && (
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setDeletingUser(user)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Permisos para {editingUser?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-3">
                            <Label>Tipo de Acceso</Label>
                            <RadioGroup
                                value={permissionMode}
                                onValueChange={(value: 'all' | 'none' | 'custom') => handleModeChange(value)}
                                className="flex flex-col space-y-1"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="mode-all" />
                                    <Label htmlFor="mode-all">Todos los permisos</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="none" id="mode-none" />
                                    <Label htmlFor="mode-none">Ninguno</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="custom" id="mode-custom" />
                                    <Label htmlFor="mode-custom">Personalizado</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-3 border rounded-md p-4">
                            <Label className="mb-2 block">Permisos Disponibles</Label>
                            <div className="grid grid-cols-1 gap-3">
                                {AVAILABLE_PERMISSIONS.map((perm) => (
                                    <div key={perm.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={perm.id}
                                            checked={selectedPermissions.includes(perm.id)}
                                            onCheckedChange={(checked) => {
                                                if (permissionMode !== 'custom') return; // Only allow changes in custom mode
                                                if (checked) {
                                                    setSelectedPermissions([...selectedPermissions, perm.id]);
                                                } else {
                                                    setSelectedPermissions(selectedPermissions.filter(p => p !== perm.id));
                                                }
                                            }}
                                            disabled={permissionMode !== 'custom'}
                                        />
                                        <Label
                                            htmlFor={perm.id}
                                            className={`text-sm font-normal ${permissionMode !== 'custom' ? 'opacity-70' : ''}`}
                                        >
                                            {perm.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={savePermissions}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta de {deletingUser?.name} ({deletingUser?.email}) y removerá sus datos de nuestros servidores.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
