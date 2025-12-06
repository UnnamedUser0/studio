'use client';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pizza, LogOut, Shield, Moon, Sun, MousePointer2, MousePointerClick, Settings as SettingsIcon, Skull } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/lib/types';
import { Badge } from '../ui/badge';
import { useState, useEffect } from 'react';
import SettingsDialog from '@/components/user/settings-dialog';
import { OnlineUsersIndicator } from '@/components/admin/online-users-indicator';


function CursorSwitcher() {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDisabled = localStorage.getItem('custom-cursor-disabled') === 'true';
    setEnabled(!isDisabled);
    if (isDisabled) {
      document.body.classList.add('no-custom-cursor');
    } else {
      document.body.classList.remove('no-custom-cursor');
    }
  }, []);

  const toggleCursor = () => {
    const newState = !enabled;
    setEnabled(newState);
    if (newState) {
      document.body.classList.remove('no-custom-cursor');
      localStorage.removeItem('custom-cursor-disabled');
    } else {
      document.body.classList.add('no-custom-cursor');
      localStorage.setItem('custom-cursor-disabled', 'true');
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <MousePointer2 className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCursor}
      aria-label={enabled ? "Desactivar cursor personalizado" : "Activar cursor personalizado"}
      className="hover:bg-primary hover:text-primary-foreground hover:glow-primary"
      title={enabled ? "Desactivar cursor personalizado" : "Activar cursor personalizado"}
    >
      {enabled ? (
        <MousePointerClick className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <MousePointer2 className="h-[1.2rem] w-[1.2rem] opacity-50" />
      )}
    </Button>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
      className="hover:bg-primary hover:text-primary-foreground hover:glow-primary"
      title={theme === 'light' ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1_2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isUserLoading = status === 'loading';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setIsProfileLoading(true);
      import('@/app/actions').then(({ getUserProfile }) => {
        getUserProfile(user.id!).then((profile) => {
          setUserProfile(profile as unknown as User);
          setIsProfileLoading(false);
        });
      });
    } else {
      setUserProfile(null);
    }
  }, [user?.id]);

  // @ts-ignore
  const isAdmin = (user as any)?.isAdmin === true || userProfile?.isAdmin === true;

  const navLinkClasses = "relative text-sm font-medium transition-colors hover:text-primary after:content-[''] after:absolute after:left-1/2 after:-bottom-1.5 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-primary after:transition-all after:duration-300 hover:after:w-full";

  return (
    <header className="sticky top-0 z-[1001] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16">
      <div className="absolute left-4 md:left-8 top-0 h-full flex items-center z-20">
        <Link href="/" className="flex items-center space-x-2">
          <Pizza className="h-7 w-7 text-primary" />
          <div className="w-[7ch]">
            <span className="font-bold font-headline text-xl inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation">
              PizzApp
            </span>
          </div>
        </Link>
      </div>
      <div className="w-full px-4 md:px-8 flex h-full items-center">
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium ml-64">
          <Link href="/" className={navLinkClasses}>
            Inicio
          </Link>
          <Link href="/faq" className={navLinkClasses}>
            Preguntas Frecuentes
          </Link>
          <Link href="/help" className={navLinkClasses}>
            Centro de Ayuda
          </Link>
          <Link href="/contact" className={navLinkClasses}>
            Contacto
          </Link>
          <Link href="/?welcome=true" className={navLinkClasses}>
            Bienvenida
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden md:flex items-center gap-2">
            <OnlineUsersIndicator />
            <CursorSwitcher />
          </div>
          <ThemeSwitcher />
          {isUserLoading || (user && isProfileLoading) ? (
            <Skeleton className="h-9 w-24" />
          ) : user ? (
            <div className="flex items-center gap-4">
              {isAdmin ? (
                <Link href="/admin">
                  <Badge variant="default" className="cursor-pointer hover:bg-primary/80">
                    Administrador
                  </Badge>
                </Link>
              ) : (
                <Badge variant="secondary" className="cursor-default">
                  Usuario
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-primary/20">
                    <Avatar className="h-9 w-9 border-2 border-primary/50">
                      <AvatarImage src={user.image || `https://api.dicebear.com/8.x/micah/svg?seed=${user.email}`} alt={user.name || user.email || ''} />
                      <AvatarFallback>{user.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{userProfile?.username || user.name || user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Panel de Admin</span>
                          </Link>
                        </DropdownMenuItem>
                        {user.email === "va21070541@bachilleresdesonora.edu.mx" && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin/granting">
                              <Skull className="mr-2 h-4 w-4 text-destructive" />
                              <span>Otorgamiento y Eliminación</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
            </div>
          ) : (
            <Button asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
