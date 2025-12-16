
'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { registerUser } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const Footer = dynamic(() => import('@/components/layout/footer'), {
  loading: () => <div />,
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        toast({ title: "Error", description: "Credenciales inválidas", variant: "destructive" });
      } else {
        router.push('/');
        router.refresh();
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        await registerUser(email, password);
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result?.error) {
          toast({ title: "Error", description: "Error al iniciar sesión tras registro", variant: "destructive" });
        } else {
          router.push('/');
          router.refresh();
        }
      } catch (error) {
        toast({ title: "Error", description: "Error al registrar usuario (posiblemente ya existe)", variant: "destructive" });
      }
    }
  };

  return (
    <div className="container flex items-center justify-center py-12">
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="signup">Registrarse</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-3xl">Iniciar Sesión</CardTitle>
              <CardDescription>Accede a tu cuenta para dejar opiniones.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Correo Electrónico</Label>
                  <Input id="email-login" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required suppressHydrationWarning />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Contraseña</Label>
                  <Input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">Entrar</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-3xl">Crear Cuenta</CardTitle>
              <CardDescription>Regístrate para calificar y guardar tus pizzerías favoritas.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Correo Electrónico</Label>
                  <Input id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required suppressHydrationWarning />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Contraseña</Label>
                  <Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">Registrarse</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
