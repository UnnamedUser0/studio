'use client'

import Link from 'next/link'
import { Pizza, Facebook, Instagram, ArrowRight, Plus, Trash2, Edit2, Save, X, Linkedin, Youtube, Mail, Phone, MapPin, Github, MessageCircle } from 'lucide-react'
import { XIcon } from '../icons/x-icon'
import { cn } from '@/lib/utils'
import { buttonVariants, Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
    createFooterSection,
    updateFooterSection,
    deleteFooterSection,
    createFooterLink,
    updateFooterLink,
    deleteFooterLink,
    createSocialLink,
    updateSocialLink,
    deleteSocialLink,
    seedFooterDefaults,
    updateFooterConfig
} from '@/app/actions/footer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'

// Types (should match Prisma models roughly)
type FooterLink = {
    id: string
    label: string
    href: string
    sectionId: string
    order: number
}

type FooterSection = {
    id: string
    title: string
    order: number
    links: FooterLink[]
}

type SocialLink = {
    id: string
    platform: string
    iconName: string
    href: string
    order: number
}

const SUPER_ADMIN_EMAIL = "va21070541@bachilleresdesonora.edu.mx"

const IconMap: Record<string, any> = {
    Facebook: Facebook,
    Instagram: Instagram,
    X: XIcon,
    Linkedin: Linkedin,
    Youtube: Youtube,
    Mail: Mail,
    Phone: Phone,
    MapPin: MapPin,
    Github: Github,
    Messenger: MessageCircle,
}

const FooterLinkItem = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <li>
        <Link
            href={href}
            className="group flex items-center text-sm text-slate-400 hover:text-primary transition-all duration-300"
        >
            <ArrowRight className="h-3 w-3 mr-2 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
            <span className="transition-transform duration-300 group-hover:translate-x-1">
                {children}
            </span>
        </Link>
    </li>
);

