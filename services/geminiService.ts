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

interface ChatAssistParams {
  myProfile: {
    username: string;
    bio?: string;
  };
  theirProfile: {
    username: string;
    bio?: string;
  };
  conversationHistory?: Array<{ sender: 'me' | 'them'; message: string }>;
  isIcebreaker: boolean;
}

export const generateChatAssist = async (params: ChatAssistParams): Promise<string> => {
  if (!apiKey) return "Ahoj! Jak se máš? 😊";

  const { myProfile, theirProfile, conversationHistory, isIcebreaker } = params;

  try {
    let prompt = '';

    if (isIcebreaker) {
      // Ice-breaker mode
      prompt = `You are a dating app wingman helping write a first message.

MY PROFILE:
- Username: ${myProfile.username}
- Bio: ${myProfile.bio || 'No bio'}

THEIR PROFILE:
- Username: ${theirProfile.username}
- Bio: ${theirProfile.bio || 'No bio'}

Generate a flirty, witty, confident opening message in Czech.
- Reference something from their bio if possible
- Keep it under 25 words
- Be playful and charming
- Use 1-2 emojis max
- Don't be creepy or too direct

Just return the message, nothing else.`;
    } else {
      // Conversation assist mode
      const historyText = conversationHistory
        ?.map(msg => `${msg.sender === 'me' ? myProfile.username : theirProfile.username}: ${msg.message}`)
        .join('\n') || '';

      prompt = `You are a dating app wingman helping continue a conversation.

MY PROFILE:
- Username: ${myProfile.username}
- Bio: ${myProfile.bio || 'No bio'}

THEIR PROFILE:
- Username: ${theirProfile.username}
- Bio: ${theirProfile.bio || 'No bio'}

CONVERSATION SO FAR:
${historyText}

Generate a witty, engaging response in Czech that continues the conversation.
- Be natural and authentic
- Match the conversation tone
- Ask an interesting question or make a playful comment
- Keep it under 30 words
- Use 1-2 emojis max
- Don't be creepy

Just return the message, nothing else.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || (isIcebreaker
      ? `Ahoj ${theirProfile.username}! Tvůj profil vypadá zajímavě 😊`
      : "To je zajímavé! Řekni mi víc 🤔");
  } catch (error) {
    console.error("Error generating chat assist:", error);
    return isIcebreaker
      ? `Ahoj ${theirProfile.username}! Tvůj profil vypadá zajímavě 😊`
      : "To je zajímavé! Řekni mi víc 🤔";
  }
};