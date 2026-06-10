'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, CornerDownLeft, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PizzaBotIcon } from '../icons/pizza-bot-icon';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { getAllPizzerias } from '@/app/actions';
import { getMenuItems } from '@/app/actions/menu';

type Message = {
  role: 'user' | 'model';
  content: { text: string }[];
};

// Custom lightweight inline Markdown renderer to JSX
function RenderFormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-sm">
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('* ');
        let lineContent = line;

        if (isBullet) {
          lineContent = trimmed.startsWith('•') 
            ? line.replace(/^\s*•\s*/, '') 
            : line.replace(/^\s*\*\s*/, '');
        }

        let parts: React.ReactNode[] = [];
        let remaining = lineContent;
        let key = 0;

        while (remaining.length > 0) {
          const boldIdx = remaining.indexOf('**');
          const linkIdx = remaining.indexOf('[');
          const italicIdx = remaining.indexOf('_');

          const indices = [
            { type: 'bold', index: boldIdx },
            { type: 'link', index: linkIdx },
            { type: 'italic', index: italicIdx }
          ].filter(item => item.index !== -1).sort((a, b) => a.index - b.index);

          if (indices.length === 0) {
            parts.push(<span key={key++}>{remaining}</span>);
            break;
          }

          const first = indices[0];

          if (first.index > 0) {
            parts.push(<span key={key++}>{remaining.substring(0, first.index)}</span>);
          }

          remaining = remaining.substring(first.index);

          if (first.type === 'bold') {
            const nextBoldIdx = remaining.indexOf('**', 2);
            if (nextBoldIdx !== -1) {
              const boldText = remaining.substring(2, nextBoldIdx);
              parts.push(<strong key={key++} className="font-bold text-foreground">{boldText}</strong>);
              remaining = remaining.substring(nextBoldIdx + 2);
            } else {
              parts.push(<span key={key++}>**</span>);
              remaining = remaining.substring(2);
            }
          } else if (first.type === 'italic') {
            const nextItalicIdx = remaining.indexOf('_', 1);
            if (nextItalicIdx !== -1) {
              const italicText = remaining.substring(1, nextItalicIdx);
              parts.push(<em key={key++} className="italic">{italicText}</em>);
              remaining = remaining.substring(nextItalicIdx + 1);
            } else {
              parts.push(<span key={key++}>_</span>);
              remaining = remaining.substring(1);
            }
          } else if (first.type === 'link') {
            const closingBracketIdx = remaining.indexOf(']');
            const openingParenthesisIdx = remaining.indexOf('(', closingBracketIdx);
            const closingParenthesisIdx = remaining.indexOf(')', openingParenthesisIdx);

            if (
              closingBracketIdx !== -1 && 
              openingParenthesisIdx === closingBracketIdx + 1 && 
              closingParenthesisIdx !== -1
            ) {
              const label = remaining.substring(1, closingBracketIdx);
              const url = remaining.substring(openingParenthesisIdx + 1, closingParenthesisIdx);

              if (url.startsWith('/')) {
                parts.push(
                  <Link 
                    key={key++} 
                    href={url} 
                    className="text-primary font-semibold underline hover:text-primary/80 transition-colors"
                  >
                    {label}
                  </Link>
                );
              } else {
                parts.push(
                  <a 
                    key={key++} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary font-semibold underline hover:text-primary/80 transition-colors"
                  >
                    {label}
                  </a>
                );
              }
              remaining = remaining.substring(closingParenthesisIdx + 1);
            } else {
              parts.push(<span key={key++}>[</span>);
              remaining = remaining.substring(1);
            }
          }
        }

        if (isBullet) {
          return (
            <div key={lineIndex} className="flex items-start gap-2 pl-2">
              <span className="text-primary select-none mt-1">•</span>
              <span className="flex-1 leading-relaxed">{parts}</span>
            </div>
          );
        }

        return (
          <p key={lineIndex} className="leading-relaxed min-h-[1rem]">
            {parts}
          </p>
        );
      })}
    </div>
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [pizzerias, setPizzerias] = useState<any[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  // Load real-time pizzerias from database on mount
  useEffect(() => {
    getAllPizzerias()
      .then(data => {
        setPizzerias(data || []);
      })
      .catch(err => {
        console.error("Error loading pizzerias in Pizzi brain:", err);
      });
  }, []);

  // Local expert NLP bot logic (100% serverless, zero API dependencies, dynamically queries DB)
  const getBotResponse = async (query: string): Promise<string> => {
    const lower = query.toLowerCase().trim();

    // 1. GREETINGS & INTRO
    if (
      lower.includes('hola') || 
      lower.includes('buenos días') || 
      lower.includes('buenos dias') || 
      lower.includes('buenas tardes') || 
      lower.includes('buenas noches') || 
      lower.includes('saludos') || 
      lower.includes('que tal') || 
      lower.includes('quien eres') || 
      lower.includes('quién eres')
    ) {
      return "¡Hola! 🍕 Soy **Pizzi**, tu compañero experto y guía en **PizzApp**.\n\n" +
             "¡Estoy aquí para ayudarte a encontrar la pizza perfecta y resolver cualquier duda que tengas de forma rápida y con mucho entusiasmo!\n\n" +
             "Dime, ¿qué te gustaría hacer hoy? Puedes preguntarme sobre:\n" +
             "• 🍕 **Recomendaciones**: Prueba escribiendo *'recomienda pizzerías'* o el nombre de alguna en especial.\n" +
             "• 📋 **Menús y Precios**: Prueba con *'menú de Mexy'* o *'carta de Dominos Pizza'*.\n" +
             "• 🗺️ **Ubicaciones y Rutas**: Escribe *'dónde está el mapa'* o *'cómo llegar'*.\n" +
             "• 💬 **Opiniones**: Pregúntame cómo calificar o escribir reseñas.\n\n" +
             "¡También puedes navegar directamente usando el [Mapa Interactivo (Inicio)](/) o resolver dudas en la sección de [Preguntas Frecuentes](/faq)!";
    }

    // 2. PIZZERIAS MATCHING (Exact, Fuzzy or Partial)
    let matchedPizzeria = pizzerias.find(p => lower.includes(p.name.toLowerCase()));
    
    if (!matchedPizzeria) {
      if (lower.includes('roy')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('roy'));
      else if (lower.includes('cobacha')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('cobacha'));
      else if (lower.includes('nona')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('nona'));
      else if (lower.includes('sargento') || lower.includes('pimienta')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('sargento') || p.name.toLowerCase().includes('pimienta'));
      else if (lower.includes('boston')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('boston'));
      else if (lower.includes('caesar') || lower.includes('little')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('caesar') || p.name.toLowerCase().includes('little'));
      else if (lower.includes('domino')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('domino'));
      else if (lower.includes('yarda')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('yarda'));
      else if (lower.includes('papa john')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('papa john'));
      else if (lower.includes('hut')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('hut'));
      else if (lower.includes('mexy')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('mexy'));
      else if (lower.includes('leña') || lower.includes('bugambilias')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('leña') || p.name.toLowerCase().includes('bugambilia') || p.name.toLowerCase().includes('luna'));
      else if (lower.includes('rin-tin-tin') || lower.includes('rintintin')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('rin'));
    }

    const isMenuQuery = lower.includes('menu') || lower.includes('menú') || lower.includes('carta') || lower.includes('platillo') || lower.includes('venden') || lower.includes('precio') || lower.includes('comer') || lower.includes('producto') || lower.includes('bebida');

    if (matchedPizzeria) {
      if (isMenuQuery) {
        try {
          const menuItems = await getMenuItems(matchedPizzeria.id);
          if (menuItems && menuItems.length > 0) {
            let menuText = `📋 **Menú de ${matchedPizzeria.name}**:\n`;
            
            // Group by category
            const categories: Record<string, any[]> = {};
            menuItems.forEach(item => {
              const cat = item.category || 'Especialidades / Otros';
              if (!categories[cat]) categories[cat] = [];
              categories[cat].push(item);
            });

            for (const cat in categories) {
              menuText += `\n🔸 **${cat}**:\n`;
              categories[cat].forEach(item => {
                menuText += `• **${item.name}** - $${item.price}\n`;
                if (item.description) menuText += `  _${item.description}_\n`;
              });
            }
            return menuText + `\n¡Todo se ve delicioso! ¿Te gustaría saber cómo llegar o llamarlos?`;
          } else {
            return `📋 **${matchedPizzeria.name}** aún no tiene platillos registrados en su menú.\n\nSi eres administrador, puedes agregar nuevos platillos ingresando al [Panel de Administración](/admin).`;
          }
        } catch (err) {
          console.error("Error loading menu items for Pizzi:", err);
          return `📋 No pude cargar el menú de **${matchedPizzeria.name}** en este momento, pero puedes consultarlo haciendo clic en el botón *Ver Menú* en su tarjeta dentro de la sección de [Explorar Pizzerías](/#explorar).`;
        }
      }

      // Show specific pizzeria details
      const ratingStars = matchedPizzeria.rating > 0 
        ? `${'★'.repeat(Math.round(matchedPizzeria.rating))}${'☆'.repeat(5 - Math.round(matchedPizzeria.rating))} (${matchedPizzeria.rating.toFixed(1)} / 5)` 
        : 'Aún sin calificaciones';

      return `🍕 **¡Excelente elección! Aquí tienes los detalles de ${matchedPizzeria.name}:**\n\n` +
             `• **Dirección**: ${matchedPizzeria.address || 'Ubicación central Hermosillo'}\n` +
             `• **Calificación**: ${ratingStars} (${matchedPizzeria.reviewCount || 0} opiniones)\n` +
             `• **Teléfono**: ${matchedPizzeria.phoneNumber || 'No disponible'}\n` +
             `• **Horario**: ${matchedPizzeria.schedule || 'Lunes a Domingo (horario habitual)'}\n` +
             `• **Sitio Web**: ${matchedPizzeria.website ? `[Visitar Web](${matchedPizzeria.website})` : 'No registrado'}\n` +
             `• **Redes**: ${matchedPizzeria.socialMedia || 'No registradas'}\n` +
             (matchedPizzeria.description ? `• **Descripción**: _${matchedPizzeria.description}_\n` : '') +
             `\n🗺️ Puedes localizar este lugar directamente en el [Mapa Interactivo (Inicio)](/) y presionar el botón **Cómo llegar** para obtener la ruta. ¡También puedes ver qué ofrecen consultando su **menú**!`;
    }

    // 3. PIZZERIAS LIST / RECOMMENDATIONS
    if (lower.includes('pizzerias') || lower.includes('pizzerías') || lower.includes('cuales hay') || lower.includes('cuales son') || lower.includes('lista') || lower.includes('locales') || lower.includes('recomienda') || lower.includes('sitios') || lower.includes('donde comer') || lower.includes('restaurantes')) {
      if (pizzerias.length > 0) {
        const listText = pizzerias.map(p => {
          const ratingText = p.rating > 0 ? `★ ${p.rating.toFixed(1)}` : 'Sin calificación';
          return `• 🍕 **${p.name}** - ${p.address || 'Hermosillo'} (${ratingText})`;
        }).join('\n');

        return `¡Claro que sí! Aquí tienes las opciones disponibles en PizzApp:\n\n` +
               listText + 
               `\n\n¿Quieres que te muestre el menú de alguna de ellas o cómo llegar? ¡Escribe su nombre!`;
      } else {
        return "¡Hermosillo tiene opciones increíbles para ti! Aquí tienes las favoritas de la comunidad:\n\n" +
               "• 🍕 **Roy's Pizza** (San Benito) - Increíble sabor artesanal local.\n" +
               "• 🍕 **Pizzería La Cobacha** (Las Palmas) - Excelente ambiente rústico a la leña.\n" +
               "• 🍕 **La Nona Pizza & Pasta** (Santa Fe) - El sabor italiano tradicional más puro.\n" +
               "• 🍕 **Sargento Pimienta** (Valle Verde) - Una de las preferidas de la comunidad.\n" +
               "• 🍕 **Boston's Pizza** (Prados del Centenario) - Familiar, con menús súper variados.\n" +
               "• 🍕 **Papa John's** (Colosio) e **Yarda's Pizza** (La Encantada) - Calidad y gran sabor.\n" +
               "• 🍕 **Little Caesars** y **Domino's Pizza** (Solidaridad) - Rápidas y calientes.\n\n" +
               "¿Te gustaría ver la ubicación o menú de alguna? ¡Dime cuál te llama la atención!";
      }
    }

    // 4. MAP & GPS DIRECTIONS (LEAFLET)
    if (lower.includes('mapa') || lower.includes('ubicación') || lower.includes('ubicacion') || lower.includes('donde') || lower.includes('dirección') || lower.includes('direccion') || lower.includes('llegar') || lower.includes('cómo llegar') || lower.includes('como llegar') || lower.includes('leaflet') || lower.includes('gps') || lower.includes('coordenadas')) {
      return "🗺️ **¡El Mapa Interactivo es genial!**\n\n" +
             "Está ubicado en la parte superior de nuestra página de [Inicio](/). Cuenta con:\n" +
             "• **Localización GPS**: Muestra todos los negocios exactos en la ciudad.\n" +
             "• **Ruta Dinámica**: Haz clic en la tarjeta de cualquier pizzería y presiona el botón **Cómo llegar** para que el mapa trace la mejor ruta desde tu ubicación actual.\n" +
             "• **Explorador**: Si prefieres un listado organizado por cercanía y filtros, deslízate hasta la sección de [Explorar Pizzerías](/#explorar).";
    }

    // 5. REVIEWS & RATINGS (STARS)
    if (lower.includes('reseña') || lower.includes('reseñas') || lower.includes('opinion') || lower.includes('opinión') || lower.includes('opiniones') || lower.includes('estrella') || lower.includes('estrellas') || lower.includes('calificar') || lower.includes('comentario') || lower.includes('valorar')) {
      return "⭐ **¡Tu opinión vale muchísimo para la comunidad!**\n\n" +
             "• **Reseñas de Pizzerías**: Ve a la sección de [Explorar Pizzerías](/#explorar), selecciona un local y pulsa el botón **Calificar**. Podrás calificar con estrellas y escribir un comentario.\n" +
             "• **Opinión de la App**: Si quieres dejar un comentario general sobre PizzApp, ve a la sección de [Testimonios](/#testimonials) y haz clic en *Deja tu propia opinión*.\n\n" +
             "*(Nota: Necesitas [Iniciar Sesión](/login) para poder publicar valoraciones y evitar spam)*";
    }

    // 6. ACCOUNTS & SESSIONS
    if (lower.includes('cuenta') || lower.includes('registro') || lower.includes('login') || lower.includes('iniciar sesión') || lower.includes('sesión') || lower.includes('anónimo') || lower.includes('anonimo') || lower.includes('password') || lower.includes('contraseña')) {
      return "🔑 **¡Unirse a PizzApp es muy fácil!**\n\n" +
             "Puedes ingresar a la página de [Iniciar Sesión](/login) para registrarte o entrar. Ofrecemos:\n" +
             "• **Registro Clásico**: Crea tu cuenta con tu correo electrónico y contraseña.\n" +
             "• **Inicio Anónimo**: Entra al instante sin correos ni contraseñas para guardar tus pizzerías favoritas y probar la app de inmediato.\n\n" +
             "¡Una vez dentro, podrás valorar locales y dejar reseñas sobre tu experiencia!";
    }

    // 7. LAYOUT STYLER & ADMIN TOOLS
    if (
      lower.includes('admin') || 
      lower.includes('administrador') || 
      lower.includes('gestionar') || 
      lower.includes('styler') || 
      lower.includes('layout') || 
      lower.includes('ranking') || 
      lower.includes('estilo') || 
      lower.includes('diseño') ||
      lower.includes('diseno')
    ) {
      return "🛠️ **¡Herramientas de Administración Visual!**\n\n" +
             "Si tienes permisos de administrador, al iniciar sesión verás accesos especiales:\n" +
             "• **Panel de Admin**: Entra al [Panel de Administración](/admin) para registrar nuevos locales, editar coordenadas, números de teléfono o subir imágenes.\n" +
             "• **Ranking**: Personaliza el podio de las pizzerías más populares en la sección de [Ranking de Pizzerías](/#ranking).\n" +
             "• **Styler**: Modifica en caliente la escala de tarjetas y el diseño visual de la interfaz.";
    }

    // 8. FAQ & SUPPORT
    if (lower.includes('ayuda') || lower.includes('soporte') || lower.includes('contacto') || lower.includes('sugerir') || lower.includes('reportar') || lower.includes('faq')) {
      return "✉️ **¿Necesitas ayuda o quieres sugerir una pizzería?**\n\n" +
             "¡Estamos listos para escucharte! Puedes utilizar las siguientes vías:\n" +
             "• **Formulario de Contacto**: Escríbenos en la página de [Contacto](/contact) para reportar datos erróneos o sugerir nuevos locales.\n" +
             "• **Dudas comunes**: Revisa nuestra lista de respuestas en la página de [Preguntas Frecuentes](/faq).\n" +
             "• **Centro de Ayuda**: Encuentra documentación detallada en el [Centro de Ayuda](/help).";
    }

    // 9. GRATITUDE
    if (lower.includes('gracias') || lower.includes('agradezco') || lower.includes('excelente') || lower.includes('perfecto') || lower.includes('chido') || lower.includes('bueno') || lower.includes('super') || lower.includes('genial') || lower.includes('chilo') || lower.includes('chilo')) {
      return "¡De nada! 😄 Es un absoluto placer ayudarte a encontrar la mejor pizza. ¡Disfruta tu comida y recuerda que estoy aquí siempre para orientarte! 🍕✨";
    }

    // 10. GENERAL DETAILED FALLBACK
    return "🍕 **¡Hola! Soy Pizzi, tu asistente virtual de PizzApp.**\n\n" +
           "Estoy aquí para guiarte en tu búsqueda de pizzas en Hermosillo. Pregúntame sobre:\n\n" +
           "1. 🍕 **Pizzerías**: Encuentra locales recomendados (ej. *'Mexy'*, *'La Cobacha'*, *'Roy's'*).\n" +
           "2. 📋 **Menús**: Consulta platillos y precios (ej. *'menú de Mexy'*).\n" +
           "3. 🗺️ **Mapa y GPS**: Descubre cómo trazar tu ruta en el [Mapa Interactivo (Inicio)](/).\n" +
           "4. ⭐ **Opiniones**: Aprende a calificar en la sección de [Explorar Pizzerías](/#explorar).\n" +
           "5. 🔑 **Cuentas**: Inicia sesión o regístrate en [Iniciar Sesión](/login).\n" +
           "6. ✉️ **Contacto**: Sugiere locales o pide soporte en la página de [Contacto](/contact).";
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsThinking(true);

    setTimeout(async () => {
      try {
        const responseText = await getBotResponse(currentInput);
        const botMessage: Message = { role: 'model', content: [{ text: responseText }] };
        setMessages(prev => [...prev, botMessage]);
      } catch (err) {
        console.error("Error resolving bot message:", err);
        const botMessage: Message = { role: 'model', content: [{ text: "¡Ups! Ocurrió un inconveniente al consultar las pizzerías. Por favor, pregúntame de nuevo y con gusto te responderé. 🍕" }] };
        setMessages(prev => [...prev, botMessage]);
      } finally {
        setIsThinking(false);
      }
    }, 500);
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
                        msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none whitespace-pre-line' : 'bg-muted rounded-bl-none'
                      )}>
                        {msg.role === 'user' ? (
                          msg.content[0].text
                        ) : (
                          <RenderFormattedText text={msg.content[0].text} />
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isThinking && (
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
                  disabled={isThinking}
                />
                <Button type="submit" size="icon" disabled={isThinking}>
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
