import { NextRequest, NextResponse } from 'next/server';
import { getCachedHighlights } from '@/lib/insforge';
import { generateCards } from '@/lib/gemini';
import { fetchElectionData } from '@/lib/tinyfish';
import { HighlightCard, CardCategory } from '@/lib/gemini';

const VALID_STATES = ['all', 'west_bengal', 'tamil_nadu'];
const VALID_CATEGORIES = ['all', 'results', 'upsets', 'swings', 'turnout', 'controversies', 'coalitions', 'historic_firsts'];

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const state = searchParams.get('state') || 'all';
        const category = searchParams.get('category') || 'all';

        if (!VALID_STATES.includes(state)) {
            return NextResponse.json(
                { error: 'Invalid state' },
                { status: 400 }
            );
        }

        if (!VALID_CATEGORIES.includes(category)) {
            return NextResponse.json(
                { error: 'Invalid category' },
                { status: 400 }
            );
        }

        // Check cache first
        const statesToFetch = state === 'all' ? ['west_bengal', 'tamil_nadu'] : [state];
        const allCards: HighlightCard[] = [];

        for (const s of statesToFetch) {
            const cacheKey = category === 'all' ? 'all' : category;

            const cached = await getCachedHighlights(s, cacheKey);

            if (cached.success && cached.data) {
                // Check if cache is less than 1 hour old
                const cachedAt = new Date(cached.data.generated_at);
                const now = new Date();
                const hoursSinceCache = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);

                if (hoursSinceCache < 1) {
                    // Use cached data
                    allCards.push(...(cached.data.cards as HighlightCard[]));
                    console.log(`📦 Using cached highlights for ${s}/${cacheKey}`);
                    continue;
                }
            }

            // Cache miss or expired - generate new cards
            console.log(`🔄 Generating new highlights for ${s}...`);
            const electionResult = await fetchElectionData(s as 'west_bengal' | 'tamil_nadu');

            if (!electionResult.success || !electionResult.data) {
                console.warn(`Failed to fetch data for ${s}, skipping`);
                continue;
            }

            const cardsResult = await generateCards(
                s as 'west_bengal' | 'tamil_nadu',
                electionResult.data.text
            );

            if (cardsResult.success && cardsResult.cards) {
                allCards.push(...cardsResult.cards);
            }
        }

        // Filter by category if needed
        const filteredCards = category === 'all'
            ? allCards
            : allCards.filter(card => card.category === category);

        return NextResponse.json({
            success: true,
            cards: filteredCards,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('Error fetching highlights:', error);
        return NextResponse.json(
            { error: 'Failed to fetch highlights' },
            { status: 500 }
        );
    }
}
