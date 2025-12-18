
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
    cardScale: number; // Base/Fallback (Desktop)
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

    // Podium Heights (Desktop)
    podiumHeight1st?: number;
    podiumHeight2nd?: number;
    podiumHeight3rd?: number;

    // Card Elevation (Desktop)
    cardElevation1st?: number;
    cardElevation2nd?: number;
    cardElevation3rd?: number;

    containerHeight?: number;

    // Mobile Counterparts
    mobileCardScale1st?: number;
    mobileCardScale2nd?: number;
    mobileCardScale3rd?: number;
    mobileCardWidth?: number; // Base width
    mobileCardWidth2nd?: number;
    mobileCardWidth3rd?: number;
    mobileImageHeight?: number;
    mobileTextSize?: number;
    mobileButtonScale?: number;

    // Podium Heights (Mobile)
    mobilePodiumHeight1st?: number;
    mobilePodiumHeight2nd?: number;
    mobilePodiumHeight3rd?: number;

    // Card Elevation (Mobile)
    mobileCardElevation1st?: number;
    mobileCardElevation2nd?: number;
    mobileCardElevation3rd?: number;

    mobileContainerHeight?: number;
};

const DEFAULT_STYLES: RankingStyles = {
    cardScale: 1,
    cardScale1st: 1.1,
    cardScale2nd: 1,
    cardScale3rd: 1,
    cardWidth: 320,
    cardWidth2nd: 300,
    cardWidth3rd: 300,
    imageHeight: 112,
    imageWidth: 112,
    textSize: 1,
    buttonScale: 1,
    showSideActions: true,

    podiumHeight1st: 256, // h-64
    podiumHeight2nd: 128, // h-32
    podiumHeight3rd: 96,  // h-24

    containerHeight: 600,

    cardElevation1st: 20,
    cardElevation2nd: 12,
    cardElevation3rd: 12,

    // Optimized defaults for Mobile Podium (w-full / 3 columns)
    mobileCardScale1st: 0.5,
    mobileCardScale2nd: 0.45,
    mobileCardScale3rd: 0.45,
    mobileCardWidth: 280,
    mobileCardWidth2nd: 280,
    mobileCardWidth3rd: 280,
    mobileImageHeight: 90,
    mobileTextSize: 0.9,
    mobileButtonScale: 0.9,

    mobilePodiumHeight1st: 160,
    mobilePodiumHeight2nd: 80,
    mobilePodiumHeight3rd: 60,

    mobileCardElevation1st: 20, // Lifted up
    mobileCardElevation2nd: 10,
    mobileCardElevation3rd: 10,

    mobileContainerHeight: 600,
};

type RankingStylerProps = {
    styles: RankingStyles;
    onStylesChange: (styles: RankingStyles) => void;
};

