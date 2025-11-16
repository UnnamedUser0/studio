'use client';
import Link from 'next/link';
import { useUser, useAuth, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
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
import { Pizza, LogOut, Shield, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/lib/types';
import { Badge } from '../ui/badge';


function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
      className="hover:bg-primary hover:text-primary-foreground hover:glow-primary"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1_2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const userProfileRef = useMemoFirebase(() => 
      user ? doc(firestore, 'users', user.uid) : null,
      [firestore, user]
  );

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);
  const isAdmin = userProfile?.isAdmin === true;

  const navLinkClasses = "relative text-sm font-medium transition-colors hover:text-primary after:content-[''] after:absolute after:left-1/2 after:-bottom-1.5 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-primary after:transition-all after:duration-300 hover:after:w-full";

  return (
    <header className="sticky top-0 z-[1001] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16">
      <div className="container flex h-full items-center">
        <div className="flex items-center space-x-2 mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <Pizza className="h-7 w-7 text-primary" />
            <div className="w-[7ch]"> 
              <span className="font-bold font-headline text-xl inline-block overflow-hidden whitespace-nowrap border-r-4 border-r-primary typing-animation">
                PizzApp
              </span>
            </div>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
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
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeSwitcher />
          {isUserLoading ? (
             <Skeleton className="h-9 w-24" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-primary/20">
                    <Avatar className="h-9 w-9 border-2 border-primary/50">
                      <AvatarImage src={`https://api.dicebear.com/8.x/micah/svg?seed=${user.email}`} alt={user.displayName || user.email || ''} />
                      <AvatarFallback>{user.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{userProfile?.username || user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Panel de Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => auth?.signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {isProfileLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                userProfile && (
                   <Badge variant={isAdmin ? "default" : "secondary"}>
                    {isAdmin ? "Administrador" : "Usuario"}
                   </Badge>
                )
              )}
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