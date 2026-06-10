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

    // 2. PROJECT KNOWLEDGE BASE (18 structured entries mapped for total project context)
    const knowledgeBase = [
      {
        id: 'greetings',
        keywords: ['hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'que tal', 'quien eres', 'quién eres', 'ayudame', 'ayúdame', 'pizzi'],
        response: "¡Hola! 🍕 Qué alegría saludarte. Soy **Pizzi**, tu asistente y guía oficial en **PizzApp**.\n\n" +
                  "¡Estoy aquí para ayudarte de forma súper directa y entusiasta a encontrar las mejores pizzas, consultar menús y navegar por la aplicación! Puedes preguntarme lo que quieras, como por ejemplo:\n" +
                  "• *'¿Qué pizzerías me recomiendas?'*\n" +
                  "• *'¿Cuál es el menú de Mexy?'*\n" +
                  "• *'¿Cómo llegar a Roy\\'s Pizza?'*\n\n" +
                  "¡O explora tú mismo navegando directamente en el [Mapa de Pizzerías](/) o en la sección de [Preguntas Frecuentes](/faq)!"
      },
      {
        id: 'registration',
        keywords: ['necesito registrarme', 'necesito registrar', 'obligatorio registrarse', 'para que registrarse', 'crear cuenta', 'registro', 'cuenta', 'registrarse', 'login', 'iniciar sesion', 'iniciar sesión', 'sesion', 'sesión'],
        response: "¡No es obligatorio registrarse! Puedes explorar el [Mapa Interactivo (Inicio)](/) de pizzerías, ver sus menús y leer las opiniones de la comunidad de forma totalmente libre como invitado.\n\n" +
                  "Sin embargo, si deseas **guardar tus pizzerías favoritas**, **calificar locales con estrellas** o **escribir reseñas**, sí necesitarás ingresar con una cuenta. ¡Puedes hacerlo en 10 segundos con tu correo electrónico o pulsando **Inicio Anónimo** en la página de [Iniciar Sesión](/login)!"
      },
      {
        id: 'contact',
        keywords: ['contacto', 'contactarlos', 'contactar', 'correo', 'email', 'sugerir pizzería', 'sugerir pizzerias', 'sugerir', 'reportar', 'mensaje', 'formulario', 'telefono soporte', 'teléfono soporte', 'ayuda soporte'],
        response: "¡Nos encantaría escucharte! Si tienes dudas, sugerencias de nuevos locales o deseas reportar información incorrecta, ve directamente a nuestra página de [Contacto](/contact).\n\n" +
                  "Allí encontrarás un sencillo formulario donde solo debes ingresar tu nombre, correo, asunto y mensaje, ¡y nuestro equipo te responderá a la brevedad! ✉️"
      },
      {
        id: 'pizzerias_list',
        keywords: ['pizzerias', 'pizzerías', 'locales', 'lista', 'sitios', 'restaurantes', 'donde comer', 'dónde comer', 'cuales hay', 'cuales son', 'recomienda pizzerias', 'recomienda'],
        response: pizzerias.length > 0 
          ? `¡Por supuesto! Aquí tienes las opciones disponibles en PizzApp:\n\n` +
            pizzerias.map(p => {
              const ratingText = p.rating > 0 ? `★ ${p.rating.toFixed(1)}` : 'Sin calificación';
              return `• 🍕 **${p.name}** - ${p.address || 'Hermosillo'} (${ratingText})`;
            }).join('\n') + 
            `\n\n¿Quieres conocer el menú, dirección o detalles de alguna de ellas? ¡Escribe su nombre!`
          : "¡En Hermosillo tenemos excelentes opciones! Aquí tienes las favoritas de la comunidad:\n\n" +
            "• 🍕 **Roy's Pizza** (San Benito) - Increíble sabor artesanal local.\n" +
            "• 🍕 **Pizzería La Cobacha** (Las Palmas) - Excelente ambiente rústico y a la leña.\n" +
            "• 🍕 **La Nona Pizza & Pasta** (Santa Fe) - El sabor italiano tradicional más puro.\n" +
            "• 🍕 **Sargento Pimienta** (Valle Verde) - Una de las preferidas de la comunidad.\n" +
            "• 🍕 **Boston's Pizza** (Prados del Centenario) - Familiar, con menús súper variados.\n" +
            "• 🍕 **Papa John's** (Colosio) e **Yarda's Pizza** (La Encantada) - Sabor e ingredientes de calidad.\n" +
            "• 🍕 **Little Caesars** y **Domino's Pizza** (Blvd. Solidaridad) - Calientes y listas en minutos.\n\n" +
            "¿Quieres conocer la dirección o detalles de alguna de ellas en específico? ¡Dime su nombre!"
      },
      {
        id: 'menu_list',
        keywords: ['menu', 'menú', 'carta', 'platillos', 'venden', 'precio', 'precios', 'comer', 'productos', 'bebida', 'bebidas'],
        response: "¡Claro que sí! Para ver el menú y los precios de cualquier pizzería de forma interactiva, simplemente haz clic en el botón **Ver menú** en su tarjeta correspondiente dentro de la sección de [Explorar Pizzerías](/#explorar).\n\n" +
                  "Si quieres que te muestre los precios de alguna pizzería aquí mismo, dime su nombre (por ejemplo: *'menú de Mexy'* o *'carta de Domino\\'s Pizza'*)."
      },
      {
        id: 'map_gps',
        keywords: ['mapa', 'gps', 'ubicacion', 'ubicación', 'como llegar', 'cómo llegar', 'leaflet', 'ruta', 'coordenadas', 'dms', 'decimales', 'dirección', 'direccion', 'llegar'],
        response: "🗺️ ¡Nuestro **Mapa Interactivo** te guiará sin perderte!\n\n" +
                  "Está ubicado al inicio de la página de [Inicio (PizzApp)](/). Funciona de la siguiente manera:\n" +
                  "• **Marcadores GPS**: Muestran la ubicación exacta de cada pizzería en Hermosillo.\n" +
                  "• **Botón Cómo Llegar**: Al seleccionar cualquier pizzería, presiona el botón *Cómo llegar* y el mapa trazará una línea de ruta dinámica y óptima en tiempo real desde tu ubicación actual.\n" +
                  "• **Barra de Búsqueda**: Te permite buscar por nombre, dirección o colonia de forma inteligente."
      },
      {
        id: 'reviews',
        keywords: ['reseña', 'reseñas', 'comentario', 'comentarios', 'estrella', 'estrellas', 'calificar', 'valorar', 'opinar', 'opinion', 'opinión', 'opiniones'],
        response: "⭐ ¡Queremos conocer tu experiencia! Para calificar una pizzería con estrellas (del 1 al 5) y dejar tus comentarios, ve a la sección de [Explorar Pizzerías](/#explorar), selecciona el local y haz clic en **Calificar**.\n\n" +
                  "Si deseas opinar en general sobre el diseño o funcionamiento de PizzApp, puedes hacerlo en la [Sección de Testimonios](/#testimonials) haciendo clic en *Deja tu propia opinión*. Recuerda que debes [Iniciar Sesión](/login) para poder publicar."
      },
      {
        id: 'commissions',
        keywords: ['comision', 'comisión', 'comisiones', 'cobran', 'pedido', 'pedidos', 'delivery', 'comida a domicilio', 'costo', 'gratis', 'comprar', 'venta'],
        response: "❌ **¡PizzApp no cobra ninguna comisión ni procesa pedidos!**\n\n" +
                  "Nuestra aplicación es una guía 100% gratuita y comunitaria. Te conectamos directamente con los teléfonos, redes sociales y ubicaciones de los locales para que ordenes con ellos sin intermediarios ni costos extra."
      },
      {
        id: 'faq_page',
        keywords: ['faq', 'preguntas', 'pregunta', 'dudas', 'preguntas frecuentes'],
        response: "¡Tenemos una sección completa dedicada a responder tus dudas al instante! Visita nuestra página de [Preguntas Frecuentes](/faq), donde organizamos por categorías las preguntas más comunes sobre el uso de la aplicación, mapa, datos y soporte."
      },
      {
        id: 'help_center',
        keywords: ['ayuda', 'soporte', 'centro de ayuda', 'recursos', 'documentacion', 'documentación', 'manual'],
        response: "¡Claro! En nuestro [Centro de Ayuda](/help) encontrarás tarjetas informativas que te dirigen a [Preguntas Frecuentes](/faq), la página de [Contacto](/contact) y recursos técnicos adicionales como la documentación de la API de OpenStreetMap y Leaflet."
      },
      {
        id: 'privacy',
        keywords: ['privacidad', 'datos', 'seguridad', 'correo', 'contraseña', 'guardan', 'comparten'],
        response: "🔒 En PizzApp nos tomamos muy en serio tu privacidad. Solo solicitamos tu correo para la autenticación y control de reseñas. No compartimos ningún dato personal con terceros. Puedes leer más detalles en nuestra [Política de Privacidad](/privacy)."
      },
      {
        id: 'terms',
        keywords: ['terminos', 'términos', 'condiciones', 'reglas', 'politicas', 'políticas', 'uso'],
        response: "📜 El uso de la plataforma está regido por nuestras pautas de convivencia comunitaria. No se permiten comentarios ofensivos o falsos. Puedes leer los detalles completos en nuestros [Términos de Uso](/terms)."
      },
      {
        id: 'theme_mode',
        keywords: ['oscuro', 'claro', 'tema', 'color', 'colores', 'modo oscuro', 'modo claro', 'pantalla', 'fondo'],
        response: "🌓 **¡PizzApp cuenta con Modo Oscuro y Claro!**\n\n" +
                  "Para cambiar el tema visual de la aplicación, simplemente haz clic en el icono de Sol/Luna que se encuentra en la esquina superior derecha del menú de navegación."
      },
      {
        id: 'custom_cursor',
        keywords: ['cursor', 'puntero', 'raton', 'ratón', 'personalizado', 'icono mouse', 'mouse'],
        response: "🖱️ **¡Tenemos un puntero de pizza personalizado!**\n\n" +
                  "Si te gusta o prefieres el cursor clásico de tu navegador, puedes activarlo o desactivarlo haciendo clic en el icono del puntero que se encuentra en el menú superior de navegación."
      },
      {
        id: 'admin_tools',
        keywords: ['admin', 'administrador', 'panel de admin', 'ranking styler', 'styler', 'layout', 'grid', 'stack', 'otorgamiento', 'permisos', 'gestionar pizzerias', 'usuarios online', 'online', 'ranking', 'podio'],
        response: "🛠️ ¡El panel de administración te permite gestionar todo el contenido en caliente!\n\n" +
                  "Si eres administrador, puedes iniciar sesión e ir al [Panel de Administración](/admin) para registrar pizzerías y menús. También puedes usar el *Ranking Styler* en el [Ranking de Pizzerías](/#ranking) para ajustar la escala de las tarjetas en tiempo real, u otorgar permisos en la página de otorgamiento."
      },
      {
        id: 'image_upload',
        keywords: ['imagen', 'foto', 'subir', 'error', 'base64', 'serverless', 'netlify', 'cargar', 'archivo'],
        response: "📷 ¡Nuestra subida de imágenes es tolerante a fallos serverless!\n\n" +
                  "Procesamos todas las imágenes en memoria RAM transformándolas en formato **Base64** para guardarlas de manera permanente en la base de datos cloud de Neon PostgreSQL, evitando problemas de permisos en Netlify. Si eres admin, puedes subirlas en el [Panel de Administración](/admin)."
      },
      {
        id: 'info_source',
        keywords: ['de donde viene', 'de dónde viene', 'de donde sacan', 'de dónde sacan', 'proviene la informacion', 'proviene la información', 'fuente de datos', 'api overpass', 'osm', 'openstreetmap', 'osm', 'datos'],
        response: "¡Excelente pregunta! 🗺️ La información de las pizzerías es recopilada por nuestro equipo mediante herramientas colaborativas como **OpenStreetMap** (utilizando la API Overpass) y validada constantemente por la comunidad de PizzApp.\n\n" +
                  "Además, los dueños de los locales pueden sugerir cambios o añadir información en la página de [Contacto](/contact). Puedes leer más al respecto en el [Centro de Ayuda](/help)!"
      },
      {
        id: 'about_pizzapp',
        keywords: ['nosotros', 'mision', 'misión', 'pizzapp', 'creadores', 'de que trata', 'proyecto', 'app', 'aplicacion', 'aplicación'],
        response: "🍕 **¡PizzApp es la guía definitiva para los amantes de la pizza en Hermosillo!**\n\n" +
                  "Nació del deseo de conectar a la comunidad con los mejores locales tradicionales y artesanales, apoyando al comercio local y facilitando que encuentres tu rebanada ideal. ¡Conóncenos más en nuestra página de [Inicio (PizzApp)](/)!"
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
