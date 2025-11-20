'use server';
/**
 * @fileOverview A chatbot flow for the PizzApp application.
 *
 * - pizzAppChat - A function that handles the chatbot conversation.
 * - PizzAppChatInput - The input type for the pizzAppChat function.
 * - PizzAppChatOutput - The return type for the pizzAppChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {Part} from '@genkit-ai/google-genai';

const PizzAppChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).describe('The conversation history.'),
  question: z.string().describe('The user\'s question.'),
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
- **Función Principal:** PizzApp es una guía para descubrir, calificar y encontrar las mejores pizzerías en Hermosillo, Sonora.
- **Búsqueda y Mapa:** Los usuarios pueden buscar pizzerías por nombre, dirección o colonia. La página principal tiene un mapa interactivo para explorar pizzerías cercanas. La búsqueda inteligente puede interpretar consultas como "pepperoni" o direcciones.
- **No se necesita registro para explorar:** Los visitantes pueden buscar y ver información de las pizzerías sin una cuenta.
- **Registro para opinar:** Para dejar opiniones, calificar o guardar favoritos, los usuarios deben crear una cuenta gratuita.
- **Información de la Pizzería:** Cada pizzería tiene una página de detalle con su dirección, ubicación, calificación promedio y opiniones de otros usuarios.
- **Fuente de Datos:** La información es recopilada por el equipo de PizzApp y validada por la comunidad. Los dueños de negocios podrán reclamar y actualizar perfiles próximamente.
- **Reportar Errores:** Los usuarios pueden reportar información incorrecta a través del formulario de contacto.
- **Modelo de Negocio:** PizzApp NO procesa pedidos ni cobra comisiones. Es una guía.
- **Soporte:** Los usuarios pueden contactar a soporte a través del formulario de contacto.
- **Privacidad:** La información del usuario (correo) se usa solo para autenticación y para funciones como publicar opiniones. Los datos no se comparten con terceros.
- **Términos de Uso:** El contenido generado por el usuario (opiniones) debe ser respetuoso. El contenido de PizzApp (logos, diseño) está protegido por derechos de autor.
`;

const pizzAppChatFlow = ai.defineFlow(
  {
    name: 'pizzAppChatFlow',
    inputSchema: PizzAppChatInputSchema,
    outputSchema: PizzAppChatOutputSchema,
  },
  async ({ history, question }) => {
    
    const systemInstruction = `Eres "Pizzi", el asistente virtual de PizzApp. Tu única función es responder preguntas y aclarar dudas sobre la aplicación PizzApp. Eres amable, servicial y directo.

    **Contexto sobre la aplicación PizzApp:**
    ${APP_CONTEXT}

    **Reglas:**
    1.  NUNCA salgas de tu rol de asistente de PizzApp.
    2.  Si te preguntan algo que no tiene que ver con PizzApp, responde amablemente que solo puedes ayudar con temas relacionados con la aplicación.
    3.  Usa el historial de la conversación para entender el contexto.
    4.  Responde en el mismo idioma de la pregunta del usuario.`;

    const fullHistory = [
        ...history,
        { role: 'user', content: [{ text: question }] },
    ] as Part[];

    const result = await ai.generate({
      prompt: fullHistory,
      system: systemInstruction,
    });

    return { answer: result.text };
  }
);
