'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ElectionBarChart } from '@/components/charts/bar-chart';
import { ElectionPieChart } from '@/components/charts/pie-chart';
import { HighlightCard } from '@/lib/gemini';

const CATEGORY_COLORS: Record<string, string> = {
    results: 'bg-green-900 text-green-300 border-green-800',
    upsets: 'bg-amber-900 text-amber-300 border-amber-800',
    swings: 'bg-blue-900 text-blue-300 border-blue-800',
    turnout: 'bg-purple-900 text-purple-300 border-purple-800',
    controversies: 'bg-red-900 text-red-300 border-red-800',
    coalitions: 'bg-indigo-900 text-indigo-300 border-indigo-800',
    historic_firsts: 'bg-orange-900 text-orange-300 border-orange-800',
};

const CATEGORY_LABELS: Record<string, string> = {
    results: 'RESULTS',
    upsets: 'UPSET',
    swings: 'SWING',
    turnout: 'TURNOUT',
    controversies: 'CONTROVERSY',
    coalitions: 'COALITION',
    historic_firsts: 'HISTORIC FIRST',
};

const STATE_LABELS: Record<string, string> = {
    west_bengal: 'West Bengal',
    tamil_nadu: 'Tamil Nadu',
};

export default function DetailPage() {
    const params = useParams();
    const router = useRouter();
    const cardId = params.cardId as string;

    const [card, setCard] = useState<HighlightCard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCard() {
            try {
                console.log('🔍 Fetching card with ID:', cardId);

                // Fetch all cards and find the matching one
                const response = await fetch('/api/highlights?state=all&category=all');
                const data = await response.json();

                console.log('📦 API response:', {
                    success: data.success,
                    totalCards: data.cards?.length || 0,
                    cardIds: data.cards?.map((c: any) => c.id) || [],
                });

                if (!data.success) {
                    throw new Error('Failed to fetch cards');
                }

                const foundCard = data.cards.find((c: HighlightCard) => c.id === cardId);

                console.log('🎯 Found card:', foundCard?.id || 'not found');

                if (!foundCard) {
                    throw new Error('Card not found');
                }

                setCard(foundCard);
            } catch (err) {
                console.error('Error fetching card:', err);
                setError(err instanceof Error ? err.message : 'Failed to load card');
            } finally {
                setLoading(false);
            }
        }

        fetchCard();
    }, [cardId]);

    if (loading) {
        return (
            <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
                <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
                <div className="h-10 w-3/4 bg-zinc-800 rounded animate-pulse" />
                <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="h-72 bg-zinc-800 rounded animate-pulse" />
            </div>
        );
    }

    if (error || !card) {
        return (
            <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-xl font-bold text-zinc-50">Card Not Found</h2>
                <p className="text-zinc-400">{error || 'The card you\'re looking for doesn\'t exist'}</p>
                <Button onClick={() => router.push('/feed')} className="min-h-[44px]">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Feed
                </Button>
            </div>
        );
    }

    const categoryColor = CATEGORY_COLORS[card.category] || 'bg-zinc-800 text-zinc-300';
    const categoryLabel = CATEGORY_LABELS[card.category] || card.category;
    const stateLabel = STATE_LABELS[card.state] || card.state;

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.push('/feed')}
                className="min-h-[44px]"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {/* Header */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${categoryColor} border`}>
                        {categoryLabel}
                    </Badge>
                    <span className="text-sm text-zinc-500">{stateLabel}</span>
                </div>
                <h1 className="text-3xl font-bold text-zinc-50">{card.headline}</h1>
                <p className="text-lg text-zinc-400">{card.context}</p>
            </div>

            {/* Key Stat */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="text-5xl font-bold text-zinc-50">{card.key_stat.value}</div>
                <div className="text-sm text-zinc-400 mt-2">{card.key_stat.label}</div>
            </div>

            {/* Why It Matters */}
            <div className="space-y-3">
                <h2 className="text-xl font-semibold text-zinc-50">Why It Matters</h2>
                <div className="prose prose-invert max-w-none">
                    {card.detail.full_text.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-zinc-300 leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>

            {/* Chart */}
            {card.detail.chart_type !== 'none' && card.detail.chart_data && (
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-zinc-50">Data Visualization</h2>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        {card.detail.chart_type === 'bar' && (
                            <ElectionBarChart data={card.detail.chart_data as any} />
                        )}
                        {card.detail.chart_type === 'pie' && (
                            <ElectionPieChart data={card.detail.chart_data as any} />
                        )}
                        {card.detail.chart_type === 'comparison' && (
                            <ElectionBarChart data={card.detail.chart_data as any} />
                        )}
                    </div>
                </div>
            )}

            {/* Suggested Questions */}
            {card.detail.suggested_questions && card.detail.suggested_questions.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-zinc-50">Suggested Questions</h2>
                    <div className="flex flex-wrap gap-2">
                        {card.detail.suggested_questions.map((question, index) => (
                            <button
                                key={index}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors min-h-[44px]"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat CTA */}
            <div className="pt-4">
                <Button className="w-full h-12 text-base" size="lg">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Chat about this
                </Button>
            </div>

            {/* Sources */}
            {card.detail.sources && card.detail.sources.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-500">Sources</h3>
                    <div className="space-y-2">
                        {card.detail.sources.map((source, index) => (
                            <a
                                key={index}
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                                {source}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
