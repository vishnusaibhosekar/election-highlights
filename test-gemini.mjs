/**
 * Gemini API Test Script
 * 
 * Tests the @google/genai SDK for:
 * 1. Basic content generation
 * 2. Structured JSON output (for card generation)
 * 3. Streaming responses (for chat)
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY environment variable not set');
    process.exit(1);
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function testBasicGeneration() {
    console.log('📍 Test 1: Basic content generation');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'What is 2+2? Answer in one word.',
        });

        const text = response.text;
        console.log(`✅ Response: "${text.trim()}"`);
        console.log(`   Model: ${response.modelVersion || 'gemini-2.0-flash'}`);
        console.log('');
        return true;
    } catch (error) {
        console.error('❌ Test 1 failed:', error.message);
        return false;
    }
}

async function testStructuredJSON() {
    console.log('📍 Test 2: Structured JSON output (card generation simulation)');

    const electionData = `
2026 West Bengal Assembly Election Results:
- Total seats: 294
- BJP: 165 seats (42.3% vote share)
- TMC: 95 seats (35.1% vote share)
- INC: 20 seats (12.8% vote share)
- Others: 14 seats (9.8% vote share)
- Voter turnout: 92.93% (highest ever)
- Key upset: Mamata Banerjee lost her seat
`;

    const prompt = `You are an election data analyst. Based on this election data, generate ONE highlight card in JSON format:

${electionData}

Return ONLY a valid JSON object with this exact structure (no markdown, no preamble):
{
  "id": "test_card_001",
  "state": "west_bengal",
  "category": "results",
  "headline": "Short punchy headline under 60 chars",
  "context": "One line explanation under 120 chars",
  "key_stat": {
    "value": "The most impactful number",
    "label": "What it measures"
  },
  "detail": {
    "full_text": "Brief 2-3 sentence explanation",
    "chart_type": "bar",
    "chart_data": [{"name": "Party", "value": 123}],
    "sources": ["https://example.com"],
    "suggested_questions": ["Question 1?", "Question 2?", "Question 3?"]
  }
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
                maxOutputTokens: 2000,
            },
        });

        const text = response.text.trim();

        // Try to parse as JSON
        try {
            // Remove markdown code blocks if present
            const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const card = JSON.parse(jsonStr);

            console.log('✅ JSON parsing successful!');
            console.log(`   Headline: "${card.headline}"`);
            console.log(`   Category: ${card.category}`);
            console.log(`   Key stat: ${card.key_stat.value} ${card.key_stat.label}`);
            console.log(`   Chart type: ${card.detail.chart_type}`);
            console.log(`   Chart data points: ${card.detail.chart_data.length}`);
            console.log('');
            return true;
        } catch (parseError) {
            console.error('❌ JSON parsing failed');
            console.error(`   Response: ${text.substring(0, 200)}...`);
            console.error(`   Parse error: ${parseError.message}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Test 2 failed:', error.message);
        return false;
    }
}

async function testStreaming() {
    console.log('📍 Test 3: Streaming response (chat simulation)');

    try {
        const stream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: 'Explain in 2 sentences why election turnouts matter.',
            config: {
                temperature: 0.5,
                maxOutputTokens: 200,
            },
        });

        let fullText = '';
        let chunkCount = 0;

        console.log('   Streaming chunks:');
        for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
                fullText += text;
                chunkCount++;
                process.stdout.write(`   [${chunkCount}] ${text.substring(0, 50)}...\n`);
            }
        }

        console.log(`\n✅ Streaming completed`);
        console.log(`   Total chunks: ${chunkCount}`);
        console.log(`   Final length: ${fullText.length} chars`);
        console.log('');
        return true;
    } catch (error) {
        console.error('❌ Test 3 failed:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🤖 Testing Gemini API (@google/genai SDK)...\n');

    const results = [
        await testBasicGeneration(),
        await testStructuredJSON(),
        await testStreaming(),
    ];

    return results.every(r => r);
}

runTests()
    .then((success) => {
        if (success) {
            console.log('🎉 All Gemini API tests passed!');
            console.log('   You can now use this pattern in lib/gemini.ts\n');
            process.exit(0);
        } else {
            console.log('⚠️  Some tests failed. Check errors above.\n');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('\n❌ Unexpected error:', error);
        process.exit(1);
    });
