-- Election Highlights Database Schema
-- Created: 2026-05-07

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  card_id     TEXT NOT NULL,
  card_data   JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  card_id       TEXT NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Cached highlights table
CREATE TABLE IF NOT EXISTS cached_highlights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state       TEXT NOT NULL,
  category    TEXT NOT NULL,
  cards       JSONB NOT NULL,
  source_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for cached_highlights (public read, admin write)
CREATE POLICY "Anyone can read cached highlights"
  ON cached_highlights FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cached highlights"
  ON cached_highlights FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cached highlights"
  ON cached_highlights FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_card_id ON bookmarks(card_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_card_id ON chat_sessions(card_id);
CREATE INDEX IF NOT EXISTS idx_cached_highlights_state_category ON cached_highlights(state, category);
