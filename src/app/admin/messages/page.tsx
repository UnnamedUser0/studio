'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  getContactMessages, 
  sendAdminReply, 
  updateMessageStatus, 
  deleteContactMessage 
} from '@/app/actions/contact';
import { getUserProfile } from '@/app/actions';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Search, 
  User, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  ArrowLeft,
  XSquare,
  Paperclip
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

const SUPER_ADMIN_EMAIL = "va21070541@bachilleresdesonora.edu.mx";

export default function AdminMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
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

  // 1. Verify Admin Status
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    getUserProfile(session.user.id!).then((profile) => {
      if (profile?.isAdmin || session.user?.email === SUPER_ADMIN_EMAIL) {
        setIsAdmin(true);
        loadMessages();
      } else {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
      }
    }).catch(err => {
      console.error("Error verifying admin status:", err);
      setIsCheckingAdmin(false);
    });
  }, [session, status, router]);

  // 2. Fetch Messages from DB
  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const data = await getContactMessages();
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
        title: "Error al cargar mensajes",
        description: err.message || "No se pudieron obtener los mensajes del servidor.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
      setIsCheckingAdmin(false);
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
      await sendAdminReply(selectedMessageId, replyText, replyImage || undefined);
      setReplyText('');
      setReplyImage(null);
      
      // Reset attachment input if present
      const fileInput = document.getElementById('reply-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast({
        title: "Respuesta enviada",
        description: "El mensaje ha sido respondido correctamente.",
        className: "bg-green-500 text-white border-none",
      });
      // Reload messages to show new reply and status change
      await loadMessages();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al responder",
        description: err.message || "Ocurrió un error al enviar la respuesta.",
        variant: "destructive"
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  // 4. Update Status Handler
  const handleUpdateStatus = async (statusVal: 'pending' | 'in_progress' | 'resolved') => {
    if (!selectedMessageId) return;
    try {
      await updateMessageStatus(selectedMessageId, statusVal);
      toast({
        title: "Estado actualizado",
        description: `El estado del chat ha cambiado a "${
          statusVal === 'pending' ? 'Pendiente' : statusVal === 'in_progress' ? 'En Proceso' : 'Resuelto'
        }".`,
        className: "bg-blue-500 text-white border-none",
      });
      await loadMessages();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al actualizar estado",
        description: err.message || "No se pudo actualizar el estado.",
        variant: "destructive"
      });
    }
  };

  // 5. Terminar Chat Handler (marks as resolved)
  const handleEndChat = async () => {
    if (!selectedMessageId) return;
    try {
      await updateMessageStatus(selectedMessageId, 'resolved');
      toast({
        title: "Chat terminado",
        description: "El chat ha sido marcado como Resuelto.",
        className: "bg-green-600 text-white border-none",
      });
      await loadMessages();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al terminar el chat",
        description: err.message || "No se pudo cerrar el chat.",
        variant: "destructive"
      });
    }
  };

  // 6. Delete Chat Handler
  const handleDeleteChat = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este chat? Se borrarán permanentemente el mensaje y todas sus respuestas.")) return;
    try {
      await deleteContactMessage(id);
      toast({
        title: "Chat eliminado",
        description: "El chat se eliminó correctamente.",
        className: "bg-amber-600 text-white border-none",
      });
      setSelectedMessageId(null);
      setShowMobileChat(false);
      await loadMessages();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al eliminar",
        description: err.message || "No se pudo eliminar el chat.",
        variant: "destructive"
      });
    }
  };

  // Filtering Logic
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  if (status === 'loading' || isCheckingAdmin) {
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

  if (!isAdmin) {
    return (
      <div className="container py-20 text-center flex flex-col justify-center items-center">
        <h1 className="font-headline text-3xl">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">No tienes permisos para ver esta página de administración.</p>
        <Button onClick={() => router.push('/')} className="mt-6">Volver al Inicio</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Mensajes de Soporte
          </h1>
          <p className="text-muted-foreground">
            Bandeja de soporte en tiempo real. Gestiona y responde las consultas de tus usuarios.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver al Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border rounded-xl overflow-hidden h-[750px] bg-card shadow-2xl relative">
        
        {/* LEFT COLUMN: WhatsApp List (6 cols in medium, 4 cols in large, or hidden on mobile if chat is open) */}
        <div className={`col-span-1 md:col-span-4 border-r flex flex-col h-full bg-background/50 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Header with Search */}
          <div className="p-4 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar remitente, asunto..."
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
            {isLoadingMessages ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto opacity-50" />
                <p className="text-sm">No se encontraron mensajes.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedMessageId;
                const lastItemText = msg.replies.length > 0 
                  ? `Tú: ${msg.replies[msg.replies.length - 1].content}` 
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
                      <span className="font-bold text-sm truncate">{msg.name}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(msg.createdAt, { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate text-foreground/80">{msg.subject}</span>
                      {getStatusBadge(msg.status)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 truncate">
                      {lastItemText}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat Box (8 cols in medium, 8 cols in large, or full width on mobile if chat is open) */}
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
                    {activeMessage.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm md:text-base truncate">{activeMessage.name}</h2>
                      <span className="hidden sm:inline-block">{getStatusBadge(activeMessage.status)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {activeMessage.email}
                    </p>
                  </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Status Dropdown/Selector */}
                  <select
                    value={activeMessage.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    className="text-xs bg-background border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Proceso</option>
                    <option value="resolved">Resuelto</option>
                  </select>

                  {/* End Chat Button */}
                  {activeMessage.status !== 'resolved' && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={handleEndChat}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Terminar Chat</span>
                    </Button>
                  )}

                  {/* Delete Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteChat(activeMessage.id)}
                    title="Eliminar Chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/40">
                {/* Subject banner */}
                <div className="flex justify-center my-2">
                  <div className="bg-background border rounded-lg px-3 py-1.5 text-xs text-muted-foreground max-w-md text-center shadow-sm">
                    <span className="font-semibold text-foreground">Asunto:</span> {activeMessage.subject}
                  </div>
                </div>

                {/* Original User Message (Left Aligned) */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[70%] bg-background border rounded-2xl rounded-tl-none p-3 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <User className="h-3.5 w-3.5" />
                      {activeMessage.name}
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-muted text-muted-foreground border-none">
                        Usuario
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {activeMessage.message}
                    </p>
                    {activeMessage.image && (
                      <div className="mt-2 rounded-lg overflow-hidden border max-w-xs cursor-zoom-in">
                        <img 
                          src={activeMessage.image} 
                          alt="Adjunto" 
                          className="w-full h-auto object-cover max-h-60 hover:opacity-90 transition-opacity" 
                          onClick={() => window.open(activeMessage.image!, '_blank')}
                        />
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground text-right">
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
                  const cleanSenderName = reply.senderName.includes('@') ? reply.senderName.split('@')[0] : reply.senderName;
                  
                  return (
                    <div key={reply.id} className={cn("flex", isReplyFromUser ? "justify-start" : "justify-end")}>
                      <div className={cn(
                        "max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md space-y-1",
                        isReplyFromUser 
                          ? "bg-background border text-foreground rounded-tl-none" 
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      )}>
                        <div className="text-xs font-bold flex items-center justify-between gap-4 opacity-90">
                          <span>{cleanSenderName}</span>
                          <Badge className={cn(
                            "text-[9px] px-1 py-0 h-4 border-none",
                            isReplyFromUser 
                              ? "bg-muted text-muted-foreground hover:bg-muted/80" 
                              : "bg-white/20 text-white hover:bg-white/30"
                          )}>
                            {isReplyFromUser ? "Usuario" : "Soporte"}
                          </Badge>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {reply.content}
                        </p>
                        {reply.image && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-white/20 max-w-xs cursor-zoom-in">
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
                          isReplyFromUser ? "text-muted-foreground" : "text-primary-foreground/75"
                        )}>
                          {new Date(reply.createdAt).toLocaleString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short'
                          })}
                          {!isReplyFromUser && <Check className="h-3 w-3" />}
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
                      Este chat está marcado como <strong>Resuelto</strong>. Enviar una respuesta cambiará el estado automáticamente a <strong>En Proceso</strong>.
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
                      placeholder="Escribe una respuesta para el usuario..."
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
              <h3 className="text-xl font-headline font-bold text-foreground">Soporte PizzApp</h3>
              <p className="text-sm max-w-sm mt-2">
                Selecciona una conversación del listado izquierdo para ver los detalles del mensaje y responder al usuario.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
