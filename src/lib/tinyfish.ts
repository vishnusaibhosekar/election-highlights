/**
 * TinyFish Fetch API Utility
 * 
 * Provides functions to scrape web pages using TinyFish Fetch API.
 * Returns clean markdown content optimized for LLM processing.
 */

interface TinyFishResult {
    url: string;
    final_url: string;
    title: string | null;
    description: string | null;
    language: string | null;
    text: string;
    latency_ms: number | null;
}

interface TinyFishError {
    url: string;
    error: string;
}

interface TinyFishResponse {
    results: TinyFishResult[];
    errors: TinyFishError[];
}

export interface FetchContentResult {
    success: boolean;
    data?: TinyFishResult;
    error?: string;
}

const TINYFISH_API_URL = 'https://api.fetch.tinyfish.ai';
const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY;

if (!TINYFISH_API_KEY) {
    console.warn('⚠️  TINYFISH_API_KEY environment variable is not set');
}

/**
 * Fetch and extract content from one or more URLs using TinyFish
 * 
 * @param urls - Array of URLs to fetch (max 10)
 * @param format - Output format: 'markdown' (default), 'html', or 'json'
 * @returns TinyFishResponse with results and errors
 */
export async function fetchContent(
    urls: string[],
    format: 'markdown' | 'html' | 'json' = 'markdown'
): Promise<TinyFishResponse> {
    if (!TINYFISH_API_KEY) {
        throw new Error('TINYFISH_API_KEY is not configured');
    }

    if (urls.length === 0) {
        throw new Error('At least one URL is required');
    }

    if (urls.length > 10) {
        throw new Error('Maximum 10 URLs allowed per request');
    }

    const response = await fetch(TINYFISH_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TINYFISH_API_KEY,
        },
        body: JSON.stringify({
            urls,
            format,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
            throw new Error('TinyFish API key is invalid (401 Unauthorized)');
        } else if (response.status === 429) {
            throw new Error('TinyFish rate limit exceeded (429 Too Many Requests)');
        } else {
            throw new Error(`TinyFish API error: HTTP ${response.status} - ${errorText}`);
        }
    }

    const data: TinyFishResponse = await response.json();
    return data;
}

/**
 * Fetch content from a single URL
 * 
 * @param url - URL to fetch
 * @param format - Output format (default: 'markdown')
 * @returns FetchContentResult with success/error status
 */
export async function fetchSingleContent(
    url: string,
    format: 'markdown' | 'html' | 'json' = 'markdown'
): Promise<FetchContentResult> {
    try {
        const response = await fetchContent([url], format);

        if (response.errors.length > 0) {
            return {
                success: false,
                error: response.errors[0].error,
            };
        }

        if (response.results.length === 0) {
            return {
                success: false,
                error: 'No results returned',
            };
        }

        return {
            success: true,
            data: response.results[0],
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Election data source URLs
 */
export const ELECTION_URLS = {
    west_bengal: 'https://en.wikipedia.org/wiki/2026_West_Bengal_Legislative_Assembly_election',
    tamil_nadu: 'https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election',
} as const;

/**
 * Fetch election data for a specific state
 * 
 * @param state - 'west_bengal' or 'tamil_nadu'
 * @returns FetchContentResult with election data
 */
export async function fetchElectionData(
    state: 'west_bengal' | 'tamil_nadu'
): Promise<FetchContentResult> {
    const url = ELECTION_URLS[state];
    return fetchSingleContent(url, 'markdown');
}

/**
 * Fetch election data for both states in parallel
 * 
 * @returns Record with state keys and FetchContentResult values
 */
export async function fetchAllElectionData(): Promise<Record<string, FetchContentResult>> {
    const [westBengal, tamilNadu] = await Promise.all([
        fetchElectionData('west_bengal'),
        fetchElectionData('tamil_nadu'),
    ]);

    return {
        west_bengal: westBengal,
        tamil_nadu: tamilNadu,
    };
}
