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
    cardScale: number;
    buttonScale: number;
    buttonLayout: 'grid' | 'stack';
};

interface LayoutEditorProps {
    initialSettings: LayoutSettings;
    onSettingsChange: (settings: LayoutSettings) => void;
}

export default function LayoutEditor({ initialSettings, onSettingsChange }: LayoutEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<LayoutSettings>(initialSettings);
    const { toast } = useToast();

    useEffect(() => {
        onSettingsChange(settings);
    }, [settings, onSettingsChange]);

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
        <Card className="fixed bottom-24 left-6 z-[1002] w-80 shadow-2xl animate-in slide-in-from-bottom-10">
            <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm font-medium">Editor de Diseño</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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

                <Button className="w-full" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                </Button>
            </CardContent>
        </Card>
    );
}
