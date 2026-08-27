'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, CornerDownLeft, X, Loader2, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PizzaBotIcon } from '../icons/pizza-bot-icon';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { getAllPizzerias } from '@/app/actions';
import { getMenuItems } from '@/app/actions/menu';
import { useSession } from 'next-auth/react';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementPositionRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const { data: session } = useSession();
  const user = session?.user;
  const [isAdmin, setIsAdmin] = useState(false);
  const [layoutSettings, setLayoutSettings] = useState<any>(null);
  const [showChatSettings, setShowChatSettings] = useState(false);

  useEffect(() => {
    if (user?.id) {
      import('@/app/actions').then(({ getUserProfile }) => {
        getUserProfile(user.id!).then((profile: any) => {
          setIsAdmin((user as any).isAdmin === true || profile?.isAdmin === true);
        });
      });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    import('@/app/actions').then(({ getLayoutSettings }) => {
      getLayoutSettings().then(setLayoutSettings);
    });
  }, []);

  const handleChatSettingChange = (key: string, val: number) => {
    setLayoutSettings((prev: any) => {
      if (!prev) return prev;
      return { ...prev, [key]: val };
    });
  };

  const saveChatSettings = async () => {
    try {
      const { updateLayoutSettings } = await import('@/app/actions');
      await updateLayoutSettings(layoutSettings);
      setShowChatSettings(false);
    } catch (err) {
      console.error("Failed to save chatbot settings:", err);
    }
  };

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

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('pizzi_custom_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const maxX = Math.max(16, window.innerWidth - 72);
          const maxY = Math.max(16, window.innerHeight - 72);
          setPosition({
            x: Math.min(Math.max(8, parsed.x), maxX),
            y: Math.min(Math.max(8, parsed.y), maxY)
          });
          return;
        }
      }
    } catch {}
    // Position at bottom-right initially, keeping room for bottom bars on mobile
    const defaultX = window.innerWidth - 80;
    const defaultY = window.innerHeight - 100;
    setPosition({ x: defaultX, y: defaultY });
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const handleResize = () => {
      setPosition(prev => {
        const maxX = Math.max(16, window.innerWidth - 72);
        const maxY = Math.max(16, window.innerHeight - 72);
        const newX = Math.min(Math.max(8, prev.x), maxX);
        const newY = Math.min(Math.max(8, prev.y), maxY);
        return { x: newX, y: newY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    
    // Prevent default touch behavior
    e.preventDefault();
    
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementPositionRef.current = { x: position.x, y: position.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }
    
    const targetX = elementPositionRef.current.x + dx;
    const targetY = elementPositionRef.current.y + dy;
    
    // Free dragging across the entire screen and map without snapping limitations
    const maxX = Math.max(8, window.innerWidth - 72);
    const maxY = Math.max(8, window.innerHeight - 72);
    const clampedX = Math.min(Math.max(8, targetX), maxX);
    const clampedY = Math.min(Math.max(8, targetY), maxY);
    
    setPosition({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    
    if (!hasMovedRef.current) {
      toggleChat();
    } else {
      // Free placement anywhere user drops Pizzi with persistent coordinate memory
      try {
        localStorage.setItem('pizzi_custom_pos', JSON.stringify({ x: position.x, y: position.y }));
      } catch {}
    }
  };

  const isChatOnLeft = isMounted && position.x < window.innerWidth / 2;

  // Local expert NLP bot logic (100% serverless, zero API dependencies, dynamically queries DB)
  const getBotResponse = async (query: string): Promise<string> => {
    const lower = query.toLowerCase().trim();

    // 0. CONTEXT CHECKING - Identify if the user is answering a previous question from Pizzi
    const lastModelMessage = messages.slice().reverse().find(m => m.role === 'model');
    const lastBotText = lastModelMessage ? lastModelMessage.content[0].text.toLowerCase() : '';

    if (lastBotText) {
      const isAffirmative = ['sí', 'si', 'claro', 'por favor', 'yes', 'va', 'dale'].some(w => {
        const regex = new RegExp(`\\b${w}\\b`, 'i');
        return regex.test(lower);
      });
      const isNegative = ['no', 'nada', 'ninguna', 'gracias', 'en nada', 'tampoco'].some(w => {
        const regex = new RegExp(`\\b${w}\\b`, 'i');
        return regex.test(lower);
      });

      if (lastBotText.includes('escribe su nombre') || lastBotText.includes('escribe el nombre')) {
        if (isAffirmative) {
          return "¡Excelente! Dime el nombre de la pizzería que buscas para darte sus detalles. 🍕";
        }
        if (isNegative) {
          return "Entendido. ¿Hay alguna otra cosa de PizzApp en la que te pueda ayudar hoy? 😊";
        }
      }

      if (lastBotText.includes('menú de alguna pizzería aquí mismo')) {
        if (isAffirmative) {
          return "¡Perfecto! Escribe el nombre de la pizzería (por ejemplo, *'Mexy'* o *'La Cobacha'*) para mostrarte el menú. 📋";
        }
        if (isNegative) {
          return "Entendido. Recuerda que puedes consultar los menús completos con el botón *'Ver menú'* en la sección de [Explorar Pizzerías](/#explorar) en cualquier momento. 😉";
        }
      }

      if (lastBotText.includes('¿cómo puedo ayudarte hoy?') || lastBotText.includes('¿en qué puedo ayudarte?')) {
        if (isNegative) {
          return "¡Entendido! Si en otro momento necesitas buscar una pizzería, trazar una ruta GPS o configurar tu perfil, estaré aquí para ayudarte. ¡Disfruta tu día! 🍕";
        }
      }
    }

    // Check if user is asking about the best rated pizzerias
    const isRatingQuery = [
      'mejor puntuacion', 'mejor puntuación',
      'mejor calificacion', 'mejor calificación',
      'mejor calificada', 'mejor calificado',
      'mejor valorada', 'mejor valorado',
      'mas estrellas', 'más estrellas',
      'puntuacion mas alta', 'puntuación más alta',
      'mejor pizzeria', 'mejor pizzería',
      'pizzerias mas valoradas', 'pizzerías más valoradas'
    ].some(phrase => lower.includes(phrase));

    if (isRatingQuery) {
      if (!pizzerias || pizzerias.length === 0) {
        return "🍕 Actualmente no tengo información de calificaciones de pizzerías en la base de datos de PizzApp. Por favor, intenta consultar de nuevo más tarde o revisa el [Mapa de Inicio](/) para ver las pizzerías registradas.";
      }

      // Sort pizzerias: rating desc, then reviewCount desc
      const sorted = [...pizzerias].sort((a, b) => {
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        const reviewsA = Number(a.reviewCount) || 0;
        const reviewsB = Number(b.reviewCount) || 0;
        return reviewsB - reviewsA;
      });

      const best = sorted[0];
      const bestRating = Number(best.rating) || 0;
      const bestStars = '★'.repeat(Math.round(bestRating)) + '☆'.repeat(5 - Math.round(bestRating));
      
      let responseText = `La pizzería con la mejor puntuación en PizzApp es **${best.name}** con una calificación de **${bestRating.toFixed(1)} / 5** ${bestStars} (${best.reviewCount || 0} opiniones).\n\n`;

      if (sorted.length > 1) {
        responseText += `Otras alternativas recomendadas en PizzApp son:\n`;
        const alternatives = sorted.slice(1, 3); // next 2
        alternatives.forEach((p) => {
          const pRating = Number(p.rating) || 0;
          const pStars = '★'.repeat(Math.round(pRating)) + '☆'.repeat(5 - Math.round(pRating));
          responseText += `• **${p.name}**: **${pRating.toFixed(1)} / 5** ${pStars} (${p.reviewCount || 0} opiniones) - _${p.address || 'Hermosillo'}_\n`;
        });
      }

      responseText += `\n🗺️ Puedes encontrar todas estas pizzerías en el [Mapa de Inicio](/) y trazar tu ruta haciendo clic en **Cómo llegar**. ¡Buen provecho! 🍕`;
      return responseText;
    }

    // 1. PIZZERIAS MATCHING (Exact, Fuzzy or Partial) - Check first
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
      else if (lower.includes('leña') || lower.includes('bugambilias') || lower.includes('media luna')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('leña') || p.name.toLowerCase().includes('bugambilia') || p.name.toLowerCase().includes('luna'));
      else if (lower.includes('rin-tin-tin') || lower.includes('rintintin') || lower.includes('rin tin')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('rin'));
      else if (lower.includes('gino')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('gino'));
      else if (lower.includes('oeste')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('oeste'));
      else if (lower.includes('time')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('time'));
      else if (lower.includes('anthony')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('anthony'));
      else if (lower.includes('mozzarella')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('mozzarella'));
      else if (lower.includes('delis')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('delis'));
      else if (lower.includes('express')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('express'));
      else if (lower.includes('alitas')) matchedPizzeria = pizzerias.find(p => p.name.toLowerCase().includes('alitas'));
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

    // 2. PROJECT KNOWLEDGE BASE (Enriched structured entries mapped for total project context)
    const knowledgeBase = [
      {
        id: 'greetings',
        keywords: ['hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'que tal', 'quién eres', 'quien eres', 'ayuda', 'pizzi', 'para que sirve', 'para qué sirve', 'de que trata', 'de qué trata'],
        response: "¡Hola! 🍕 Qué alegría saludarte. Soy **Pizzi**, tu asistente y guía virtual en **PizzApp**.\n\n" +
                  "Te puedo ayudar a encontrar locales de pizza, ver menús, trazar rutas en el mapa y configurar tu perfil o cuenta. ¿De qué te gustaría hablar hoy? Por ejemplo, puedes preguntarme:\n" +
                  "• 👤 **Cuentas y Perfiles**: *'¿Cómo funcionan las cuentas?'* o *'¿Cómo edito mi avatar?'*\n" +
                  "• 💬 **Opiniones y Comentarios**: *'¿Cómo calificar una pizzería?'* o *'¿Qué son los testimonios?'*\n" +
                  "• 🗺️ **Mapa e Interactividad**: *'¿Cómo trazar rutas con el GPS?'* o *'¿Cómo funciona el mapa?'*\n" +
                  "• 📖 **Nuestra Historia**: *'¿Cuál es el origen de PizzApp?'* o *'¿Quiénes lo fundaron?'*\n" +
                  "• 🛠️ **Administración y Tecnología**: *'¿Qué hace el panel de admin?'* o *'¿Cómo se guardan las fotos?'*\n\n" +
                  "¡O si lo prefieres, explora directamente navegando al [Mapa de Inicio](/) o leyendo las [Preguntas Frecuentes](/faq)!"
      },
      {
        id: 'our_history',
        keywords: ['nuestra historia', 'historia', 'como nacio', 'cómo nació', 'quienes son', 'quiénes son', 'quienes somos', 'quiénes somos', 'creadores', 'mision', 'misión', 'sobre nosotros', 'nosotros', 'acerca de', 'origen', 'fundadores', 'fundador', 'bachilleres', 'sonora', 'hermosillo'],
        response: "🍕 **Nuestra Historia y Filosofía Comunitaria:**\n\n" +
                  "PizzApp nació en **Hermosillo, Sonora**, de un profundo amor por la pizza tradicional y la gastronomía local. El proyecto fue concebido por un grupo de desarrolladores apasionados y estudiantes de **Bachilleres del Estado de Sonora** (cuyo contacto del superadministrador principal es `va21070541@bachilleresdesonora.edu.mx`).\n\n" +
                  "**¿Por qué creamos PizzApp?**\n" +
                  "• **Apoyo al Comercio Local**: Las plataformas de delivery comerciales cobran altas comisiones (a veces de hasta el 30%) que afectan gravemente a los pequeños pizzeros de Hermosillo. PizzApp es una herramienta **100% gratuita y sin fines de lucro**.\n" +
                  "• **Democratizar la Visibilidad**: Queremos que tanto un local artesanal con horno de leña en una colonia tradicional como las grandes cadenas tengan la misma oportunidad de ser descubiertos.\n" +
                  "• **Conectividad Real**: Proveemos información verídica, ubicaciones exactas y menús actualizados directamente del administrador del local, sin intermediarios.\n\n" +
                  "Si quieres conocer más de nuestro propósito, lee la pantalla de [Bienvenida](/?welcome=true) o dirígete a la sección dedicada [Sobre Nosotros](/about)."
      },
      {
        id: 'user_accounts',
        keywords: ['cuenta', 'cuentas', 'usuario', 'usuarios', 'perfil', 'registro', 'registrarme', 'registrarse', 'crear cuenta', 'login', 'iniciar sesion', 'iniciar sesión', 'sesion', 'sesión', 'roles', 'rol'],
        response: "🔑 **Sistema de Cuentas, Roles y Perfiles en PizzApp:**\n\n" +
                  "PizzApp cuenta con un robusto sistema de autenticación seguro (encriptación mediante `bcryptjs`) y control de roles almacenado en base de datos. Existen tres niveles de acceso:\n\n" +
                  "1. **Usuario Anónimo**: Si tienes prisa, puedes ingresar de inmediato desde la pantalla de [Iniciar Sesión](/login) pulsando *'Iniciar Sesión Anónima'*. Esto te permite explorar el mapa y calificar pizzerías sin ingresar datos personales.\n" +
                  "2. **Usuario Registrado**: Te registras con correo y contraseña. Puedes calificar de 1 a 5 estrellas, escribir reseñas de pizzerías, guardar tus favoritos y publicar testimonios generales sobre el sitio.\n" +
                  "3. **Administrador**: Tienen la insignia oficial de Admin. Pueden registrar y editar pizzerías, modificar platillos del menú, responder a comentarios oficiales y moderar opiniones.\n" +
                  "4. **Superadministrador**: El correo `va21070541@bachilleresdesonora.edu.mx` tiene el control absoluto de la plataforma, pudiendo promover o degradar administradores desde el panel `/admin/granting` y monitorizar la base de datos en tiempo real.\n\n" +
                  "**Ajustes de Perfil (Configuración):**\n" +
                  "Para abrir tus ajustes, inicia sesión, pulsa tu avatar arriba a la derecha y selecciona **Configuración** para abrir el panel emergente con tres pestañas: **Perfil**, **Cuenta** y **Acerca de**."
      },
      {
        id: 'delete_account',
        keywords: ['eliminar cuenta', 'borrar cuenta', 'elimino cuenta', 'borro cuenta', 'dar de baja', 'eliminar mi cuenta', 'borrar mi cuenta', 'quitar cuenta', 'desactivar cuenta'],
        response: "⚠️ **Cómo eliminar tu cuenta en PizzApp:**\n\n" +
                  "Lamentamos mucho que quieras dejarnos. Si deseas eliminar tu cuenta de forma permanente, sigue estos sencillos pasos:\n" +
                  "1. Asegúrate de haber **iniciado sesión** en tu cuenta.\n" +
                  "2. Haz clic sobre tu **avatar** (foto de perfil) en la esquina superior derecha del menú de navegación.\n" +
                  "3. Selecciona la opción **Configuración** en el menú desplegable.\n" +
                  "4. Ve a la pestaña **Cuenta** en el diálogo que aparece.\n" +
                  "5. Desplázate hacia abajo hasta la *Zona de Peligro* y presiona el botón **Eliminar Cuenta**.\n" +
                  "6. Confirma la acción en el cuadro de diálogo de advertencia.\n\n" +
                  "*(Nota: Esta acción es irreversible. Se eliminarán de forma permanente tu perfil, contraseña, favoritos y todos los comentarios o reseñas que hayas realizado)*"
      },
      {
        id: 'change_password',
        keywords: ['cambiar contraseña', 'cambiar password', 'cambiar clave', 'recuperar contraseña', 'modificar contraseña', 'actualizar contraseña', 'contraseña nueva', 'olvide mi contraseña', 'cambio mi contraseña'],
        response: "🔒 **Cómo cambiar tu contraseña en PizzApp:**\n\n" +
                  "Para cambiar tu contraseña de forma segura, sigue estos pasos:\n" +
                  "1. **Inicia sesión** en la aplicación.\n" +
                  "2. Haz clic en tu **avatar** (esquina superior derecha) y selecciona **Configuración**.\n" +
                  "3. Dirígete a la pestaña **Cuenta**.\n" +
                  "4. En la sección **Cambiar Contraseña**, introduce tu **Contraseña Actual** por motivos de seguridad.\n" +
                  "5. Escribe tu **Nueva Contraseña** y confírmala en el campo de abajo.\n" +
                  "6. Presiona el botón **Actualizar Contraseña**.\n\n" +
                  "¡Listo! Tu contraseña habrá sido actualizada de inmediato con cifrado seguro."
      },
      {
        id: 'change_avatar',
        keywords: ['cambiar avatar', 'cambiar foto', 'subir foto', 'cambiar imagen', 'poner foto', 'editar avatar', 'foto de perfil', 'imagen de perfil', 'avatar personalizado', 'elegir avatar'],
        response: "👤 **Cómo cambiar o subir tu foto de perfil (Avatar):**\n\n" +
                  "PizzApp te ofrece múltiples opciones para personalizar tu perfil visual:\n" +
                  "1. Abre el menú de tu **avatar** arriba a la derecha y selecciona **Configuración**.\n" +
                  "2. En la pestaña **Perfil**, verás tu avatar actual y un botón de cámara 📷.\n" +
                  "3. **Opciones disponibles**:\n" +
                  "   • **Subir Foto**: Presiona el icono de cámara o el botón *'Subir Foto'* para cargar un archivo desde tu dispositivo (máx. 5MB). Se convertirá a Base64 para guardarse de forma segura en PostgreSQL Neon.\n" +
                  "   • **Avatares Predeterminados**: Selecciona cualquiera de las **21 imágenes de avatares predeterminados** (como Felix, Aneka, Zoe, Rocky, Garfield, etc.).\n" +
                  "   • **Generar por Género**: Elige tu género (Masculino, Femenino u Otro) y escribe tu nombre para generar un avatar dinámico de Dicebear.\n" +
                  "4. Presiona **Actualizar Perfil y Avatar** para guardar los cambios."
      },
      {
        id: 'anonymous_session',
        keywords: ['sesion anonima', 'sesión anónima', 'usuario anonimo', 'usuario anónimo', 'entrar sin cuenta', 'probar app', 'invitado', 'entrar como invitado', 'login anonimo'],
        response: "🔑 **Inicio de Sesión Anónima en PizzApp:**\n\n" +
                  "¿Quieres probar la aplicación de inmediato sin registrarte? ¡PizzApp tiene la función de **Inicio Anónimo**!\n" +
                  "• **Cómo ingresar**: Ve a [Iniciar Sesión](/login) y presiona el botón **Iniciar Sesión Anónima**.\n" +
                  "• **Qué puedes hacer**: Podrás navegar por el mapa interactivo, ver los menús y lo más importante: **calificar pizzerías y dejar reseñas** usando una identidad temporal.\n" +
                  "• **Limitaciones**: Tu sesión es local. Si deseas que tus pizzerías favoritas y perfil se guarden permanentemente en múltiples dispositivos, te recomendamos crear una cuenta gratuita con tu correo."
      },
      {
        id: 'database_prisma',
        keywords: ['base de datos', 'postgresql', 'prisma', 'studio', 'neon', 'serverless', 'localhost:5555'],
        response: "💾 **Arquitectura de Base de Datos y Prisma:**\n\n" +
                  "PizzApp utiliza una base de datos **PostgreSQL** hospedada en la nube de **Neon**.\n" +
                  "• **ORM**: Nos conectamos mediante **Prisma ORM** para realizar consultas seguras e instantáneas desde Next.js Server Actions.\n" +
                  "• **Prisma Studio**: El superadministrador (`va21070541@bachilleresdesonora.edu.mx`) tiene un enlace en su menú desplegable de avatar para acceder a **Prisma Studio** en `http://localhost:5555` localmente y administrar todas las tablas de datos de manera visual."
      },
      {
        id: 'permissions',
        keywords: ['permisos', 'otorgamiento', 'conceder', 'hacer admin', 'superadmin', 'va21070541', 'permissions', 'eliminar admin', 'asignar', 'roles', 'degradar', 'promover', 'granting'],
        response: "🛡️ **Otorgamiento de Roles y Permisos (Superadministrador):**\n\n" +
                  "Los usuarios administradores en PizzApp pueden tener permisos granulares. El superadministrador principal de la plataforma tiene el correo `va21070541@bachilleresdesonora.edu.mx`.\n\n" +
                  "Este superadministrador cuenta con acceso exclusivo a la página de [Otorgamiento y Eliminación](/admin/granting) (disponible desde el menú desplegable de su avatar), la cual le permite buscar usuarios en la base de datos para:\n" +
                  "• Conceder o revocar privilegios de **Administrador**.\n" +
                  "• Asignar permisos específicos como `manage_pizzerias` (para gestionar locales) o `manage_content` (para moderar comentarios y testimonios)."
      },
      {
        id: 'comments_reviews',
        keywords: ['reseña', 'reseñas', 'comentarios', 'comentario', 'comentar', 'calificar', 'valorar', 'estrella', 'estrellas', 'puntos', 'opinion', 'opinión', 'opiniones', 'respuesta', 'responder comentario', 'testimonios', 'testimonio'],
        response: "⭐ **Calificaciones, Reseñas y Testimonios en PizzApp:**\n\n" +
                  "PizzApp ofrece dos maneras diferentes de dejar tu opinión para fomentar una comunidad transparente y de confianza:\n\n" +
                  "1. **Reseñas de Pizzerías**: \n" +
                  "   • **¿Cómo calificar?**: Ve a la sección [Explorar Pizzerías](/#explorar), selecciona el local que visitaste, presiona el botón **Calificar** en su tarjeta y completa el formulario (estrellas de 1 a 5 y opinión en texto).\n" +
                  "   • **Promedio Dinámico**: Cada vez que se envía una reseña, la calificación de estrellas promedio de la pizzería se recalcula de inmediato de forma automatizada.\n" +
                  "   • **Respuestas Oficiales**: Los administradores pueden responder oficialmente a las reseñas para agradecer o resolver dudas de los comensales.\n\n" +
                  "2. **Testimonios Generales**: \n" +
                  "   • **¿Cómo comentar?**: Se ubican al final de la página de [Inicio (PizzApp)](/#testimonials). Están dirigidos a dar retroalimentación sobre la aplicación en sí. Los administradores también pueden responderlos o eliminarlos desde el panel administrativo si infringen las reglas de uso.\n\n" +
                  "*(Nota: Debes [Iniciar Sesión](/login) o ingresar como usuario anónimo para poder comentar y así evitar el spam)*"
      },
      {
        id: 'sections_routes',
        keywords: ['secciones', 'paginas', 'páginas', 'rutas', 'inicio', 'faq', 'help', 'contact', 'about', 'donde ir', 'dónde ir', 'seccion', 'sección', 'pagina', 'página', 'enlaces', 'navegar', 'bienvenida', 'muro', 'nosotros'],
        response: "🗺️ **Estructura y Secciones Completas de PizzApp:**\n\n" +
                  "Puedes navegar fácilmente por la aplicación usando la barra superior o estos enlaces directos:\n\n" +
                  "• **Página de Inicio (`/`)**:\n" +
                  "  - **Splash Screen/Bienvenida** (`/?welcome=true`): Un saludo especial para comensales nuevos.\n" +
                  "  - **Mapa Interactivo**: Localiza pizzerías en Hermosillo y traza rutas con GPS.\n" +
                  "  - **Podio de Favoritos** (`/#ranking`): Muestra el Top 3 de pizzerías favoritas de la comunidad.\n" +
                  "  - **Explorar Pizzerías** (`/#explorar`): El catálogo completo con filtros y buscador.\n" +
                  "  - **Testimonios** (`/#testimonials`): Muro comunitario de opiniones sobre PizzApp.\n" +
                  "• **Nosotros y Filosofía (`/about`)**: Conoce por qué PizzApp es y siempre será 100% gratuita y sin comisiones.\n" +
                  "• **Preguntas Frecuentes (`/faq`)**: Listado completo y desplegable de respuestas a preguntas de los usuarios administrada por los editores de contenido.\n" +
                  "• **Centro de Soporte (`/help`)**: Recursos, guías de privacidad, términos de uso y enlaces técnicos.\n" +
                  "• **Contacto (`/contact`)**: Formulario para enviarnos mensajes de soporte o sugerencias de locales.\n" +
                  "• **Panel de Administración (`/admin`)**: Exclusivo para administradores, para gestionar pizzerías, menús y comentarios.\n" +
                  "• **Otorgamiento de Roles (`/admin/granting`)**: Exclusivo para el superadministrador, para conceder permisos."
      },
      {
        id: 'contact_info',
        keywords: ['contacto', 'contactarlos', 'contactar', 'correo', 'email', 'sugerir pizzería', 'sugerir pizzerias', 'sugerir', 'reportar', 'mensaje', 'formulario', 'telefono soporte', 'teléfono soporte', 'ayuda soporte'],
        response: "✉️ **Página de Contacto y Sugerencias de Locales:**\n\n" +
                  "Si quieres reportar datos incorrectos, pedir ayuda de soporte, o si eres dueño de una pizzería en Hermosillo y deseas aparecer de forma **100% gratuita** en nuestro mapa, ve a nuestra página de [Contacto](/contact).\n\n" +
                  "Allí encontrarás un sencillo formulario interactivo donde deberás ingresar tu nombre, correo electrónico, asunto y mensaje. ¡Nuestro equipo técnico revisará tu solicitud y te responderá a la brevedad!"
      },
      {
        id: 'pizzerias_list',
        keywords: ['pizzerias', 'pizzerías', 'locales', 'lista', 'sitios', 'restaurantes', 'donde comer', 'dónde comer', 'cuales hay', 'cuales son', 'recomienda pizzerias', 'recomienda'],
        response: pizzerias.length > 0 
          ? `🍕 **Pizzerías Registradas en PizzApp:**\n\n` +
            pizzerias.map(p => {
              const ratingText = p.rating > 0 ? `${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))} (${p.rating.toFixed(1)} / 5)` : 'Sin calificación';
              return `• **${p.name}** - _${p.address || 'Hermosillo'}_ (Calificación: ${ratingText})`;
            }).join('\n') + 
            `\n\n¿Quieres consultar la dirección exacta, teléfono o el menú de alguna de ellas? ¡Escribe su nombre!`
          : "🍕 **Pizzerías Favoritas de la Comunidad en Hermosillo:**\n\n" +
            "• **Roy's Pizza** (San Benito) - Sabor artesanal local inigualable.\n" +
            "• **Pizzería La Cobacha** (Las Palmas) - Excelente ambiente rústico con horno a la leña.\n" +
            "• **La Nona Pizza & Pasta** (Santa Fe) - Cocina italiana tradicional e ingredientes importados.\n" +
            "• **Sargento Pimienta** (Valle Verde) - Una de las favoritas de la comunidad para reunirse.\n" +
            "• **Boston's Pizza** (Prados del Centenario) - Restaurante bar familiar con menú internacional.\n" +
            "• **Yarda's Pizza** (La Encantada) y **Papa John's** (Colosio) - Ingredientes de calidad y excelente servicio.\n" +
            "• **Little Caesars** y **Domino's Pizza** (Blvd. Solidaridad) - Opción ideal para calientes y listas.\n\n" +
            "¿Quieres conocer detalles de alguna de ellas? ¡Escribe su nombre!"
      },
      {
        id: 'menu_info',
        keywords: ['menu', 'menú', 'carta', 'platillos', 'venden', 'precio', 'precios', 'comer', 'productos', 'bebida', 'bebidas', 'especialidad'],
        response: "📋 **Consulta de Menús e Ingredientes:**\n\n" +
                  "En PizzApp, cada pizzería cuenta con un menú digital interactivo. Para consultarlo:\n" +
                  "1. Ve a la sección [Explorar Pizzerías](/#explorar).\n" +
                  "2. Pulsa en el botón **Ver Menú** dentro de la tarjeta de la pizzería de tu elección.\n" +
                  "3. Se desplegará un desglose categorizado de sus pizzas, precios, descripciones e ingredientes especiales.\n\n" +
                  "Si quieres conocer el menú de alguna pizzería aquí mismo en el chat, solo pregúntame directamente, por ejemplo: *'¿Cuál es el menú de Roy\\'s Pizza?'* o *'menú de Mexy'*."
      },
      {
        id: 'map_gps',
        keywords: ['mapa', 'gps', 'ubicacion', 'ubicación', 'como llegar', 'cómo llegar', 'leaflet', 'ruta', 'coordenadas', 'decimales', 'dirección', 'direccion', 'llegar', 'distancia', 'openstreetmap', 'osm'],
        response: "🗺️ **Mapa Interactivo y Trazado de Rutas en Tiempo Real (GPS):**\n\n" +
                  "Nuestro mapa utiliza la tecnología de **Leaflet** y mapas abiertos de **OpenStreetMap** (recopilados con la API Overpass). Sus características principales son:\n\n" +
                  "• **Marcadores Personalizados**: Cada pizzería tiene un marcador visual con su logotipo o icono representativo.\n" +
                  "• **Buscador Inteligente**: Permite buscar pizzerías por nombre, dirección o colonia (ej. *'San Benito'* o *'Solidaridad'*).\n" +
                  "• **Cómo Llegar (Trazado de Rutas)**: Al seleccionar una pizzería en el mapa, puedes presionar el botón **Cómo llegar**. Si otorgas permisos de ubicación en tu navegador, el mapa trazará una línea de ruta dinámica óptima desde tu ubicación actual en tiempo real hasta el local.\n\n" +
                  "¡Pruébalo ahora en la sección del [Mapa en Inicio](/)!"
      },
      {
        id: 'commissions',
        keywords: ['comision', 'comisión', 'comisiones', 'cobran', 'pedido', 'pedidos', 'delivery', 'comida a domicilio', 'costo', 'gratis', 'comprar', 'venta', 'costos', 'precio extra', 'gratuita', 'intermediario'],
        response: "❌ **¡PizzApp no cobra comisiones ni gestiona pedidos directamente!**\n\n" +
                  "Queremos ser muy claros en esto: **nuestra aplicación es una guía comunitaria 100% gratuita**.\n" +
                  "• **Sin Intermediarios**: No cobramos tarifas de servicio ni comisiones a los usuarios ni a los dueños de las pizzerías.\n" +
                  "• **Contacto Directo**: Te facilitamos el teléfono y los enlaces a las redes de cada local para que pidas directamente con ellos, garantizando que el dinero vaya íntegro al negocio local y tú consigas el mejor precio posible."
      },
      {
        id: 'faq_page',
        keywords: ['faq', 'preguntas', 'pregunta', 'dudas', 'preguntas frecuentes', 'accordion', 'categoria', 'categorías'],
        response: "❓ **Sección de Preguntas Frecuentes (FAQ):**\n\n" +
                  "Visita nuestra página de [Preguntas Frecuentes](/faq), la cual cuenta con un acordeón dinámico interactivo con las dudas más recurrentes sobre el uso de PizzApp:\n" +
                  "• **Categorías**: Uso de la aplicación, datos y mapas, y soporte.\n" +
                  "• **Herramientas de Admin**: Si tienes rol de administrador, puedes añadir, editar o eliminar categorías y preguntas directamente en caliente en la misma interfaz de la página `/faq`."
      },
      {
        id: 'help_center',
        keywords: ['ayuda', 'soporte', 'centro de ayuda', 'recursos', 'documentacion', 'documentación', 'manual', 'ayudame'],
        response: "ℹ️ **Centro de Ayuda y Soporte Técnico:**\n\n" +
                  "En nuestro [Centro de Ayuda](/help) encontrarás tarjetas informativas que te dirigen a [Preguntas Frecuentes](/faq), la página de [Contacto](/contact) y recursos técnicos adicionales como la documentación de la API de OpenStreetMap y Leaflet."
      },
      {
        id: 'privacy',
        keywords: ['privacidad', 'datos', 'seguridad', 'correo', 'contraseña', 'guardan', 'comparten', 'politica', 'política'],
        response: "🔒 **Política de Privacidad y Seguridad:**\n\n" +
                  "Tu seguridad es muy importante para nosotros. En PizzApp:\n" +
                  "• **Datos de Registro**: Solo solicitamos tu correo para la autenticación y control de reseñas. Las contraseñas están protegidas con el algoritmo de hash `bcryptjs` de alta seguridad.\n" +
                  "• **Ubicación GPS**: La ubicación solo se procesa de forma local en tu navegador para trazar la ruta hacia la pizzería y **no se almacena** en ningún servidor.\n" +
                  "• **Eliminación**: Puedes borrar tu cuenta permanentemente desde la Configuración de tu Perfil, eliminando todos tus registros asociados. Puedes leer la política completa en [Política de Privacidad](/privacy)."
      },
      {
        id: 'terms',
        keywords: ['terminos', 'términos', 'condiciones', 'reglas', 'politicas', 'políticas', 'uso', 'abuso', 'spam'],
        response: "📜 **Términos de Uso y Convivencia:**\n\n" +
                  "Para garantizar que PizzApp sea un espacio útil y seguro para todos los hermosillenses, establecemos algunas pautas básicas en nuestros [Términos de Uso](/terms):\n" +
                  "• **Reseñas Honestas**: No se permiten opiniones falsas ni campañas de desprestigio.\n" +
                  "• **Respeto**: Está estrictamente prohibido usar lenguaje ofensivo, discriminatorio o spam en los comentarios o testimonios.\n" +
                  "• **Moderación**: Los administradores tienen la facultad de eliminar comentarios inapropiados y suspender cuentas de infractores."
      },
      {
        id: 'theme_mode',
        keywords: ['oscuro', 'claro', 'tema', 'color', 'colores', 'modo oscuro', 'modo claro', 'pantalla', 'fondo', 'sol', 'luna', 'visual'],
        response: "🌓 **Temas Visuales (Modo Claro y Modo Oscuro):**\n\n" +
                  "PizzApp incluye soporte nativo y fluido para temas claros y oscuros. Cambiar de tema es sumamente fácil:\n" +
                  "• En la esquina superior derecha de la barra de navegación, verás un icono de **Sol/Luna**.\n" +
                  "• Haz clic sobre él para alternar la paleta de colores. El sistema guardará tu preferencia automáticamente para tu próxima visita."
      },
      {
        id: 'custom_cursor',
        keywords: ['cursor', 'puntero', 'raton', 'ratón', 'personalizado', 'icono mouse', 'mouse', 'pizza cursor'],
        response: "🖱️ **Cursor Temático de Rebanada de Pizza:**\n\n" +
                  "¡Hemos agregado un cursor personalizado interactivo con forma de una deliciosa rebanada de pizza que sigue el puntero de tu ratón!\n\n" +
                  "**¿Cómo activarlo o desactivarlo?**\n" +
                  "• En el menú de navegación superior (en computadoras de escritorio) o en el menú desplegable, verás un icono de puntero de ratón.\n" +
                  "• Haz clic en él para encenderlo o apagarlo. Si prefieres el cursor clásico de tu sistema operativo, puedes desactivarlo y tu preferencia quedará registrada en el `localStorage` de tu navegador."
      },
      {
        id: 'admin_tools',
        keywords: ['admin', 'administrador', 'panel de admin', 'styler', 'layout', 'grid', 'stack', 'otorgamiento', 'permisos', 'gestionar pizzerias', 'usuarios online', 'online', 'ranking', 'podio', 'dashboard'],
        response: "🛠️ **Panel de Administración y Gestión en Caliente:**\n\n" +
                  "Si eres administrador, puedes iniciar sesión e ingresar al [Panel de Administración](/admin). Dependiendo de tus permisos asignados por el superadministrador, tendrás acceso a:\n" +
                  "• **Gestionar Pizzerías**: Registrar nuevos establecimientos especificando nombre, coordenadas lat/lng, dirección, teléfono, redes, horario, descripción y foto. Permite importar información geográfica directamente desde OpenStreetMap a través de la herramienta **OsmImporter**.\n" +
                  "• **Gestionar Menús**: Agregar, editar y clasificar por categorías los platillos y precios de cada local.\n" +
                  "• **Gestionar Opiniones de Pizzerías**: Responder de manera oficial a las opiniones de clientes o eliminar comentarios spam.\n" +
                  "• **Gestionar Testimonios**: Responder o eliminar las sugerencias generales sobre el sitio."
      },
      {
        id: 'image_upload',
        keywords: ['imagen', 'foto', 'subir', 'error', 'base64', 'serverless', 'netlify', 'cargar', 'archivo', 'avatar upload'],
        response: "📷 **Subida de Imágenes Tolerante a Fallos en Netlify:**\n\n" +
                  "El hosting en la nube serverless de Netlify posee un sistema de archivos de solo lectura y efímero, lo cual impide escribir archivos locales de manera convencional.\n\n" +
                  "**Nuestra Solución Técnica**:\n" +
                  "En PizzApp, convertimos las imágenes cargadas por el usuario o administradores en texto de formato **Base64** en memoria RAM. Luego, esta cadena Base64 se almacena directamente en la base de datos cloud PostgreSQL de Neon. Esto garantiza que las fotos de perfil de los usuarios y las imágenes de las pizzerías se carguen de manera 100% estable, rápida y persistente."
      },
      {
        id: 'live_monitors',
        keywords: ['usuarios online', 'heartbeat', 'online', 'activos', 'tiempo real', 'indicador', 'pulso', 'localizacion', 'localhost:5555', 'prisma studio'],
        response: "👥 **Monitoreo en Tiempo Real (Heartbeat y Prisma Studio):**\n\n" +
                  "• **Heartbeat (Pulso de Actividad)**: PizzApp actualiza periódicamente la última conexión de los usuarios activos. Si eres el superadministrador, verás un indicador de **Usuarios en línea** en la barra superior que se refresca cada 3 segundos, mostrando un popover flotante con el nombre, correo y avatar de todos los comensales navegando en vivo en ese instante.\n" +
                  "• **Prisma Studio**: El superadministrador dispone de un acceso directo en el avatar a la consola de base de datos local (`http://localhost:5555`) para inspeccionar o corregir tablas directamente a nivel técnico."
      },
      {
        id: 'ranking_styler',
        keywords: ['ranking styler', 'cardscale', 'buttonscale', 'buttonlayout', 'diseño podio', 'personalizar podio', 'apariencia podio', 'escala podio'],
        response: "📐 **Herramienta Ranking Styler para Administradores:**\n\n" +
                  "El **Ranking Styler** es un control visual exclusivo para administradores, integrado directamente en el [Ranking de Pizzerías](/#ranking) (podio del Top 3). Permite modificar la apariencia estética en caliente mediante configuraciones como:\n" +
                  "• **Escala de Tarjetas (`cardScale`)**: Modifica el tamaño físico de las tarjetas del podio.\n" +
                  "• **Escala de Botones (`buttonScale`)**: Modifica la dimensión de los botones de interacción.\n" +
                  "• **Diseño de Botones (`buttonLayout`)**: Cambia la distribución del menú de acciones entre una cuadrícula (`grid`) o una pila vertical (`stack`) en tiempo real."
      }
    ];

    // Find the best matching knowledge base entry based on keyword scoring
    let bestMatch: { id: string; score: number; response: string } | null = null;

    for (const entry of knowledgeBase) {
      let score = 0;
      for (const kw of entry.keywords) {
        if (lower.includes(kw)) {
          // Add score weighted by keyword length to prefer specific matches
          score += kw.length;
        }
      }
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: entry.id, score, response: entry.response };
      }
    }

    if (bestMatch && bestMatch.score > 2) {
      return bestMatch.response;
    }

    // 3. GENERAL DETAILED FALLBACK
    return "🍕 **¡Hola! Soy Pizzi, tu asistente virtual de PizzApp.**\n\n" +
           "No encontré una respuesta exacta para esa pregunta, pero estoy súper entusiasmado de ayudarte con cualquier duda sobre la aplicación. ¡Pregúntame directamente sobre:\n\n" +
           "• 🍕 **Nombres de pizzerías** (ej. *'Mexy'*, *'La Cobacha'*, *'Roy\\'s'*).\n" +
           "• 📋 **Ver sus menús** (ej. *'menú de Mexy'*).\n" +
           "• 🗺️ Cómo usar el [Mapa Interactivo (Inicio)](/) o trazar rutas con *'Cómo llegar'*.\n" +
           "• ⭐ Cómo publicar [Testimonios](/#testimonials) o calificar en [Explorar Pizzerías](/#explorar).\n" +
           "• 🔑 Cómo registrarse o iniciar sesión en [Iniciar Sesión](/login).\n" +
           "• ✉️ Cómo sugerir locales o pedir ayuda en la página de [Contacto](/contact).";
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

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }, 50);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed z-[1002] cursor-grab active:cursor-grabbing group select-none touch-none",
          isMounted ? "" : "bottom-24 md:bottom-6 right-6"
        )}
        style={isMounted ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Abrir chat de ayuda"
      >
        <div className={cn(
          "absolute top-1/2 w-auto -translate-y-1/2 bg-background border rounded-lg p-2 px-3 text-center shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 pointer-events-none",
          isChatOnLeft ? "left-full ml-4" : "right-full mr-4"
        )}>
          <p className="text-sm font-medium whitespace-nowrap">¿En qué puedo ayudarte?</p>
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-background border transform rotate-45 -z-10",
            isChatOnLeft ? "left-[-0.5rem] border-b border-l" : "right-[-0.5rem] border-t border-r"
          )}></div>
        </div>

        <button 
          className="relative h-16 w-16 rounded-full pointer-events-none" 
          aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        >
          <PizzaBotIcon className={cn("h-full w-full transform transition-transform duration-300", isOpen ? "rotate-12 scale-90" : "animate-wave-and-float")} />
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
              <X className="h-8 w-8 text-white" />
            </div>
          )}
        </button>
      </div>

      {isOpen && (
        <div 
          className={cn(
            "fixed bottom-44 md:bottom-28 w-full z-[1001] animate-fade-in-down chatbot-window-container",
            isChatOnLeft ? "left-6" : "right-6"
          )}
          style={{
            '--chatbot-width-desktop': `${layoutSettings?.chatbotWidth ?? 380}px`,
            '--chatbot-width-mobile': `${layoutSettings?.chatbotWidthMobile ?? 320}px`,
            '--chatbot-height-desktop': `${layoutSettings?.chatbotHeight ?? 500}px`,
            '--chatbot-height-mobile': `${layoutSettings?.chatbotHeightMobile ?? 450}px`,
            '--chatbot-scale-desktop': `${layoutSettings?.chatbotScale ?? 1.0}`,
            '--chatbot-scale-mobile': `${layoutSettings?.chatbotScaleMobile ?? 1.0}`,
            '--transform-origin-x': isChatOnLeft ? 'left' : 'right'
          } as React.CSSProperties}
        >
          <style jsx global>{`
            .chatbot-window-container {
              width: var(--chatbot-width-mobile, 320px) !important;
              transform: scale(var(--chatbot-scale-mobile, 1.0)) !important;
              transform-origin: bottom var(--transform-origin-x, right) !important;
            }
            .chatbot-card-element {
              height: var(--chatbot-height-mobile, 450px) !important;
            }
            @media (min-width: 768px) {
              .chatbot-window-container {
                width: var(--chatbot-width-desktop, 380px) !important;
                transform: scale(var(--chatbot-scale-desktop, 1.0)) !important;
                transform-origin: bottom var(--transform-origin-x, right) !important;
              }
              .chatbot-card-element {
                height: var(--chatbot-height-desktop, 500px) !important;
              }
            }
          `}</style>
          <Card className="flex flex-col shadow-2xl chatbot-card-element">
            <CardHeader className="flex-row items-center justify-between gap-3 py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10"><PizzaBotIcon /></div>
                <div>
                  <CardTitle className="font-headline text-lg md:text-xl">Pizzi, tu Asistente</CardTitle>
                  <p className="text-xs text-muted-foreground">¿Cómo puedo ayudarte hoy?</p>
                </div>
              </div>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowChatSettings(!showChatSettings)}
                  title="Configurar Tamaño del Chat"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {showChatSettings ? (
                <div className="absolute inset-0 bg-background/98 z-20 p-4 overflow-y-auto space-y-4 text-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-bold text-base text-primary">Ajustar Tamaño del Chat</h3>
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowChatSettings(false)}>Cerrar</Button>
                    </div>
                    
                    {/* Desktop Settings */}
                    <div className="space-y-3">
                      <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Vista Escritorio</div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Ancho</span>
                          <span>{layoutSettings?.chatbotWidth ?? 380}px</span>
                        </div>
                        <input 
                          type="range" min="250" max="1000" step="10"
                          value={layoutSettings?.chatbotWidth ?? 380}
                          onChange={(e) => handleChatSettingChange('chatbotWidth', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Alto</span>
                          <span>{layoutSettings?.chatbotHeight ?? 500}px</span>
                        </div>
                        <input 
                          type="range" min="300" max="1000" step="10"
                          value={layoutSettings?.chatbotHeight ?? 500}
                          onChange={(e) => handleChatSettingChange('chatbotHeight', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Escala</span>
                          <span>{layoutSettings?.chatbotScale ?? 1.0}x</span>
                        </div>
                        <input 
                          type="range" min="0.5" max="2.5" step="0.05"
                          value={layoutSettings?.chatbotScale ?? 1.0}
                          onChange={(e) => handleChatSettingChange('chatbotScale', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Mobile Settings */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Vista Móvil</div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Ancho Móvil</span>
                          <span>{layoutSettings?.chatbotWidthMobile ?? 320}px</span>
                        </div>
                        <input 
                          type="range" min="200" max="600" step="10"
                          value={layoutSettings?.chatbotWidthMobile ?? 320}
                          onChange={(e) => handleChatSettingChange('chatbotWidthMobile', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Alto Móvil</span>
                          <span>{layoutSettings?.chatbotHeightMobile ?? 450}px</span>
                        </div>
                        <input 
                          type="range" min="200" max="800" step="10"
                          value={layoutSettings?.chatbotHeightMobile ?? 450}
                          onChange={(e) => handleChatSettingChange('chatbotHeightMobile', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Escala Móvil</span>
                          <span>{layoutSettings?.chatbotScaleMobile ?? 1.0}x</span>
                        </div>
                        <input 
                          type="range" min="0.5" max="2.0" step="0.05"
                          value={layoutSettings?.chatbotScaleMobile ?? 1.0}
                          onChange={(e) => handleChatSettingChange('chatbotScaleMobile', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    size="sm"
                    onClick={saveChatSettings}
                  >
                    Guardar Ajustes
                  </Button>
                </div>
              ) : (
                <div 
                  className="h-full overflow-y-auto p-4 space-y-4" 
                  ref={scrollContainerRef}
                >
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
            )}
            </CardContent>
            <CardFooter className="border-t p-3 bg-background z-10 shadow-sm">
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
