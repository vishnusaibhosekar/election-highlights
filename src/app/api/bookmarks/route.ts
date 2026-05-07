import { NextRequest, NextResponse } from 'next/server';
import { getBookmarks, addBookmark, removeBookmark, isBookmarked } from '@/lib/insforge';

// Helper to get user ID from request (from auth token or cookie)
function getUserId(request: NextRequest): string | null {
    // For now, return null - we'll implement proper auth later
    // In production, extract from JWT token or session cookie
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        // Parse JWT token to get user ID
        // This is simplified - use proper JWT verification in production
        return 'anonymous-user';
    }
    return null;
}

export async function GET(request: NextRequest) {
    try {
        const userId = getUserId(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const result = await getBookmarks(userId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            bookmarks: result.data,
        });
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookmarks' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserId(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { cardId, cardData } = body;

        if (!cardId || !cardData) {
            return NextResponse.json(
                { error: 'Missing required fields: cardId, cardData' },
                { status: 400 }
            );
        }

        const result = await addBookmark(userId, cardId, cardData);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            bookmark: result.data,
        });
    } catch (error) {
        console.error('Error adding bookmark:', error);
        return NextResponse.json(
            { error: 'Failed to add bookmark' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const userId = getUserId(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { bookmarkId } = body;

        if (!bookmarkId) {
            return NextResponse.json(
                { error: 'Missing required field: bookmarkId' },
                { status: 400 }
            );
        }

        const result = await removeBookmark(userId, bookmarkId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('Error removing bookmark:', error);
        return NextResponse.json(
            { error: 'Failed to remove bookmark' },
            { status: 500 }
        );
    }
}
