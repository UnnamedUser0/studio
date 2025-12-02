'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Pizzeria } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Trophy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RankingManagerProps {
    allPizzerias: Pizzeria[];
    currentRankingIds?: string[];
    onUpdate?: () => void;
}

export default function RankingManager({ allPizzerias, currentRankingIds = [], onUpdate }: RankingManagerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ranking, setRanking] = useState<string[]>(['', '', '']);
    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            if (currentRankingIds && currentRankingIds.length > 0) {
                const newRanking = [...currentRankingIds];
                while (newRanking.length < 3) newRanking.push('');
                setRanking(newRanking.slice(0, 3));
            } else {
                setRanking(['', '', '']);
            }
        }
    }, [open, JSON.stringify(currentRankingIds)]);

    const handleSave = async () => {
        if (!firestore) return;
        setLoading(true);
        try {
            await setDoc(doc(firestore, 'settings', 'ranking'), {
                pizzeriaIds: ranking.filter(id => id !== '')
            });
            toast({
                title: "Ranking actualizado",
                description: "Las pizzerías destacadas han sido actualizadas.",
            });
            setOpen(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el ranking.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const updatePosition = (index: number, value: string) => {
        const newRanking = [...ranking];
        newRanking[index] = value;
        setRanking(newRanking);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Gestionar Ranking
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Gestionar Ranking</DialogTitle>
                    <DialogDescription>
                        Selecciona las 3 mejores pizzerías para mostrar en la página principal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={`pos-${index}`} className="text-right font-bold">
                                #{index + 1}
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    value={ranking[index]}
                                    onValueChange={(value) => updatePosition(index, value)}
                                >
                                    <SelectTrigger id={`pos-${index}`}>
                                        <SelectValue placeholder="Seleccionar pizzería" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allPizzerias.map((pizzeria) => (
                                            <SelectItem key={pizzeria.id} value={pizzeria.id}>
                                                {pizzeria.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
