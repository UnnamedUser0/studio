'use client';
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { Pizzeria } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  address: z.string().min(10, { message: 'La dirección debe tener al menos 10 caracteres.' }),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  category: z.string().default('Pizza'),
  source: z.string().default('Admin'),
});

type PizzeriaFormValues = z.infer<typeof formSchema>;

interface PizzeriaFormProps {
  pizzeria?: Pizzeria | null;
  onSuccess: () => void;
}

export default function PizzeriaForm({ pizzeria, onSuccess }: PizzeriaFormProps) {
  const { toast } } from useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PizzeriaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      lat: 29.073,
      lng: -110.957,
      category: 'Pizza',
      source: 'Admin'
    }
  });

  useEffect(() => {
    if (pizzeria) {
      reset({
        name: pizzeria.name,
        address: pizzeria.address,
        lat: pizzeria.lat,
        lng: pizzeria.lng,
        category: pizzeria.category,
        source: pizzeria.source,
      });
    } else {
        reset({
            name: '',
            address: '',
            lat: 29.073,
            lng: -110.957,
            category: 'Pizza',
            source: 'Admin'
        });
    }
  }, [pizzeria, reset]);

  const onSubmit: SubmitHandler<PizzeriaFormValues> = async (data) => {
    if (!firestore) return;
    setIsSubmitting(true);
    
    if (pizzeria) {
      // Update existing document
      const docRef = doc(firestore, 'pizzerias', pizzeria.id);
      setDoc(docRef, data, { merge: true })
        .then(() => {
            toast({ title: 'Pizzería actualizada', description: `${data.name} se ha actualizado correctamente.` });
            onSuccess();
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsSubmitting(false);
        });

    } else {
      // Create new document
      const collectionRef = collection(firestore, 'pizzerias');
      const newPizzeriaData = { ...data, id: ''};
      addDoc(collectionRef, newPizzeriaData)
        .then((docRef) => {
            setDoc(docRef, { id: docRef.id }, { merge: true });
            toast({ title: 'Pizzería agregada', description: `${data.name} se ha añadido correctamente.` });
            onSuccess();
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: collectionRef.path,
                operation: 'create',
                requestResourceData: newPizzeriaData,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div>
        <Label htmlFor="name">Nombre de la Pizzería</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" {...register('address')} />
        {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lat">Latitud</Label>
          <Input id="lat" type="number" step="any" {...register('lat')} />
          {errors.lat && <p className="text-sm text-destructive mt-1">{errors.lat.message}</p>}
        </div>
        <div>
          <Label htmlFor="lng">Longitud</Label>
          <Input id="lng" type="number" step="any" {...register('lng')} />
          {errors.lng && <p className="text-sm text-destructive mt-1">{errors.lng.message}</p>}
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {pizzeria ? 'Actualizar Pizzería' : 'Guardar Pizzería'}
        </Button>
      </div>
    </form>
  );
}
