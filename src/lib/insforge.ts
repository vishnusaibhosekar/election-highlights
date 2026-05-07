/**
 * InsForge Database Utility
 * 
 * Provides typed database operations for:
 * - Bookmarks (user-specific)
 * - Chat sessions (user-specific)
 * - Cached highlights (public read, authenticated write)
 */

import { createClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!INSFORGE_URL || !INSFORGE_ANON_KEY) {
    console.warn('⚠️  InsForge environment variables are not set');
}

// Initialize InsForge client
export const insforge = createClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
});

// Type definitions
export interface Bookmark {
    id: string;
    user_id: string;
    card_id: string;
    card_data: Record<string, any>;
    created_at: string;
}

export interface ChatSession {
    id: string;
    user_id: string;
    card_id: string;
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp?: string;
    }>;
    created_at: string;
    updated_at: string;
}

export interface CachedHighlight {
    id: string;
    state: string;
    category: string;
    cards: Record<string, any>[];
    source_data?: Record<string, any>;
    generated_at: string;
}

export interface DatabaseResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Bookmarks Operations
 */

export async function getBookmarks(userId: string): Promise<DatabaseResponse<Bookmark[]>> {
    try {
        const { data, error } = await insforge.database
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function addBookmark(
    userId: string,
    cardId: string,
    cardData: Record<string, any>
): Promise<DatabaseResponse<Bookmark>> {
    try {
        const { data, error } = await insforge.database
            .from('bookmarks')
            .insert([
                {
                    user_id: userId,
                    card_id: cardId,
                    card_data: cardData,
                },
            ])
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function removeBookmark(
    userId: string,
    bookmarkId: string
): Promise<DatabaseResponse<void>> {
    try {
        const { error } = await insforge.database
            .from('bookmarks')
            .delete()
            .eq('id', bookmarkId)
            .eq('user_id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function isBookmarked(
    userId: string,
    cardId: string
): Promise<DatabaseResponse<boolean>> {
    try {
        const { data, error } = await insforge.database
            .from('bookmarks')
            .select('id')
            .eq('user_id', userId)
            .eq('card_id', cardId)
            .limit(1);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data.length > 0 };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Chat Sessions Operations
 */

export async function getChatSession(
    userId: string,
    cardId: string
): Promise<DatabaseResponse<ChatSession | null>> {
    try {
        const { data, error } = await insforge.database
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('card_id', cardId)
            .maybeSingle();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function createChatSession(
    userId: string,
    cardId: string,
    messages: ChatSession['messages'] = []
): Promise<DatabaseResponse<ChatSession>> {
    try {
        const { data, error } = await insforge.database
            .from('chat_sessions')
            .insert([
                {
                    user_id: userId,
                    card_id: cardId,
                    messages,
                },
            ])
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function updateChatSession(
    sessionId: string,
    userId: string,
    messages: ChatSession['messages']
): Promise<DatabaseResponse<ChatSession>> {
    try {
        const { data, error } = await insforge.database
            .from('chat_sessions')
            .update({
                messages,
                updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Cached Highlights Operations
 */

export async function getCachedHighlights(
    state: string,
    category: string
): Promise<DatabaseResponse<CachedHighlight | null>> {
    try {
        const { data, error } = await insforge.database
            .from('cached_highlights')
            .select('*')
            .eq('state', state)
            .eq('category', category)
            .maybeSingle();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function cacheHighlights(
    state: string,
    category: string,
    cards: Record<string, any>[],
    sourceData?: Record<string, any>
): Promise<DatabaseResponse<CachedHighlight>> {
    try {
        // Check if cache entry exists
        const existing = await getCachedHighlights(state, category);

        if (existing.success && existing.data) {
            // Update existing
            const { data, error } = await insforge.database
                .from('cached_highlights')
                .update({
                    cards,
                    source_data: sourceData,
                    generated_at: new Date().toISOString(),
                })
                .eq('id', existing.data.id)
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } else {
            // Insert new
            const { data, error } = await insforge.database
                .from('cached_highlights')
                .insert([
                    {
                        state,
                        category,
                        cards,
                        source_data: sourceData,
                    },
                ])
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function clearExpiredCache(hoursOld: number = 1): Promise<DatabaseResponse<void>> {
    try {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hoursOld);

        const { error } = await insforge.database
            .from('cached_highlights')
            .delete()
            .lt('generated_at', cutoffTime.toISOString());

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
