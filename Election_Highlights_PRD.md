# Election Highlights Engine — PRD & Build Spec

**Project:** Election Highlights Engine
**Event:** GDG Hyderabad — Agentic Premier League (Challenge 2)
**Date:** 6 May 2026
**Build Window:** ~3 hours
**Data Focus:** West Bengal & Tamil Nadu 2026 Assembly Elections (results declared 4 May 2026)

---

## Qoder Agent Context

This document is the single source of truth for building this project. It contains every architectural decision, research finding, and implementation detail. When building, follow this spec exactly — all decisions have been made. If something is ambiguous, check this doc before asking.

### Research Already Completed

The following has been validated and does not need re-research:

1. **TinyFish `fetch_content` works for scraping election data.** Wikipedia election pages are the richest structured source. Tested and confirmed working. ECI's `results.eci.gov.in` is blocked by proxy — do NOT attempt to scrape it directly.

2. **Wikipedia election pages are comprehensive.** Both pages contain: party-wise seat tallies, vote share percentages, candidate lists, constituency-level results, turnout data, alliance details, historical comparisons. These are our primary data source.

3. **Key data URLs (confirmed accessible via TinyFish):**
   - West Bengal: `https://en.wikipedia.org/wiki/2026_West_Bengal_Legislative_Assembly_election`
   - Tamil Nadu: `https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election`
   - News sources for narrative context: Deccan Herald, The Hindu, NDTV (use TinyFish to fetch specific article URLs as needed)

4. **InsForge setup is two commands.** Same as the cricket project. Google OAuth is built-in.

