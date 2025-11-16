'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getFirestore } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { User } from '@/lib/types';


const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

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

  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => 
      user ? doc(firestore, 'users', user.uid) : null,
      [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);
  const isAdmin = userProfile?.isAdmin === true;

  useEffect(() => {
    // Wait until user loading is finished before checking for user
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  // If either user or profile is loading, or if we're not logged in yet, show a loading skeleton
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow container py-12">
          <Skeleton className="w-1/3 h-12 mb-8" />
          <Skeleton className="w-full h-64" />
        </div>
        <Footer />
      </div>
    );
  }
  
  // After loading, if the user is not an admin, deny access
  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow container py-20 text-center flex flex-col justify-center items-center">
            <h1 className="font-headline text-3xl">Acceso Denegado</h1>
            <p className="text-muted-foreground mt-2">No tienes permisos para ver esta página.</p>
            <Button onClick={() => router.push('/')} className="mt-6">Volver al Inicio</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // If the user is an admin, show the dashboard
  return <AdminDashboard />;
}
