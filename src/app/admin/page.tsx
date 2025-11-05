'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Footer from '@/components/layout/footer';

function AdminDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-grow container py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline text-4xl">Panel de Administración</h1>
            <p className="text-muted-foreground">Bienvenido, {user?.name}.</p>
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
  const { isAdmin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // A simple client-side check. A real app needs server-side protection.
    if (user === null) {
      router.push('/login');
    }
  }, [isAdmin, user, router]);

  if (user === null) {
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
