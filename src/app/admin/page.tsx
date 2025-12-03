'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import { getAllPizzerias, getTestimonials, getUserProfile } from '@/app/actions';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

function AdminDashboard() {
  const { data: session } = useSession();
  const user = session?.user;
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingPizzeria, setEditingPizzeria] = useState<Pizzeria | null>(null);
  const [firestorePizzerias, setFirestorePizzerias] = useState<Pizzeria[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoadingPizzerias, setIsLoadingPizzerias] = useState(true);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);

  useEffect(() => {
    setIsLoadingPizzerias(true);
    getAllPizzerias().then((data) => {
      // Adapt Prisma Pizzeria to App Pizzeria type if needed
      // Prisma Pizzeria matches App Pizzeria roughly, but we need to handle optional fields if any mismatch
      // Prisma: id, name, address, lat, lng, imageUrl, createdAt, updatedAt
      // App: id, name, address, lat, lng, rating, category, source, reviews, imageUrl, imageHint
      // We need to map it.
      const adapted = data.map((p: any) => ({
        ...p,
        rating: p.rating,
        category: p.category || 'Pizza',
        source: p.source || 'Database',
        imageHint: 'pizza',
        imageUrl: p.imageUrl || undefined,
        reviews: [],
        reviewCount: p.reviewCount
      })) as unknown as Pizzeria[];
      setFirestorePizzerias(adapted);
      setIsLoadingPizzerias(false);
    });

    setIsLoadingTestimonials(true);
    getTestimonials().then((data) => {
      // Adapt Prisma Testimonial
      const adapted = data.map((t: any) => ({
        id: t.id.toString(),
        author: t.name,
        role: t.role || 'Usuario',
        comment: t.content,
        createdAt: t.createdAt.toISOString(),
        avatarUrl: t.avatarUrl,
        email: t.email || undefined,
        reply: t.replyText ? {
          text: t.replyText,
          repliedAt: t.repliedAt ? t.repliedAt.toISOString() : new Date().toISOString()
        } : undefined
      })) as unknown as Testimonial[];
      setTestimonials(adapted);
      setIsLoadingTestimonials(false);
    });
  }, []);

  const allPizzerias = useMemo(() => {
    // Cast pizzeriasData to Pizzeria[] to match the type, assuming missing optional fields are handled by components
    const staticPizzerias = pizzeriasData as unknown as Pizzeria[];

    if (!firestorePizzerias) return staticPizzerias;

    const firestoreIds = new Set(firestorePizzerias.map(p => p.id));
    const filteredStatic = staticPizzerias.filter(p => !firestoreIds.has(p.id));

    return [...firestorePizzerias, ...filteredStatic].sort((a, b) => a.name.localeCompare(b.name));
  }, [firestorePizzerias]);


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
    // Refresh pizzerias
    setIsLoadingPizzerias(true);
    getAllPizzerias().then((data) => {
      const adapted = data.map((p: any) => ({
        ...p,
        rating: p.rating,
        category: p.category || 'Pizza',
        source: p.source || 'Database',
        imageHint: 'pizza',
        imageUrl: p.imageUrl || undefined,
        reviews: [],
        reviewCount: p.reviewCount
      })) as unknown as Pizzeria[];
      setFirestorePizzerias(adapted);
      setIsLoadingPizzerias(false);
    });
  }

  return (
    <div className="container py-12">

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline text-4xl">Panel de Administración</h1>
            <p className="text-muted-foreground">Bienvenido, {user?.name || user?.email}.</p>
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    // We can check session.user.isAdmin if we added it to the session type
    // Or fetch profile
    // @ts-ignore
    if (session.user.isAdmin) {
      setIsAdmin(true);
      setIsCheckingAdmin(false);
    } else {
      // Fetch profile to be sure
      getUserProfile(session.user.id!).then((profile) => {
        if (profile?.isAdmin) {
          setIsAdmin(true);
        }
        setIsCheckingAdmin(false);
      });
    }
  }, [session, status, router]);

  if (status === 'loading' || isCheckingAdmin) {
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

  if (!isAdmin) {
    return (
      <div className="container py-20 text-center flex flex-col justify-center items-center">
        <h1 className="font-headline text-3xl">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">No tienes permisos para ver esta página.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Volver al Inicio</Button>
      </div>
    );
  }

  return <AdminDashboard />;
}
