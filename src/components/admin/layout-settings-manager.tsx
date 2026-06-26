'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getLayoutSettings, updateLayoutSettings } from '@/app/actions'
import { Save, LayoutTemplate } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

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
        mapHeight: 70,
        mapHeightMobile: 55,
        mapCenterOffset: 150,
        popupCenterOffset2D: 180,
        popupCenterOffset2DMobile: 150,
        popupCenterOffset3D: 250,
        popupCenterOffset3DMobile: 200,
        iconAnchorX: 25,
        iconAnchorY: 25,
        navInstructionTop: 16,
        navInstructionTopMobile: 16,
        navInstructionScale: 1.0,
        navInstructionScaleMobile: 1.0,
        navDashboardBottom: 0,
        navDashboardBottomMobile: 0,
        navDashboardScale: 1.0,
        navDashboardScaleMobile: 1.0,
        navStreetBottom: 112,
        navStreetBottomMobile: 112,
        navStreetScale: 1.0,
        navStreetScaleMobile: 1.0,
        navInstructionLeft: 0,
        navInstructionLeftMobile: 0,
        navDashboardLeft: 0,
        navDashboardLeftMobile: 0,
        navStreetLeft: 0,
        navStreetLeftMobile: 0,
        navInstructionWidth: 100,
        navInstructionWidthMobile: 100,
        navDashboardWidth: 100,
        navDashboardWidthMobile: 100,
        userMarkerScale: 1.0,
        userMarkerScaleMobile: 1.0,
        navSpeedBottom: 112,
        navSpeedBottomMobile: 112,
        navSpeedLeft: 0,
        navSpeedLeftMobile: 0,
        navSpeedScale: 1.0,
        navSpeedScaleMobile: 1.0,
        navInstructionFontSize: 24,
        navInstructionFontSizeMobile: 18,
        navDashboardFontSize: 30,
        navDashboardFontSizeMobile: 22
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const data = await getLayoutSettings()
            if (data) {
                // Merge data with initial defaults to ensure no property becomes undefined
                setSettings((prev: any) => ({ ...prev, ...data }))
            }
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
                description: 'Los ajustes de diseño se han actualizado correctamente en el servidor.',
                className: 'bg-green-600 text-white border-none',
            })
        } catch (error) {
            console.error('Error saving layout settings:', error)
            toast({
                title: 'Error al guardar',
                description: 'No se pudo guardar la configuración en la base de datos.',
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

    const handleLocalSettingChange = (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        if (onSettingsChange) {
            onSettingsChange(newSettings);
        }
    };

    const handleSettingCommit = (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        if (onSettingsChange) {
            onSettingsChange(newSettings);
        }
    };

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                    <LayoutTemplate className="w-5 h-5 text-primary" />
                    Consola de Ajustes y Diseño del Mapa
                </CardTitle>
                <CardDescription>
                    Modifica en tiempo real las proporciones del visor del mapa, buscador, controles laterales y popups.
                </CardDescription>

                <div className="flex w-full rounded-md bg-muted p-1 mt-4">
                    <button
                        onClick={() => setActiveTab('desktop')}
                        type="button"
                        className={`flex-1 text-xs font-semibold py-2 rounded-sm transition-all ${activeTab === 'desktop' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Escritorio (Desktop)
                    </button>
                    <button
                        onClick={() => setActiveTab('mobile')}
                        type="button"
                        className={`flex-1 text-xs font-semibold py-2 rounded-sm transition-all ${activeTab === 'mobile' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Dispositivos Móviles
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-0">

                {activeTab === 'desktop' ? (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        {/* Map Height */}
                        <div className="space-y-3 border p-4 rounded-lg bg-muted/20">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-sm font-semibold text-foreground">Proporción de Altura del Mapa</Label>
                                    <span className="text-xs font-bold text-primary">{settings.mapHeight || 70}%</span>
                                </div>
                                <Slider
                                    value={[settings.mapHeight || 70]}
                                    min={40}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => handleLocalSettingChange('mapHeight', val)} onValueCommit={([val]) => handleSettingCommit('mapHeight', val)}
                                />
                                <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                    Establece la altura vertical del mapa en relación con el alto total de la ventana gráfica en ordenadores.
                                </p>
                            </div>
                        </div>

                        {/* Sheet Width */}
                        <div className="space-y-3 border p-4 rounded-lg bg-muted/20">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-sm font-semibold text-foreground">Ancho del Panel Lateral (Lista)</Label>
                                    <span className="text-xs font-bold text-primary">{settings.sheetWidth}%</span>
                                </div>
                                <Slider
                                    value={[settings.sheetWidth]}
                                    min={30}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => handleLocalSettingChange('sheetWidth', val)} onValueCommit={([val]) => handleSettingCommit('sheetWidth', val)}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Más espacio para el mapa</span>
                                    <span>Más ancho para listados</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                    Define el ancho porcentual (vw) asignado al panel que contiene la lista de pizzerías e información en vista de escritorio.
                                </p>
                            </div>
                        </div>

                        {/* Card Scale */}
                        <div className="space-y-3 border p-4 rounded-lg bg-muted/20">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-sm font-semibold text-foreground">Escala Visual de Tarjetas de Pizzerías</Label>
                                    <span className="text-xs font-bold text-primary">{settings.cardScale}x</span>
                                </div>
                                <Slider
                                    value={[settings.cardScale]}
                                    min={0.8}
                                    max={1.2}
                                    step={0.05}
                                    onValueChange={([val]) => handleLocalSettingChange('cardScale', val)} onValueCommit={([val]) => handleSettingCommit('cardScale', val)}
                                />
                                <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                    Ajusta el factor de escala global para el tamaño físico de las tarjetas informativas dentro del listado.
                                </p>
                            </div>
                        </div>

                        {/* Search Bar Settings */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Buscador Inteligente</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Ancho Relativo del Buscador</Label>
                                        <span className="text-xs font-bold text-primary">{settings.searchWidth || 50}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.searchWidth || 50]}
                                        min={20}
                                        max={100}
                                        step={5}
                                        onValueChange={([val]) => handleLocalSettingChange('searchWidth', val)} onValueCommit={([val]) => handleSettingCommit('searchWidth', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Porcentaje del ancho de la pantalla que ocupará la barra flotante de búsqueda.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Altura del Buscador (Escala)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.searchHeight || 12}</span>
                                    </div>
                                    <Slider
                                        value={[settings.searchHeight || 12]}
                                        min={8}
                                        max={20}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('searchHeight', val)} onValueCommit={([val]) => handleSettingCommit('searchHeight', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Multiplicador de altura vertical y tamaño de fuente tipográfica de la caja de texto del buscador.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Controls Positions */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Ubicación de Controles del Mapa</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Desplazamiento Superior de Botones de Control</Label>
                                        <span className="text-xs font-bold text-primary">{settings.buttonsTop || 160}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.buttonsTop || 160]}
                                        min={50}
                                        max={500}
                                        step={10}
                                        onValueChange={([val]) => handleLocalSettingChange('buttonsTop', val)} onValueCommit={([val]) => handleSettingCommit('buttonsTop', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Posición en píxeles desde el borde superior para botones de acción rápida flotantes a la derecha (Brújula, Geolocalización, Fullscreen).
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Desplazamiento Superior del Selector de Capas</Label>
                                        <span className="text-xs font-bold text-primary">{settings.layerControlTop || 10}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.layerControlTop || 10]}
                                        min={0}
                                        max={300}
                                        step={5}
                                        onValueChange={([val]) => handleLocalSettingChange('layerControlTop', val)} onValueCommit={([val]) => handleSettingCommit('layerControlTop', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Margen vertical superior en píxeles para el selector flotante de tipos de mapa (Satélite, Relieve, Tránsito).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Popup Sizing */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Globo de Información (Popup)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Ancho del Globo de Información (Popup)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupWidth || 280}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupWidth || 280]}
                                        min={200}
                                        max={500}
                                        step={10}
                                        onValueChange={([val]) => handleLocalSettingChange('popupWidth', val)} onValueCommit={([val]) => handleSettingCommit('popupWidth', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ancho fijo en píxeles para los globos de previsualización al seleccionar pizzerías.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala Visual del Globo de Información</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupScale || 1}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupScale || 1]}
                                        min={0.5}
                                        max={1.5}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('popupScale', val)} onValueCommit={([val]) => handleSettingCommit('popupScale', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Multiplicador de tamaño en escala 2D para ajustar la proporción visual del globo.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Tamaño de Fuente del Popup</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupFontSize || 14}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupFontSize || 14]}
                                        min={10}
                                        max={24}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('popupFontSize', val)} onValueCommit={([val]) => handleSettingCommit('popupFontSize', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Tamaño de letra en píxeles de las descripciones del globo emergente.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Desplazamiento de Altura del Popup (Offset Y)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupOffsetY || -35}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupOffsetY || -35]}
                                        min={-100}
                                        max={0}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('popupOffsetY', val)} onValueCommit={([val]) => handleSettingCommit('popupOffsetY', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta qué tan arriba del marcador de pizza se dibuja el globo de diálogo (valores negativos indican mayor distancia hacia arriba).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Map Settings */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Cámara y Punteros Avanzados</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Offset de Centrado del Popup (Vista 2D Escritorio)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupCenterOffset2D || 180}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupCenterOffset2D || 180]}
                                        min={-500}
                                        max={1500}
                                        step={10}
                                        onValueChange={([val]) => handleLocalSettingChange('popupCenterOffset2D', val)} onValueCommit={([val]) => handleSettingCommit('popupCenterOffset2D', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el desplazamiento vertical para centrar el popup en vista estándar 2D (Escritorio).
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Offset de Centrado del Popup (Vista 3D Escritorio)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupCenterOffset3D || 250}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupCenterOffset3D || 250]}
                                        min={-500}
                                        max={1500}
                                        step={10}
                                        onValueChange={([val]) => handleLocalSettingChange('popupCenterOffset3D', val)} onValueCommit={([val]) => handleSettingCommit('popupCenterOffset3D', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el desplazamiento vertical para centrar el popup en vista inclinada 3D (Escritorio).
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label className="text-xs font-medium">Ancla Eje X (Marcador)</Label>
                                            <span className="text-xs font-bold text-primary">{settings.iconAnchorX || 25}px</span>
                                        </div>
                                        <Slider
                                            value={[settings.iconAnchorX || 25]}
                                            min={0}
                                            max={50}
                                            step={1}
                                            onValueChange={([val]) => handleLocalSettingChange('iconAnchorX', val)} onValueCommit={([val]) => handleSettingCommit('iconAnchorX', val)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label className="text-xs font-medium">Ancla Eje Y (Marcador)</Label>
                                            <span className="text-xs font-bold text-primary">{settings.iconAnchorY || 25}px</span>
                                        </div>
                                        <Slider
                                            value={[settings.iconAnchorY || 25]}
                                            min={0}
                                            max={50}
                                            step={1}
                                            onValueChange={([val]) => handleLocalSettingChange('iconAnchorY', val)} onValueCommit={([val]) => handleSettingCommit('iconAnchorY', val)}
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                    Alineación y desfase del marcador respecto a su punto geográfico (el valor ideal [25, 25] corresponde a centrado horizontal y vertical).
                                </p>
                            </div>
                        </div>

                        {/* Navigation Settings (Desktop) */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Interfaz de Navegación (Durante viaje)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Superior de Indicaciones (Ruta)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionTop ?? 16}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionTop ?? 16]}
                                        min={0}
                                        max={200}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionTop', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionTop', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Posición vertical en píxeles para la barra superior verde de indicaciones.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala de Indicaciones (Ruta)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionScale ?? 1.0}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionScale ?? 1.0]}
                                        min={0.5}
                                        max={2.0}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionScale', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionScale', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta la escala física global de la barra de indicaciones superior.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Lateral de Indicaciones (Ruta)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionLeft ?? 0}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionLeft ?? 0]}
                                        min={-300}
                                        max={300}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionLeft', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionLeft', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Desplazamiento horizontal (izquierda/derecha) para las indicaciones.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Ancho de Indicaciones (Ruta)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionWidth ?? 100}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionWidth ?? 100]}
                                        min={30}
                                        max={100}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionWidth', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionWidth', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el ancho de la barra de indicaciones superior en porcentaje de pantalla.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Tamaño de Letra de Indicaciones</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionFontSize ?? 24}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionFontSize ?? 24]}
                                        min={12}
                                        max={40}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionFontSize', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionFontSize', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Modifica el tamaño de la tipografía de la barra verde de indicaciones.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Inferior del Tablero (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardBottom ?? 0}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardBottom ?? 0]}
                                        min={-100}
                                        max={200}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardBottom', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardBottom', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajuste vertical de la posición del panel de control de tiempo y distancia inferior.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala del Tablero (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardScale ?? 1.0}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardScale ?? 1.0]}
                                        min={0.5}
                                        max={2.0}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardScale', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardScale', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Escala el panel inferior de información y tiempo estimado.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Lateral del Tablero (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardLeft ?? 0}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardLeft ?? 0]}
                                        min={-300}
                                        max={300}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardLeft', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardLeft', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Desplazamiento horizontal (izquierda/derecha) para el tablero.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Ancho del Tablero (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardWidth ?? 100}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardWidth ?? 100]}
                                        min={30}
                                        max={100}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardWidth', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardWidth', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el ancho del panel inferior en porcentaje de pantalla.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Tamaño de Letra del Tablero (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardFontSize ?? 30}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardFontSize ?? 30]}
                                        min={12}
                                        max={50}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardFontSize', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardFontSize', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Modifica el tamaño de la tipografía del panel negro de tiempo y distancia.
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Inferior del Velocímetro</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navSpeedBottom ?? 112}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navSpeedBottom ?? 112]}
                                        min={20}
                                        max={400}
                                        step={5}
                                        onValueChange={([val]) => handleLocalSettingChange('navSpeedBottom', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navSpeedBottom', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Desplazamiento vertical desde el borde inferior para el indicador de velocidad.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala del Velocímetro</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navSpeedScale ?? 1.0}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.navSpeedScale ?? 1.0]}
                                        min={0.5}
                                        max={2.0}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('navSpeedScale', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navSpeedScale', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Modifica el tamaño (escala) del indicador de velocidad.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Lateral del Velocímetro</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navSpeedLeft ?? 0}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navSpeedLeft ?? 0]}
                                        min={-300}
                                        max={300}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navSpeedLeft', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navSpeedLeft', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Desplazamiento horizontal (izquierda/derecha) para el velocímetro.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala de Indicador de Ubicación (Usuario/Flecha)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.userMarkerScale ?? 1.0}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.userMarkerScale ?? 1.0]}
                                        min={0.5}
                                        max={4.0}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('userMarkerScale', val)}
                                        onValueCommit={([val]) => handleSettingCommit('userMarkerScale', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el tamaño (escala) del indicador de ubicación del usuario (y flecha de navegación).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        {/* Mobile Height */}
                        <div className="space-y-3 border p-4 rounded-lg bg-muted/20">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-sm font-semibold text-foreground">Proporción de Altura del Mapa (Vista Móvil)</Label>
                                    <span className="text-xs font-bold text-primary">{settings.mapHeightMobile || 55}%</span>
                                </div>
                                <Slider
                                    value={[settings.mapHeightMobile || 55]}
                                    min={30}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => handleLocalSettingChange('mapHeightMobile', val)} onValueCommit={([val]) => handleSettingCommit('mapHeightMobile', val)}
                                />
                                <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                    Altura del mapa para dispositivos móviles expresada en porcentaje respecto a la altura útil de la pantalla móvil.
                                </p>
                            </div>
                        </div>

                        {/* Mobile Sheet Width */}
                        <div className="space-y-3 border p-4 rounded-lg bg-muted/20">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-sm font-semibold text-foreground">Ancho del Panel (Vista Móvil)</Label>
                                    <span className="text-xs font-bold text-primary">{settings.sheetWidthMobile ?? 100}%</span>
                                </div>
                                <Slider
                                    value={[settings.sheetWidthMobile ?? 100]}
                                    min={50}
                                    max={100}
                                    step={5}
                                    onValueChange={([val]) => handleLocalSettingChange('sheetWidthMobile', val)} onValueCommit={([val]) => handleSettingCommit('sheetWidthMobile', val)}
                                />
                                <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                    Ancho que abarca la lista de pizzerías deslizable en móviles. Un 100% cubre el ancho total.
                                </p>
                            </div>
                        </div>

                        {/* Mobile Card Scale */}
                        <div className="space-y-3 border p-4 rounded-lg bg-muted/20">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-sm font-semibold text-foreground">Escala Visual de Tarjetas (Vista Móvil)</Label>
                                    <span className="text-xs font-bold text-primary">{settings.cardScaleMobile ?? 1}x</span>
                                </div>
                                <Slider
                                    value={[settings.cardScaleMobile ?? 1]}
                                    min={0.5}
                                    max={1.2}
                                    step={0.05}
                                    onValueChange={([val]) => handleLocalSettingChange('cardScaleMobile', val)} onValueCommit={([val]) => handleSettingCommit('cardScaleMobile', val)}
                                />
                                <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                    Ajuste de escala de tamaño físico para los contenedores de pizzería en dispositivos celulares.
                                </p>
                            </div>
                        </div>

                        {/* Mobile Search Bar Settings */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Buscador Inteligente (Móvil)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Ancho Relativo del Buscador (Vista Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.searchWidthMobile || 90}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.searchWidthMobile || 90]}
                                        min={50}
                                        max={100}
                                        step={5}
                                        onValueChange={([val]) => handleLocalSettingChange('searchWidthMobile', val)} onValueCommit={([val]) => handleSettingCommit('searchWidthMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Define qué porcentaje del ancho disponible ocupa el buscador flotante en la vista celular.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Altura del Buscador (Vista Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.searchHeightMobile || 10}</span>
                                    </div>
                                    <Slider
                                        value={[settings.searchHeightMobile || 10]}
                                        min={8}
                                        max={16}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('searchHeightMobile', val)} onValueCommit={([val]) => handleSettingCommit('searchHeightMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Tamaño de altura del input de búsqueda e iconos en dispositivos táctiles.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Controls Position */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Ubicación de Controles (Móvil)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Desplazamiento Superior de Botones de Control (Vista Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.buttonsTopMobile || 160}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.buttonsTopMobile || 160]}
                                        min={50}
                                        max={500}
                                        step={10}
                                        onValueChange={([val]) => handleLocalSettingChange('buttonsTopMobile', val)} onValueCommit={([val]) => handleSettingCommit('buttonsTopMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Margen vertical en píxeles para los botones flotantes laterales en dispositivos móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Desplazamiento Superior del Selector de Capas (Vista Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.layerControlTopMobile || 10}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.layerControlTopMobile || 10]}
                                        min={0}
                                        max={300}
                                        step={5}
                                        onValueChange={([val]) => handleLocalSettingChange('layerControlTopMobile', val)} onValueCommit={([val]) => handleSettingCommit('layerControlTopMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Margen vertical superior del control selector de estilo de mapa en dispositivos móviles.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Popup Settings */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Globo de Información (Popup Móvil)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Ancho del Globo de Información (Popup Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupWidthMobile || 260}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupWidthMobile || 260]}
                                        min={150}
                                        max={350}
                                        step={10}
                                        onValueChange={([val]) => handleLocalSettingChange('popupWidthMobile', val)} onValueCommit={([val]) => handleSettingCommit('popupWidthMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el ancho del popup al tocar un marcador en celulares.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala Visual del Globo de Información (Vista Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupScaleMobile || 1}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupScaleMobile || 1]}
                                        min={0.5}
                                        max={1.5}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('popupScaleMobile', val)} onValueCommit={([val]) => handleSettingCommit('popupScaleMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Escalado visual 2D del popup emergente en dispositivos móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Tamaño de Fuente del Popup (Vista Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupFontSizeMobile || 12}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupFontSizeMobile || 12]}
                                        min={10}
                                        max={24}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('popupFontSizeMobile', val)} onValueCommit={([val]) => handleSettingCommit('popupFontSizeMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Tamaño de letra en píxeles del popup emergente al usar móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Desplazamiento de Altura del Popup (Offset Y Vista Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupOffsetYMobile || -35}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupOffsetYMobile || -35]}
                                        min={-100}
                                        max={0}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('popupOffsetYMobile', val)} onValueCommit={([val]) => handleSettingCommit('popupOffsetYMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajuste de separación vertical del popup móvil con respecto al icono de la pizzería.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Map Settings (Mobile) */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Cámara Avanzada (Móvil)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Offset de Centrado del Popup (Vista 2D Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupCenterOffset2DMobile || 150}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupCenterOffset2DMobile || 150]}
                                        min={-500}
                                        max={1500}
                                        step={10}
                                        onValueChange={([val]) => handleLocalSettingChange('popupCenterOffset2DMobile', val)} onValueCommit={([val]) => handleSettingCommit('popupCenterOffset2DMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el desplazamiento vertical para centrar el popup en vista estándar 2D (Móvil).
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Offset de Centrado del Popup (Vista 3D Móvil)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.popupCenterOffset3DMobile || 200}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.popupCenterOffset3DMobile || 200]}
                                        min={-500}
                                        max={1500}
                                        step={10}
                                        onValueChange={([val]) => handleLocalSettingChange('popupCenterOffset3DMobile', val)} onValueCommit={([val]) => handleSettingCommit('popupCenterOffset3DMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el desplazamiento vertical para centrar el popup en vista inclinada 3D (Móvil).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Settings (Mobile) */}
                        <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                            <h4 className="font-bold text-sm text-foreground/90 border-b pb-1.5 mb-2">Interfaz de Navegación (Durante viaje Móvil)</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Superior de Indicaciones Móvil</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionTopMobile ?? 16}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionTopMobile ?? 16]}
                                        min={0}
                                        max={200}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionTopMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionTopMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Posición vertical en píxeles para la barra superior verde de indicaciones en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala de Indicaciones Móvil</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionScaleMobile ?? 1.0}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionScaleMobile ?? 1.0]}
                                        min={0.5}
                                        max={2.0}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionScaleMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionScaleMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta la escala física global de la barra de indicaciones superior en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Lateral de Indicaciones Móvil</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionLeftMobile ?? 0}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionLeftMobile ?? 0]}
                                        min={-300}
                                        max={300}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionLeftMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionLeftMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Desplazamiento horizontal (izquierda/derecha) para las indicaciones en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Ancho de Indicaciones Móvil (Ruta)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionWidthMobile ?? 100}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionWidthMobile ?? 100]}
                                        min={30}
                                        max={100}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionWidthMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionWidthMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el ancho de la barra de indicaciones superior en móviles en porcentaje de pantalla.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Tamaño de Letra de Indicaciones Móvil</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navInstructionFontSizeMobile ?? 18}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navInstructionFontSizeMobile ?? 18]}
                                        min={10}
                                        max={30}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('navInstructionFontSizeMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navInstructionFontSizeMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Modifica el tamaño de la tipografía de la barra verde de indicaciones en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Inferior del Tablero Móvil (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardBottomMobile ?? 0}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardBottomMobile ?? 0]}
                                        min={-100}
                                        max={200}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardBottomMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardBottomMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajuste vertical de la posición del panel de control de tiempo y distancia inferior en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala del Tablero Móvil (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardScaleMobile ?? 1.0}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardScaleMobile ?? 1.0]}
                                        min={0.5}
                                        max={2.0}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardScaleMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardScaleMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Escala el panel inferior de información y tiempo estimado en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Lateral del Tablero Móvil (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardLeftMobile ?? 0}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardLeftMobile ?? 0]}
                                        min={-300}
                                        max={300}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardLeftMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardLeftMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Desplazamiento horizontal (izquierda/derecha) para el tablero en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Ancho del Tablero Móvil (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardWidthMobile ?? 100}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardWidthMobile ?? 100]}
                                        min={30}
                                        max={100}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardWidthMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardWidthMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el ancho del panel inferior en móviles en porcentaje de pantalla.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Tamaño de Letra del Tablero Móvil (Tiempo/ETA)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navDashboardFontSizeMobile ?? 22}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navDashboardFontSizeMobile ?? 22]}
                                        min={10}
                                        max={32}
                                        step={1}
                                        onValueChange={([val]) => handleLocalSettingChange('navDashboardFontSizeMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navDashboardFontSizeMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Modifica el tamaño de la tipografía del panel negro de tiempo y distancia en móviles.
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Inferior del Velocímetro Móvil</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navSpeedBottomMobile ?? 112}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navSpeedBottomMobile ?? 112]}
                                        min={20}
                                        max={400}
                                        step={5}
                                        onValueChange={([val]) => handleLocalSettingChange('navSpeedBottomMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navSpeedBottomMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Desplazamiento vertical desde el borde inferior para el velocímetro en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala del Velocímetro Móvil</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navSpeedScaleMobile ?? 1.0}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.navSpeedScaleMobile ?? 1.0]}
                                        min={0.5}
                                        max={2.0}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('navSpeedScaleMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navSpeedScaleMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Modifica el tamaño del velocímetro en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Margen Lateral del Velocímetro Móvil</Label>
                                        <span className="text-xs font-bold text-primary">{settings.navSpeedLeftMobile ?? 0}px</span>
                                    </div>
                                    <Slider
                                        value={[settings.navSpeedLeftMobile ?? 0]}
                                        min={-300}
                                        max={300}
                                        step={2}
                                        onValueChange={([val]) => handleLocalSettingChange('navSpeedLeftMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('navSpeedLeftMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Desplazamiento horizontal (izquierda/derecha) para el velocímetro en móviles.
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between">
                                        <Label className="text-xs font-medium">Escala de Indicador de Ubicación Móvil (Usuario/Flecha)</Label>
                                        <span className="text-xs font-bold text-primary">{settings.userMarkerScaleMobile ?? 1.0}x</span>
                                    </div>
                                    <Slider
                                        value={[settings.userMarkerScaleMobile ?? 1.0]}
                                        min={0.5}
                                        max={4.0}
                                        step={0.05}
                                        onValueChange={([val]) => handleLocalSettingChange('userMarkerScaleMobile', val)}
                                        onValueCommit={([val]) => handleSettingCommit('userMarkerScaleMobile', val)}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                                        Ajusta el tamaño (escala) del indicador de ubicación del usuario (y flecha de navegación) en móviles.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full gap-2 mt-6 py-5 text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Guardando Ajustes...' : 'Guardar Cambios y Aplicar'}
                </Button>
            </CardContent>
        </Card >
    )
}
