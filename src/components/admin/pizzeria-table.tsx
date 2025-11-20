'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { Pizzeria } from '@/lib/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface PizzeriaTableProps {
  pizzerias: Pizzeria[];
  onEdit: (pizzeria: Pizzeria) => void;
}

export default function PizzeriaTable({ pizzerias, onEdit }: PizzeriaTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (pizzeriaId: string, pizzeriaName: string) => {
    if (!firestore) return;
    const pizzeriaRef = doc(firestore, 'pizzerias', pizzeriaId);
    
    deleteDoc(pizzeriaRef).then(() => {
        toast({
            title: "Pizzería eliminada",
            description: `La pizzería "${pizzeriaName}" ha sido eliminada.`
        })
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: pizzeriaRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  if (pizzerias.length === 0) {
    return <p className="text-center text-muted-foreground p-4">No hay pizzerías registradas. ¡Agrega la primera!</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead className="hidden md:table-cell">Dirección</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pizzerias.map((pizzeria) => (
          <TableRow key={pizzeria.id}>
            <TableCell className="font-medium">{pizzeria.name}</TableCell>
            <TableCell className="hidden md:table-cell">{pizzeria.address}</TableCell>
            <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(pizzeria)}>
                        <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la pizzería
                                y todas sus opiniones asociadas.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(pizzeria.id, pizzeria.name)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
