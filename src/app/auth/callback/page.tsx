'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;

const insforge = createClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
});

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function handleCallback() {
            try {
                // Get tokens from URL hash (InsForge OAuth returns them in hash)
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);

                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (!accessToken) {
                    setError('No access token received. Please try again.');
                    return;
                }

                // Store tokens in cookies for server-side access
                document.cookie = `insforge_access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
                if (refreshToken) {
                    document.cookie = `insforge_refresh_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
                }

                // Redirect to feed on success
                router.push('/feed');
            } catch (err) {
                console.error('Auth callback error:', err);
                setError('Failed to complete sign in. Please try again.');
            }
        }

        handleCallback();
    }, [router, searchParams]);

    if (error) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center px-4 bg-zinc-950">
                <div className="text-center space-y-4 max-w-md">
                    <h2 className="text-2xl font-bold text-zinc-50">Sign In Failed</h2>
                    <p className="text-zinc-400">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-50 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 items-center justify-center px-4 bg-zinc-950">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-50 mx-auto"></div>
                <p className="text-zinc-400">Completing sign in...</p>
            </div>
        </div>
    );
}
