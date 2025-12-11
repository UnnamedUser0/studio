
'use client';

import { useState, useEffect } from 'react';
import { Settings, X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';

import { useToast } from '@/hooks/use-toast';
import { updateRankingStyles } from '@/app/actions';

export type RankingStyles = {
    cardScale: number; // Base/Fallback
    cardScale1st: number;
    cardScale2nd: number;
    cardScale3rd: number;
    cardWidth: number;
    cardWidth2nd: number;
    cardWidth3rd: number;
    imageHeight: number;
    imageWidth: number;
    textSize: number;
    buttonScale: number;
    showSideActions: boolean;
};

const DEFAULT_STYLES: RankingStyles = {
    cardScale: 1,
    cardScale1st: 1,
    cardScale2nd: 1,
    cardScale3rd: 1,
    cardWidth: 320,
    cardWidth2nd: 320,
    cardWidth3rd: 320,
    imageHeight: 112,
    imageWidth: 112,
    textSize: 1,
    buttonScale: 1,
    showSideActions: true,
};

type RankingStylerProps = {
    styles: RankingStyles;
    onStylesChange: (styles: RankingStyles) => void;
};

export function RankingStyler({ styles, onStylesChange }: RankingStylerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localStyles, setLocalStyles] = useState<RankingStyles>(styles);
    const { toast } = useToast();

    useEffect(() => {
        setLocalStyles({
            ...DEFAULT_STYLES,
            ...styles
        });
    }, [styles]);

    const handleChange = (key: keyof RankingStyles, value: number | boolean) => {
        const newStyles = { ...localStyles, [key]: value };
        setLocalStyles(newStyles);
        onStylesChange(newStyles);
    };

    const handleSave = async () => {
        try {
            await updateRankingStyles(localStyles);
            toast({
                title: "Estilos guardados",
                description: "Los cambios se han aplicado correctamente.",
            });
            setIsOpen(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron guardar los cambios.",
                variant: "destructive",
            });
        }
    };

    const handleReset = () => {
        setLocalStyles(DEFAULT_STYLES);
        onStylesChange(DEFAULT_STYLES);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-background/80 backdrop-blur-sm">
                    <Settings className="h-4 w-4" />
                    Editar Estilo Ranking
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Personalizar Ranking</SheetTitle>
                    <SheetDescription>
                        Ajusta el tamaño y diseño de las tarjetas del ranking.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-6">
                    <div className="space-y-4 border-b pb-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Escala de Tarjetas</h4>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>1er Lugar ({localStyles.cardScale1st}x)</Label>
                            </div>
                            <Slider
                                value={[localStyles.cardScale1st]}
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                onValueChange={([val]) => handleChange('cardScale1st', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>2do Lugar ({localStyles.cardScale2nd}x)</Label>
                            </div>
                            <Slider
                                value={[localStyles.cardScale2nd]}
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                onValueChange={([val]) => handleChange('cardScale2nd', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>3er Lugar ({localStyles.cardScale3rd}x)</Label>
                            </div>
                            <Slider
                                value={[localStyles.cardScale3rd]}
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                onValueChange={([val]) => handleChange('cardScale3rd', val)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border-b pb-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Ancho de Contenedor</h4>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>1er Lugar ({localStyles.cardWidth}px)</Label>
                            </div>
                            <Slider
                                value={[localStyles.cardWidth]}
                                min={150}
                                max={500}
                                step={10}
                                onValueChange={([val]) => handleChange('cardWidth', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>2do Lugar ({localStyles.cardWidth2nd}px)</Label>
                            </div>
                            <Slider
                                value={[localStyles.cardWidth2nd]}
                                min={150}
                                max={500}
                                step={10}
                                onValueChange={([val]) => handleChange('cardWidth2nd', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>3er Lugar ({localStyles.cardWidth3rd}px)</Label>
                            </div>
                            <Slider
                                value={[localStyles.cardWidth3rd]}
                                min={150}
                                max={500}
                                step={10}
                                onValueChange={([val]) => handleChange('cardWidth3rd', val)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border-b pb-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Imagen y Contenido</h4>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Ancho de Imagen ({localStyles.imageWidth}px)</Label>
                            </div>
                            <Slider
                                value={[localStyles.imageWidth]}
                                min={50}
                                max={300}
                                step={10}
                                onValueChange={([val]) => handleChange('imageWidth', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Altura de Imagen ({localStyles.imageHeight}px)</Label>
                            </div>
                            <Slider
                                value={[localStyles.imageHeight]}
                                min={50}
                                max={300}
                                step={10}
                                onValueChange={([val]) => handleChange('imageHeight', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Tamaño de Texto ({localStyles.textSize}rem)</Label>
                            </div>
                            <Slider
                                value={[localStyles.textSize]}
                                min={0.5}
                                max={2}
                                step={0.1}
                                onValueChange={([val]) => handleChange('textSize', val)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Escala de Botones ({localStyles.buttonScale}x)</Label>
                            </div>
                            <Slider
                                value={[localStyles.buttonScale]}
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                onValueChange={([val]) => handleChange('buttonScale', val)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="show-actions">Mostrar Botones Laterales</Label>
                        <Switch
                            id="show-actions"
                            checked={localStyles.showSideActions}
                            onCheckedChange={(val) => handleChange('showSideActions', val)}
                        />
                    </div>
                </div>

                <SheetFooter className="flex-col gap-2 sm:flex-col">
                    <Button variant="outline" onClick={handleReset} className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restablecer Valores
                    </Button>
                    <Button onClick={handleSave} className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
