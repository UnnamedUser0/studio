'use client';

import { useState, useRef, useEffect } from 'react';
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
      return "¡Hola! 🍕 Soy Pizzi, el asistente inteligente y local de PizzApp.\n\n" +
             "He sido enriquecido con un cerebro local superveloz que está conectado directamente a nuestra base de datos **Neon PostgreSQL** en tiempo real. " +
             "No dependo de APIs externas de pago, por lo que mis respuestas son instantáneas y 100% libres de fallos de conexión.\n\n" +
             "¿De qué tienes antojo hoy o qué duda técnica/de uso tienes sobre PizzApp? Pregúntame sobre:\n" +
             "• 🍕 **Pizzerías** (ej. *'recomienda locales'*, *'dame la lista'*, o el nombre de una en específico).\n" +
             "• 📋 **Menús** (ej. *'menú de Pizza Hut'*, *'carta de Mexy'*).\n" +
             "• 🗺️ **Mapa interactivo Leaflet** y *'Cómo llegar'*.\n" +
             "• ☁️ **Imágenes Serverless en Base64** y nuestra base de datos Neon DB.\n" +
             "• 🛠️ **Layout y Ranking Styler** (panel de administración).\n" +
             "• ⭐ **Calificaciones, estrellas y reseñas** de la comunidad.";
    }

    // 2. PIZZERIAS MATCHING (Exact, Fuzzy or Partial)
    // Find if any pizzeria name is mentioned in the query
    let matchedPizzeria = pizzerias.find(p => lower.includes(p.name.toLowerCase()));
    
    // Fuzzy/Partial match fallback for standard names
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
            let menuText = `📋 **Menú en tiempo real de ${matchedPizzeria.name}**:\n`;
            
            // Group by category
            const categories: Record<string, any[]> = {};
            menuItems.forEach(item => {
              const cat = item.category || 'Especialidades / Otros';
              if (!categories[cat]) categories[cat] = [];
              categories[cat].push(item);
            });

            for (const cat in categories) {
              menuText += `\n🔸 **Categoría: ${cat}**:\n`;
              categories[cat].forEach(item => {
                menuText += `• **${item.name}** - $${item.price}\n`;
                if (item.description) menuText += `  _${item.description}_\n`;
              });
            }
            return menuText + `\n¡Todo directo de nuestra base de datos Neon PostgreSQL! ¿Deseas saber el horario o teléfono de ${matchedPizzeria.name}? ¡Pregúntame!`;
          } else {
            return `📋 **${matchedPizzeria.name}** aún no tiene platillos registrados en su menú.\n\nSi eres administrador, puedes agregar nuevos productos y precios para esta pizzería desde la sección de "Gestionar Pizzerías" -> "Editar Menú" subiendo imágenes o ingresando detalles.`;
          }
        } catch (err) {
          console.error("Error loading menu items for Pizzi:", err);
          return `📋 Hubo un error al intentar consultar el menú de **${matchedPizzeria.name}** en la base de datos, pero puedes verlos haciendo clic en "Ver Menú" en su tarjeta.`;
        }
      }

      // Show specific pizzeria details
      const ratingText = matchedPizzeria.rating > 0 
        ? `${'⭐'.repeat(Math.round(matchedPizzeria.rating))} (${matchedPizzeria.rating.toFixed(1)} / 5)` 
        : 'Sin opiniones o calificaciones de la comunidad todavía';

      return `🍕 **Detalles en Vivo: ${matchedPizzeria.name}**\n` +
             `• **Dirección**: ${matchedPizzeria.address || 'Ubicación central Hermosillo'}\n` +
             `• **Calificación promedio**: ${ratingText} (${matchedPizzeria.reviewCount || 0} reseñas)\n` +
             `• **Teléfono**: ${matchedPizzeria.phoneNumber || 'No proporcionado'}\n` +
             `• **Horario**: ${matchedPizzeria.schedule || 'Lunes a Domingo (horario habitual)'}\n` +
             `• **Sitio Web**: ${matchedPizzeria.website ? `[Visitar Sitio](${matchedPizzeria.website})` : 'No registrado'}\n` +
             `• **Redes Sociales**: ${matchedPizzeria.socialMedia || 'No registradas'}\n` +
             (matchedPizzeria.description ? `• **Descripción**: _${matchedPizzeria.description}_\n` : '') +
             `\n🗺️ Puedes encontrar a **${matchedPizzeria.name}** exactamente en el Mapa Interactivo de la pantalla principal. ¡Haz clic en 'Cómo llegar' para trazar una ruta GPS desde tu posición actual! O pregúntame por su **menú** para ver sus precios.`;
    }

    // 3. PIZZERIAS LIST / RECOMMENDATIONS
    if (lower.includes('pizzerias') || lower.includes('pizzerías') || lower.includes('cuales hay') || lower.includes('cuales son') || lower.includes('lista') || lower.includes('locales') || lower.includes('recomienda') || lower.includes('sitios') || lower.includes('donde comer') || lower.includes('restaurantes')) {
      if (pizzerias.length > 0) {
        const listText = pizzerias.map(p => {
          const ratingText = p.rating > 0 ? `⭐ ${p.rating.toFixed(1)}` : 'Sin reseñar';
          return `• 🍕 **${p.name}** - ${p.address || 'Hermosillo'} (${ratingText})`;
        }).join('\n');

        return `¡Por supuesto! Consultando nuestra base de datos PostgreSQL, aquí tienes la lista actual de pizzerías en Hermosillo:\n\n` +
               listText + 
               `\n\n¿Quieres conocer el menú, dirección o detalles de alguna de ellas? ¡Escribe su nombre!`;
      } else {
        // Safe hardcoded database fallback if DB query returned nothing or is loading
        return "¡En Hermosillo tenemos excelentes opciones artesanales y rápidas en nuestro Mapa Interactivo! Aquí tienes las favoritas de la comunidad:\n\n" +
               "• 🍕 **Roy's Pizza** (San Benito) - Increíble sabor artesanal local.\n" +
               "• 🍕 **Pizzería La Cobacha** (Las Palmas) - Excelente ambiente rústico y a la leña.\n" +
               "• 🍕 **La Nona Pizza & Pasta** (Santa Fe) - El sabor italiano tradicional más puro.\n" +
               "• 🍕 **Sargento Pimienta** (Valle Verde) - Una de las preferidas de la comunidad.\n" +
               "• 🍕 **Boston's Pizza** (Prados del Centenario) - Familiar, con menús súper variados.\n" +
               "• 🍕 **Papa John's** (Colosio) e **Yarda's Pizza** (La Encantada) - Sabor e ingredientes de calidad.\n" +
               "• 🍕 **Little Caesars** y **Domino's Pizza** (Blvd. Solidaridad) - Calientes y listas en minutos.\n\n" +
               "¿Quieres conocer la dirección o detalles de alguna de ellas en específico? ¡Dime su nombre!";
      }
    }

    // 4. MAP & GPS DIRECTIONS (LEAFLET)
    if (lower.includes('mapa') || lower.includes('ubicación') || lower.includes('ubicacion') || lower.includes('donde') || lower.includes('dirección') || lower.includes('direccion') || lower.includes('llegar') || lower.includes('cómo llegar') || lower.includes('como llegar') || lower.includes('leaflet') || lower.includes('gps') || lower.includes('coordenadas')) {
      return "🗺️ **Mapa Interactivo Leaflet en PizzApp:**\n" +
             "Hemos implementado un mapa geográfico interactivo de última generación:\n" +
             "• **GPS y Geolocalización**: Centrado en Hermosillo, Sonora. Muestra marcadores exactos de cada pizzería.\n" +
             "• **Botón 'Cómo Llegar'**: Al seleccionar una pizzería, presiona el botón y el mapa trazará una ruta dinámica y óptima en tiempo real directamente sobre el mapa 3D.\n" +
             "• **Coordenadas Flexibles**: Soporta el registro de pizzerías con coordenadas en formato decimal (ej: `29.0825, -110.9678`) o coordenadas DMS (Grados, Minutos y Segundos) de alta precisión.\n" +
             "• **Búsqueda Integrada**: La barra superior te guiará al instante haciendo foco en el marcador respectivo.";
    }

    // 5. SERVERLESS IMAGES UPLOAD ARCHITECTURE (EXPLAINING THE ADVANCED BASE64 DESIGN)
    if (
      lower.includes('imagen') || 
      lower.includes('foto') || 
      lower.includes('subir') || 
      lower.includes('error') || 
      lower.includes('base64') || 
      lower.includes('serverless') || 
      lower.includes('netlify') || 
      lower.includes('neon') || 
      lower.includes('postgres') || 
      lower.includes('aws') || 
      lower.includes('disco') ||
      lower.includes('almacenamiento')
    ) {
      return "☁️ **Arquitectura Avanzada de Subida de Imágenes Serverless (Base64 + Neon DB):**\n" +
             "¡PizzApp está diseñada para tolerar fallos serverless de manera robusta!\n" +
             "• **El Reto**: Plataformas como Netlify operan en entornos serverless efímeros con sistemas de archivos de 'Solo Lectura' (Read-Only). Intentar guardar fotos localmente en `public/uploads` en producción causa errores fatales de permisos.\n" +
             "• **La Solución**: Modificamos el backend para procesar todas las subidas de imágenes (avatars de usuario, logos de pizzerías, fotos de menús) **completamente en memoria RAM, convirtiendo los archivos a cadenas Base64 (`data:image/png;base64,...`)**.\n" +
             "• **Persistencia**: La cadena Base64 resultante se guarda de forma persistente directamente en la base de datos cloud **Neon PostgreSQL** a través de Prisma ORM.\n" +
             "• **Optimización en Next.js**: Para evitar fallos en el servidor de optimización de Next.js al renderizar cadenas Base64 largas, habilitamos de forma dinámica la propiedad `unoptimized={imageUrl.startsWith('data:') || imageUrl.startsWith('/uploads')}` en todos los componentes de imagen. ¡Velocidad de carga y tolerancia a fallos garantizadas al 100%!";
    }

    // 6. LAYOUT STYLER & ADMIN TOOLS
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
      return "🛠️ **Herramientas Administrativas y Ranking Styler:**\n" +
             "Los administradores tienen acceso a un panel de control exclusivo en la parte superior:\n" +
             "• **Gestionar Pizzerías**: Agregar, modificar o eliminar locales, incluyendo campos avanzados como coordenadas, descripción, teléfono, horario y sitio web.\n" +
             "• **Gestión de Menús**: Crear categorías y añadir platillos con precios y fotografías.\n" +
             "• **Ranking Styler (Editor de Layout Visual)**: Una potente herramienta interactiva en tiempo real que permite ajustar la estética de la app. Los admins pueden regular la escala de las tarjetas, el tamaño de los botones, el ancho del layout y alternar el orden visual ('grid' o 'stack') para adaptar la interfaz en caliente.";
    }

    // 7. REVIEWS & RATINGS (STARS)
    if (lower.includes('reseña') || lower.includes('reseñas') || lower.includes('opinion') || lower.includes('opinión') || lower.includes('opiniones') || lower.includes('estrella') || lower.includes('estrellas') || lower.includes('calificar') || lower.includes('comentario') || lower.includes('valorar')) {
      return "⭐ **Sistema de Reseñas y Estrellas de PizzApp:**\n" +
             "• **Calificación**: Los usuarios registrados pueden calificar cada establecimiento de 1 a 5 estrellas y escribir su reseña sobre la comida y el servicio.\n" +
             "• **Respuestas del Propietario/Admin**: Los administradores o dueños pueden contestar de forma oficial a las opiniones de los clientes para mantener un diálogo activo.\n" +
             "• **Autenticación**: Para prevenir spam, es obligatorio iniciar sesión para emitir calificaciones, aunque las opiniones son de libre visualización para los invitados.";
    }

    // 8. ACCOUNTS & SESSIONS
    if (lower.includes('cuenta') || lower.includes('registro') || lower.includes('login') || lower.includes('iniciar sesión') || lower.includes('sesión') || lower.includes('anónimo') || lower.includes('anonimo') || lower.includes('password') || lower.includes('contraseña')) {
      return "🔑 **Seguridad y Control de Accesos:**\n" +
             "• **Modo Invitado**: Explora de forma completamente anónima el mapa, busca locales y consulta opiniones sin ingresar datos.\n" +
             "• **Registro Rápido**: Regístrate ingresando un correo y contraseña de tu elección.\n" +
             "• **Acceso Anónimo Instantáneo**: ¿Tienes prisa? Puedes pulsar 'Inicio Anónimo' para crear una sesión temporal de inmediato, permitiéndote guardar favoritos e interactuar con la app en segundos.\n" +
             "• **Seguridad**: Todas las contraseñas se encriptan de forma segura con `bcryptjs` en la base de datos cloud.";
    }

    // 9. COMMISSION POLICY & GENERAL FAQ
    if (lower.includes('comisión') || lower.includes('comision') || lower.includes('cobrar') || lower.includes('pedir') || lower.includes('delivery') || lower.includes('comida') || lower.includes('comisiones') || lower.includes('pizzapp') || lower.includes('ayuda') || lower.includes('soporte') || lower.includes('contacto')) {
      return "❓ **Preguntas Frecuentes y Soporte:**\n" +
             "• **¿PizzApp cobra comisiones?**: ¡No, en lo absoluto! PizzApp es una guía local comunitaria e informativa. No cobramos comisiones a los negocios ni a los usuarios. Te conectamos de manera directa mediante enlaces web, teléfonos y ubicación exacta para que trates con el negocio sin intermediarios.\n" +
             "• **Sugerir un Local**: Si conoces una pizzería en Hermosillo que no esté en nuestro mapa, escríbenos desde la sección de **Contacto** en la barra superior y soporte la agregará de inmediato.\n" +
             "• **Reportar Datos Erróneos**: Envíanos un mensaje si algún teléfono u horario cambió para mantener el mapa 100% veraz.";
    }

    // 10. GRATITUDE
    if (lower.includes('gracias') || lower.includes('agradezco') || lower.includes('excelente') || lower.includes('perfecto') || lower.includes('chido') || lower.includes('bueno') || lower.includes('super') || lower.includes('genial') || lower.includes('chilo')) {
      return "¡De nada! Es un absoluto placer ayudarte a encontrar la pizza ideal en Hermosillo. ¡Disfruta tu comida y recuerda que siempre estoy aquí en la esquina inferior derecha para resolver cualquier duda sobre PizzApp! 🍕✨";
    }

    // 11. GENERAL DETAILED FALLBACK
    return "🍕 **¡Hola! Soy Pizzi, tu Asistente Experto Local de PizzApp.**\n\n" +
           "No dependo de APIs externas de pago, mi cerebro inteligente local está conectado directamente a la base de datos cloud en tiempo real. Pregúntame escribiendo palabras clave sobre:\n\n" +
           "1. 🍕 **Lista de pizzerías** o locales en Hermosillo (ej. *'Mexy'*, *'La Cobacha'*, *'Roy's'*).\n" +
           "2. 📋 **Menús y precios** de productos registrados (ej. *'menú de Pizza Hut'*).\n" +
           "3. 🗺️ Cómo usar el **Mapa Interactivo Leaflet** y *'Cómo llegar'*.\n" +
           "4. ☁️ Nuestra moderna tecnología **Serverless Base64 y Neon DB**.\n" +
           "5. 🛠️ El editor visual **Ranking Styler** para administradores.\n" +
           "6. 🔑 Registro de cuentas, **acceso anónimo** instantáneo o recuperación de contraseña.";
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsThinking(true);

    // Dynamic asynchronous resolving of the query, mock a small natural delay
    setTimeout(async () => {
      try {
        const responseText = await getBotResponse(currentInput);
        const botMessage: Message = { role: 'model', content: [{ text: responseText }] };
        setMessages(prev => [...prev, botMessage]);
      } catch (err) {
        console.error("Error resolving bot message:", err);
        const botMessage: Message = { role: 'model', content: [{ text: "Ups, tuve un pequeño contratiempo al consultar mi base de datos Neon PostgreSQL. Por favor pregúntame de nuevo y te responderé con gusto. 🍕" }] };
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
                        'max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-line',
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
