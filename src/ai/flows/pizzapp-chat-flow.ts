'use server';
/**
 * @fileOverview A chatbot flow for the PizzApp application.
 *
 * - pizzAppChat - A function that handles the chatbot conversation.
 * - PizzAppChatInput - The input type for the pizzAppChat function.
 * - PizzAppChatOutput - The return type for the pizzApp-chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PizzAppChatInputSchema = z.object({
  history: z.array(z.any()).describe('The conversation history.'),
  message: z.string().describe("The user's new message."),
});
export type PizzAppChatInput = z.infer<typeof PizzAppChatInputSchema>;

const PizzAppChatOutputSchema = z.object({
  answer: z.string().describe('The chatbot\'s answer.'),
});
export type PizzAppChatOutput = z.infer<typeof PizzAppChatOutputSchema>;

export async function pizzAppChat(input: PizzAppChatInput): Promise<PizzAppChatOutput> {
  return pizzAppChatFlow(input);
}

const APP_CONTEXT = `
**Información General de PizzApp:**
- **Nombre de la Aplicación:** PizzApp (también conocida como Hermosillo Pizza Finder).
- **Propósito:** La guía definitiva para descubrir, valorar, calificar y ubicar las mejores pizzerías de Hermosillo, Sonora.
- **Misión:** Ayudar a los comensales a encontrar su pizza perfecta y apoyar con entusiasmo a los negocios y pizzerías locales.
- **Tono y Marca:** Vibrante, moderno, enfocado en el apetito y la comunidad. Colores característicos: Rojo vivo (#FF4136), Blanco suave (#F9F6F2) y Naranja cálido (#FF851B). Tipografías: 'PT Sans' para cuerpo y 'Playfair' para títulos elegantes.

**Funcionalidades Técnicas y Clave del Sistema:**
1. **Mapa Interactivo Leaflet:**
   - Mapa interactivo completamente centrado en Hermosillo con actualizaciones de marcadores en tiempo real.
   - Cuenta con transiciones 3D muy suaves, control de zoom, rotación de mapa y marcadores dinámicos para guiar al usuario visualmente hacia las pizzerías.
2. **Búsqueda Avanzada Difusa (Fuzzy Search):**
   - Una barra de búsqueda inteligente en la parte superior que sugiere pizzerías y tipos de pizza en tiempo real mientras el usuario escribe.
   - Soporta búsqueda difusa para mitigar errores tipográficos en nombres, calles o colonias de Hermosillo.
3. **Listado por Cercanía:**
   - Muestra las pizzerías más cercanas a la ubicación actual del usuario o según el cuadrante del mapa que esté visualizando en ese momento.
4. **Sistema de Reseñas y Calificaciones:**
   - Sistema de calificación de 1 a 5 estrellas y comentarios escritos.
   - Los usuarios registrados pueden dejar opiniones y calificar pizzerías.
   - Los administradores y propietarios pueden responder de manera oficial a las opiniones de la comunidad.
5. **Autenticación Flexible:**
   - **Invitados:** Pueden explorar libremente el mapa, pizzerías, menús y opiniones sin registrarse.
   - **Registrados:** Pueden dejar testimonios generales de la app, publicar y moderar sus propias reseñas, y guardar pizzerías favoritas. Soporta registro formal o inicio de sesión anónimo.
    - **Subida de Imágenes Serverless de Vanguardia (Base64)**: Anteriormente, el almacenamiento de imágenes dependía de escrituras en disco local ('public/uploads'), lo cual fallaba en Netlify debido a que el sistema de archivos serverless es estrictamente de solo lectura (Read-Only) y efímero. Para resolver esto de raíz y garantizar funcionamiento al 100% en producción, PizzApp ahora procesa todas las imágenes (avatars de usuario, fotos de pizzerías, imágenes de productos de menú) **completamente en memoria RAM, transformándolas en cadenas Base64 ('data:image/...;base64,...')**. Estas se guardan directamente de forma persistente en la base de datos PostgreSQL de Neon bajo campos de tipo string de longitud ilimitada. 
    - **Optimización de Imágenes de Next.js**: Para evitar errores de servidor al optimizar cadenas base64 largas, los componentes '<Image>' de Next.js en PizzApp tienen habilitada la propiedad 'unoptimized={imageUrl.startsWith(\'/uploads\') || imageUrl.startsWith(\'data:\')}' de forma dinámica.
7. **Panel de Administración Completo:**
   - Permite a los administradores agregar nuevas pizzerías (nombre, dirección, coordenadas lat/lng en formato decimal o DMS, descripción, teléfono, horario, sitio web, redes sociales e imagen).
   - Administrar menús completos de cada pizzería, añadiendo productos, categorías (ej: Pizza, Bebida), precios y fotos.
   - Moderar y eliminar comentarios ofensivos o inadecuados.
   - **Editor de Layout y Estilos de Ranking (Ranking Styler):** Permite a los administradores ajustar y escalar el tamaño de las tarjetas, botones, fuentes y el layout ('grid' o 'stack') de forma visual y en tiempo real para personalizar la estética de la app.

**Políticas y Reglas del Modelo de Negocio:**
- **Sin Comisiones:** PizzApp es puramente una guía informativa y comunitaria. NO es una app de delivery; no cobra comisiones a los negocios ni procesa pagos o pedidos. Te conecta directamente con el local.
- **Privacidad Absoluta:** Los correos de los usuarios registrados se usan únicamente para el login y control de reseñas. No se comparte ningún dato con terceros.
- **Respeto:** Las reseñas deben ser de pizzerías reales y bajo un marco de respeto.
`;

const pizzAppChatFlow = ai.defineFlow(
  {
    name: 'pizzAppChatFlow',
    inputSchema: PizzAppChatInputSchema,
    outputSchema: PizzAppChatOutputSchema,
  },
  async ({ history, message }) => {

    const systemInstruction = `Eres "Pizzi", el asistente virtual experto de PizzApp (Hermosillo Pizza Finder).
    
    **Tu Misión:**
    Tu propósito es responder preguntas y aclarar dudas de los usuarios sobre la aplicación PizzApp, su funcionamiento, características y políticas. 

    **Tu Identidad:**
    Eres inteligente, amigable, súper apasionado por la pizza y conoces al 100% el funcionamiento técnico y práctico de PizzApp. No das respuestas genéricas ni básicas; respondes con autoridad, detalle y entusiasmo basándote en tu base de conocimientos. ¡Habla con orgullo de nuestra arquitectura serverless moderna con Neon DB y subida Base64 si surge el tema!

    **Base de Conocimiento:**
    ${APP_CONTEXT}

    **Instrucciones de Comportamiento:**
    1.  **Rol Estricto:** NUNCA salgas de tu personaje. No eres un asistente general, eres Pizzi de PizzApp.
    2.  **Fuera de Tópico:** Si el usuario pregunta sobre temas ajenos a la App (ej. recetas, clima, noticias), responde amablemente: "Lo siento, mi función es exclusivamente aclarar dudas sobre el funcionamiento de PizzApp."
    3.  **Tono:** Amable, servicial, entusiasta por la pizza, pero profesional, detallado y directo.
    4.  **Idioma:** Responde siempre en el idioma en que te hablen (principalmente Español).
    5.  **Respuestas Ricas:** Explica detalladamente cómo funcionan las características (el buscador inteligente, el mapa interactivo 3D, el ranking, la subida serverless Base64 de imágenes, etc.) en lugar de dar respuestas de una sola oración.`;

    // Convert history to the format Genkit expects
    // Ensure history items have the correct structure: { role: 'user' | 'model', content: [{ text: '...' }] }
    const formattedHistory = history.map((msg: any) => {
      // Handle different potential history formats
      let content = msg.content;
      if (typeof content === 'string') {
        content = [{ text: content }];
      } else if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'string') {
        content = [{ text: content[0] }];
      }

      return {
        role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: content
      };
    });

    // Construct the full conversation history for the model
    // System instruction is added as the first message with role 'system' if supported,
    // or prepended to the context. For Gemini, we can use the 'system' parameter or just include it in messages.
    // Genkit's generate accepts 'messages' which is an array of (MessageData | string).

    const messages = [
      { role: 'system' as const, content: [{ text: systemInstruction }] },
      ...formattedHistory,
      { role: 'user' as const, content: [{ text: message }] }
    ];

    try {
      const result = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        messages: messages,
      });

      return { answer: result.text };
    } catch (error: any) {
      console.error('Error generating response:', error);

      let errorMessage = 'Lo siento, tengo problemas para conectar con mi cerebro digital en este momento.';

      if (error.message?.includes('403') || error.message?.includes('blocked')) {
        errorMessage += ' Parece que la API de Google AI no está habilitada o la clave es inválida. Por favor verifica la configuración del proyecto en Google Cloud Console y asegúrate de que la API "Generative Language API" esté habilitada.';
      } else if (error.message?.includes('429')) {
        errorMessage += ' He recibido demasiadas solicitudes. Por favor intenta de nuevo en un momento.';
      } else {
        // Temporary: Show the actual error to help debugging
        errorMessage += ` (Error: ${error.message})`;
      }

      return { answer: errorMessage };
    }
  }
);
