'use client';

interface StateFilterProps {
    currentState: string;
    onStateChange: (state: string) => void;
}

const STATES = [
    { value: 'all', label: 'All' },
    { value: 'west_bengal', label: 'West Bengal' },
    { value: 'tamil_nadu', label: 'Tamil Nadu' },
];

export function StateFilter({ currentState, onStateChange }: StateFilterProps) {
    return (
        <div className="flex gap-2 w-full overflow-x-auto px-4 py-2">
            {STATES.map((state) => (
                <button
                    key={state.value}
                    onClick={() => onStateChange(state.value)}
                    className={`
            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
            min-h-[44px]
            ${currentState === state.value
                            ? 'bg-zinc-50 text-zinc-950'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-50'
                        }
          `}
                >
                    {state.label}
                </button>
            ))}
        </div>
    );
}
