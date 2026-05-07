'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MessageSquare, Bookmark } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // InsForge Google OAuth flow
    const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
    if (!INSFORGE_URL) {
      console.error('InsForge URL not configured');
      setIsLoading(false);
      return;
    }

    // Redirect to InsForge OAuth
    window.location.href = `${INSFORGE_URL}/auth/google`;
  };

  const handleContinueWithoutAuth = () => {
    router.push('/feed');
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-12 bg-zinc-950">
      <div className="w-full max-w-2xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="mb-4">
            2026 Assembly Elections
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-50">
            Election Highlights
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-lg mx-auto">
            West Bengal & Tamil Nadu — bite-sized insights, powered by AI
          </p>
        </div>

        {/* Sign In Button */}
        <div className="space-y-3">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full h-12 text-base font-medium"
          >
            {isLoading ? (
              'Signing in...'
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          <Button
            onClick={handleContinueWithoutAuth}
            variant="ghost"
            size="lg"
            className="w-full h-12 text-base text-zinc-400 hover:text-zinc-50"
          >
            Continue without signing in
          </Button>
        </div>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <h3 className="font-semibold text-zinc-50">Live Highlights</h3>
              <p className="text-sm text-zinc-400">
                Swipe through AI-generated cards covering results, upsets, and controversies
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-3">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <h3 className="font-semibold text-zinc-50">AI Chat</h3>
              <p className="text-sm text-zinc-400">
                Ask Gemini follow-up questions about any election topic
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 space-y-3">
              <Bookmark className="h-8 w-8 text-amber-500" />
              <h3 className="font-semibold text-zinc-50">Bookmarks</h3>
              <p className="text-sm text-zinc-400">
                Save your favorite insights and revisit them anytime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-zinc-500 pt-4">
          <p>Data sourced from Wikipedia & ECI • Built with Gemini AI</p>
        </div>
      </div>
    </div>
  );
}
