'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Bot, User, CornerDownLeft, X, Loader2 } from 'lucide-react';
import { pizzAppChat, PizzAppChatInput } from '@/ai/flows/pizzapp-chat-flow';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PizzaSliceIcon } from '../icons/pizza-slice-icon';
import { cn } from '@/lib/utils';

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
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-[1002]"
        size="icon"
        onClick={toggleChat}
        aria-label="Abrir chat de ayuda"
      >
        {isOpen ? <X className="h-8 w-8" /> : <MessageCircle className="h-8 w-8" />}
      </Button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm z-[1001] animate-fade-in-down">
          <Card className="flex flex-col h-[60vh] shadow-2xl">
            <CardHeader className="flex-row items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
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
                           <AvatarFallback><PizzaSliceIcon className="h-5 w-5" /></AvatarFallback>
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
                           <AvatarFallback><PizzaSliceIcon className="h-5 w-5" /></AvatarFallback>
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