export default function FooterClient({
    initialSections,
    initialSocialLinks,
    initialCopyright
}: {
    initialSections: FooterSection[],
    initialSocialLinks: SocialLink[],
    initialCopyright?: string
}) {
    const { data: session } = useSession()
    const isAdmin = session?.user?.email === SUPER_ADMIN_EMAIL
    const router = useRouter()
    const { toast } = useToast()

    const [editingSection, setEditingSection] = useState<FooterSection | null>(null)
    const [editingLink, setEditingLink] = useState<FooterLink | null>(null)
    const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null)

    const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false)
    const [isCopyrightDialogOpen, setIsCopyrightDialogOpen] = useState(false)

    // Form states
    const [sectionForm, setSectionForm] = useState({ title: '', order: 0 })
    const [linkForm, setLinkForm] = useState({ label: '', href: '', sectionId: '', order: 0 })
    const [socialForm, setSocialForm] = useState({ platform: '', iconName: '', href: '', order: 0 })
    const [copyrightText, setCopyrightText] = useState(initialCopyright || `© ${new Date().getFullYear()} Pizzapp. Todos los derechos reservados.`)
    const [copyrightForm, setCopyrightForm] = useState('')

    useEffect(() => {
        if (initialCopyright) {
            setCopyrightText(initialCopyright)
        }
    }, [initialCopyright])

    // ... (Handlers for Section and Link remain the same)

    const handleCreateSection = async () => {
        try {
            await createFooterSection(sectionForm)
            toast({ title: "Sección creada" })
            setIsSectionDialogOpen(false)
            router.refresh()
        } catch (error) {
            toast({ title: "Error al crear sección", variant: "destructive" })
        }
    }

    const handleUpdateSection = async () => {
        if (!editingSection) return
        try {
            await updateFooterSection(editingSection.id, sectionForm)
            toast({ title: "Sección actualizada" })
            setIsSectionDialogOpen(false)
            setEditingSection(null)
            router.refresh()
        } catch (error) {
            toast({ title: "Error al actualizar sección", variant: "destructive" })
        }
    }

    const handleDeleteSection = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta sección?")) return
        try {
            await deleteFooterSection(id)
            toast({ title: "Sección eliminada" })
            router.refresh()
        } catch (error) {
            toast({ title: "Error al eliminar sección", variant: "destructive" })
        }
    }

    const handleCreateLink = async () => {
        try {
            await createFooterLink(linkForm)
            toast({ title: "Enlace creado" })
            setIsLinkDialogOpen(false)
            router.refresh()
        } catch (error) {
            toast({ title: "Error al crear enlace", variant: "destructive" })
        }
    }

    const handleUpdateLink = async () => {
        if (!editingLink) return
        try {
            await updateFooterLink(editingLink.id, linkForm)
            toast({ title: "Enlace actualizado" })
            setIsLinkDialogOpen(false)
            setEditingLink(null)
            router.refresh()
        } catch (error) {
            toast({ title: "Error al actualizar enlace", variant: "destructive" })
        }
    }

    const handleDeleteLink = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este enlace?")) return
        try {
            await deleteFooterLink(id)
            toast({ title: "Enlace eliminado" })
            router.refresh()
        } catch (error) {
            toast({ title: "Error al eliminar enlace", variant: "destructive" })
        }
    }

    const handleCreateSocial = async () => {
        try {
            await createSocialLink(socialForm)
            toast({ title: "Red social agregada" })
            setIsSocialDialogOpen(false)
            router.refresh()
        } catch (error) {
            toast({ title: "Error al agregar red social", variant: "destructive" })
        }
    }

    const handleUpdateSocial = async () => {
        if (!editingSocial) return
        try {
            await updateSocialLink(editingSocial.id, socialForm)
            toast({ title: "Red social actualizada" })
            setIsSocialDialogOpen(false)
            setEditingSocial(null)
            router.refresh()
        } catch (error) {
            toast({ title: "Error al actualizar red social", variant: "destructive" })
        }
    }

    const handleDeleteSocial = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta red social?")) return
        try {
            await deleteSocialLink(id)
            toast({ title: "Red social eliminada" })
            router.refresh()
        } catch (error) {
            toast({ title: "Error al eliminar red social", variant: "destructive" })
        }
    }

    const handleSeed = async () => {
        try {
            await seedFooterDefaults()
            toast({ title: "Datos por defecto cargados" })
            router.refresh()
        } catch (error) {
            toast({ title: "Error al cargar datos", variant: "destructive" })
        }
    }

    const handleUpdateCopyright = async () => {
        try {
            await updateFooterConfig(copyrightForm)
            toast({ title: "Copyright actualizado" })
            setCopyrightText(copyrightForm)
            setIsCopyrightDialogOpen(false)
            router.refresh()
        } catch (error) {
            toast({ title: "Error al actualizar copyright", variant: "destructive" })
        }
    }

    const openSectionDialog = (section?: FooterSection) => {
        if (section) {
            setEditingSection(section)
            setSectionForm({ title: section.title, order: section.order })
        } else {
            setEditingSection(null)
            setSectionForm({ title: '', order: 0 })
        }
        setIsSectionDialogOpen(true)
    }

    const openLinkDialog = (sectionId: string, link?: FooterLink) => {
        if (link) {
            setEditingLink(link)
            setLinkForm({ label: link.label, href: link.href, sectionId, order: link.order })
        } else {
            setEditingLink(null)
            setLinkForm({ label: '', href: '', sectionId, order: 0 })
        }
        setIsLinkDialogOpen(true)
    }

    const openSocialDialog = (social?: SocialLink) => {
        if (social) {
            setEditingSocial(social)
            setSocialForm({ platform: social.platform, iconName: social.iconName, href: social.href, order: social.order })
        } else {
            setEditingSocial(null)
            setSocialForm({ platform: 'Facebook', iconName: 'Facebook', href: '', order: 0 })
        }
        setIsSocialDialogOpen(true)
    }

    const openCopyrightDialog = () => {
        setCopyrightForm(copyrightText)
        setIsCopyrightDialogOpen(true)
    }

    return (
        <footer className="bg-slate-900 text-slate-300 relative">
            {/* ... (Admin buttons remain the same) */}
            {isAdmin && (
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {initialSections.length === 0 && (
                        <Button onClick={handleSeed} size="sm" variant="secondary">
                            <Save className="h-4 w-4 mr-2" /> Cargar Por Defecto
                        </Button>
                    )}
                    <Button onClick={() => openSectionDialog()} size="sm" variant="secondary">
                        <Plus className="h-4 w-4 mr-2" /> Agregar Sección
                    </Button>
                </div>
            )}

            <div className="container py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Column 1: Logo and Description */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Pizza className="h-7 w-7 text-primary" />
                            <div className="w-[7ch]">
                                <span className="font-bold font-headline text-xl inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation text-white">
                                    PizzApp
                                </span>
                            </div>
                        </Link>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Encuentra las mejores pizzerías en Hermosillo con un solo clic. Tu guía definitiva para la pizza.
                        </p>

                        <div className="flex flex-wrap gap-3 pt-2 items-center">
                            {initialSocialLinks.map((social) => {
                                const Icon = IconMap[social.iconName] || Facebook
                                return (
                                    <div key={social.id} className="relative group/social">
                                        <Link
                                            href={social.href}
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "icon" }),
                                                "bg-slate-800 text-slate-400 hover:bg-primary hover:text-white rounded-full transition-all duration-300 hover:-translate-y-1 hover:glow-primary"
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Icon className="h-5 w-5 text-current" />
                                        </Link>
                                        {isAdmin && (
                                            <div className="absolute -top-8 -right-2 hidden group-hover/social:flex gap-1 bg-slate-800 rounded-md p-1 z-20 shadow-lg border border-slate-700">
                                                <button onClick={(e) => { e.preventDefault(); openSocialDialog(social) }} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded"><Edit2 className="h-4 w-4" /></button>
                                                <button onClick={(e) => { e.preventDefault(); handleDeleteSocial(social.id) }} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            {isAdmin && (
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-dashed" onClick={() => openSocialDialog()}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Sections */}
                    {initialSections.map((section) => (
                        <div key={section.id} className="relative group/section">
                            {isAdmin && (
                                <div className="absolute -top-2 right-0 hidden group-hover/section:flex gap-2 bg-slate-900 z-20 border border-slate-700 rounded-md p-1 shadow-lg">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800" onClick={() => openSectionDialog(section)}><Edit2 className="h-4 w-4 text-blue-400" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800" onClick={() => handleDeleteSection(section.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                                </div>
                            )}
                            <h3 className="font-headline text-lg font-semibold text-white relative mb-6">
                                {section.title}
                                <span className="absolute -bottom-2 left-0 h-1 w-12 bg-primary rounded-full"></span>
                            </h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <div key={link.id} className="relative group/link flex items-center">
                                        <FooterLinkItem href={link.href}>{link.label}</FooterLinkItem>
                                        {isAdmin && (
                                            <div className="ml-2 hidden group-hover/link:flex gap-1 items-center">
                                                <button onClick={() => openLinkDialog(section.id, link)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"><Edit2 className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteLink(link.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isAdmin && (
                                    <Button variant="ghost" size="sm" className="text-xs text-slate-500" onClick={() => openLinkDialog(section.id)}>
                                        <Plus className="h-3 w-3 mr-1" /> Agregar enlace
                                    </Button>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-500 relative group/copyright">
                    <p>{copyrightText}</p>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-8 right-0 opacity-0 group-hover/copyright:opacity-100 transition-opacity"
                            onClick={openCopyrightDialog}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSection ? 'Editar Sección' : 'Nueva Sección'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Título</Label>
                            <Input value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} />
                        </div>
                        <div>
                            <Label>Orden</Label>
                            <Input type="number" value={sectionForm.order} onChange={e => setSectionForm({ ...sectionForm, order: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={editingSection ? handleUpdateSection : handleCreateSection}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLink ? 'Editar Enlace' : 'Nuevo Enlace'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Texto</Label>
                            <Input value={linkForm.label} onChange={e => setLinkForm({ ...linkForm, label: e.target.value })} />
                        </div>
                        <div>
                            <Label>URL</Label>
                            <Input value={linkForm.href} onChange={e => setLinkForm({ ...linkForm, href: e.target.value })} />
                        </div>
                        <div>
                            <Label>Orden</Label>
                            <Input type="number" value={linkForm.order} onChange={e => setLinkForm({ ...linkForm, order: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={editingLink ? handleUpdateLink : handleCreateLink}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSocialDialogOpen} onOpenChange={setIsSocialDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingSocial ? 'Editar Red Social' : 'Nueva Red Social'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Plataforma</Label>
                            <Input value={socialForm.platform} onChange={e => setSocialForm({ ...socialForm, platform: e.target.value })} />
                        </div>
                        <div>
                            <Label>Icono</Label>
                            <div className="grid grid-cols-5 gap-2 mt-2">
                                {Object.keys(IconMap).map((iconName) => {
                                    const Icon = IconMap[iconName]
                                    return (
                                        <div
                                            key={iconName}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-2 rounded-md cursor-pointer border hover:bg-muted transition-colors",
                                                socialForm.iconName === iconName ? "border-primary bg-primary/10" : "border-transparent"
                                            )}
                                            onClick={() => setSocialForm({ ...socialForm, iconName })}
                                        >
                                            <Icon className="h-6 w-6 mb-1" />
                                            <span className="text-[10px] truncate w-full text-center">{iconName}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div>
                            <Label>URL</Label>
                            <Input value={socialForm.href} onChange={e => setSocialForm({ ...socialForm, href: e.target.value })} />
                        </div>
                        <div>
                            <Label>Orden</Label>
                            <Input type="number" value={socialForm.order} onChange={e => setSocialForm({ ...socialForm, order: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={editingSocial ? handleUpdateSocial : handleCreateSocial}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCopyrightDialogOpen} onOpenChange={setIsCopyrightDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Copyright</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Texto del Copyright</Label>
                            <Textarea
                                value={copyrightForm}
                                onChange={e => setCopyrightForm(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Puedes usar texto simple. Se mostrará centrado al final del pie de página.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateCopyright}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </footer>
    )
}