export function RankingStyler({ styles, onStylesChange }: RankingStylerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localStyles, setLocalStyles] = useState<RankingStyles>(styles);
    const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
    const [savedStyles, setSavedStyles] = useState<RankingStyles>(styles);
    const { toast } = useToast();

    // Check for changes by comparing localStyles with savedStyles
    const hasChanges = JSON.stringify(localStyles) !== JSON.stringify(savedStyles);

    useEffect(() => {
        // When opening, sync with props AND set saved state
        if (isOpen) {
            const merged = { ...DEFAULT_STYLES, ...styles };
            setLocalStyles(merged);
            setSavedStyles(merged);
        }
    }, [isOpen]); // Only when opening state changes

    const handleChange = (key: keyof RankingStyles, value: number | boolean) => {
        const newStyles = { ...localStyles, [key]: value };
        setLocalStyles(newStyles);
        onStylesChange(newStyles); // Live preview
    };

    const handleSave = async () => {
        if (!hasChanges) return;

        try {
            await updateRankingStyles(localStyles);
            setSavedStyles(localStyles); // Update saved reference
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
        let newStyles = { ...localStyles };

        if (activeTab === 'desktop') {
            // Reset only desktop keys
            newStyles.cardScale = DEFAULT_STYLES.cardScale;
            newStyles.cardScale1st = DEFAULT_STYLES.cardScale1st;
            newStyles.cardScale2nd = DEFAULT_STYLES.cardScale2nd;
            newStyles.cardScale3rd = DEFAULT_STYLES.cardScale3rd;
            newStyles.cardWidth = DEFAULT_STYLES.cardWidth;
            newStyles.cardWidth2nd = DEFAULT_STYLES.cardWidth2nd;
            newStyles.cardWidth3rd = DEFAULT_STYLES.cardWidth3rd;
            newStyles.imageHeight = DEFAULT_STYLES.imageHeight;
            newStyles.imageWidth = DEFAULT_STYLES.imageWidth;
            newStyles.textSize = DEFAULT_STYLES.textSize;
            newStyles.buttonScale = DEFAULT_STYLES.buttonScale;
            newStyles.showSideActions = DEFAULT_STYLES.showSideActions;
            newStyles.podiumHeight1st = DEFAULT_STYLES.podiumHeight1st;
            newStyles.podiumHeight2nd = DEFAULT_STYLES.podiumHeight2nd;
            newStyles.podiumHeight3rd = DEFAULT_STYLES.podiumHeight3rd;
            newStyles.cardElevation1st = DEFAULT_STYLES.cardElevation1st;
            newStyles.cardElevation2nd = DEFAULT_STYLES.cardElevation2nd;
            newStyles.cardElevation3rd = DEFAULT_STYLES.cardElevation3rd;
            newStyles.containerHeight = DEFAULT_STYLES.containerHeight;
        } else {
            // Reset only mobile keys
            newStyles.mobileCardScale1st = DEFAULT_STYLES.mobileCardScale1st;
            newStyles.mobileCardScale2nd = DEFAULT_STYLES.mobileCardScale2nd;
            newStyles.mobileCardScale3rd = DEFAULT_STYLES.mobileCardScale3rd;
            newStyles.mobileCardScale3rd = DEFAULT_STYLES.mobileCardScale3rd;
            newStyles.mobileCardWidth = DEFAULT_STYLES.mobileCardWidth;
            newStyles.mobileCardWidth2nd = DEFAULT_STYLES.mobileCardWidth2nd;
            newStyles.mobileCardWidth3rd = DEFAULT_STYLES.mobileCardWidth3rd;
            newStyles.mobileImageHeight = DEFAULT_STYLES.mobileImageHeight;
            newStyles.mobileTextSize = DEFAULT_STYLES.mobileTextSize;
            newStyles.mobileButtonScale = DEFAULT_STYLES.mobileButtonScale;
            newStyles.mobilePodiumHeight1st = DEFAULT_STYLES.mobilePodiumHeight1st;
            newStyles.mobilePodiumHeight2nd = DEFAULT_STYLES.mobilePodiumHeight2nd;
            newStyles.mobilePodiumHeight1st = DEFAULT_STYLES.mobilePodiumHeight1st;
            newStyles.mobilePodiumHeight2nd = DEFAULT_STYLES.mobilePodiumHeight2nd;
            newStyles.mobilePodiumHeight3rd = DEFAULT_STYLES.mobilePodiumHeight3rd;
            newStyles.mobileCardElevation1st = DEFAULT_STYLES.mobileCardElevation1st;
            newStyles.mobileCardElevation2nd = DEFAULT_STYLES.mobileCardElevation2nd;
            newStyles.mobileCardElevation3rd = DEFAULT_STYLES.mobileCardElevation3rd;
            newStyles.mobileContainerHeight = DEFAULT_STYLES.mobileContainerHeight;
        }

        setLocalStyles(newStyles);
        onStylesChange(newStyles);
        toast({
            title: "Reestablecido",
            description: `Se han reestablecido los valores de ${activeTab === 'desktop' ? 'Escritorio' : 'Móvil'}.`,
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-background/80 backdrop-blur-sm">
                    <Settings className="h-4 w-4" />
                    Editar Estilo Ranking
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-md flex flex-col h-full ring-offset-background focus:outline-none">
                <SheetHeader>
                    <SheetTitle>Personalizar Ranking</SheetTitle>
                    <SheetDescription>
                        Ajusta el tamaño y diseño de las tarjetas y podio.
                    </SheetDescription>
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
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6">
                    {activeTab === 'desktop' ? (
                        <div className="grid gap-6">
                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Podio (Escritorio)</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Altura 1er ({localStyles.podiumHeight1st ?? 256}px)</Label></div>
                                    <Slider value={[localStyles.podiumHeight1st ?? 256]} min={20} max={800} step={10} onValueChange={([val]) => handleChange('podiumHeight1st', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Altura 2do ({localStyles.podiumHeight2nd ?? 128}px)</Label></div>
                                    <Slider value={[localStyles.podiumHeight2nd ?? 128]} min={20} max={800} step={10} onValueChange={([val]) => handleChange('podiumHeight2nd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Altura 3er ({localStyles.podiumHeight3rd ?? 96}px)</Label></div>
                                    <Slider value={[localStyles.podiumHeight3rd ?? 96]} min={20} max={800} step={10} onValueChange={([val]) => handleChange('podiumHeight3rd', val)} />
                                </div>
                            </div>

                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Elevación (Escritorio)</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>1er ({localStyles.cardElevation1st ?? 20}px)</Label></div>
                                    <Slider value={[localStyles.cardElevation1st ?? 20]} min={-200} max={200} step={5} onValueChange={([val]) => handleChange('cardElevation1st', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>2do ({localStyles.cardElevation2nd ?? 12}px)</Label></div>
                                    <Slider value={[localStyles.cardElevation2nd ?? 12]} min={-200} max={200} step={5} onValueChange={([val]) => handleChange('cardElevation2nd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>3er ({localStyles.cardElevation3rd ?? 12}px)</Label></div>
                                    <Slider value={[localStyles.cardElevation3rd ?? 12]} min={-200} max={200} step={5} onValueChange={([val]) => handleChange('cardElevation3rd', val)} />
                                </div>
                            </div>

                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Escala Estándar</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>1er Lugar ({localStyles.cardScale1st}x)</Label></div>
                                    <Slider value={[localStyles.cardScale1st]} min={0.1} max={3.0} step={0.05} onValueChange={([val]) => handleChange('cardScale1st', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>2do Lugar ({localStyles.cardScale2nd}x)</Label></div>
                                    <Slider value={[localStyles.cardScale2nd]} min={0.1} max={3.0} step={0.05} onValueChange={([val]) => handleChange('cardScale2nd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>3er Lugar ({localStyles.cardScale3rd}x)</Label></div>
                                    <Slider value={[localStyles.cardScale3rd]} min={0.1} max={3.0} step={0.05} onValueChange={([val]) => handleChange('cardScale3rd', val)} />
                                </div>
                            </div>

                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Dimensiones</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Ancho 1er ({localStyles.cardWidth}px)</Label></div>
                                    <Slider value={[localStyles.cardWidth]} min={50} max={800} step={10} onValueChange={([val]) => handleChange('cardWidth', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Ancho 2do ({localStyles.cardWidth2nd}px)</Label></div>
                                    <Slider value={[localStyles.cardWidth2nd]} min={50} max={800} step={10} onValueChange={([val]) => handleChange('cardWidth2nd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Ancho 3er ({localStyles.cardWidth3rd}px)</Label></div>
                                    <Slider value={[localStyles.cardWidth3rd]} min={50} max={800} step={10} onValueChange={([val]) => handleChange('cardWidth3rd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Altura Contenedor ({localStyles.containerHeight ?? 600}px)</Label></div>
                                    <Slider value={[localStyles.containerHeight ?? 600]} min={100} max={2000} step={10} onValueChange={([val]) => handleChange('containerHeight', val)} />
                                </div>
                            </div>

                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Detalles</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Img Alto ({localStyles.imageHeight}px)</Label></div>
                                    <Slider value={[localStyles.imageHeight]} min={10} max={500} step={10} onValueChange={([val]) => handleChange('imageHeight', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Img Ancho ({localStyles.imageWidth}px)</Label></div>
                                    <Slider value={[localStyles.imageWidth]} min={10} max={500} step={10} onValueChange={([val]) => handleChange('imageWidth', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Texto ({localStyles.textSize}rem)</Label></div>
                                    <Slider value={[localStyles.textSize]} min={0.1} max={3.0} step={0.1} onValueChange={([val]) => handleChange('textSize', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Botones ({localStyles.buttonScale}x)</Label></div>
                                    <Slider value={[localStyles.buttonScale]} min={0.1} max={3.0} step={0.05} onValueChange={([val]) => handleChange('buttonScale', val)} />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <Label htmlFor="show-actions">Botones Laterales</Label>
                                    <Switch id="show-actions" checked={localStyles.showSideActions} onCheckedChange={(val) => handleChange('showSideActions', val)} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Podio (Móvil)</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Altura 1er ({localStyles.mobilePodiumHeight1st ?? 160}px)</Label></div>
                                    <Slider value={[localStyles.mobilePodiumHeight1st ?? 160]} min={20} max={800} step={10} onValueChange={([val]) => handleChange('mobilePodiumHeight1st', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Altura 2do ({localStyles.mobilePodiumHeight2nd ?? 80}px)</Label></div>
                                    <Slider value={[localStyles.mobilePodiumHeight2nd ?? 80]} min={20} max={800} step={10} onValueChange={([val]) => handleChange('mobilePodiumHeight2nd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Altura 3er ({localStyles.mobilePodiumHeight3rd ?? 60}px)</Label></div>
                                    <Slider value={[localStyles.mobilePodiumHeight3rd ?? 60]} min={20} max={800} step={10} onValueChange={([val]) => handleChange('mobilePodiumHeight3rd', val)} />
                                </div>
                            </div>

                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Elevación (Móvil)</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>1er ({localStyles.mobileCardElevation1st ?? 20}px)</Label></div>
                                    <Slider value={[localStyles.mobileCardElevation1st ?? 20]} min={-200} max={200} step={5} onValueChange={([val]) => handleChange('mobileCardElevation1st', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>2do ({localStyles.mobileCardElevation2nd ?? 10}px)</Label></div>
                                    <Slider value={[localStyles.mobileCardElevation2nd ?? 10]} min={-200} max={200} step={5} onValueChange={([val]) => handleChange('mobileCardElevation2nd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>3er ({localStyles.mobileCardElevation3rd ?? 10}px)</Label></div>
                                    <Slider value={[localStyles.mobileCardElevation3rd ?? 10]} min={-200} max={200} step={5} onValueChange={([val]) => handleChange('mobileCardElevation3rd', val)} />
                                </div>
                            </div>

                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Escala Móvil</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>1er Lugar ({localStyles.mobileCardScale1st ?? 1}x)</Label></div>
                                    <Slider value={[localStyles.mobileCardScale1st ?? 1]} min={0.1} max={3.0} step={0.05} onValueChange={([val]) => handleChange('mobileCardScale1st', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>2do Lugar ({localStyles.mobileCardScale2nd ?? 0.95}x)</Label></div>
                                    <Slider value={[localStyles.mobileCardScale2nd ?? 0.95]} min={0.1} max={3.0} step={0.05} onValueChange={([val]) => handleChange('mobileCardScale2nd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>3er Lugar ({localStyles.mobileCardScale3rd ?? 0.95}x)</Label></div>
                                    <Slider value={[localStyles.mobileCardScale3rd ?? 0.95]} min={0.1} max={3.0} step={0.05} onValueChange={([val]) => handleChange('mobileCardScale3rd', val)} />
                                </div>
                            </div>

                            <div className="space-y-4 border-b pb-4">
                                <h4 className="font-medium text-sm text-muted-foreground">Dimensiones Móvil</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Ancho 1er ({localStyles.mobileCardWidth ?? 280}px)</Label></div>
                                    <Slider value={[localStyles.mobileCardWidth ?? 280]} min={50} max={800} step={10} onValueChange={([val]) => handleChange('mobileCardWidth', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Ancho 2do ({localStyles.mobileCardWidth2nd ?? 280}px)</Label></div>
                                    <Slider value={[localStyles.mobileCardWidth2nd ?? 280]} min={50} max={800} step={10} onValueChange={([val]) => handleChange('mobileCardWidth2nd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Ancho 3er ({localStyles.mobileCardWidth3rd ?? 280}px)</Label></div>
                                    <Slider value={[localStyles.mobileCardWidth3rd ?? 280]} min={50} max={800} step={10} onValueChange={([val]) => handleChange('mobileCardWidth3rd', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Altura Contenedor ({localStyles.mobileContainerHeight ?? 600}px)</Label></div>
                                    <Slider value={[localStyles.mobileContainerHeight ?? 600]} min={100} max={2000} step={10} onValueChange={([val]) => handleChange('mobileContainerHeight', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Img Alto ({localStyles.mobileImageHeight ?? 96}px)</Label></div>
                                    <Slider value={[localStyles.mobileImageHeight ?? 96]} min={10} max={500} step={5} onValueChange={([val]) => handleChange('mobileImageHeight', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Texto ({localStyles.mobileTextSize ?? 0.9}rem)</Label></div>
                                    <Slider value={[localStyles.mobileTextSize ?? 0.9]} min={0.1} max={3.0} step={0.1} onValueChange={([val]) => handleChange('mobileTextSize', val)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><Label>Botones ({localStyles.mobileButtonScale ?? 0.9}x)</Label></div>
                                    <Slider value={[localStyles.mobileButtonScale ?? 0.9]} min={0.1} max={3.0} step={0.05} onValueChange={([val]) => handleChange('mobileButtonScale', val)} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <SheetFooter className="mt-auto pt-4">
                    <Button variant="outline" onClick={handleReset} className="flex-1">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset {activeTab === 'desktop' ? 'Escritorio' : 'Móvil'}
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
                        <Save className="mr-2 h-4 w-4" />
                        {hasChanges ? 'Guardar Cambios' : 'Sin cambios'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
