import { NextRequest, NextResponse } from 'next/server';
import { generateCards } from '@/lib/gemini';
import { fetchElectionData } from '@/lib/tinyfish';
import { cacheHighlights } from '@/lib/insforge';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { state } = body;

        if (!state || !['west_bengal', 'tamil_nadu'].includes(state)) {
            return NextResponse.json(
                { error: 'Invalid state. Must be west_bengal or tamil_nadu' },
                { status: 400 }
            );
        }

        console.log(`🤖 Generating cards for ${state}...`);

        // Step 1: Fetch election data from Wikipedia
        const electionResult = await fetchElectionData(state as 'west_bengal' | 'tamil_nadu');

        if (!electionResult.success || !electionResult.data) {
            return NextResponse.json(
                { error: 'Failed to fetch election data' },
                { status: 500 }
            );
        }

        // Step 2: Generate cards using Gemini
        const cardsResult = await generateCards(
            state as 'west_bengal' | 'tamil_nadu',
            electionResult.data.text
        );

        if (!cardsResult.success || !cardsResult.cards) {
            return NextResponse.json(
                { error: cardsResult.error || 'Failed to generate cards' },
                { status: 500 }
            );
        }

        // Step 3: Cache the generated cards
        try {
            await cacheHighlights(
                state,
                'all',
                cardsResult.cards as any,
                { source: electionResult.data.url }
            );
            console.log(`✅ Cards cached for ${state}`);
        } catch (cacheError) {
            console.warn('⚠️ Failed to cache cards:', cacheError);
            // Continue even if caching fails
        }

        return NextResponse.json({
            success: true,
            cards: cardsResult.cards,
        });
    } catch (error) {
        console.error('Error generating cards:', error);
        return NextResponse.json(
            { error: 'Failed to generate cards' },
            { status: 500 }
        );
    }
}
