'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
    Sliders,
    X,
    Save,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Monitor,
    Smartphone,
    Layers,
    Sparkles,
    Move,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WelcomeAdminPanelProps {
    settings: any;
    onSettingsChange: (newSettings: any) => void;
    onReset: () => void;
    isAdmin: boolean;
}

export default function WelcomeAdminPanel({
    settings,
    onSettingsChange,
    onReset,
    isAdmin
}: WelcomeAdminPanelProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeSection, setActiveSection] = useState<'3d' | 'top' | 'bottom'>('3d');

    if (!isAdmin) return null;

    const isMobileTab = activeTab === 'mobile';
    const suffix = isMobileTab ? 'Mobile' : '';

    const handleChange = (key: string, value: number | string) => {
        const fullKey = `${key}${suffix}`;
        const updated = {
            ...settings,
            [fullKey]: typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '' ? Number(value) : value
        };
        onSettingsChange(updated);
    };

    const getValue = (key: string, defaultVal: number | string = 0) => {
        const fullKey = `${key}${suffix}`;
        return settings?.[fullKey] !== undefined ? settings[fullKey] : defaultVal;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { updateLayoutSettings } = await import('@/app/actions');
            await updateLayoutSettings(settings);
            toast({
                title: "Ajustes guardados",
                description: "La configuración de la pantalla de bienvenida se ha guardado exitosamente.",
            });
        } catch (error) {
            console.error("Error al guardar ajustes de bienvenida:", error);
            toast({
                title: "Error al guardar",
                description: "No se pudieron guardar los ajustes en el servidor.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Copiado al portapapeles",
            description: "Los valores actuales han sido copiados en formato JSON.",
        });
    };

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <div className="fixed top-4 right-4 z-[2100] flex items-center gap-2">
                    <Button
                        onClick={() => setIsOpen(true)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl rounded-full px-4 py-2 flex items-center gap-2 border border-primary-foreground/20 backdrop-blur-md transition-all"
                    >
                        <Sliders className="h-4 w-4" />
                        <span className="font-semibold text-xs sm:text-sm">Ajustes 3D & Layout (Admin)</span>
                    </Button>
                </div>
            )}

            {/* Floating Control Panel */}
            {isOpen && (
                <div
                    className={`fixed z-[2100] bg-background/95 backdrop-blur-xl border border-border shadow-2xl transition-all duration-200 overflow-hidden ${
                        isMinimized
                            ? 'bottom-4 right-4 w-80 rounded-2xl'
                            : 'bottom-2 sm:bottom-4 right-2 sm:right-4 left-2 sm:left-auto w-auto sm:w-[440px] max-h-[85vh] rounded-2xl flex flex-col'
                    }`}
                >
                    {/* Header */}
                    <div className="p-3 sm:p-4 bg-muted/60 border-b border-border flex items-center justify-between gap-2 select-none">
                        <div className="flex items-center gap-2">
                            <Sliders className="h-5 w-5 text-primary" />
                            <div>
                                <h3 className="font-bold text-sm sm:text-base leading-none">Editor de Bienvenida</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Ajustes en tiempo real</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? "Expandir" : "Minimizar"}
                            >
                                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                                onClick={() => setIsOpen(false)}
                                title="Cerrar panel"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Device Tab Selector */}
                            <div className="px-4 pt-3 pb-2 border-b border-border/50 bg-background/50">
                                <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
                                    <TabsList className="grid grid-cols-2 w-full">
                                        <TabsTrigger value="desktop" className="flex items-center gap-1.5 text-xs py-1.5">
                                            <Monitor className="h-3.5 w-3.5" />
                                            Escritorio
                                        </TabsTrigger>
                                        <TabsTrigger value="mobile" className="flex items-center gap-1.5 text-xs py-1.5">
                                            <Smartphone className="h-3.5 w-3.5" />
                                            Móvil
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Section Navigation */}
                                <div className="flex items-center justify-between gap-1 mt-2.5 bg-muted/40 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection('3d')}
                                        className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${
                                            activeSection === '3d'
                                                ? 'bg-background text-primary shadow-sm font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        🍕 Modelo 3D
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection('top')}
                                        className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${
                                            activeSection === 'top'
                                                ? 'bg-background text-primary shadow-sm font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        🔝 Logo Sup.
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection('bottom')}
                                        className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${
                                            activeSection === 'bottom'
                                                ? 'bg-background text-primary shadow-sm font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        🔽 Texto & Botones
                                    </button>
                                </div>
                            </div>

                            {/* Controls Body */}
                            <div className="p-4 overflow-y-auto space-y-4 max-h-[52vh]">
                                {/* ---------------- SECTION: 3D MODEL ---------------- */}
                                {activeSection === '3d' && (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        <div className="bg-primary/5 border border-primary/20 p-2.5 rounded-xl text-xs text-primary font-medium flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 shrink-0" />
                                            Ajusta el tamaño, centrado, posición y cámara 3D en {isMobileTab ? 'Móvil' : 'Escritorio'}.
                                        </div>

                                        {/* 3D Scale (Size) */}
                                        <ControlRow
                                            label="Escala / Tamaño 3D"
                                            description="Tamaño de la pizza en el centro de su eje"
                                            value={getValue('welcome3DScale', isMobileTab ? 3.2 : 3.0)}
                                            step={0.1}
                                            min={0.1}
                                            max={10.0}
                                            onChange={(val) => handleChange('welcome3DScale', val)}
                                        />

                                        {/* 3D Space Height */}
                                        <ControlRow
                                            label="Altura del Espacio 3D (vh)"
                                            description="Espacio vertical dedicado al 3D (empuja el contenido sin superponerse)"
                                            value={getValue('welcome3DHeight', isMobileTab ? 48 : 65)}
                                            step={1}
                                            min={10}
                                            max={100}
                                            onChange={(val) => handleChange('welcome3DHeight', val)}
                                        />

                                        {/* 3D Space Width */}
                                        <ControlRow
                                            label="Ancho del Espacio 3D (%)"
                                            description="Ancho del área visible del modelo 3D"
                                            value={getValue('welcome3DWidth', 100)}
                                            step={5}
                                            min={20}
                                            max={200}
                                            onChange={(val) => handleChange('welcome3DWidth', val)}
                                        />

                                        {/* 3D Space Pos X */}
                                        <ControlRow
                                            label="Alineación X del Espacio (Lados px)"
                                            description="Mueve todo el espacio 3D a la izquierda (-) o derecha (+)"
                                            value={getValue('welcome3DSpaceOffsetX', 0)}
                                            step={2}
                                            min={-300}
                                            max={300}
                                            onChange={(val) => handleChange('welcome3DSpaceOffsetX', val)}
                                        />

                                        {/* 3D Space Pos Y */}
                                        <ControlRow
                                            label="Alineación Y del Espacio (Arriba / Abajo px)"
                                            description="Mueve todo el espacio 3D arriba (-) o abajo (+)"
                                            value={getValue('welcome3DSpaceOffsetY', 0)}
                                            step={2}
                                            min={-300}
                                            max={300}
                                            onChange={(val) => handleChange('welcome3DSpaceOffsetY', val)}
                                        />

                                        {/* Camera FOV */}
                                        <ControlRow
                                            label="FOV Cámara (Ángulo de Visión)"
                                            description="Menor FOV acerca la toma, mayor FOV amplía el entorno"
                                            value={getValue('welcome3DFov', isMobileTab ? 42 : 45)}
                                            step={1}
                                            min={10}
                                            max={120}
                                            onChange={(val) => handleChange('welcome3DFov', val)}
                                        />

                                        {/* Auto-rotation speed */}
                                        <ControlRow
                                            label="Velocidad de Giro en su Eje"
                                            description="0 para detener rotación, valores mayores para más velocidad"
                                            value={getValue('welcome3DRotationSpeed', 2.0)}
                                            step={0.2}
                                            min={0}
                                            max={10}
                                            onChange={(val) => handleChange('welcome3DRotationSpeed', val)}
                                        />
                                    </div>
                                )}

                                {/* ---------------- SECTION: TOP ELEMENTS (LOGO) ---------------- */}
                                {activeSection === 'top' && (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        <div className="bg-primary/5 border border-primary/20 p-2.5 rounded-xl text-xs text-primary font-medium flex items-center gap-2">
                                            <Layers className="h-4 w-4 shrink-0" />
                                            Ajusta la posición, escala y separación del Logotipo superior en {isMobileTab ? 'Móvil' : 'Escritorio'}.
                                        </div>

                                        {/* Logo Scale */}
                                        <ControlRow
                                            label="Escala del Logotipo"
                                            description="Multiplicador de tamaño de 'PizzApp' y su icono"
                                            value={getValue('welcomeLogoScale', isMobileTab ? 1.25 : 1.5)}
                                            step={0.05}
                                            min={0.5}
                                            max={3.0}
                                            onChange={(val) => handleChange('welcomeLogoScale', val)}
                                        />

                                        {/* Logo Offset Y */}
                                        <ControlRow
                                            label="Desplazamiento Y (Arriba / Abajo px)"
                                            description="Mueve el logotipo arriba (-) o abajo (+)"
                                            value={getValue('welcomeLogoOffsetY', 0)}
                                            step={1}
                                            min={-200}
                                            max={200}
                                            onChange={(val) => handleChange('welcomeLogoOffsetY', val)}
                                        />

                                        {/* Logo Offset X */}
                                        <ControlRow
                                            label="Desplazamiento X (Lados px)"
                                            description="Mueve el logotipo a la izquierda (-) o derecha (+)"
                                            value={getValue('welcomeLogoOffsetX', 0)}
                                            step={1}
                                            min={-200}
                                            max={200}
                                            onChange={(val) => handleChange('welcomeLogoOffsetX', val)}
                                        />

                                        {/* Logo Margin Bottom */}
                                        <ControlRow
                                            label="Separación Inferior con 3D (px)"
                                            description="Margen hacia el modelo 3D"
                                            value={getValue('welcomeLogoMarginBottom', isMobileTab ? 8 : 16)}
                                            step={2}
                                            min={-100}
                                            max={200}
                                            onChange={(val) => handleChange('welcomeLogoMarginBottom', val)}
                                        />
                                    </div>
                                )}

                                {/* ---------------- SECTION: BOTTOM ELEMENTS (TEXT & BUTTONS) ---------------- */}
                                {activeSection === 'bottom' && (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        <div className="bg-primary/5 border border-primary/20 p-2.5 rounded-xl text-xs text-primary font-medium flex items-center gap-2">
                                            <Move className="h-4 w-4 shrink-0" />
                                            Ajusta la sección inferior (títulos 'Vive la mejor...', subtítulo y botones) en {isMobileTab ? 'Móvil' : 'Escritorio'}.
                                        </div>

                                        {/* Content Scale */}
                                        <ControlRow
                                            label="Escala del Bloque de Texto"
                                            description="Multiplicador de escala de títulos y botones"
                                            value={getValue('welcomeContentScale', 1.0)}
                                            step={0.05}
                                            min={0.5}
                                            max={2.5}
                                            onChange={(val) => handleChange('welcomeContentScale', val)}
                                        />

                                        {/* Content Offset Y */}
                                        <ControlRow
                                            label="Desplazamiento Y (Arriba / Abajo px)"
                                            description="Acerca (-) o aleja (+) los textos del modelo 3D"
                                            value={getValue('welcomeContentOffsetY', 0)}
                                            step={1}
                                            min={-200}
                                            max={200}
                                            onChange={(val) => handleChange('welcomeContentOffsetY', val)}
                                        />

                                        {/* Content Offset X */}
                                        <ControlRow
                                            label="Desplazamiento X (Lados px)"
                                            description="Mueve el bloque de textos a los lados"
                                            value={getValue('welcomeContentOffsetX', 0)}
                                            step={1}
                                            min={-200}
                                            max={200}
                                            onChange={(val) => handleChange('welcomeContentOffsetX', val)}
                                        />

                                        {/* Content Margin Top */}
                                        <ControlRow
                                            label="Margen Superior hacia 3D (px)"
                                            description="Separación entre el modelo 3D y el título"
                                            value={getValue('welcomeContentMarginTop', isMobileTab ? 4 : 0)}
                                            step={2}
                                            min={-100}
                                            max={200}
                                            onChange={(val) => handleChange('welcomeContentMarginTop', val)}
                                        />

                                        {/* Content Spacing (Gap) */}
                                        <ControlRow
                                            label="Espaciado entre Elementos (px)"
                                            description="Separación interna entre títulos, párrafos y botones"
                                            value={getValue('welcomeContentSpacing', isMobileTab ? 16 : 32)}
                                            step={2}
                                            min={0}
                                            max={100}
                                            onChange={(val) => handleChange('welcomeContentSpacing', val)}
                                        />

                                        {/* Buttons Layout */}
                                        <div className="space-y-1.5 pt-1">
                                            <Label className="text-xs font-semibold text-foreground">Disposición de Botones</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={getValue('welcomeButtonsLayout', 'row') === 'row' ? 'default' : 'outline'}
                                                    onClick={() => handleChange('welcomeButtonsLayout', 'row')}
                                                    className="text-xs"
                                                >
                                                    Horizontal (Lado a lado)
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={getValue('welcomeButtonsLayout', 'row') === 'column' ? 'default' : 'outline'}
                                                    onClick={() => handleChange('welcomeButtonsLayout', 'column')}
                                                    className="text-xs"
                                                >
                                                    Vertical (Apilados)
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-3 sm:p-4 bg-muted/40 border-t border-border flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onReset}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                        title="Restablecer valores por defecto"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                        Restablecer
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="text-xs"
                                        title="Copiar JSON de configuración"
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>

                                <Button
                                    onClick={handleSave}
                                    size="sm"
                                    disabled={saving}
                                    className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4"
                                >
                                    <Save className="h-3.5 w-3.5 mr-1.5" />
                                    {saving ? 'Guardando...' : 'Guardar Todo'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}

interface ControlRowProps {
    label: string;
    description?: string;
    value: number;
    step?: number;
    min?: number;
    max?: number;
    onChange: (val: number) => void;
}

function ControlRow({ label, description, value, step = 1, min = -100, max = 100, onChange }: ControlRowProps) {
    const numVal = typeof value === 'number' ? value : Number(value) || 0;

    return (
        <div className="space-y-1.5 bg-card/60 p-2.5 rounded-xl border border-border/40">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <Label className="text-xs font-semibold text-foreground">{label}</Label>
                    {description && <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>}
                </div>
                <Input
                    type="number"
                    step={step}
                    value={numVal}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className="w-20 h-7 text-xs font-mono text-right font-bold bg-background border-border/80"
                />
            </div>
            <Slider
                value={[numVal]}
                min={min}
                max={max}
                step={step}
                onValueChange={([val]) => onChange(val)}
                className="py-1 cursor-pointer"
            />
        </div>
    );
}
