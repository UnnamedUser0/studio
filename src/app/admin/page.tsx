'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

const ADMIN_EMAILS = ['va21070541@bachilleresdesonora.edu.mx'];

function AdminDashboard() {
  const { user } = useUser();
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow container py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline text-4xl">Panel de Administración</h1>
            <p className="text-muted-foreground">Bienvenido, {user?.displayName || user?.email}.</p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Pizzería
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Gestionar Pizzerías</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Aquí se mostrará una tabla para administrar las pizzerías, editar información y moderar opiniones.
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return <div className="container py-12"><Skeleton className="w-full h-64" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-headline text-3xl">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">No tienes permisos para ver esta página.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Volver al Inicio</Button>
      </div>
    );
  }

  return <AdminDashboard />;
}
