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
import { MessageSquareReply, Trash2 } from 'lucide-react';
import type { Testimonial } from '@/lib/types';
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
import TestimonialCard from '../testimonial/testimonial-card';


interface TestimonialTableProps {
  testimonials: Testimonial[];
}

export default function TestimonialTable({ testimonials }: TestimonialTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (testimonialId: string) => {
    if (!firestore) return;
    const testimonialRef = doc(firestore, 'testimonials', testimonialId);
    deleteDoc(testimonialRef);
    toast({
        title: "Testimonio eliminado",
        description: `El testimonio ha sido eliminado.`
    })
  }

  return (
    <div className="space-y-4">
        {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
    </div>
  );
}
