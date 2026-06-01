'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, CornerDownLeft, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PizzaBotIcon } from '../icons/pizza-bot-icon';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { pizzAppChat } from '@/ai/flows/pizzapp-chat-flow';


type Message = {
  role: 'user' | 'model';
  content: { text: string }[];
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    // Local smart bot logic (fallback when Gemini API Key is not set or quota is exceeded)
    const getBotResponse = (query: string) => {
      const lower = query.toLowerCase();
      if (lower.includes('hola') || lower.includes('buenos días') || lower.includes('buenas') || lower.includes('saludos')) {
        return "¡Hola! Soy Pizzi, el asistente experto de PizzApp. Estoy aquí para guiarte a descubrir las mejores pizzerías en Hermosillo. ¿Qué tipo de pizza o local estás buscando hoy?";
      }
      if (lower.includes('menu') || lower.includes('menú') || lower.includes('carta') || lower.includes('platillo') || lower.includes('precio')) {
        return "¡Claro! En PizzApp puedes ver el menú detallado de cada pizzería haciendo clic en el botón 'Ver menú' en la tarjeta de cualquier pizzería. Ahí verás los platillos disponibles, sus ingredientes y sus precios.";
      }
      if (lower.includes('horario') || lower.includes('abierto') || lower.includes('hora') || lower.includes('tiempo')) {
        return "Los horarios varían por establecimiento, pero la mayoría de las pizzerías en Hermosillo abren entre 11:00 AM y 11:00 PM. Puedes ver el horario exacto de tu local favorito haciendo clic en su ficha en el mapa interactivo.";
      }
      if (lower.includes('mapa') || lower.includes('ubicación') || lower.includes('donde') || lower.includes('dirección') || lower.includes('llegar') || lower.includes('cómo llegar')) {
        return "Contamos con un Mapa Interactivo Leaflet centrado en Hermosillo, Sonora. Puedes buscar pizzerías por nombre o colonia en la barra superior. Si encuentras una que te guste, haz clic en 'Cómo llegar' para trazar la ruta en tiempo real directamente en el mapa.";
      }
      if (lower.includes('mejor') || lower.includes('ranking') || lower.includes('top') || lower.includes('estrella') || lower.includes('calificar') || lower.includes('reseña') || lower.includes('opinión')) {
        return "¡Nuestra comunidad es súper activa! En la sección de 'Ranking', verás las pizzerías mejor valoradas de Hermosillo. Además, si inicias sesión, puedes calificar de 1 a 5 estrellas y escribir una reseña sobre tu experiencia para ayudar a otros usuarios.";
      }
      if (lower.includes('cuenta') || lower.includes('registro') || lower.includes('login') || lower.includes('iniciar sesión') || lower.includes('sesión')) {
        return "¡Unirte a la comunidad es facilísimo! Para explorar el mapa y los menús no necesitas cuenta. Pero si deseas escribir reseñas, calificar locales o guardar favoritos, puedes registrarte gratis con tu correo o iniciar sesión de forma anónima.";
      }
      if (lower.includes('contacto') || lower.includes('soporte') || lower.includes('dueño') || lower.includes('negocio') || lower.includes('agregar')) {
        return "Si deseas agregar tu pizzería a PizzApp, sugerir un cambio o reportar un problema, ve a nuestra sección de 'Contacto'. El equipo de soporte revisará la información de inmediato para actualizar el listado.";
      }
      if (lower.includes('imagen') || lower.includes('foto') || lower.includes('subir') || lower.includes('error') || lower.includes('base64') || lower.includes('serverless') || lower.includes('netlify')) {
        return "Hemos implementado una robusta arquitectura serverless en PizzApp conectada a Neon PostgreSQL. Todas las fotos de pizzerías, menús y avatares se procesan 100% en memoria en formato Base64 de alta velocidad. Esto elimina cualquier error de escritura en producción y mantiene tus imágenes seguras permanentemente en la nube.";
      }
      if (lower.includes('gracias') || lower.includes('agradezco') || lower.includes('excelente') || lower.includes('perfecto')) {
        return "¡Es todo un placer ayudarte! Disfruta la mejor pizza de Hermosillo. Si tienes otra duda sobre PizzApp, aquí estaré. 🍕";
      }
      return "Entiendo tu duda sobre PizzApp. Aunque actualmente estoy operando en mi modo de respaldo inteligente por límites de cuota, te comento que PizzApp es una completa guía interactiva 3D de pizzerías en Hermosillo. Te sugiero explorar el mapa de inicio, la sección de Rankings, o la pestaña de Ayuda para más detalles.";
    };

    startTransition(async () => {
      try {
        // Format conversation history for Genkit flow
        const formattedHistory = messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          content: msg.content.map(c => ({ text: c.text }))
        }));

        const response = await pizzAppChat({
          history: formattedHistory,
          message: currentInput
        });

        // Trigger fallback if Genkit API error occurs
        if (response.answer.includes('problemas para conectar con mi cerebro digital') || response.answer.includes('API de Google AI no está habilitada')) {
          throw new Error('AI flow returned connection/key error. Falling back.');
        }

        const botMessage: Message = { role: 'model', content: [{ text: response.answer }] };
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.warn("Pizzi AI flow unavailable, using local fallback. Error:", error);
        const responseText = getBotResponse(currentInput);
        const botMessage: Message = { role: 'model', content: [{ text: responseText }] };
        setMessages(prev => [...prev, botMessage]);
      }
    });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <>
      <div
        className="fixed bottom-24 md:bottom-6 right-6 z-[1002] cursor-pointer group"
        onClick={toggleChat}
        aria-label="Abrir chat de ayuda"
      >
        <div className="absolute top-1/2 right-full mr-4 w-auto -translate-y-1/2 bg-background border rounded-lg p-2 px-3 text-center shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:block pointer-events-none">
          <p className="text-sm font-medium whitespace-nowrap">¿En qué puedo ayudarte?</p>
          <div className="absolute right-[-0.5rem] top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-t border-r transform rotate-45 -z-10"></div>
        </div>

        <button className="relative h-16 w-16 rounded-full" aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}>
          <PizzaBotIcon className={cn("h-full w-full transform transition-transform duration-300", isOpen ? "rotate-12 scale-90" : "animate-wave-and-float")} />
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
              <X className="h-8 w-8 text-white" />
            </div>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-44 md:bottom-28 right-6 w-full max-w-sm z-[1001] animate-fade-in-down">
          <Card className="flex flex-col h-[60vh] shadow-2xl">
            <CardHeader className="flex-row items-center gap-3">
              <div className="h-10 w-10"><PizzaBotIcon /></div>
              <div>
                <CardTitle className="font-headline text-2xl">Pizzi, tu Asistente</CardTitle>
                <p className="text-sm text-muted-foreground">¿Cómo puedo ayudarte hoy?</p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-4 space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={cn('flex items-start gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.role === 'model' && (
                        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                          <AvatarFallback><div className="h-6 w-6"><PizzaBotIcon /></div></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        'max-w-[80%] rounded-xl px-4 py-2 text-sm',
                        msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                      )}>
                        {msg.content[0].text}
                      </div>
                      {msg.role === 'user' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isPending && (
                    <div className="flex items-start gap-3 justify-start">
                      <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback><div className="h-6 w-6"><PizzaBotIcon /></div></AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-xl px-4 py-2 rounded-bl-none flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Pizzi está pensando...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex w-full items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  disabled={isPending}
                />
                <Button type="submit" size="icon" disabled={isPending}>
                  <CornerDownLeft className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
