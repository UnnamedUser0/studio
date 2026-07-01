'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Download, QrCode, X, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export default function DownloadApp() {
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  return (
    <section id="download-app" className="py-20 bg-muted/30 border-t border-b border-border/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>

      <div className="container px-4 mx-auto relative z-10">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-headline font-bold tracking-tight">
              PizzApp en todos tus dispositivos
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Lleva el mapa definitivo de las mejores pizzerías de Hermosillo contigo. Descarga la versión de escritorio o instala la app móvil.
            </p>
          </div>
        </ScrollReveal>

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
              <CardContent className="flex flex-col justify-between h-[180px] pt-0">
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Versión portable (ejecutable directo sin instalación).
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Acceso directo desde tu escritorio.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Mayor rendimiento y sin pestañas del navegador.
                  </li>
                </ul>
                <Button 
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 h-11 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <a href="/downloads/PizzApp.exe" download>
                    <Download className="w-4 h-4" />
                    Descargar para Windows (.exe)
                  </a>
                </Button>
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
              <CardContent className="flex flex-col justify-between h-[180px] pt-0">
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
                      Instalar en Celular
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-card border border-border/80 backdrop-blur-lg">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-headline font-bold text-center">Instalar PizzApp en tu Móvil</DialogTitle>
                      <DialogDescription className="text-center">
                        Sigue estos sencillos pasos para instalar la aplicación móvil en tu celular.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                      {/* Option 1: PWA (Recommended) */}
                      <div className="space-y-2 border-b border-border/50 pb-4">
                        <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                          <Info className="w-4 h-4" /> Método Rápido (Recomendado)
                        </h4>
                        <p className="text-xs text-muted-foreground leading-normal">
                          Entra a este sitio web desde el navegador de tu celular y haz lo siguiente:
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1.5 pl-4 list-disc leading-normal mt-2">
                          <li><strong>En Android (Chrome):</strong> Toca los tres puntos de arriba y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.</li>
                          <li><strong>En iOS (Safari):</strong> Toca el botón de <strong>Compartir</strong> (cuadrado con flecha hacia arriba) y selecciona <strong>"Añadir a pantalla de inicio"</strong>.</li>
                        </ul>
                      </div>

                      {/* Option 2: Expo QR */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <QrCode className="w-4 h-4" /> Método de Prueba (Expo Go)
                        </h4>
                        <p className="text-xs text-muted-foreground leading-normal">
                          Si estás en el entorno de desarrollo local y tienes Expo Go instalado en tu celular, escanea el código QR que se genera en la terminal al ejecutar:
                        </p>
                        <div className="bg-muted p-2 rounded text-center font-mono text-xs text-primary font-bold">
                          npm run mobile
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => setIsMobileModalOpen(false)} className="bg-primary hover:bg-primary/90 text-white">
                        Entendido
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
