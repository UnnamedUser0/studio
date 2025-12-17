'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings2, X, Save } from 'lucide-react';
import { updateLayoutSettings } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export type LayoutSettings = {
    sheetWidth: number;
    sheetWidthMobile?: number;
    cardScale: number;
    cardScaleMobile?: number;
    buttonScale: number;
    buttonScaleMobile?: number;
    buttonLayout: 'grid' | 'stack';
};

interface LayoutEditorProps {
    initialSettings: LayoutSettings;
    onSettingsChange: (settings: LayoutSettings) => void;
}

export default function LayoutEditor({ initialSettings, onSettingsChange }: LayoutEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<LayoutSettings>(initialSettings);
    const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
    const { toast } = useToast();

    useEffect(() => {
        onSettingsChange(settings);
    }, [settings, onSettingsChange]);

    // Update local state if initialSettings updates from outside (e.g. data loaded from server)
    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const handleSave = async () => {
        try {
            await updateLayoutSettings(settings);
            toast({
                title: "Configuración guardada",
                description: "Los ajustes de diseño se han guardado correctamente.",
            });
            setIsOpen(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración.",
                variant: "destructive"
            });
        }
    };

    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-24 left-6 z-[1002] rounded-full shadow-lg"
                size="icon"
                onClick={() => setIsOpen(true)}
            >
                <Settings2 className="w-6 h-6" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-24 left-6 z-[1002] w-80 shadow-2xl animate-in slide-in-from-bottom-10 flex flex-col max-h-[80vh]">
            <CardHeader className="flex flex-col gap-2 py-3 shadow-sm z-10 bg-card">
                <div className="flex flex-row items-center justify-between w-full">
                    <CardTitle className="text-sm font-medium">Editor de Diseño</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex w-full rounded-md bg-muted p-1">
                    <button
                        onClick={() => setActiveTab('desktop')}
                        className={`flex-1 text-xs font-medium py-1 rounded-sm transition-all ${activeTab === 'desktop' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Escritorio
                    </button>
                    <button
                        onClick={() => setActiveTab('mobile')}
                        className={`flex-1 text-xs font-medium py-1 rounded-sm transition-all ${activeTab === 'mobile' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Móvil
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto py-4">
                {activeTab === 'desktop' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Ancho del Panel ({settings.sheetWidth}vw)</Label>
                            </div>
                            <Slider
                                value={[settings.sheetWidth]}
                                min={30}
                                max={95}
                                step={1}
                                onValueChange={([val]) => setSettings({ ...settings, sheetWidth: val })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Escala de Tarjeta ({settings.cardScale}x)</Label>
                            </div>
                            <Slider
                                value={[settings.cardScale]}
                                min={0.5}
                                max={1.5}
                                step={0.1}
                                onValueChange={([val]) => setSettings({ ...settings, cardScale: val })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Escala de Botones ({settings.buttonScale}x)</Label>
                            </div>
                            <Slider
                                value={[settings.buttonScale]}
                                min={0.5}
                                max={1.5}
                                step={0.1}
                                onValueChange={([val]) => setSettings({ ...settings, buttonScale: val })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Diseño de Botones (Grid/Stack)</Label>
                            <Switch
                                checked={settings.buttonLayout === 'grid'}
                                onCheckedChange={(checked) => setSettings({ ...settings, buttonLayout: checked ? 'grid' : 'stack' })}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Ancho del Panel ({settings.sheetWidthMobile ?? 100}vw)</Label>
                            </div>
                            <Slider
                                value={[settings.sheetWidthMobile ?? 100]}
                                min={50}
                                max={100}
                                step={1}
                                onValueChange={([val]) => setSettings({ ...settings, sheetWidthMobile: val })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Escala de Tarjeta ({settings.cardScaleMobile ?? 1}x)</Label>
                            </div>
                            <Slider
                                value={[settings.cardScaleMobile ?? 1]}
                                min={0.5}
                                max={1.5}
                                step={0.1}
                                onValueChange={([val]) => setSettings({ ...settings, cardScaleMobile: val })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Escala de Botones ({settings.buttonScaleMobile ?? 1}x)</Label>
                            </div>
                            <Slider
                                value={[settings.buttonScaleMobile ?? 1]}
                                min={0.5}
                                max={1.5}
                                step={0.1}
                                onValueChange={([val]) => setSettings({ ...settings, buttonScaleMobile: val })}
                            />
                        </div>
                    </div>
                )}

                <Button className="w-full mt-4" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                </Button>
            </CardContent>
        </Card>
    );
}
