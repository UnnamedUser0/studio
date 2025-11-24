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
**Información General:**
- **Nombre:** Hermosillo Pizza Finder (PizzApp).
- **Propósito:** Guía definitiva para descubrir, calificar y encontrar las mejores pizzerías en Hermosillo, Sonora.
- **Misión:** Ayudar a los usuarios a encontrar su pizza perfecta y apoyar a los negocios locales.

**Funcionalidades Clave:**
- **Mapa Interactivo:** Mapa centrado en Hermosillo con actualizaciones en tiempo real, transiciones 3D suaves, zoom y rotación. Muestra marcadores de pizzerías.
- **Búsqueda Inteligente:** Barra de búsqueda que sugiere pizzerías o tipos de pizza mientras escribes. Soporta búsqueda difusa (fuzzy matching) para nombres y direcciones.
- **Listados Basados en Ubicación:** Muestra pizzerías cercanas a la ubicación del usuario o del área del mapa visible.
- **Ranking y Reseñas:** Sistema de calificación (1-5 estrellas) y comentarios. Los usuarios pueden leer y escribir reseñas para compartir su experiencia.
- **Autenticación:**
    - **Visitantes:** Pueden explorar el mapa y ver información sin cuenta.
    - **Usuarios Registrados:** Necesario para escribir reseñas, calificar y guardar favoritos. Inicio de sesión con correo/contraseña o anónimo.
- **Panel de Administración:** Solo para usuarios autorizados (admins). Permite gestionar listados de pizzerías y moderar reseñas.
- **Centro de Ayuda:** FAQ y guías de uso.

**Datos y Entidades:**
- **Pizzería:** Nombre, dirección, coordenadas (lat/lng), categoría (ej. Italiana, Pizza), fuente de datos (OpenStreetMap, etc.), y calificación promedio.
- **Usuario:** ID, email, nombre de usuario, rol (admin o usuario normal).
- **Reseña:** Vinculada a una pizzería y un usuario. Contiene calificación, comentario y fecha.
- **Testimonio:** Comentarios generales sobre la App que aparecen públicamente.

**Estilo y Marca:**
- **Colores:** Rojo vivo (#FF4136) para apetito, Blanco suave (#F9F6F2) para fondo, Naranja cálido (#FF851B) para acentos.
- **Tipografía:** 'PT Sans' (amigable/moderna) y 'Playfair' (elegante para títulos).
- **Vibe:** Moderna, vibrante, centrada en la comida y la comunidad.

**Políticas y Privacidad:**
- **Modelo:** Guía informativa. NO procesa pedidos ni cobra comisiones a pizzerías.
- **Privacidad:** Datos de usuario (email) usados solo para autenticación y gestión de reseñas. No se comparten con terceros.
- **Contenido:** Las opiniones deben ser respetuosas.
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
    Tu ÚNICO propósito es responder preguntas y aclarar dudas de los usuarios sobre la aplicación PizzApp, su funcionamiento, características y políticas.

    **Base de Conocimiento (Toda la verdad sobre la App):**
    ${APP_CONTEXT}

    **Instrucciones de Comportamiento:**
    1.  **Rol Estricto:** NUNCA salgas de tu personaje. No eres un asistente general, eres Pizzi de PizzApp.
    2.  **Fuera de Tópico:** Si el usuario pregunta sobre temas ajenos a la App (ej. recetas, clima, noticias), responde amablemente: "Lo siento, mi función es exclusivamente aclarar dudas sobre el funcionamiento de PizzApp."
    3.  **Tono:** Amable, servicial, entusiasta por la pizza, pero profesional y directo.
    4.  **Idioma:** Responde siempre en el idioma en que te hablen (principalmente Español).
    5.  **Claridad:** Usa la información de la "Base de Conocimiento" para dar respuestas precisas.`;

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
        model: 'googleai/gemini-1.5-flash',
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
