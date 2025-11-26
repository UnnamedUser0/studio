'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define schemas for input and output
const PizzAppAssistantInputSchema = z.object({
    history: z.array(z.any()).describe('The conversation history.'),
    message: z.string().describe("The user's new message."),
});

export type PizzAppAssistantInput = z.infer<typeof PizzAppAssistantInputSchema>;

const PizzAppAssistantOutputSchema = z.object({
    answer: z.string().describe('The chatbot\'s answer.'),
});

export type PizzAppAssistantOutput = z.infer<typeof PizzAppAssistantOutputSchema>;

// Construct the Knowledge Base from the application pages
const KNOWLEDGE_BASE = `
**INFORMACIÓN DE CONTEXTO DE PIZZAPP**

**1. SOBRE NOSOTROS**
PizzApp nació de la pasión por la pizza y el deseo de conectar a los amantes de la buena comida con los mejores lugares de Hermosillo.
Misión: Ayudar a los usuarios a encontrar su pizza perfecta y apoyar a los negocios locales.

**2. PREGUNTAS FRECUENTES (FAQ)**

*Uso de la Aplicación:*
- **¿Cómo busco pizzerías en PizzApp?** Puedes usar la barra de búsqueda en la parte superior para escribir el nombre, la dirección o una colonia. También puedes explorar el mapa interactivo en la página de inicio para ver las pizzerías cercanas a ti.
- **¿Necesito registrarme para usar PizzApp?** No es necesario registrarse para explorar pizzerías, ver sus menús o ubicaciones. Sin embargo, para dejar opiniones, calificar y guardar tus lugares favoritos, sí necesitarás crear una cuenta gratuita.
- **¿Qué información puedo ver sobre una pizzería?** Para cada pizzería, puedes ver su dirección, ubicación en el mapa, calificación promedio, y las opiniones y comentarios dejados por otros usuarios de la comunidad.

*Datos y Mapas:*
- **¿De dónde proviene la información de las pizzerías?** La información inicial es recopilada por nuestro equipo y validada constantemente por la comunidad. Los dueños de negocios también podrán reclamar y actualizar sus perfiles próximamente.
- **¿Por qué algunas pizzerías no aparecen en la búsqueda?** Nuestro buscador inteligente intenta encontrar la mejor coincidencia. Si una pizzería es nueva o no está en nuestra base de datos, es posible que no aparezca. ¡Puedes sugerirnos nuevos lugares a través de nuestra página de contacto!
- **¿Cómo puedo reportar información incorrecta?** Si encuentras un error en la dirección, horario o cualquier otro dato de una pizzería, te agradecemos que nos lo hagas saber a través del formulario en nuestra página de Contacto.

*Soporte y Contacto:*
- **¿A quién puedo contactar si tengo un problema con la aplicación?** Nuestro equipo de soporte está disponible para ayudarte. Puedes enviarnos un mensaje a través del formulario en la sección de Contacto y te responderemos a la brevedad.
- **Soy dueño, ¿puedo agregar mi pizzería a PizzApp?** ¡Claro que sí! Estamos finalizando el portal para dueños de negocios. Mientras tanto, puedes enviarnos la información de tu pizzería a través de la página de Contacto para que la agreguemos.
- **¿PizzApp cobra comisiones por pedidos?** No. Actualmente, PizzApp es una guía para descubrir y calificar pizzerías. No procesamos pedidos ni cobramos comisiones. Solo te conectamos con los mejores lugares de la ciudad.

**3. AYUDA Y SOPORTE**
- **Preguntas Frecuentes:** Consulta nuestra sección de preguntas frecuentes para encontrar respuestas rápidas a los problemas más comunes.
- **Contacta con Nosotros:** ¿No encuentras lo que buscas? Nuestro equipo de soporte está listo para ayudarte personalmente.
- **Recursos Adicionales:**
    - Documentación de la API Overpass (Datos de Pizzerías)
    - Políticas de Uso de Nominatim (Geocodificación)
    - Documentación de Leaflet (Biblioteca del Mapa)

**4. TÉRMINOS Y CONDICIONES**
- **Uso de la Aplicación:** PizzApp es una guía para descubrir y opinar sobre pizzerías. No nos hacemos responsables por la calidad del servicio o producto de los establecimientos listados.
- **Contenido del Usuario:** Eres responsable de las opiniones y calificaciones que publicas. No se permite contenido ofensivo, falso o que infrinja derechos de autor.
- **Propiedad Intelectual:** El contenido de PizzApp, incluyendo logos, textos y diseño, está protegido por derechos de autor y no puede ser reproducido sin permiso.

**5. POLÍTICA DE PRIVACIDAD**
- En PizzApp, respetamos tu privacidad.
- La información del usuario, como el correo electrónico proporcionado durante el inicio de sesión, se utiliza únicamente para la autenticación de la cuenta y para permitir funciones como la publicación de opiniones.
- No compartimos tus datos personales con terceros.
`;

