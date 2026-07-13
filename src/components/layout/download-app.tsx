'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Download, QrCode, Info, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export default function DownloadApp() {
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsElectron(window.navigator.userAgent.toLowerCase().includes('electron'));
    }
  }, []);

  if (!mounted) return null;

  return (
    <section id="download-app" className="py-20 bg-muted/30 border-t border-b border-border/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>

      <div className="container px-4 mx-auto relative z-10">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-headline font-bold tracking-tight">
              {isElectron ? "PizzApp Desktop" : "PizzApp en todos tus dispositivos"}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {isElectron 
                ? "Estás utilizando la aplicación nativa para Windows. Tu app cuenta con un launcher que busca e instala actualizaciones automáticas al iniciar."
                : "Lleva el mapa definitivo de las mejores pizzerías de Hermosillo contigo. Descarga la versión de escritorio o instala la app móvil."}
            </p>
          </div>
        </ScrollReveal>

        {isElectron ? (
          // Vista simplificada y segura para Electron (evita Dialog y redundancias de descarga)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Desktop App Status */}
            <ScrollReveal>
              <Card className="h-full border-border/60 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl group">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Aplicación de Escritorio Activa</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    Tienes instalada la versión oficial para Windows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-[210px] pt-0">
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Actualizaciones automáticas integradas (Launcher interactivo).
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Optimización de memoria y soporte de aceleración por GPU.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Esquinas redondeadas transparentes de alta seguridad.
                    </li>
                  </ul>
                  <div className="space-y-2">
                    <Button disabled className="w-full bg-muted text-muted-foreground font-semibold flex items-center justify-center gap-2 h-11 border border-border">
                      Ya estás ejecutando la App de Escritorio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Mobile App Download directly visible */}
            <ScrollReveal>
              <Card className="h-full border-border/60 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl group">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">PizzApp para Celular</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    Descarga la versión móvil nativa para tu celular Android.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-[210px] pt-0">
                  <p className="text-sm text-muted-foreground leading-normal mb-6">
                    Puedes descargar el archivo instalador nativo APK de forma directa en tu dispositivo para navegar con GPS por las pizzerías.
                  </p>
                  <div className="space-y-2">
                    <Button 
                      asChild
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 h-11 shadow-md"
                    >
                      <a href="https://github.com/UnnamedUser0/studio/releases/latest" target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                        Descargar APK para Android
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        ) : (
          // Vista estándar para la web
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Desktop App Card */}
            <ScrollReveal>
              <Card className="h-full border-border/60 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl group">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">App para Computadora</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    Disfruta de PizzApp en Windows de forma nativa e independiente del navegador.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-[210px] pt-0">
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Instalador seguro optimizado para Windows.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Acceso directo desde tu escritorio y menú de inicio.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Sistema de actualizaciones automáticas interactivo.
                    </li>
                  </ul>
                  <div className="space-y-2">
                    <Button 
                      asChild
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 h-11 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <a href="https://github.com/UnnamedUser0/studio/releases/latest/download/PizzApp.exe" target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                        Descargar para Windows (.exe)
                      </a>
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Descarga segura desde la sección de versiones en nuestro repositorio GitHub.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Mobile App Card */}
            <ScrollReveal>
              <Card className="h-full border-border/60 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl group">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">App para Celular</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    Encuentra tu pizza ideal directamente desde tu teléfono mientras estás en la calle.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-[210px] pt-0">
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Navegación GPS y rutas dinámicas en tiempo real.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Inicio rápido con icono en tu pantalla de inicio.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Experiencia a pantalla completa optimizada para celulares.
                    </li>
                  </ul>
                  <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold flex items-center justify-center gap-2 h-11 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <QrCode className="w-4 h-4" />
                        Obtener App Móvil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] bg-card border border-border/80 backdrop-blur-lg overflow-y-auto max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-headline font-bold text-center">Instalar PizzApp en tu Celular</DialogTitle>
                        <DialogDescription className="text-center">
                          Elige el método de instalación adecuado para tu dispositivo.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4 space-y-6">
                        {/* Option 1: Android APK */}
                        <div className="space-y-3 p-3 border border-primary/20 rounded-lg bg-primary/5">
                          <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4" /> App para Android (.APK)
                          </h4>
                          <p className="text-xs text-muted-foreground leading-normal">
                            Descarga e instala la aplicación oficial nativa directamente en tu teléfono Android.
                          </p>
                          <Button 
                            asChild
                            size="sm"
                            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 h-9 shadow-sm"
                          >
                            <a href="https://github.com/UnnamedUser0/studio/releases/latest" target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                              Descargar para Android (.apk)
                            </a>
                          </Button>
                        </div>

                        {/* Option 2: iOS PWA (Apple) */}
                        <div className="space-y-2 border border-border/60 rounded-lg p-3 bg-muted/20">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <Info className="w-4 h-4" /> iPhone (iOS) - App en Pantalla de Inicio
                          </h4>
                          <p className="text-xs text-muted-foreground leading-normal">
                            Debido a que Apple no permite descargas directas de archivos de terceros, puedes agregarla directamente a tu pantalla de inicio como una aplicación web nativa (PWA):
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc leading-normal mt-1">
                            <li>Abre esta página en el navegador <strong>Safari</strong> de tu iPhone.</li>
                            <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con una flecha hacia arriba).</li>
                            <li>Selecciona la opción <strong>"Añadir a pantalla de inicio"</strong>.</li>
                          </ul>
                        </div>

                        {/* Option 3: Expo QR */}
                        <div className="space-y-2 border border-dashed border-border/80 rounded-lg p-3 bg-muted/10">
                          <h4 className="font-bold text-xs text-muted-foreground flex items-center gap-1.5">
                            <QrCode className="w-3.5 h-3.5" /> Modo Desarrollador (Expo Go)
                          </h4>
                          <p className="text-[11px] text-muted-foreground leading-normal">
                            Para depuración y pruebas locales: Ejecuta `npm run mobile` en tu terminal y escanea el código QR desde la app **Expo Go** en Android o iOS.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={() => setIsMobileModalOpen(false)} className="bg-foreground text-background hover:bg-foreground/90">
                          Cerrar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        )}
      </div>
    </section>
  );
}
