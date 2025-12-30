'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, Pizza } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Validate Confirm Password in Signup Mode
    if (!isLoginMode) {
      if (password !== confirmPassword) {
        toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLoginMode) {
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result?.error) {
          toast({ title: "Error", description: "Credenciales inválidas", variant: "destructive" });
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        // Signup Mode
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
    } catch (error) {
      toast({ title: "Error", description: "Ha ocurrido un error inesperado", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#101010] p-4">

      {/* Logo - Main App Concept Animation - Placed ABOVE the form container in the "black" area */}
      <div className="flex items-center justify-center gap-2 mb-8 scale-110">
        <Pizza className="h-10 w-10 text-primary" />
        <div className="w-[7ch] text-left font-bold font-headline text-4xl">
          <span className="inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation text-white pb-2 leading-normal">
            PizzApp
          </span>
        </div>
      </div>

      {/* Main Container - modeled after the image (Dark Grey Card) */}
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-2xl shadow-xl p-6 md:p-8 space-y-6 border border-[#2a2a2a]">

        {/* Dynamic Header/Description based on mode */}
        <p className="text-gray-400 text-sm text-center leading-relaxed">
          {isLoginMode
            ? "Solo se permite iniciar sesión por correo electrónico o Google."
            : "Solo se admite el registro por correo electrónico en tu región. Una sola cuenta de PizzApp Studio es todo lo que necesitas para acceder a todos los servicios."
          }
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email Input */}
          <div className="space-y-1">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Dirección de correo electrónico"
                className="pl-10 h-12 bg-[#252525] border-[#333] text-gray-200 placeholder:text-gray-600 focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary rounded-lg transition-all"
                required
                suppressHydrationWarning
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <Input
                id="password"
                type={isVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="pl-10 pr-10 h-12 bg-[#252525] border-[#333] text-gray-200 placeholder:text-gray-600 focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary rounded-lg transition-all"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input - ONLY in Signup Mode */}
          {!isLoginMode && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  type={isConfirmVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  className="pl-10 pr-10 h-12 bg-[#252525] border-[#333] text-gray-200 placeholder:text-gray-600 focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary rounded-lg transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmVisible(!isConfirmVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                >
                  {isConfirmVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Disclaimer for Signup */}
          {!isLoginMode && (
            <p className="text-xs text-gray-500 px-1">
              Al registrarte, aceptas los <Link href="/terms" className="underline hover:text-gray-300">Términos de uso</Link> y <Link href="/privacy" className="underline hover:text-gray-300">Política de Privacidad</Link> de PizzApp Studio.
            </p>
          )}

          {/* Disclaimer for Login */}
          {isLoginMode && (
            <p className="text-xs text-gray-500 text-center px-2">
              Al iniciar sesión, aceptas los <Link href="/terms" className="underline hover:text-gray-300">Términos de uso</Link> y <Link href="/privacy" className="underline hover:text-gray-300">Política de Privacidad</Link>.
            </p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground font-medium text-base rounded-lg transition-all hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoginMode ? 'Iniciar sesión' : 'Registrarse'}
          </Button>

          {/* Links / Mode Toggle */}
          <div className="flex items-center justify-center text-sm mt-4">
            {isLoginMode ? (
              <div className="w-full flex justify-between">
                <button type="button" className="text-primary hover:text-primary/90 font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(false);
                    setEmail(''); setPassword(''); setConfirmPassword('');
                  }}
                  className="text-primary hover:text-primary/90 font-medium transition-colors"
                >
                  Registrarse
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(true);
                  setEmail(''); setPassword('');
                }}
                className="text-primary hover:text-primary/90 font-medium transition-colors"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </form>

        {/* Separator & Google - ONLY for Login Mode */}
        {isLoginMode && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#333]"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1e1e1e] px-2 text-gray-500">O</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-[#252525] border-[#333] hover:bg-[#333] text-gray-200 hover:text-white transition-all flex items-center justify-center gap-2 rounded-lg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Iniciar sesión con Google
            </Button>
          </>
        )}

      </div>
    </div>
  );
}
