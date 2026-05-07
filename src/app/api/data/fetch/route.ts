import { NextRequest, NextResponse } from 'next/server';
import { fetchElectionData } from '@/lib/tinyfish';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const state = searchParams.get('state');

        if (!state || !['west_bengal', 'tamil_nadu'].includes(state)) {
            return NextResponse.json(
                { error: 'Invalid state. Must be west_bengal or tamil_nadu' },
                { status: 400 }
            );
        }

        console.log(`📡 Fetching election data for ${state}...`);
        const result = await fetchElectionData(state as 'west_bengal' | 'tamil_nadu');

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error fetching election data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch election data' },
            { status: 500 }
        );
    }
}
