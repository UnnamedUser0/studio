'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && auth) {
      await initiateEmailSignIn(auth, email, password);
      router.push('/');
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && auth) {
      await initiateEmailSignUp(auth, email, password);
      router.push('/');
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
                  <Input id="email-login" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required />
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
                  <Input id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required />
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
