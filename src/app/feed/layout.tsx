'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StateFilter } from '@/components/state-filter';
import { CategoryTabs } from '@/components/category-tabs';

export default function FeedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const state = searchParams.get('state') || 'all';
    const category = searchParams.get('category') || 'all';

    const handleStateChange = (newState: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('state', newState);
        router.push(`/feed?${params.toString()}`);
    };

    const handleCategoryChange = (newCategory: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('category', newCategory);
        router.push(`/feed?${params.toString()}`);
    };

    return (
        <div className="flex flex-col flex-1 bg-zinc-950">
            {/* Sticky Filters */}
            <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 space-y-1">
                <StateFilter currentState={state} onStateChange={handleStateChange} />
                <CategoryTabs currentCategory={category} onCategoryChange={handleCategoryChange} />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
