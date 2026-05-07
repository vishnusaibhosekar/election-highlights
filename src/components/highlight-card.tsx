'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark } from 'lucide-react';
import { HighlightCard } from '@/lib/gemini';

interface HighlightCardComponentProps {
    card: HighlightCard;
    isBookmarked?: boolean;
    onBookmarkToggle?: (cardId: string) => void;
}

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

export function HighlightCardComponent({
    card,
    isBookmarked = false,
    onBookmarkToggle,
}: HighlightCardComponentProps) {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/feed/${card.id}`);
    };

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onBookmarkToggle?.(card.id);
    };

    const categoryColor = CATEGORY_COLORS[card.category] || 'bg-zinc-800 text-zinc-300';
    const categoryLabel = CATEGORY_LABELS[card.category] || card.category;
    const stateLabel = STATE_LABELS[card.state] || card.state;

    return (
        <Card
            onClick={handleClick}
            className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] touch-manipulation"
        >
            <CardContent className="p-5 space-y-4">
                {/* Header: Category + State + Bookmark */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${categoryColor} border`}>
                            {categoryLabel}
                        </Badge>
                        <span className="text-xs text-zinc-500">{stateLabel}</span>
                    </div>
                    {onBookmarkToggle && (
                        <button
                            onClick={handleBookmarkClick}
                            className="p-1.5 hover:bg-zinc-800 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            <Bookmark
                                className={`h-5 w-5 ${isBookmarked ? 'fill-zinc-50 text-zinc-50' : 'text-zinc-500'}`}
                            />
                        </button>
                    )}
                </div>

                {/* Headline */}
                <h3 className="text-xl font-bold text-zinc-50 line-clamp-2 leading-tight">
                    {card.headline}
                </h3>

                {/* Context */}
                <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                    {card.context}
                </p>

                {/* Key Stat */}
                <div className="pt-2">
                    <div className="text-4xl font-bold text-zinc-50">
                        {card.key_stat.value}
                    </div>
                    <div className="text-sm text-zinc-400 mt-1">
                        {card.key_stat.label}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-xs text-zinc-500 pt-2">
                    Tap to explore →
                </div>
            </CardContent>
        </Card>
    );
}
