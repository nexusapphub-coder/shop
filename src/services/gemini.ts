import { GoogleGenAI } from "@google/genai";

// Use a getter to avoid top-level initialization crash if key is missing
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is missing. AI features will not work.');
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getStyleGuide(productName: string, category: string) {
  const ai = getAI();
  if (!ai) return "Style guide unavailable (API key missing).";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As a professional fashion stylist, provide a concise style guide for a product named "${productName}" in the "${category}" category. 
    Give 3 bullet points on how to style it, what to pair it with, and for which occasion it's best suited. Keep it under 100 words.`,
  });

  return response.text;
}
