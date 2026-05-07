'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HighlightCardComponent } from '@/components/highlight-card';
import { HighlightCard } from '@/lib/gemini';

export default function FeedPage() {
    const searchParams = useSearchParams();
    const state = searchParams.get('state') || 'all';
    const category = searchParams.get('category') || 'all';

    const [cards, setCards] = useState<HighlightCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCards() {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    state,
                    category,
                });

                const response = await fetch(`/api/highlights?${params.toString()}`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch cards');
                }

                setCards(data.cards || []);
            } catch (err) {
                console.error('Error fetching cards:', err);
                setError(err instanceof Error ? err.message : 'Failed to load cards');
            } finally {
                setLoading(false);
            }
        }

        fetchCards();
    }, [state, category]);

    if (loading) {
        return (
            <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-zinc-900 rounded-lg p-5 space-y-4 animate-pulse">
                        <div className="flex gap-2">
                            <div className="h-6 w-20 bg-zinc-800 rounded" />
                            <div className="h-4 w-24 bg-zinc-800 rounded" />
                        </div>
                        <div className="h-6 w-3/4 bg-zinc-800 rounded" />
                        <div className="h-4 w-full bg-zinc-800 rounded" />
                        <div className="h-12 w-32 bg-zinc-800 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-lg mx-auto px-4 py-12 text-center space-y-4">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-xl font-bold text-zinc-50">Failed to Load</h2>
                <p className="text-zinc-400">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-50 transition-colors min-h-[44px]"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="w-full max-w-lg mx-auto px-4 py-12 text-center space-y-4">
                <div className="text-6xl">📭</div>
                <h2 className="text-xl font-bold text-zinc-50">No Highlights Found</h2>
                <p className="text-zinc-400">Try a different category or state filter</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
            {cards.map((card) => (
                <HighlightCardComponent key={card.id} card={card} />
            ))}
        </div>
    );
}
