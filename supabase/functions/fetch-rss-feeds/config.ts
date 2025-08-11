export function getGeminiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return key;
}

export const INTEREST_KEYWORDS = {
  'Technology': [
    'tech', 'software', 'ai', 'artificial intelligence', 'digital', 'startup', 'app',
    'innovation', 'cybersecurity', 'computer', 'internet', 'cloud', 'mobile',
    'programming', 'blockchain', 'machine learning', 'robotics', 'automation'
  ],
  'Finance': [
    'finance', 'business', 'market', 'investment', 'stock', 'economy', 'banking',
    'trading', 'cryptocurrency', 'bitcoin', 'fintech', 'venture capital', 'startup funding',
    'economic growth', 'market analysis', 'financial technology'
  ],
  'Sports': [
    'sports', 'football', 'cricket', 'basketball', 'tennis', 'soccer', 'olympics',
    'tournament', 'championship', 'athlete', 'game', 'match', 'team', 'league',
    'racing', 'fitness', 'esports', 'sports technology'
  ],
  'Politics': [
    'politics', 'government', 'election', 'policy', 'political', 'democracy',
    'parliament', 'congress', 'legislation', 'law', 'diplomacy', 'minister',
    'president', 'campaign', 'voting', 'political party'
  ],
  'Health': [
    'health', 'medical', 'healthcare', 'medicine', 'wellness', 'fitness', 'nutrition',
    'mental health', 'disease', 'treatment', 'research', 'hospital', 'doctors',
    'pharmaceutical', 'biotech', 'health technology'
  ],
  'Entertainment': [
    'entertainment', 'movie', 'film', 'music', 'celebrity', 'tv', 'television',
    'streaming', 'hollywood', 'show', 'media', 'gaming', 'arts', 'culture',
    'performance', 'concert', 'theater'
  ],
  'Science': [
    'science', 'research', 'discovery', 'innovation', 'technology', 'experiment',
    'study', 'breakthrough', 'space', 'physics', 'chemistry', 'biology', 'astronomy',
    'environmental', 'climate', 'scientific', 'laboratory'
  ],
  'World News': [
    'world', 'international', 'global', 'foreign', 'diplomatic', 'world affairs',
    'geopolitics', 'international relations', 'trade', 'world economy', 'global issues',
    'international policy', 'world politics', 'global events'
  ]
} as const;

export const PREDEFINED_INTERESTS = new Set(Object.keys(INTEREST_KEYWORDS));
