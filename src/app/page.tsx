'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Bookmark, Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    router.push('/feed');
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-12 bg-zinc-950">
      <div className="w-full max-w-2xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-block px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400 mb-4">
            2026 Assembly Elections
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-50">
            Election Highlights
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-lg mx-auto">
            West Bengal & Tamil Nadu — bite-sized insights, powered by AI
          </p>
        </div>

        {/* Get Started Button */}
        <div>
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="w-full h-12 px-6 bg-zinc-50 hover:bg-zinc-200 disabled:bg-zinc-300 disabled:cursor-not-allowed text-zinc-950 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading highlights...
              </>
            ) : (
              'Explore Election Highlights →'
            )}
          </button>
          {isLoading && (
            <p className="text-sm text-zinc-500 mt-3 text-center">
              First load takes ~20 seconds (scraping Wikipedia + AI generation)
            </p>
          )}
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
