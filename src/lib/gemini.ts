/**
 * Gemini API Utility
 * 
 * Provides functions for:
 * - Card generation from election data (structured JSON output)
 * - Scoped chat conversations (streaming responses)
 * 
 * Uses @google/genai SDK with gemini-2.5-flash model
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY environment variable is not set');
}

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Model configuration
const CARD_GENERATION_MODEL = 'gemini-2.5-flash';
const CHAT_MODEL = 'gemini-2.5-flash';

const CARD_GENERATION_CONFIG = {
    temperature: 0.3, // Consistent, factual
    responseMimeType: 'application/json', // Force JSON response
};

const CHAT_CONFIG = {
    temperature: 0.5, // Slightly more conversational
};

/**
 * Card generation prompt template
 */
const CARD_GENERATION_PROMPT = `You are an election data analyst creating highlight cards for a news app.
You will receive raw election data from the 2026 {state} Assembly Election.

Generate a JSON array of highlight cards. Each card surfaces ONE key insight
that a regular citizen would find interesting, surprising, or important.

Generate cards across these categories:
- results: party-wise seat tallies, vote share
- upsets: big leaders who lost, surprise outcomes
- swings: seats that changed hands, margin shifts from 2021
- turnout: participation records, district variations
- controversies: legal issues, voter roll problems, repolls
- coalitions: post-election alliances, government formation math
- historic_firsts: records broken, unprecedented events

For each card provide:
{
  "id": "<unique_id>",
  "state": "<west_bengal|tamil_nadu>",
  "category": "<category>",
  "headline": "<max 60 chars, punchy, no period>",
  "context": "<one line explainer, max 120 chars>",
  "key_stat": { "value": "<number or short string>", "label": "<what it measures>" },
  "detail": {
    "full_text": "<2-3 paragraphs explaining why this matters, in simple language>",
    "chart_type": "<bar|pie|comparison|none>",
    "chart_data": <structured data object for the chart>,
    "sources": ["<source URLs>"],
    "suggested_questions": ["<3 follow-up questions a curious citizen might ask>"]
  }
}

Rules:
- Generate 8-12 cards per state
- Headlines must be jargon-free — a first-time voter should understand them
- Key stats should use the most impactful number (percentages, seat counts, margins)
- Chart data must be valid for Recharts (array of objects with name/value keys)
- Full text should explain context a 20-year-old would need, not a political analyst
- Respond ONLY with the JSON array, no markdown, no preamble`;

/**
 * Chat system prompt template
 */
const CHAT_SYSTEM_PROMPT = `You are a friendly, non-partisan election analyst helping a curious citizen
understand the 2026 {state} Assembly Election.

The user is looking at this highlight:
- Topic: {headline}
- Context: {context}
- Key stat: {key_stat}
- Full context: {full_text}

Additional election data for reference:
{raw_data_summary}

Rules:
- Answer in simple, jargon-free language
- Be strictly non-partisan — present facts, not opinions
- If comparing parties, present both sides fairly
- Use specific numbers and data points when available
- If you don't have the data to answer, say so honestly
- Keep responses concise (2-4 paragraphs max unless asked for more)
- Do NOT speculate on future political outcomes`;

export interface HighlightCard {
    id: string;
    state: 'west_bengal' | 'tamil_nadu';
    category: CardCategory;
    headline: string;
    context: string;
    key_stat: {
        value: string;
        label: string;
    };
    detail: {
        full_text: string;
        chart_type: 'bar' | 'pie' | 'comparison' | 'none';
        chart_data: Record<string, any>[];
        sources: string[];
        suggested_questions: string[];
    };
    generated_at: string;
}

export type CardCategory =
    | 'results'
    | 'upsets'
    | 'swings'
    | 'turnout'
    | 'controversies'
    | 'coalitions'
    | 'historic_firsts';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface GenerateCardsResult {
    success: boolean;
    cards?: HighlightCard[];
    error?: string;
}

export interface ChatResponse {
    success: boolean;
    text?: string;
    error?: string;
}

/**
 * Generate highlight cards from election data
 * 
 * @param state - State name (west_bengal or tamil_nadu)
 * @param electionData - Raw election data from Wikipedia scrape
 * @returns Array of HighlightCard objects
 */
