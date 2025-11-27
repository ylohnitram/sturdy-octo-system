import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    // Set CORS headers
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('[Wingman API] Missing GEMINI_API_KEY in server environment');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { contents, model = 'gemini-2.5-flash' } = req.body;

        if (!contents) {
            return res.status(400).json({ error: 'Missing contents parameter' });
        }

        console.log('[Wingman API] Generating content with model:', model);

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model,
            contents,
        });

        const text = response.text?.trim();

        if (!text) {
            console.warn('[Wingman API] Empty response from Gemini');
            return res.status(500).json({ error: 'Empty response from AI' });
        }

        console.log('[Wingman API] Successfully generated content');
        return res.status(200).json({ text });

    } catch (error) {
        console.error('[Wingman API] Error:', error);
        return res.status(500).json({
            error: 'Failed to generate content',
            details: error.message
        });
    }
}
