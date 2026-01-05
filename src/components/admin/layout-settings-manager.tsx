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

export default function LayoutSettingsManager({ onSettingsChange }: { onSettingsChange?: (settings: any) => void }) {
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
        searchWidth: 50, // %
        searchWidthMobile: 90, // %
        searchHeight: 12, // unit
        searchHeightMobile: 10, // unit
        // Map Buttons Position
        buttonsTop: 160, // px (default top-40 = 160px)
        buttonsTopMobile: 160,
        // Layer Control Position
        layerControlTop: 10, // px
        layerControlTopMobile: 10,
        // Popup Settings
        popupWidth: 280, // px
        popupWidthMobile: 260, // px
        popupScale: 1, // scale
        popupScaleMobile: 1, // scale
        popupFontSize: 14, // px
        popupFontSizeMobile: 12, // px
        popupOffsetY: -35, // px
        popupOffsetYMobile: -35, // px
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

            // Notify parent if callback provided (to update UI immediately)
            if (onSettingsChange) {
                onSettingsChange(settings)
            }

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

    const handleSettingChange = (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        // Live preview: notify parent immediately
        if (onSettingsChange) {
            onSettingsChange(newSettings);
        }
    };

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
                                    onValueChange={([val]) => handleSettingChange('mapHeight', val)}
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
                                    onValueChange={([val]) => handleSettingChange('sheetWidth', val)}
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
                                    onValueChange={([val]) => handleSettingChange('cardScale', val)}
                                />
                            </div>
                        </div>

                        {/* Search Bar Settings (Desktop) */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <h4 className="font-semibold text-sm">Barra de Búsqueda</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Ancho (% de Pantalla)</Label>
                                        <span className="text-sm text-muted-foreground">{settings.searchWidth || 50}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.searchWidth || 50]}
                                        min={20}
                                        max={100}
                                        step={5}
                                        onValueChange={([val]) => handleSettingChange('searchWidth', val)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Altura (Escala)</Label>
                                        <span className="text-sm text-muted-foreground">{settings.searchHeight || 12}</span>
                                    </div>
                                    <Slider
                                        value={[settings.searchHeight || 12]}
                                        min={8}
                                        max={20}
                                        step={1}
                                        onValueChange={([val]) => handleSettingChange('searchHeight', val)}
                                    />
                                    <p className="text-xs text-muted-foreground">Controla el alto y tamaño de texto.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Posición Vertical Botones (px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.buttonsTop || 160}px</span>
                                </div>
                                <Slider
                                    value={[settings.buttonsTop || 160]}
                                    min={50}
                                    max={500}
                                    step={10}
                                    onValueChange={([val]) => handleSettingChange('buttonsTop', val)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Posición Vertical Tipos de Mapa (px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.layerControlTop || 10}px</span>
                                </div>
                                <Slider
                                    value={[settings.layerControlTop || 10]}
                                    min={0}
                                    max={300}
                                    step={5}
                                    onValueChange={([val]) => handleSettingChange('layerControlTop', val)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Ancho de Mini Paneles (Popup px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.popupWidth || 280}px</span>
                                </div>
                                <Slider
                                    value={[settings.popupWidth || 280]}
                                    min={200}
                                    max={500}
                                    step={10}
                                    onValueChange={([val]) => handleSettingChange('popupWidth', val)}
                                />
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between">
                                    <Label>Escala Global del Popup</Label>
                                    <span className="text-sm text-muted-foreground">{settings.popupScale || 1}x</span>
                                </div>
                                <Slider
                                    value={[settings.popupScale || 1]}
                                    min={0.5}
                                    max={1.5}
                                    step={0.05}
                                    onValueChange={([val]) => handleSettingChange('popupScale', val)}
                                />
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between">
                                    <Label>Tamaño de Fuente del Contenido (px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.popupFontSize || 14}px</span>
                                </div>
                                <Slider
                                    value={[settings.popupFontSize || 14]}
                                    min={10}
                                    max={24}
                                    step={1}
                                    onValueChange={([val]) => handleSettingChange('popupFontSize', val)}
                                />
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between">
                                    <Label>Desplazamiento Vertical Popup (px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.popupOffsetY || -35}px</span>
                                </div>
                                <Slider
                                    value={[settings.popupOffsetY || -35]}
                                    min={-100}
                                    max={0}
                                    step={1}
                                    onValueChange={([val]) => handleSettingChange('popupOffsetY', val)}
                                />
                            </div>
                        </div>

                        {/* Advanced Map Settings */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <h4 className="font-semibold text-sm">Configuración Avanzada Mapa</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Desplazamiento Centro Cámara (px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.mapCenterOffset || 150}px</span>
                                </div>
                                <Slider
                                    value={[settings.mapCenterOffset || 150]}
                                    min={0}
                                    max={400}
                                    step={10}
                                    onValueChange={([val]) => handleSettingChange('mapCenterOffset', val)}
                                />
                                <p className="text-xs text-muted-foreground">Ajusta cuánto se baja el mapa para centrar el popup visualmente.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Ancla Icono X</Label>
                                        <span className="text-sm text-muted-foreground">{settings.iconAnchorX || 25}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.iconAnchorX || 25]}
                                        min={0}
                                        max={50}
                                        step={1}
                                        onValueChange={([val]) => handleSettingChange('iconAnchorX', val)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Ancla Icono Y</Label>
                                        <span className="text-sm text-muted-foreground">{settings.iconAnchorY || 25}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.iconAnchorY || 25]}
                                        min={0}
                                        max={50}
                                        step={1}
                                        onValueChange={([val]) => handleSettingChange('iconAnchorY', val)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Ajusta el punto de anclaje del icono (centro de la pizza).</p>
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
                                    onValueChange={([val]) => handleSettingChange('mapHeightMobile', val)}
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
                                    onValueChange={([val]) => handleSettingChange('sheetWidthMobile', val)}
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
                                    onValueChange={([val]) => handleSettingChange('cardScaleMobile', val)}
                                />
                            </div>
                        </div>

                        {/* Search Bar Settings (Mobile) */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <h4 className="font-semibold text-sm">Barra de Búsqueda (Móvil)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Ancho (% de Pantalla)</Label>
                                        <span className="text-sm text-muted-foreground">{settings.searchWidthMobile || 90}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.searchWidthMobile || 90]}
                                        min={50}
                                        max={100}
                                        step={5}
                                        onValueChange={([val]) => handleSettingChange('searchWidthMobile', val)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Altura (Escala)</Label>
                                        <span className="text-sm text-muted-foreground">{settings.searchHeightMobile || 10}</span>
                                    </div>
                                    <Slider
                                        value={[settings.searchHeightMobile || 10]}
                                        min={8}
                                        max={16}
                                        step={1}
                                        onValueChange={([val]) => handleSettingChange('searchHeightMobile', val)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Posición Vertical Botones (Móvil px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.buttonsTopMobile || 160}px</span>
                                </div>
                                <Slider
                                    value={[settings.buttonsTopMobile || 160]}
                                    min={50}
                                    max={500}
                                    onValueChange={([val]) => handleSettingChange('buttonsTopMobile', val)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Posición Vertical Tipos de Mapa (Móvil px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.layerControlTopMobile || 10}px</span>
                                </div>
                                <Slider
                                    value={[settings.layerControlTopMobile || 10]}
                                    min={0}
                                    max={300}
                                    onValueChange={([val]) => handleSettingChange('layerControlTopMobile', val)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Ancho de Mini Paneles (Popup Móvil px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.popupWidthMobile || 260}px</span>
                                </div>
                                <Slider
                                    value={[settings.popupWidthMobile || 260]}
                                    min={150}
                                    max={350}
                                    step={10}
                                    onValueChange={([val]) => handleSettingChange('popupWidthMobile', val)}
                                />
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between">
                                    <Label>Escala Global del Popup (Móvil)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.popupScaleMobile || 1}x</span>
                                </div>
                                <Slider
                                    value={[settings.popupScaleMobile || 1]}
                                    min={0.5}
                                    max={1.5}
                                    step={0.05}
                                    onValueChange={([val]) => handleSettingChange('popupScaleMobile', val)}
                                />
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between">
                                    <Label>Tamaño de Fuente del Contenido (Móvil px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.popupFontSizeMobile || 12}px</span>
                                </div>
                                <Slider
                                    value={[settings.popupFontSizeMobile || 12]}
                                    min={10}
                                    max={24}
                                    step={1}
                                    onValueChange={([val]) => handleSettingChange('popupFontSizeMobile', val)}
                                />
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between">
                                    <Label>Desplazamiento Vertical Popup (Móvil px)</Label>
                                    <span className="text-sm text-muted-foreground">{settings.popupOffsetYMobile || -35}px</span>
                                </div>
                                <Slider
                                    value={[settings.popupOffsetYMobile || -35]}
                                    min={-100}
                                    max={0}
                                    step={1}
                                    onValueChange={([val]) => handleSettingChange('popupOffsetYMobile', val)}
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
        </Card >
    )
}
