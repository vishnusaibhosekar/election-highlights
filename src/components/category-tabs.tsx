'use client';

interface CategoryTabsProps {
    currentCategory: string;
    onCategoryChange: (category: string) => void;
}

const CATEGORIES = [
    { value: 'all', label: 'All', emoji: '📰' },
    { value: 'results', label: 'Results', emoji: '🏆' },
    { value: 'upsets', label: 'Upsets', emoji: '⚡' },
    { value: 'swings', label: 'Swings', emoji: '🔄' },
    { value: 'turnout', label: 'Turnout', emoji: '📊' },
    { value: 'controversies', label: 'Controversies', emoji: '🔥' },
    { value: 'coalitions', label: 'Coalitions', emoji: '🤝' },
    { value: 'historic_firsts', label: 'Historic', emoji: '🏛️' },
];

export function CategoryTabs({ currentCategory, onCategoryChange }: CategoryTabsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide snap-x snap-mandatory">
            {CATEGORIES.map((category) => (
                <button
                    key={category.value}
                    onClick={() => onCategoryChange(category.value)}
                    className={`
            flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all snap-start
            min-h-[44px]
            ${currentCategory === category.value
                            ? 'bg-zinc-800 text-zinc-50'
                            : 'bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50'
                        }
          `}
                >
                    <span>{category.emoji}</span>
                    <span>{category.label}</span>
                </button>
            ))}
        </div>
    );
}
