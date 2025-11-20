import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateIcebreaker = async (targetName: string, targetBio: string): Promise<string> => {
  if (!apiKey) return "Ahoj, vypadáš zajímavě! (AI klíč chybí)";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a flirty, witty, and confident opening line in Czech for a dating app. 
      The target's name is ${targetName}. 
      Their bio is: "${targetBio}". 
      Keep it short, under 20 words. Use emojis.`,
    });
    return response.text?.trim() || `Ahoj ${targetName}, máš skvělý profil! 🔥`;
  } catch (error) {
    console.error("Error generating icebreaker:", error);
    return `Ahoj ${targetName}, máš skvělý profil! 🔥`;
  }
};

export const analyzeProfileInsight = async (userStats: any): Promise<string> => {
  if (!apiKey) return "Váš profil má vysoký potenciál pro tento týden.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze these dating stats and give a short, 1-sentence "insight" or "roast" in Czech.
      Stats: ${JSON.stringify(userStats)}.
      Tone: Playful, competitive, slightly spicy.`,
    });
    return response.text?.trim() || "Tvé skóre stoupá, jen tak dál!";
  } catch (error) {
    return "Tvé skóre stoupá, jen tak dál!";
  }
};

export const generateUserBio = async (trait: string, interests: string[]): Promise<string> => {
  if (!apiKey) return "Život je hra. 🎯";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, punchy, 1-sentence bio for a dating app user who is "${trait}" and likes ${interests.join(', ')}. 
      Language: Czech. 
      Style: Confident, slightly mysterious, maybe a bit arrogant. 
      Use 1 emoji.`,
    });
    return response.text?.trim() || `Mám rád ${interests[0]} a vyhrávám. 🎯`;
  } catch (error) {
    console.error("Error generating bio:", error);
    return `Mám rád ${interests[0]} a vyhrávám. 🎯`;
  }
};