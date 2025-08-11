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
  'Science': [
    'science', 'research', 'discovery', 'innovation', 'technology', 'experiment',
    'study', 'breakthrough', 'space', 'physics', 'chemistry', 'biology', 'astronomy',
    'environmental', 'climate', 'scientific', 'laboratory'
  ],
  'Health': [
    'health', 'medical', 'healthcare', 'medicine', 'wellness', 'fitness', 'nutrition',
    'mental health', 'disease', 'treatment', 'research', 'hospital', 'doctors',
    'pharmaceutical', 'biotech', 'health technology'
  ],
  'AI & ML': [
    'artificial intelligence', 'machine learning', 'deep learning', 'neural networks',
    'ai models', 'nlp', 'computer vision', 'ai research', 'robotics', 'automation',
    'data science', 'algorithms', 'ai applications'
  ],
  'Startups': [
    'startup', 'entrepreneur', 'venture capital', 'funding', 'seed round',
    'innovation', 'tech startup', 'startup ecosystem', 'incubator', 'accelerator',
    'business model', 'unicorn', 'startup founder'
  ],
  'Gaming': [
    'gaming', 'video games', 'esports', 'game development', 'console gaming',
    'pc gaming', 'mobile gaming', 'game industry', 'game technology',
    'virtual reality', 'augmented reality', 'gaming hardware'
  ],
  'Cybersecurity': [
    'cybersecurity', 'security', 'hacking', 'cyber attack', 'data breach',
    'privacy', 'encryption', 'network security', 'information security',
    'cyber defense', 'security technology', 'cyber threats'
  ],
  'Business Tech': [
    'enterprise technology', 'business software', 'cloud computing', 'digital transformation',
    'saas', 'enterprise solutions', 'business intelligence', 'data analytics',
    'productivity tools', 'business automation'
  ]
} as const;

export const PREDEFINED_INTERESTS = new Set(Object.keys(INTEREST_KEYWORDS));
