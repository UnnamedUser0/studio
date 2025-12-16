'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getLayoutSettings, updateLayoutSettings } from '@/app/actions'
import { Save, LayoutTemplate, Smartphone } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

export default function LayoutSettingsManager() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState<any>({
        sheetWidth: 75,
        cardScale: 1,
        buttonScale: 1,
        buttonLayout: 'grid',
        mapHeight: 70,
        mapHeightMobile: 55
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const data = await getLayoutSettings()
            if (data) setSettings(data)
        } catch (error) {
            console.error('Error loading layout settings:', error)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateLayoutSettings(settings)
            toast({
                title: 'Configuración guardada',
                description: 'Los ajustes de diseño se han actualizado.',
                className: 'bg-green-500 text-white border-none',
            })
        } catch (error) {
            console.error('Error saving layout settings:', error)
            toast({
                title: 'Error',
                description: 'No se pudo guardar la configuración.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5" />
                    Configuración de Mapa y Diseño
                </CardTitle>
                <CardDescription>Ajusta el tamaño del panel lateral y la visualización del mapa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Altura del Mapa (% de Pantalla)</Label>
                            <span className="text-sm text-muted-foreground">{settings.mapHeight || 70}% - {settings.mapHeightMobile || 55}% (Móvil)</span>
                        </div>
                        <div className="space-y-4 pt-2">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Escritorio</Label>
                                <Slider
                                    value={[settings.mapHeight || 70]}
                                    min={40}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => setSettings({ ...settings, mapHeight: val })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Móvil</Label>
                                <Slider
                                    value={[settings.mapHeightMobile || 55]}
                                    min={30}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => setSettings({ ...settings, mapHeightMobile: val })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Ancho del Panel Lateral (Visible sobre el Mapa)</Label>
                            <span className="text-sm text-muted-foreground">{settings.sheetWidth}%</span>
                        </div>
                        <Slider
                            value={[settings.sheetWidth]}
                            min={30}
                            max={100}
                            step={5}
                            onValueChange={([val]) => setSettings({ ...settings, sheetWidth: val })}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Más Mapa Visible</span>
                            <span>Más Panel Visible</span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                            Controla qué porcentaje de la pantalla ocupa el panel de información, dejando el resto para el mapa.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Escala de Tarjetas</Label>
                            <span className="text-sm text-muted-foreground">{settings.cardScale}x</span>
                        </div>
                        <Slider
                            value={[settings.cardScale]}
                            min={0.8}
                            max={1.2}
                            step={0.05}
                            onValueChange={([val]) => setSettings({ ...settings, cardScale: val })}
                        />
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full gap-2"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </CardContent>
        </Card>
    )
}