// Define the flow
export const pizzAppAssistantFlow = ai.defineFlow(
    {
        name: 'pizzAppAssistantFlow',
        inputSchema: PizzAppAssistantInputSchema,
        outputSchema: PizzAppAssistantOutputSchema,
    },
    async ({ history, message }) => {
        const systemInstruction = `Eres "Pizzi", el asistente virtual amigable y servicial de PizzApp.

    **TU ROL:**
    - Eres un experto en PizzApp y tu único objetivo es ayudar a los usuarios con sus dudas sobre la aplicación.
    - Eres amable, paciente y entusiasta (¡te encanta la pizza!).
    - Respondes de manera precisa basándote EXCLUSIVAMENTE en la información proporcionada en tu Base de Conocimiento.

    **BASE DE CONOCIMIENTO:**
    ${KNOWLEDGE_BASE}

    **DIRECTRICES:**
    1.  **Contexto:** Usa la información de "Sobre Nosotros", "FAQ", "Ayuda", "Términos" y "Privacidad" para responder.
    2.  **Fuera de Alcance:** Si te preguntan algo que no está relacionado con PizzApp (ej. recetas de cocina, el clima, noticias generales), responde amablemente que solo puedes ayudar con temas relacionados con la aplicación PizzApp.
    3.  **Tono:** Mantén un tono conversacional, cercano y profesional.
    4.  **Idioma:** Responde en el mismo idioma que el usuario (principalmente Español).
    5.  **Desconocido:** Si no sabes la respuesta basándote en la información provista, sugiere al usuario que contacte a soporte a través de la página de Contacto. No inventes información.
    `;

        // Format history for Genkit
        const formattedHistory = history.map((msg: any) => {
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

        const messages = [
            { role: 'system' as const, content: [{ text: systemInstruction }] },
            ...formattedHistory,
            { role: 'user' as const, content: [{ text: message }] }
        ];

        try {
            const result = await ai.generate({
                model: 'googleai/gemini-2.5-flash',
                messages: messages,
            });

            return { answer: result.text };
        } catch (error: any) {
            console.error('Error in pizzAppAssistantFlow:', error);

            let errorMessage = 'Lo siento, tuve un problema al procesar tu solicitud.';

            if (error.message?.includes('403') || error.message?.includes('blocked')) {
                errorMessage += ' Parece que la API de Google AI no está habilitada o la clave es inválida. Verifica tu configuración.';
            } else if (error.message?.includes('429')) {
                errorMessage += ' He recibido demasiadas solicitudes. Por favor intenta de nuevo en un momento.';
            } else {
                errorMessage += ` (Detalle del error: ${error.message})`;
            }

            return { answer: errorMessage };
        }
    }
);

export async function runPizzAppAssistant(input: PizzAppAssistantInput): Promise<PizzAppAssistantOutput> {
    return pizzAppAssistantFlow(input);
}