export async function generateCards(
    state: 'west_bengal' | 'tamil_nadu',
    electionData: string
): Promise<GenerateCardsResult> {
    if (!GEMINI_API_KEY) {
        return {
            success: false,
            error: 'GEMINI_API_KEY is not configured',
        };
    }

    try {
        const prompt = CARD_GENERATION_PROMPT.replace('{state}', state.replace('_', ' '));
        const fullPrompt = `${prompt}\n\nHere is the election data:\n\n${electionData}`;

        console.log(`🤖 Sending prompt to Gemini (${fullPrompt.length} chars)...`);

        const response = await ai.models.generateContent({
            model: CARD_GENERATION_MODEL,
            contents: fullPrompt,
            config: CARD_GENERATION_CONFIG,
        });

        const text = response.text?.trim() || '';
        console.log(`🤖 Gemini response received (${text.length} chars)`);

        // Parse JSON response
        try {
            // Remove markdown code blocks if present
            let jsonStr = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Try to find JSON array in the response
            const startIndex = jsonStr.indexOf('[');
            const endIndex = jsonStr.lastIndexOf(']');

            if (startIndex !== -1 && endIndex !== -1) {
                jsonStr = jsonStr.substring(startIndex, endIndex + 1);
            }

            const cards: HighlightCard[] = JSON.parse(jsonStr);

            // Add generated_at timestamp
            const timestamp = new Date().toISOString();
            const cardsWithTimestamp = cards.map((card) => ({
                ...card,
                generated_at: timestamp,
            }));

            return {
                success: true,
                cards: cardsWithTimestamp,
            };
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw Gemini response (first 500 chars):', text.substring(0, 500));
            console.error('Raw Gemini response (last 500 chars):', text.substring(text.length - 500));

            return {
                success: false,
                error: `Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Generate a single chat response (non-streaming)
 * 
 * @param card - The highlight card being discussed
 * @param electionData - Raw election data for context
 * @param userMessage - User's question
 * @param chatHistory - Previous messages (optional)
 * @returns Gemini's response text
 */
export async function generateChatResponse(
    card: HighlightCard,
    electionData: string,
    userMessage: string,
    chatHistory: ChatMessage[] = []
): Promise<ChatResponse> {
    if (!GEMINI_API_KEY) {
        return {
            success: false,
            error: 'GEMINI_API_KEY is not configured',
        };
    }

    try {
        const systemPrompt = CHAT_SYSTEM_PROMPT.replace('{state}', card.state.replace('_', ' '))
            .replace('{headline}', card.headline)
            .replace('{context}', card.context)
            .replace('{key_stat}', `${card.key_stat.value} ${card.key_stat.label}`)
            .replace('{full_text}', card.detail.full_text)
            .replace('{raw_data_summary}', electionData.substring(0, 3000)); // Limit context

        // Build conversation history
        const contents: any[] = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I will provide factual, non-partisan answers based on the election data.' }] },
            ...chatHistory.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
            { role: 'user', parts: [{ text: userMessage }] },
        ];

        const response = await ai.models.generateContent({
            model: CHAT_MODEL,
            contents,
            config: CHAT_CONFIG,
        });

        return {
            success: true,
            text: response.text,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Generate a streaming chat response
 * 
 * @param card - The highlight card being discussed
 * @param electionData - Raw election data for context
 * @param userMessage - User's question
 * @param chatHistory - Previous messages (optional)
 * @returns AsyncIterable that yields text chunks
 */
export async function* streamChatResponse(
    card: HighlightCard,
    electionData: string,
    userMessage: string,
    chatHistory: ChatMessage[] = []
): AsyncIterable<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = CHAT_SYSTEM_PROMPT.replace('{state}', card.state.replace('_', ' '))
        .replace('{headline}', card.headline)
        .replace('{context}', card.context)
        .replace('{key_stat}', `${card.key_stat.value} ${card.key_stat.label}`)
        .replace('{full_text}', card.detail.full_text)
        .replace('{raw_data_summary}', electionData.substring(0, 3000));

    const contents: any[] = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I will provide factual, non-partisan answers based on the election data.' }] },
        ...chatHistory.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
    ];

    const stream = await ai.models.generateContentStream({
        model: CHAT_MODEL,
        contents,
        config: CHAT_CONFIG,
    });

    for await (const chunk of stream) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
}
