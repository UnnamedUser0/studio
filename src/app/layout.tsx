import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { fontHeadline, fontBody } from '@/app/fonts';
import { AuthProvider } from '@/components/providers/auth-provider';
import Chatbot from '@/components/chatbot/chatbot';
import Footer from '@/components/layout/footer';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';

import { AdminHeartbeat } from '@/components/AdminHeartbeat';

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AdminHeartbeat />
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-grow pb-16 md:pb-0">
                {children}
              </main>
              <Footer />
              <Toaster />
              <Chatbot />
              <MobileBottomNav />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
