import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import Header from '@/components/layout/header';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { fontHeadline, fontBody } from '@/app/fonts';

export const metadata: Metadata = {
  title: 'PizzApp - Hermosillo Pizza Finder',
  description: 'Find the best pizzerias in Hermosillo, Sonora.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body 
        className={cn(
          "font-body antialiased bg-background text-foreground",
          fontHeadline.variable,
          fontBody.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Toaster />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
