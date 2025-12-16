'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getAboutContent, updateAboutContent } from '@/app/actions/about'
import { Save, FileText, Shield } from 'lucide-react'

export default function AboutContentManager() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState({
        termsTitle: '',
        termsDescription: '',
        termsPoints: '',
        privacyTitle: '',
        privacyDescription: '',
        privacyPoints: '',
        appVersion: '',
        copyrightText: '',
    })

    useEffect(() => {
        loadContent()
    }, [])

    const loadContent = async () => {
        try {
            const data = await getAboutContent()
            setContent({
                termsTitle: data.termsTitle,
                termsDescription: data.termsDescription,
                termsPoints: data.termsPoints,
                privacyTitle: data.privacyTitle,
                privacyDescription: data.privacyDescription,
                privacyPoints: data.privacyPoints,
                appVersion: data.appVersion,
                copyrightText: data.copyrightText,
            })
        } catch (error) {
            console.error('Error loading about content:', error)
            toast({
                title: 'Error',
                description: 'No se pudo cargar el contenido de Acerca de.',
                variant: 'destructive'
            })
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateAboutContent(content)
            toast({
                title: 'Guardado exitosamente',
                description: 'El contenido de Acerca de ha sido actualizado.',
                className: 'bg-green-500 text-white border-none',
            })
        } catch (error) {
            console.error('Error saving about content:', error)
            toast({
                title: 'Error',
                description: 'No se pudo guardar el contenido.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Términos de Uso
                    </CardTitle>
                    <CardDescription>Configura el contenido de los Términos de Uso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="termsTitle">Título</Label>
                        <Input
                            id="termsTitle"
                            value={content.termsTitle}
                            onChange={(e) => setContent({ ...content, termsTitle: e.target.value })}
                            placeholder="Términos de Uso"
                        />
                    </div>
                    <div>
                        <Label htmlFor="termsDescription">Descripción</Label>
                        <Textarea
                            id="termsDescription"
                            value={content.termsDescription}
                            onChange={(e) => setContent({ ...content, termsDescription: e.target.value })}
                            placeholder="Descripción de los términos de uso..."
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="termsPoints">Puntos clave (separados por |)</Label>
                        <Textarea
                            id="termsPoints"
                            value={content.termsPoints}
                            onChange={(e) => setContent({ ...content, termsPoints: e.target.value })}
                            placeholder="Punto 1|Punto 2|Punto 3"
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Separa cada punto con el símbolo | (pipe)
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Política de Privacidad
                    </CardTitle>
                    <CardDescription>Configura el contenido de la Política de Privacidad</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="privacyTitle">Título</Label>
                        <Input
                            id="privacyTitle"
                            value={content.privacyTitle}
                            onChange={(e) => setContent({ ...content, privacyTitle: e.target.value })}
                            placeholder="Política de Privacidad"
                        />
                    </div>
                    <div>
                        <Label htmlFor="privacyDescription">Descripción</Label>
                        <Textarea
                            id="privacyDescription"
                            value={content.privacyDescription}
                            onChange={(e) => setContent({ ...content, privacyDescription: e.target.value })}
                            placeholder="Descripción de la política de privacidad..."
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="privacyPoints">Puntos clave (separados por |)</Label>
                        <Textarea
                            id="privacyPoints"
                            value={content.privacyPoints}
                            onChange={(e) => setContent({ ...content, privacyPoints: e.target.value })}
                            placeholder="Punto 1|Punto 2|Punto 3"
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Separa cada punto con el símbolo | (pipe)
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Información de la Aplicación</CardTitle>
                    <CardDescription>Versión y derechos de autor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="appVersion">Versión de la aplicación</Label>
                        <Input
                            id="appVersion"
                            value={content.appVersion}
                            onChange={(e) => setContent({ ...content, appVersion: e.target.value })}
                            placeholder="PizzApp v1.0.0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="copyrightText">Texto de copyright</Label>
                        <Input
                            id="copyrightText"
                            value={content.copyrightText}
                            onChange={(e) => setContent({ ...content, copyrightText: e.target.value })}
                            placeholder="© 2024 PizzApp Inc."
                        />
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full gap-2"
                size="lg"
            >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Guardar Todo'}
            </Button>
        </div>
    )
}
