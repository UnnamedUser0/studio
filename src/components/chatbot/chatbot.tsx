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

    // Local simple bot logic
    const getBotResponse = (query: string) => {
      const lower = query.toLowerCase();
      if (lower.includes('hola') || lower.includes('buenos días') || lower.includes('buenas')) {
        return "¡Hola! Soy Pizzi, tu asistente virtual. ¿En qué puedo ayudarte a encontrar la mejor pizza hoy?";
      }
      if (lower.includes('menu') || lower.includes('menú') || lower.includes('carta')) {
        return "Puedes ver el menú de cada pizzería haciendo clic en el botón 'Ver menú' en las tarjetas de las pizzerías.";
      }
      if (lower.includes('horario') || lower.includes('abierto')) {
        return "La mayoría de nuestras pizzerías abren de 11:00 AM a 11:00 PM. Te recomiendo verificar el horario específico en la ficha de cada una.";
      }
      if (lower.includes('ubicación') || lower.includes('donde') || lower.includes('llegar')) {
        return "Usa el botón 'Cómo llegar' en la tarjeta de la pizzería que te interese para ver la ruta en el mapa.";
      }
      if (lower.includes('mejor') || lower.includes('ranking') || lower.includes('top')) {
        return "¡Nuestra sección de Ranking muestra las pizzerías mejor valoradas por la comunidad! Échale un vistazo.";
      }
      if (lower.includes('gracias')) {
        return "¡De nada! Disfruta tu pizza 🍕";
      }
      return "Interesante pregunta. Aunque soy un bot sencillo, te sugiero explorar la sección de 'Explorar Pizzerías' para más detalles o contactar directamente al local.";
    };

    startTransition(async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const responseText = getBotResponse(currentInput);
      const botMessage: Message = { role: 'model', content: [{ text: responseText }] };
      setMessages(prev => [...prev, botMessage]);
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
