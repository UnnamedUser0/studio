'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { User, Pizzeria, Testimonial } from '@/lib/types';
import PizzeriaTable from '@/components/admin/pizzeria-table';
import TestimonialTable from '@/components/admin/testimonial-table';
import PizzeriaReviewsManager from '@/components/admin/pizzeria-reviews-manager';
import PizzeriaForm from '@/components/admin/pizzeria-form';
import OsmImporter from '@/components/admin/osm-importer';
import { pizzeriasData } from '@/lib/pizzerias-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

function AdminDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingPizzeria, setEditingPizzeria] = useState<Pizzeria | null>(null);

  const pizzeriasQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'pizzerias'), orderBy('name')) : null,
    [firestore]);
  const { data: firestorePizzerias, isLoading: isLoadingPizzerias } = useCollection<Pizzeria>(pizzeriasQuery);

  const allPizzerias = useMemo(() => {
    // Cast pizzeriasData to Pizzeria[] to match the type, assuming missing optional fields are handled by components
    const staticPizzerias = pizzeriasData as unknown as Pizzeria[];

    if (!firestorePizzerias) return staticPizzerias;

    const firestoreIds = new Set(firestorePizzerias.map(p => p.id));
    const filteredStatic = staticPizzerias.filter(p => !firestoreIds.has(p.id));

    return [...firestorePizzerias, ...filteredStatic].sort((a, b) => a.name.localeCompare(b.name));
  }, [firestorePizzerias]);

  const testimonialsQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'testimonials'), orderBy('createdAt', 'desc')) : null,
    [firestore]);
  const { data: testimonials, isLoading: isLoadingTestimonials } = useCollection<Testimonial>(testimonialsQuery);

  const handleEditPizzeria = (pizzeria: Pizzeria) => {
    setEditingPizzeria(pizzeria);
    setFormOpen(true);
  }

  const handleAddNewPizzeria = () => {
    setEditingPizzeria(null);
    setFormOpen(true);
  }

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingPizzeria(null);
  }

  return (
    <div className="container py-12">
      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline text-4xl">Panel de Administración</h1>
            <p className="text-muted-foreground">Bienvenido, {user?.displayName || user?.email}.</p>
          </div>
          <div className="flex gap-2">
            <OsmImporter existingPizzerias={allPizzerias || []} />
            <DialogTrigger asChild>
              <Button onClick={handleAddNewPizzeria}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Pizzería
              </Button>
            </DialogTrigger>
          </div>
        </div>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-3xl">{editingPizzeria ? 'Editar Pizzería' : 'Agregar Nueva Pizzería'}</DialogTitle>
            <DialogDescription>
              {editingPizzeria ? 'Modifica los detalles de la pizzería.' : 'Completa el formulario para añadir una pizzería al mapa.'}
            </DialogDescription>
          </DialogHeader>
          <PizzeriaForm pizzeria={editingPizzeria} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Gestionar Pizzerías</CardTitle>
            <CardDescription>Edita, agrega o elimina pizzerías de la base de datos.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPizzerias && !allPizzerias.length ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <PizzeriaTable pizzerias={allPizzerias || []} onEdit={handleEditPizzeria} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestionar Testimonios</CardTitle>
            <CardDescription>Responde o elimina los testimonios de los usuarios sobre la aplicación.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTestimonials ? (
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <TestimonialTable testimonials={testimonials || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestionar Opiniones de Pizzerías</CardTitle>
            <CardDescription>Selecciona una pizzería para ver y gestionar sus opiniones.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPizzerias && !allPizzerias.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <PizzeriaReviewsManager pizzerias={allPizzerias || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  useEffect(() => {
    // Wait until user loading is finished before checking for user
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  // If either user or profile is loading, or if we're not logged in yet, show a loading skeleton
  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="container py-12">
        <Skeleton className="w-1/3 h-12 mb-8" />
        <div className="space-y-8">
          <Skeleton className="w-full h-64" />
          <Skeleton className="w-full h-64" />
        </div>
      </div>
    );
  }

  const isAdmin = userProfile?.isAdmin === true;

  // After loading, if the user is not an admin, deny access
  if (!isAdmin) {
    return (
      <div className="container py-20 text-center flex flex-col justify-center items-center">
        <h1 className="font-headline text-3xl">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">No tienes permisos para ver esta página.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Volver al Inicio</Button>
      </div>
    );
  }

  // If the user is an admin, show the dashboard
  return <AdminDashboard />;
}
