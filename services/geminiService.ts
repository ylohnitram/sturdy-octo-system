import { GoogleGenAI } from "@google/genai";

// Local key for dev mode (undefined in production due to vite.config.ts)
const localApiKey = process.env.GEMINI_API_KEY || '';
const localAi = localApiKey ? new GoogleGenAI({ apiKey: localApiKey }) : null;

/**
 * Unified function to call Gemini via Local SDK (Dev) or Serverless API (Prod)
 */
async function callGemini(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string | null> {
  // 1. Try Local (Dev Mode)
  if (localAi) {
    try {
      const response = await localAi.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text?.trim() || null;
    } catch (e) {
      console.error('Local Gemini Error:', e);
      return null;
    }
  }

  // 2. Try Serverless API (Production)
  try {
    const response = await fetch('/api/wingman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: prompt, model })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('API Error:', err);
      return null;
    }

    const data = await response.json();
    return data.text || null;
  } catch (e) {
    console.error('Gemini Proxy Error:', e);
    return null;
  }
}

export const generateIcebreaker = async (targetName: string, targetBio: string): Promise<string> => {
  const prompt = `Generate a flirty, witty, and confident opening line in Czech for a dating app. 
      The target's name is ${targetName}. 
      Their bio is: "${targetBio}". 
      Keep it short, under 20 words. Use emojis.`;

  const result = await callGemini(prompt);
  return result || `Ahoj ${targetName}, máš skvělý profil! 🔥`;
};

export const analyzeProfileInsight = async (userStats: any): Promise<string> => {
  const prompt = `Analyze these dating stats and give a short, 1-sentence "insight" or "roast" in Czech.
      Stats: ${JSON.stringify(userStats)}.
      Tone: Playful, competitive, slightly spicy.`;

  const result = await callGemini(prompt);
  return result || "Tvé skóre stoupá, jen tak dál!";
};

export const generateUserBio = async (trait: string, interests: string[]): Promise<string> => {
  const prompt = `Generate a short, punchy, 1-sentence bio for a dating app user who is "${trait}" and likes ${interests.join(', ')}. 
      Language: Czech. 
      Style: Confident, slightly mysterious, maybe a bit arrogant. 
      Use 1 emoji.`;

  const result = await callGemini(prompt);
  return result || `Mám rád ${interests[0]} a vyhrávám. 🎯`;
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
  const { myProfile, theirProfile, conversationHistory, isIcebreaker } = params;

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

  const result = await callGemini(prompt);
  return result || (isIcebreaker
    ? `Ahoj ${theirProfile.username}! Tvůj profil vypadá zajímavě 😊`
    : "To je zajímavé! Řekni mi víc 🤔");
};