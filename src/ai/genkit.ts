import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';


export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || "AIzaSyCrcl17PCMCjSSwyCUrnDhAa0EmZGx0yh8" })
  ],
  model: 'googleai/gemini-2.5-flash',
});