5. **Key election facts already known (do not re-scrape for these):**

   **West Bengal 2026:**
   - 294 seats total. BJP won — first right-wing government in Bengal since 1937.
   - TMC (Mamata Banerjee) defeated after ruling since 2011.
   - Mamata Banerjee lost her own seat AND refused to resign as CM.
   - 92.93% voter turnout — highest ever in Bengal.
   - 9.1 million voters removed during Special Intensive Revision — massive controversy.
   - Repoll scheduled in Falta constituency on 21 May 2026.
   - Voting in two phases: 23 April and 29 April. Results: 4 May.

   **Tamil Nadu 2026:**
   - 234 seats total. TVK (Tamilaga Vettri Kazhagam) emerged as single largest party.
   - TVK founded by actor Vijay — broke 59-year Dravidian party (DMK/AIADMK) duopoly.
   - DMK's M.K. Stalin lost his Kolathur seat (had won 3x consecutively).
   - TVK formed coalition with Congress (INC left DMK's SPA alliance to join TVK).
   - 85.1% voter turnout — highest ever in Tamil Nadu.
   - AIADMK's Palaniswami won Edappadi with widest margin in the state.
   - Voting: 23 April. Results: 4 May.

### Research Qoder Should Do

Before starting implementation, Qoder should research:

1. **InsForge setup & SDK** — Fetch https://insforge.dev/skill.md and follow it exactly. Also fetch https://docs.insforge.dev/quickstart for the TypeScript SDK patterns.
2. **InsForge Google OAuth config** — Fetch InsForge auth docs to understand how to enable Google OAuth provider.
3. **Gemini API TypeScript SDK** — Research `@google/generative-ai` npm package. We need structured JSON output from Gemini for card generation, and streaming responses for the chat feature.
4. **TinyFish API** — Research TinyFish `fetch_content` endpoint for use from a Next.js API route (server-side calls). Docs: https://docs.tinyfish.ai or MCP at https://agent.tinyfish.ai/mcp.
5. **Recharts components** — We need BarChart, PieChart, and a simple heatmap/treemap for the detail views.
6. **shadcn/ui components** — Verify available: Card, Button, Badge, Dialog, Avatar, Tabs, ScrollArea, Input, Separator, Sheet.

---

## Problem Statement

> Build a system that transforms election-related data into simple, intuitive highlights for better understanding and monitoring.

---

## Product Overview

A news-card-style web app that transforms raw election data from the 2026 West Bengal and Tamil Nadu assembly elections into bite-sized, swipeable highlight cards. Each card surfaces one key insight — an upset, a historic first, a turnout record, a controversy. Users tap any card to dive deeper into a detail view with charts, context, and an inline Gemini chat scoped to that topic for follow-up questions.

Think: Instagram Stories meets election data, with an AI analyst you can talk to.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP                               │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Auth Page   │  │  Card Feed   │  │  Detail View            │ │
│  │  (Google     │  │  - Categories│  │  - Full breakdown       │ │
│  │   OAuth)     │  │  - Swipeable │  │  - Charts (Recharts)    │ │
│  │             │  │    cards     │  │  - "Why it matters"     │ │
│  │             │  │  - State     │  │  - Gemini Chat          │ │
│  │             │  │    filter    │  │    (scoped to card)     │ │
│  └─────────────┘  └──────┬───────┘  └─────────────────────────┘ │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                    API ROUTES (/api)                        │  │
│  │                                                            │  │
│  │  /api/highlights/generate  → TinyFish + Gemini → cards    │  │
│  │  /api/highlights/detail    → Gemini detail expansion       │  │
│  │  /api/chat                 → Gemini scoped conversation    │  │
│  │  /api/data/fetch           → TinyFish → Wikipedia scrape   │  │
│  │  /api/bookmarks            → InsForge CRUD                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────┴─────┐  ┌─────┴─────┐  ┌──────┴──────┐
     │ InsForge   │  │ TinyFish  │  │  Gemini API │
     │ (Postgres  │  │ (Wikipedia│  │  (Card gen  │
     │  + Auth)   │  │  + News)  │  │  + Chat)    │
     └───────────┘  └───────────┘  └─────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js (App Router) | SSR + API routes. Same stack as cricket project. |
| UI | shadcn/ui + Tailwind CSS | Card-based layout. Dark theme. |
| Language | TypeScript (end-to-end) | Type safety. |
| Backend/DB | InsForge (Postgres + Auth) | User accounts, bookmarks, chat history. |
| Data Scraping | TinyFish `fetch_content` API | Wikipedia election pages + news articles. |
| AI | Gemini API (`@google/generative-ai`) | Card generation, detail expansion, scoped chat. |
| Charts | Recharts | Vote share bars, turnout comparisons, seat distributions. |
| Deployment | Vercel + InsForge cloud | Auto-deploy from GitHub. |

---

## Auth Flow

- **Provider:** Google OAuth via InsForge
- **Flow:** Landing page → "Sign in with Google" → InsForge handles OAuth → redirect → card feed
- **Why:** Enables bookmarks, chat history, personalized reading state

---

## Database Schema (InsForge)

### `users` table
Handled automatically by InsForge auth. Fields: `id`, `email`, `display_name`, `avatar_url`, `created_at`.

### `bookmarks` table
```sql
CREATE TABLE bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  card_id     TEXT NOT NULL,
  card_data   JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### `chat_sessions` table
```sql
CREATE TABLE chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  card_id       TEXT NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### `cached_highlights` table
```sql
CREATE TABLE cached_highlights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state       TEXT NOT NULL,
  category    TEXT NOT NULL,
  cards       JSONB NOT NULL,
  source_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Core User Flow

### Flow 1: Browse Highlights

1. User lands on the card feed
2. State filter at top: "All" | "West Bengal" | "Tamil Nadu"
3. Category tabs: Results | Upsets | Swings | Turnout | Controversies | Coalitions | Historic Firsts
4. Cards render in a vertical scrollable feed (mobile-friendly)
5. Each card shows: category badge, headline, one-line context, key stat
6. Cards are pre-generated on first load (Gemini processes scraped data → JSON array of cards)
7. Cards are cached in InsForge `cached_highlights` table to avoid re-generation

### Flow 2: Dive Deeper

1. User taps a card
2. Detail view slides in (Sheet component or new page)
3. Shows: full data breakdown, chart visualization (Recharts), "Why it matters" paragraph, source attribution
4. "Chat about this" button at the bottom

### Flow 3: Chat with Gemini

1. User taps "Chat about this"
2. Inline chat panel opens, scoped to the card's topic
3. Gemini has the card's underlying data + election context as system prompt
4. User asks follow-ups: "Why did TMC lose?", "How did this compare to 2021?", "What happens with the repoll?"
5. Gemini responds with data-grounded answers
6. Chat history persisted in InsForge `chat_sessions` table

---

## Card System

### Card Categories

| Category | Icon | Description | Example Cards |
|---|---|---|---|
| Results | 🏆 | Party-wise seat tallies, winner declarations | "BJP wins Bengal: 165 seats" |
| Upsets | ⚡ | Big leaders who lost, surprise outcomes | "Stalin loses Kolathur after 3 consecutive wins" |
| Swings | 🔄 | Seats that flipped, margin changes from 2021 | "42 seats flip from TMC to BJP in Bengal" |
| Turnout | 📊 | Participation stats, district comparisons | "Bengal hits 92.93% — highest ever" |
| Controversies | 🔥 | Voter roll issues, repolls, legal challenges | "9.1M voters removed from Bengal rolls" |
| Coalitions | 🤝 | Post-election alliance math, government formation | "TVK + Congress = majority in Tamil Nadu" |
| Historic Firsts | 🏛️ | Records broken, streaks ended | "TVK breaks 59-year Dravidian duopoly" |

### Card Data Structure

```typescript
interface HighlightCard {
  id: string;                    // unique card ID (generated)
  state: 'west_bengal' | 'tamil_nadu';
  category: CardCategory;
  headline: string;              // max 60 chars, punchy
  context: string;               // one-line explainer, max 120 chars
  key_stat: {
    value: string;               // "92.93%", "165", "9.1M"
    label: string;               // "voter turnout", "seats won", "voters removed"
  };
  detail: {
    full_text: string;           // 2-3 paragraph "why it matters" from Gemini
    chart_type: 'bar' | 'pie' | 'comparison' | 'none';
    chart_data: Record<string, any>;  // structured data for Recharts
    sources: string[];           // URLs for attribution
    suggested_questions: string[]; // 3 follow-up Qs for the chat
  };
  generated_at: string;          // ISO timestamp
}

type CardCategory = 'results' | 'upsets' | 'swings' | 'turnout' | 'controversies' | 'coalitions' | 'historic_firsts';
```

### Card UI Design

```
┌─────────────────────────────────┐
│  ⚡ UPSET          West Bengal   │  ← category badge + state
│                                 │
│  Mamata Refuses to Resign       │  ← headline (bold, large)
│  Despite Losing Seat & Majority │
│                                 │
│  First sitting CM to refuse     │  ← context (muted, smaller)
│  resignation after assembly     │
│  election loss                  │
│                                 │
│  ┌───────────┐                  │
│  │    15     │ years in power   │  ← key stat (large number + label)
│  └───────────┘                  │
│                                 │
│  Tap to explore →               │  ← subtle CTA
└─────────────────────────────────┘
```

- Dark background (`bg-zinc-900`)
- Category badge color-coded (upsets = amber, results = green, controversies = red)
- Key stat number is oversized (text-4xl)
- Subtle hover/tap animation
- Card width: full on mobile, max-w-lg on desktop

---

## Detail View Design

```
┌─────────────────────────────────┐
│  ← Back                        │
│                                 │
│  ⚡ UPSET · West Bengal          │
│                                 │
│  Mamata Refuses to Resign       │
│  Despite Losing Seat & Majority │
│                                 │
├─────────────────────────────────┤
│                                 │
│  WHY IT MATTERS                 │
│  Mamata Banerjee's refusal to   │
│  step down after losing both    │
│  her seat and assembly majority │
│  is unprecedented in Indian     │
│  democratic history...          │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │   [BAR CHART]           │    │
│  │   BJP: 165  TMC: 95     │    │  ← Recharts visualization
│  │   INC: 20   Others: 14  │    │
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│                                 │
│  SUGGESTED QUESTIONS            │
│  • Why did TMC lose Bengal?     │
│  • What happens with the        │
│    repoll in Falta?             │
│  • How does this compare        │
│    to 2021?                     │
│                                 │
├─────────────────────────────────┤
│                                 │
│  [💬 Chat about this]           │  ← opens Gemini chat
│                                 │
└─────────────────────────────────┘
```

---

## Gemini Prompts

### Prompt 1: Card Generation

Called once on first load (or refresh). Input: raw Wikipedia election data scraped via TinyFish.

```
You are an election data analyst creating highlight cards for a news app.
You will receive raw election data from the 2026 {state} Assembly Election.

Generate a JSON array of highlight cards. Each card surfaces ONE key insight
that a regular citizen would find interesting, surprising, or important.

Generate cards across these categories:
- results: party-wise seat tallies, vote share
- upsets: big leaders who lost, surprise outcomes
- swings: seats that changed hands, margin shifts from 2021
- turnout: participation records, district variations
- controversies: legal issues, voter roll problems, repolls
- coalitions: post-election alliances, government formation math
- historic_firsts: records broken, unprecedented events

For each card provide:
{
  "id": "<unique_id>",
  "state": "<west_bengal|tamil_nadu>",
  "category": "<category>",
  "headline": "<max 60 chars, punchy, no period>",
  "context": "<one line explainer, max 120 chars>",
  "key_stat": { "value": "<number or short string>", "label": "<what it measures>" },
  "detail": {
    "full_text": "<2-3 paragraphs explaining why this matters, in simple language>",
    "chart_type": "<bar|pie|comparison|none>",
    "chart_data": <structured data object for the chart>,
    "sources": ["<source URLs>"],
    "suggested_questions": ["<3 follow-up questions a curious citizen might ask>"]
  }
}

Rules:
- Generate 8-12 cards per state
- Headlines must be jargon-free — a first-time voter should understand them
- Key stats should use the most impactful number (percentages, seat counts, margins)
- Chart data must be valid for Recharts (array of objects with name/value keys)
- Full text should explain context a 20-year-old would need, not a political analyst
- Respond ONLY with the JSON array, no markdown, no preamble
```

### Prompt 2: Scoped Chat

System prompt for the chat feature when a user taps "Chat about this" on a specific card.

```
You are a friendly, non-partisan election analyst helping a curious citizen
understand the 2026 {state} Assembly Election.

The user is looking at this highlight:
- Topic: {card.headline}
- Context: {card.context}
- Key stat: {card.key_stat.value} {card.key_stat.label}
- Full context: {card.detail.full_text}

Additional election data for reference:
{raw_election_data_summary}

Rules:
- Answer in simple, jargon-free language
- Be strictly non-partisan — present facts, not opinions
- If comparing parties, present both sides fairly
- Use specific numbers and data points when available
- If you don't have the data to answer, say so honestly
- Keep responses concise (2-4 paragraphs max unless asked for more)
- Do NOT speculate on future political outcomes
```

---

## Gemini Configuration

- **Model for card generation:** `gemini-2.0-flash` (fast, structured output)
- **Model for chat:** `gemini-2.0-flash` (fast conversational responses)
- **Temperature for cards:** 0.3 (consistent, factual)
- **Temperature for chat:** 0.5 (slightly more conversational but still grounded)
- **Max tokens for cards:** 4000 (large JSON array)
- **Max tokens for chat:** 500 (concise responses)
- **Response format:** JSON for cards, plain text for chat

---

## Data Pipeline

### Step 1: Scrape (on first load or manual refresh)

```
/api/data/fetch?state=west_bengal
  → TinyFish fetch_content("https://en.wikipedia.org/wiki/2026_West_Bengal_Legislative_Assembly_election")
  → Returns markdown with tables, text, statistics
  → Store raw data in memory or InsForge cached_highlights

/api/data/fetch?state=tamil_nadu
  → TinyFish fetch_content("https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election")
  → Same flow
```

### Step 2: Generate Cards (Gemini)

```
/api/highlights/generate?state=west_bengal
  → Take raw scraped data
  → Send to Gemini with card generation prompt
  → Parse JSON response into HighlightCard[]
  → Cache in InsForge cached_highlights table
  → Return to frontend
```

### Step 3: Serve Cards (cached)

```
/api/highlights?state=all&category=upsets
  → Check InsForge cache
  → If cache exists and < 1 hour old, return cached
  → Otherwise, re-generate
```

### Caching Strategy

Cards are expensive to generate (TinyFish scrape + Gemini processing). Cache aggressively:
- Cache cards in InsForge `cached_highlights` table
- Cache key: `{state}_{category}`
- TTL: 1 hour (election data doesn't change fast post-results)
- Manual refresh button for judges to see live generation

---

## Page Structure (Next.js App Router)

```
app/
├── layout.tsx                  # Root layout, dark theme, InsForge provider, fonts
├── page.tsx                    # Landing page → "Sign in with Google" or redirect to feed
├── auth/
│   └── callback/
│       └── page.tsx            # OAuth callback handler
├── feed/
│   ├── layout.tsx              # Feed shell: state filter + category tabs
│   ├── page.tsx                # Card feed (default: all states, all categories)
│   └── [cardId]/
│       └── page.tsx            # Detail view for a specific card
├── chat/
│   └── [cardId]/
│       └── page.tsx            # Gemini chat scoped to a card (or inline Sheet)
├── bookmarks/
│   └── page.tsx                # User's bookmarked cards
├── api/
│   ├── data/
│   │   └── fetch/
│   │       └── route.ts        # GET ?state=... → TinyFish → Wikipedia scrape
│   ├── highlights/
│   │   ├── generate/
│   │   │   └── route.ts        # POST → Gemini card generation → InsForge cache
│   │   └── route.ts            # GET ?state=...&category=... → cached cards
│   ├── chat/
│   │   └── route.ts            # POST → Gemini scoped chat (streaming)
│   └── bookmarks/
│       └── route.ts            # GET/POST/DELETE → InsForge bookmarks CRUD
```

---

## UI Components

### 1. State Filter Bar (top of feed)
- Horizontal pill buttons: "All" | "West Bengal" | "Tamil Nadu"
- Sticky at top
- Active state highlighted

### 2. Category Tabs (below state filter)
- Horizontal scrollable tabs: Results | Upsets | Swings | Turnout | Controversies | Coalitions | Historic Firsts
- Each tab has its emoji icon
- "All" tab shows mixed feed

### 3. Highlight Card (feed item)
- shadcn Card component
- Category badge (top-left, color-coded)
- State badge (top-right)
- Headline (text-xl, font-bold)
- Context (text-sm, text-zinc-400)
- Key stat (text-4xl number + text-sm label)
- Tap handler → navigates to detail view
- Bookmark icon (top-right corner, toggleable)

### 4. Detail View (expanded card)
- Back button
- Card header (category + state + headline)
- "Why it matters" section (prose)
- Chart section (Recharts — bar/pie/comparison based on card.detail.chart_type)
- Suggested questions (tappable chips that pre-fill the chat)
- "Chat about this" CTA button
- Source links at bottom

### 5. Chat Panel
- Sheet component sliding up from bottom (mobile pattern) or side panel (desktop)
- Chat header: card headline as context
- Message list (user messages right-aligned, Gemini left-aligned)
- Suggested question chips above input (from card.detail.suggested_questions)
- Text input + send button
- Streaming response from Gemini
- Persist to InsForge chat_sessions

### 6. Bookmarks Page
- Grid of saved cards (same card component)
- "Remove bookmark" action
- Empty state: "No bookmarks yet — explore highlights to save your favorites"

---

## Chart Specifications (Recharts)

### Bar Chart (for seat tallies)
```typescript
// chart_data format:
[
  { name: "BJP", value: 165, fill: "#FF9933" },
  { name: "TMC", value: 95, fill: "#00BCD4" },
  { name: "INC", value: 20, fill: "#19AAAF" },
  { name: "Others", value: 14, fill: "#888" }
]
```

### Pie Chart (for vote share)
```typescript
[
  { name: "BJP", value: 42.3, fill: "#FF9933" },
  { name: "TMC", value: 35.1, fill: "#00BCD4" },
  { name: "INC", value: 12.8, fill: "#19AAAF" },
  { name: "Others", value: 9.8, fill: "#888" }
]
```

### Comparison Chart (for 2021 vs 2026)
```typescript
[
  { name: "BJP", seats_2021: 77, seats_2026: 165 },
  { name: "TMC", seats_2021: 215, seats_2026: 95 },
  { name: "INC", seats_2021: 0, seats_2026: 20 }
]
```

Use dark theme colors. Background transparent. Axis labels in zinc-400. Grid lines subtle.

---

## Party Colors Reference

Use these for chart fills and UI accents:

| Party | Color | Hex |
|---|---|---|
| BJP | Saffron | #FF9933 |
| TMC (AITC) | Cyan/Teal | #00BCD4 |
| INC | Green-Teal | #19AAAF |
| DMK | Red | #E53935 |
| AIADMK | Green-Yellow | #8BC34A |
| TVK | Blue | #1565C0 |
| CPIM | Red | #CC0000 |
| Others | Gray | #888888 |

---

## Environment Variables

```env
# InsForge
NEXT_PUBLIC_INSFORGE_URL=<project URL>
INSFORGE_API_KEY=<secret key — server-side only>
NEXT_PUBLIC_INSFORGE_ANON_KEY=<public anon key>

# Gemini
GEMINI_API_KEY=<Google AI Studio or Cloud key>

# TinyFish
TINYFISH_API_KEY=<TinyFish API key>
```

---

## Build Plan (3-Hour Sprint)

| Time | Phase | Deliverable |
|---|---|---|
| 0:00–0:20 | **Setup** | Project init (already done), InsForge tables, Google OAuth config, verify env vars |
| 0:20–0:50 | **Data Layer** | Build `/api/data/fetch` (TinyFish → Wikipedia). Build `/api/highlights/generate` (Gemini card generation). Test with real data, iterate on prompt until cards are good. |
| 0:50–1:20 | **Card Feed UI** | Build feed page with state filter + category tabs. Render cards from API. Styling: dark theme, color-coded badges, oversized key stats. |
| 1:20–1:50 | **Detail View** | Build detail page with full text, Recharts charts, suggested questions. Wire up navigation from card tap. |
| 1:50–2:20 | **Gemini Chat** | Build `/api/chat` with streaming. Build chat UI (Sheet panel). Scope Gemini to card context. Wire suggested questions as pre-fills. |
| 2:20–2:45 | **Polish** | Bookmarks, loading states, error handling, card animations, responsive tweaks. |
| 2:45–3:00 | **Demo Prep** | Screen recording: browse cards → tap for detail → chat with Gemini. Post to social media. |

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Wikipedia page structure changes | Parse markdown broadly; Gemini can handle messy input. Don't depend on exact table formats. |
| Gemini returns invalid JSON for cards | Enforce JSON-only in system prompt. Wrap in try-catch with retry. Validate schema before rendering. |
| Card generation is slow (TinyFish + Gemini) | Cache aggressively in InsForge. Show loading skeleton cards. Generate per-state in parallel. |
| Charts don't render correctly | Have a `chart_type: 'none'` fallback. Test with mock data first. |
| Chat goes off-topic or becomes partisan | Strong system prompt: "non-partisan, facts only, say 'I don't have that data' if unsure." |
| TinyFish rate limits | Wikipedia data is static post-results — cache after first fetch. Only re-fetch on manual refresh. |

---

## Non-Partisan Guidelines

This app presents election data, which is politically sensitive. Critical rules:

- **Never editorialize.** Present facts: seat counts, vote shares, margins. No "landslide victory" or "crushing defeat" — let the numbers speak.
- **Both sides of every controversy.** Voter roll deletions: present the BJP argument (removing bogus entries) AND the TMC argument (disenfranchising genuine voters).
- **No predictions.** Don't speculate about future elections, political consequences, or governance outcomes.
- **Attribution.** Always cite where data comes from (ECI, Wikipedia, specific news source).
- **Gemini prompt guardrails.** System prompt explicitly says "be strictly non-partisan."

---

## Social Media Deliverable

Screen recording showing:
1. Card feed with both states, multiple categories
2. Tapping a card → detail view with chart
3. Asking Gemini a follow-up question in chat
4. Getting a data-grounded, non-partisan response

Post with: #GoogleCloud #GoogleCloudAPL #BuildWithAI
Tag: @GoogleCloud_IN

---

## Out of Scope (Tonight)

- Real-time election monitoring (results are already declared)
- Constituency-level drill-down maps
- Comparison with other states (only WB + TN)
- Push notifications
- Multi-language support (English only tonight)
- Mobile app (web only, but mobile-responsive)
- Sharing cards to social media from within the app
- User-generated highlights

---

## Definition of Done

1. User can sign in with Google
2. Card feed loads with 15-20+ highlight cards across both states and all categories
3. State filter and category tabs work
4. Tapping a card opens a detail view with charts and "why it matters" text
5. User can chat with Gemini about any card topic and get data-grounded responses
6. Cards are cached so subsequent loads are instant
7. Screen recording posted to social media with required hashtags
