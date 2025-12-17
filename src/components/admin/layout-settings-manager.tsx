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
    const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop')
    const [settings, setSettings] = useState<any>({
        sheetWidth: 75,
        sheetWidthMobile: 100,
        cardScale: 1,
        cardScaleMobile: 1,
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

                <div className="flex w-full rounded-md bg-muted p-1 mt-4">
                    <button
                        onClick={() => setActiveTab('desktop')}
                        className={`flex-1 text-sm font-medium py-1.5 rounded-sm transition-all ${activeTab === 'desktop' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Escritorio
                    </button>
                    <button
                        onClick={() => setActiveTab('mobile')}
                        className={`flex-1 text-sm font-medium py-1.5 rounded-sm transition-all ${activeTab === 'mobile' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Móvil
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {activeTab === 'desktop' ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Desktop Settings */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Altura del Mapa (% de Pantalla)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.mapHeight || 70}%</span>
                                </div>
                                <Slider
                                    value={[settings.mapHeight || 70]}
                                    min={40}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => setSettings({ ...settings, mapHeight: val })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Ancho del Panel Lateral</Label>
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
                                    <span>Más Mapa</span>
                                    <span>Más Panel</span>
                                </div>
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
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Mobile Settings */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Altura del Mapa (Móvil)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.mapHeightMobile || 55}%</span>
                                </div>
                                <Slider
                                    value={[settings.mapHeightMobile || 55]}
                                    min={30}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => setSettings({ ...settings, mapHeightMobile: val })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Ancho del Panel (Móvil)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.sheetWidthMobile ?? 100}%</span>
                                </div>
                                <Slider
                                    value={[settings.sheetWidthMobile ?? 100]}
                                    min={50}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => setSettings({ ...settings, sheetWidthMobile: val })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Escala de Tarjetas (Móvil)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.cardScaleMobile ?? 1}x</span>
                                </div>
                                <Slider
                                    value={[settings.cardScaleMobile ?? 1]}
                                    min={0.5}
                                    max={1.2}
                                    step={0.05}
                                    onValueChange={([val]) => setSettings({ ...settings, cardScaleMobile: val })}
                                />
                            </div>
                        </div>
                    </div>
                )}


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
