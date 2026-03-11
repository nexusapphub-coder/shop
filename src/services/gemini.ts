import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getStyleGuide(productName: string, category: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As a professional fashion stylist, provide a concise style guide for a product named "${productName}" in the "${category}" category. 
    Give 3 bullet points on how to style it, what to pair it with, and for which occasion it's best suited. Keep it under 100 words.`,
  });

  return response.text;
}
