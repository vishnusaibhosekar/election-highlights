import { NextRequest, NextResponse } from 'next/server';
import { getCachedHighlights, cacheHighlights } from '@/lib/insforge';
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
            // Always check 'all' cache first (since we generate all categories together)
            const cached = await getCachedHighlights(s, 'all');

            if (cached.success && cached.data) {
                // Check if cache is less than 1 hour old
                const cachedAt = new Date(cached.data.generated_at);
                const now = new Date();
                const hoursSinceCache = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);

                if (hoursSinceCache < 1) {
                    // Use cached data and filter by category
                    const allCardsFromCache = cached.data.cards as HighlightCard[];
                    const filtered = category === 'all'
                        ? allCardsFromCache
                        : allCardsFromCache.filter(card => card.category === category);
                    allCards.push(...filtered);
                    console.log(`📦 Using cached highlights for ${s} (filtered by ${category})`);
                    continue;
                } else {
                    console.log(`⏰ Cache expired for ${s} (${hoursSinceCache.toFixed(1)} hours old)`);
                }
            } else {
                console.log(`📭 No cache found for ${s}`);
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

            console.log(`🤖 Gemini response for ${s}:`, {
                success: cardsResult.success,
                cardsCount: cardsResult.cards?.length || 0,
                error: cardsResult.error,
            });

            if (cardsResult.success && cardsResult.cards) {
                // Cache the generated cards
                try {
                    await cacheHighlights(
                        s,
                        'all',
                        cardsResult.cards as any,
                        { source: electionResult.data?.url }
                    );
                    console.log(`✅ Cards cached for ${s}`);
                } catch (cacheError) {
                    console.warn(`⚠️ Failed to cache cards for ${s}:`, cacheError);
                }

                // Filter by category
                const filtered = category === 'all'
                    ? cardsResult.cards
                    : cardsResult.cards.filter(card => card.category === category);
                allCards.push(...filtered);
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
