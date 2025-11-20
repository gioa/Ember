import { getTracer } from "./telemetryService";

// Pre-defined comforting quotes to replace dynamic generation
const QUOTES = [
  "This too shall pass.",
  "The only way out is through.",
  "Let go of what you cannot control.",
  "Peace comes from within. Do not seek it without.",
  "You are not your thoughts; you are the observer of them.",
  "Every breath is a new beginning.",
  "In the midst of movement and chaos, keep stillness inside of you.",
  "What you release will no longer hold you.",
  "Serenity is not freedom from the storm, but peace within the storm.",
  "The present moment is the only moment available to us, and it is the door to all moments.",
  "Letting go gives us freedom, and freedom is the only condition for happiness.",
  "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.",
  "You have power over your mind - not outside events. Realize this, and you will find strength.",
  "He who fears he shall suffer, already suffers what he fears.",
  "We suffer more often in imagination than in reality.",
  "The soul becomes dyed with the color of its thoughts.",
  "Waste no more time arguing about what a good man should be. Be one.",
  "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",
  "Accept the things to which fate binds you, and love the people with whom fate brings you together.",
  "When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love."
];

/**
 * Returns a comforting message from a curated list.
 * Replaces the previous Gemini API implementation.
 */
export const generateComfortingMessage = async (): Promise<string> => {
  const span = getTracer().startSpan('generate_comfort_message_local');
  
  try {
    // Simulate a brief pause for pacing
    await new Promise(resolve => setTimeout(resolve, 600));

    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    const text = QUOTES[randomIndex];
    
    span.setAttribute('response_length', text.length);
    span.end();
    
    return text;
  } catch (error) {
    console.error("Error generating message:", error);
    span.recordException(error as Error);
    span.end();
    return "The weight is lifted. Peace remains.";
  }
};