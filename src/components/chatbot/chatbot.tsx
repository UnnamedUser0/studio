'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, CornerDownLeft, X, Loader2 } from 'lucide-react';
import { pizzAppChat, PizzAppChatInput } from '@/ai/flows/pizzapp-chat-flow';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PizzaSliceIcon } from '../icons/pizza-slice-icon';
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

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    
    const chatInput: PizzAppChatInput = {
      history: messages,
      question: input,
    };

    setInput('');

    startTransition(async () => {
      try {
        const result = await pizzAppChat(chatInput);
        const botMessage: Message = { role: 'model', content: [{ text: result.answer }] };
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error("Error calling chatbot flow:", error);
        const errorMessage: Message = { role: 'model', content: [{ text: "Lo siento, estoy teniendo problemas para conectarme. Inténtalo de nuevo más tarde." }] };
        setMessages(prev => [...prev, errorMessage]);
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
        className="fixed bottom-6 right-6 z-[1002] cursor-pointer group"
        onClick={toggleChat}
        aria-label="Abrir chat de ayuda"
      >
        <div className="absolute top-1/2 -translate-y-1/2 -left-2 -translate-x-full w-auto bg-background border rounded-lg p-2 px-3 text-center shadow-lg animate-fade-in-down transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-translate-x-4 pointer-events-none">
            <p className="text-sm font-medium whitespace-nowrap">¿En qué puedo ayudarte?</p>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-t border-r transform rotate-45 -z-10"></div>
        </div>

        <button className="relative h-24 w-24 rounded-full" aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}>
            <PizzaBotIcon className={`h-full w-full transform transition-transform duration-300 ${isOpen ? 'rotate-12 scale-90' : 'animate-wave-and-float'}`} />
            {isOpen && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                    <X className="h-10 w-10 text-white"/>
                </div>
            )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-32 right-6 w-full max-w-sm z-[1001] animate-fade-in-down">
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
                           <AvatarFallback><div className="h-6 w-6"><PizzaBotIcon/></div></AvatarFallback>
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
                           <AvatarFallback><div className="h-6 w-6"><PizzaBotIcon/></div></AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-xl px-4 py-2 rounded-bl-none flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin"/>
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
