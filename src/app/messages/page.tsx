'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserContactMessages, 
  sendUserReply 
} from '@/app/actions/contact';
import { 
  MessageSquare, 
  Send, 
  Search, 
  User, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  ArrowLeft,
  Paperclip
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Reply {
  id: string;
  messageId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  image?: string | null;
  createdAt: Date;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  image?: string | null;
  status: string; // 'pending' | 'in_progress' | 'resolved'
  createdAt: Date;
  updatedAt: Date;
  replies: Reply[];
}

export default function UserMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  
  // Reply input
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  // For mobile view responsiveness
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Verify Authentication
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    loadMessages();
  }, [session, status, router]);

  // 2. Fetch Messages from DB
  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const data = await getUserContactMessages();
      // Ensure dates are parsed properly
      const formatted = data.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt),
        replies: msg.replies.map((rep: any) => ({
          ...rep,
          createdAt: new Date(rep.createdAt)
        }))
      })) as ContactMessage[];
      
      setMessages(formatted);
      
      // Auto-select first message if none is selected and screen is large
      if (formatted.length > 0 && !selectedMessageId) {
        setSelectedMessageId(formatted[0].id);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al cargar tus mensajes",
        description: err.message || "No se pudieron obtener tus conversaciones.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedMessageId, messages]);

  const activeMessage = messages.find(m => m.id === selectedMessageId);

  const handleReplyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo demasiado grande",
          description: "La imagen no debe superar los 5MB.",
          variant: "destructive"
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplyImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. Send Reply Handler
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessageId || isSendingReply) return;
    if (!replyText.trim() && !replyImage) return;

    setIsSendingReply(true);
    try {
      await sendUserReply(selectedMessageId, replyText, replyImage || undefined);
      setReplyText('');
      setReplyImage(null);
      
      // Reset attachment input if present
      const fileInput = document.getElementById('reply-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast({
        title: "Mensaje enviado",
        description: "Tu respuesta ha sido enviada correctamente al equipo de soporte.",
        className: "bg-green-500 text-white border-none",
      });
      // Reload messages to show new reply and status change
      await loadMessages();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al enviar mensaje",
        description: err.message || "Ocurrió un error al enviar tu respuesta.",
        variant: "destructive"
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  // Filtering Logic
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statusVal: string) => {
    switch(statusVal) {
      case 'pending':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">Pendiente</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">En Proceso</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Resuelto</Badge>;
      default:
        return <Badge variant="outline">{statusVal}</Badge>;
    }
  };

  if (status === 'loading' || isLoadingMessages && messages.length === 0) {
    return (
      <div className="container py-12">
        <Skeleton className="w-1/3 h-12 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          <Skeleton className="md:col-span-1 h-full" />
          <Skeleton className="md:col-span-2 h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Mis Mensajes de Soporte
          </h1>
          <p className="text-muted-foreground">
            Bandeja de comunicación con el equipo de PizzApp. Sigue el estado de tus sugerencias o reportes.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver al Inicio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border rounded-xl overflow-hidden h-[750px] bg-card shadow-2xl relative">
        
        {/* LEFT COLUMN: Chat List (hidden on mobile if chat is open) */}
        <div className={`col-span-1 md:col-span-4 border-r flex flex-col h-full bg-background/50 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Header with Search */}
          <div className="p-4 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por asunto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'pending', 'in_progress', 'resolved'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all border ${
                    statusFilter === filter
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground hover:bg-secondary/80 border-border'
                  }`}
                >
                  {filter === 'all' && 'Todos'}
                  {filter === 'pending' && 'Pendientes'}
                  {filter === 'in_progress' && 'En Proceso'}
                  {filter === 'resolved' && 'Resueltos'}
                </button>
              ))}
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-4">
                <MessageSquare className="h-12 w-12 mx-auto opacity-40" />
                <p className="text-sm font-medium">Aún no has enviado mensajes de soporte.</p>
                <Button onClick={() => router.push('/contact')} size="sm">
                  Enviar un Mensaje
                </Button>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <Search className="h-8 w-8 mx-auto opacity-50" />
                <p className="text-sm">No se encontraron resultados.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedMessageId;
                const lastItemText = msg.replies.length > 0 
                  ? msg.replies[msg.replies.length - 1].content 
                  : msg.message;
                  
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessageId(msg.id);
                      setShowMobileChat(true);
                    }}
                    className={`p-4 cursor-pointer transition-all flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary' 
                        : 'hover:bg-muted/50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm truncate">{msg.subject}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(msg.createdAt, { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">{msg.message}</span>
                      {getStatusBadge(msg.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat Box */}
        <div className={`col-span-1 md:col-span-8 flex flex-col h-full bg-muted/20 dark:bg-background/20 ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          {activeMessage ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-background flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold flex-shrink-0">
                    S
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm md:text-base truncate">Soporte PizzApp</h2>
                      <span>{getStatusBadge(activeMessage.status)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      Resolviendo tu consulta sobre: <strong>{activeMessage.subject}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/40">
                {/* Subject banner */}
                <div className="flex justify-center my-2">
                  <div className="bg-background border rounded-lg px-3 py-1.5 text-xs text-muted-foreground max-w-md text-center shadow-sm">
                    <span className="font-semibold text-foreground">Tu consulta:</span> {activeMessage.subject}
                  </div>
                </div>

                {/* Original User Message (Right Aligned, since it is the user's own message) */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[70%] bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-3 shadow-md space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold justify-between">
                      <span>Tú</span>
                      <Badge className="bg-white/20 text-white text-[9px] px-1 py-0 h-4 border-none hover:bg-white/30">
                        Remitente
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {activeMessage.message}
                    </p>
                    {activeMessage.image && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-white/20 max-w-xs cursor-zoom-in">
                        <img 
                          src={activeMessage.image} 
                          alt="Adjunto" 
                          className="w-full h-auto object-cover max-h-60 hover:opacity-90 transition-opacity" 
                          onClick={() => window.open(activeMessage.image!, '_blank')}
                        />
                      </div>
                    )}
                    <div className="text-[10px] text-primary-foreground/70 text-right">
                      {new Date(activeMessage.createdAt).toLocaleString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                  </div>
                </div>

                {/* Replies Thread */}
                {activeMessage.replies.map((reply) => {
                  const isReplyFromUser = reply.senderEmail.toLowerCase() === activeMessage.email.toLowerCase();
                  const cleanSenderName = isReplyFromUser ? "Tú" : "Administrador";

                  return (
                    <div key={reply.id} className={cn("flex", isReplyFromUser ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md space-y-1",
                        isReplyFromUser 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-background border text-foreground rounded-tl-none"
                      )}>
                        <div className="text-xs font-bold flex items-center justify-between gap-4 opacity-90">
                          <span>{isReplyFromUser ? "Tú" : cleanSenderName}</span>
                          <Badge className={cn(
                            "text-[9px] px-1 py-0 h-4 border-none",
                            isReplyFromUser 
                              ? "bg-white/20 text-white" 
                              : "bg-primary/15 text-primary hover:bg-primary/20"
                          )}>
                            {isReplyFromUser ? "Usuario" : "Soporte"}
                          </Badge>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {reply.content}
                        </p>
                        {reply.image && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-muted max-w-xs cursor-zoom-in">
                            <img 
                              src={reply.image} 
                              alt="Adjunto" 
                              className="w-full h-auto object-cover max-h-60 hover:opacity-90 transition-opacity" 
                              onClick={() => window.open(reply.image!, '_blank')}
                            />
                          </div>
                        )}
                        <div className={cn(
                          "text-[10px] text-right flex items-center justify-end gap-1",
                          isReplyFromUser ? "text-primary-foreground/75" : "text-muted-foreground"
                        )}>
                          {new Date(reply.createdAt).toLocaleString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short'
                          })}
                          {isReplyFromUser && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Footer */}
              <div className="p-4 border-t bg-background flex flex-col gap-2">
                {activeMessage.status === 'resolved' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>
                      Esta conversación ha sido marcada como <strong>Resuelta</strong> por soporte. Responder volverá a abrir el chat.
                    </p>
                  </div>
                )}
                
                {/* Image Preview Container */}
                {replyImage && (
                  <div className="relative w-24 h-24 border rounded overflow-hidden shadow bg-background group">
                    <img src={replyImage} alt="Vista previa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setReplyImage(null);
                        const fileInput = document.getElementById('reply-image') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xs font-bold">Quitar</span>
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSendReply} className="flex items-end gap-2">
                  <input
                    type="file"
                    id="reply-image"
                    accept="image/*"
                    onChange={handleReplyImageChange}
                    className="hidden"
                    disabled={isSendingReply}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-primary"
                    onClick={() => document.getElementById('reply-image')?.click()}
                    disabled={isSendingReply}
                    title="Adjuntar Imagen"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Escribe un mensaje para soporte..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                      disabled={isSendingReply}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-10 w-10 flex-shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground"
                    disabled={(!replyText.trim() && !replyImage) || isSendingReply}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground p-8 text-center bg-slate-50 dark:bg-slate-900/10">
              <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground/35 animate-pulse" />
              <h3 className="text-xl font-headline font-bold text-foreground">Mis Mensajes</h3>
              <p className="text-sm max-w-sm mt-2">
                Selecciona una consulta del listado izquierdo para ver los detalles del chat y conversar con soporte.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
