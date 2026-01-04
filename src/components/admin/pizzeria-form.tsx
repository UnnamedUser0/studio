'use client';
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Pizzeria } from '@/lib/types';
import { Loader2, Upload } from 'lucide-react';
import { addPizzeria, updatePizzeria, uploadAvatar } from '@/app/actions';

const parseDMS = (input: string | number): number => {
  if (typeof input === 'number') return input;
  const str = input.toString().trim();
  if (!isNaN(Number(str))) return Number(str);

  const dmsRegex = /^\s*(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["]?\s*([NSEW])?\s*$/i;
  const match = str.match(dmsRegex);
  if (!match) return NaN;

  const [_, deg, min, sec, dir] = match;
  let val = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;

  if (dir && (dir.toUpperCase() === 'S' || dir.toUpperCase() === 'W')) {
    val = -val;
  }
  return val;
};

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  address: z.string().min(10, { message: 'La dirección debe tener al menos 10 caracteres.' }),
  lat: z.union([z.string(), z.number()]).refine((val) => !isNaN(parseDMS(val)), { message: "Formato inválido (Ej: 29.07 o 29°04'N)" }),
  lng: z.union([z.string(), z.number()]).refine((val) => !isNaN(parseDMS(val)), { message: "Formato inválido (Ej: -110.95 o 110°57'W)" }),
  category: z.string().default('Pizza'),
  source: z.string().default('Admin'),
  imageUrl: z.string().optional(),
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
  socialMedia: z.string().optional(),
  schedule: z.string().optional(),
  description: z.string().optional(),
});

type PizzeriaFormValues = z.infer<typeof formSchema>;

interface PizzeriaFormProps {
  pizzeria?: Pizzeria | null;
  onSuccess: () => void;
}

export default function PizzeriaForm({ pizzeria, onSuccess }: PizzeriaFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PizzeriaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      lat: 29.073,
      lng: -110.957,
      category: 'Pizza',
      source: 'Admin',
      imageUrl: '',
      phoneNumber: '',
      website: '',
      socialMedia: '',
      schedule: '',
      description: '',
    }
  });

  const currentImageUrl = watch('imageUrl');

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'La imagen es muy pesada (max 5MB).', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadAvatar(formData);
      setValue('imageUrl', url, { shouldDirty: true });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al subir imagen.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (pizzeria) {
      reset({
        name: pizzeria.name,
        address: pizzeria.address,
        lat: pizzeria.lat,
        lng: pizzeria.lng,
        category: pizzeria.category,
        source: pizzeria.source,
        imageUrl: pizzeria.imageUrl || '',
        phoneNumber: pizzeria.phoneNumber || '',
        website: pizzeria.website || '',
        socialMedia: pizzeria.socialMedia || '',
        schedule: pizzeria.schedule || '',
        description: pizzeria.description || '',
      });
    } else {
      reset({
        name: '',
        address: '',
        lat: 29.073,
        lng: -110.957,
        category: 'Pizza',
        source: 'Admin',
        imageUrl: '',
        phoneNumber: '',
        website: '',
        socialMedia: '',
        schedule: '',
        description: '',
      });
    }
  }, [pizzeria, reset]);

  const onSubmit: SubmitHandler<PizzeriaFormValues> = async (data) => {
    setIsSubmitting(true);

    const formattedData = {
      ...data,
      lat: parseDMS(data.lat),
      lng: parseDMS(data.lng),
    };

    try {
      if (pizzeria) {
        // Update existing document
        await updatePizzeria(pizzeria.id, formattedData);
        toast({ title: 'Pizzería actualizada', description: `${data.name} se ha actualizado correctamente.` });
        onSuccess();
      } else {
        // Create new document
        await addPizzeria(formattedData);
        toast({ title: 'Pizzería agregada', description: `${data.name} se ha añadido correctamente.` });
        onSuccess();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Ocurrió un error al guardar la pizzería.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="flex flex-col gap-4 items-center justify-center p-4 border rounded-lg bg-muted/10">
        <Label>Imagen de la Pizzería</Label>
        <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden bg-muted border flex items-center justify-center">
          {currentImageUrl ? (
            <img src={currentImageUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground text-xs text-center p-2">Sin imagen</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadImage}
            disabled={isSubmitting}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('image-upload')?.click()} disabled={isSubmitting}>
            <Upload className="w-4 h-4 mr-2" />
            Subir Foto
          </Button>
        </div>
      </div>

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
          <Input
            id="lat"
            type="text"
            placeholder="29.073 o 29°04'24&quot;N"
            {...register('lat')}
          />
          {errors.lat && <p className="text-sm text-destructive mt-1">{errors.lat.message as string}</p>}
        </div>
        <div>
          <Label htmlFor="lng">Longitud</Label>
          <Input
            id="lng"
            type="text"
            placeholder="-110.957 o 110°57'25&quot;W"
            {...register('lng')}
          />
          {errors.lng && <p className="text-sm text-destructive mt-1">{errors.lng.message as string}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" placeholder="Breve descripción de la pizzería..." {...register('description')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phoneNumber">Teléfono</Label>
          <Input id="phoneNumber" placeholder="662 123 4567" {...register('phoneNumber')} />
        </div>
        <div>
          <Label htmlFor="schedule">Horario</Label>
          <Input id="schedule" placeholder="Lun-Dom: 12pm - 10pm" {...register('schedule')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="website">Página Web</Label>
          <Input id="website" placeholder="https://..." {...register('website')} />
        </div>
        <div>
          <Label htmlFor="socialMedia">Red Social</Label>
          <Input id="socialMedia" placeholder="Facebook/Insta..." {...register('socialMedia')} />
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
