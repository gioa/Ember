import { GoogleGenAI } from "@google/genai";
import { getTracer } from "./telemetryService";

// Initialize Gemini API
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Generates a comforting message about letting go and moving forward.
 * We do NOT send the user's worry text to the API to preserve privacy/symbolism of burning.
 * Instead, we ask for a general philosophical reflection on release.
 */
export const generateComfortingMessage = async (): Promise<string> => {
  const span = getTracer().startSpan('gemini_generate_comfort_message');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, soothing, and poetic message (max 2 sentences) about the relief of letting go of worries, watching them turn to ash, and finding inner peace. The tone should be gentle, stoic, and warm.",
    });
    
    const text = response.text;
    span.setAttribute('response_length', text?.length || 0);
    span.end();
    
    return text || "The weight is lifted. Peace remains.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    span.recordException(error as Error);
    span.end();
    return "As the smoke clears, may your mind find stillness.";
  }
};
