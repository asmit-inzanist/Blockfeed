export function getGeminiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return key;
}

export const INTEREST_KEYWORDS = {
  // Core Categories
  'Technology': [
    'tech', 'software', 'ai', 'artificial intelligence', 'digital', 'startup', 'app',
    'innovation', 'cybersecurity', 'computer', 'internet', 'cloud', 'mobile',
    'programming', 'blockchain', 'machine learning', 'robotics', 'automation'
  ],
  'Finance': ['finance', 'stock', 'investment', 'banking', 'cryptocurrency', 'bitcoin', 'trading', 
    'revenue', 'profit', 'financial', 'money', 'forex', 'bonds', 'securities', 'hedge fund'
  ],
  'Sports': ['football', 'soccer', 'basketball', 'tennis', 'cricket', 'olympics', 'sports', 
    'match', 'tournament', 'player', 'team', 'league', 'championship', 'game', 'athletic'
  ],
  'Politics': ['politics', 'election', 'government', 'parliament', 'minister', 'policy', 
    'vote', 'campaign', 'political', 'congress', 'senate', 'democracy', 'law', 'legislation'
  ],
  'Health': ['health', 'medical', 'hospital', 'doctor', 'medicine', 'virus', 'disease', 
    'treatment', 'healthcare', 'patient', 'clinical', 'drug', 'vaccine', 'therapy'
  ],
  'Entertainment': ['entertainment', 'movie', 'film', 'music', 'celebrity', 'actor', 
    'actress', 'show', 'concert', 'hollywood', 'streaming', 'album', 'television', 'media'
  ],
  'Science': ['science', 'research', 'study', 'discovery', 'climate', 'space', 'nasa', 
    'experiment', 'scientific', 'biology', 'chemistry', 'physics', 'environment', 'nature'
  ],
  'World News': ['international', 'global', 'world', 'country', 'nation', 'foreign', 
    'embassy', 'diplomatic', 'war', 'conflict', 'peace', 'treaty', 'border', 'crisis'
  ],

  // Tech & Business
  'Business & Economy': ['business', 'economy', 'market', 'industry', 'trade', 'commerce', 
    'corporate', 'gdp', 'economic growth', 'inflation', 'employment', 'manufacturing', 
    'retail', 'wholesale', 'sector'
  ],
  'AI & ML': ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks', 
    'ai models', 'nlp', 'computer vision', 'ai research', 'robotics', 'automation', 
    'data science', 'algorithms', 'ai applications'
  ],
  'Startups': ['startup', 'entrepreneur', 'venture capital', 'funding', 'seed round', 
    'innovation', 'tech startup', 'startup ecosystem', 'incubator', 'accelerator', 
    'business model', 'unicorn', 'startup founder'
  ],
  'Gaming': ['gaming', 'video games', 'esports', 'game development', 'console gaming', 
    'pc gaming', 'mobile gaming', 'game industry', 'game technology', 'virtual reality', 
    'augmented reality', 'gaming hardware'
  ],
  'Cybersecurity': ['cybersecurity', 'security', 'hacking', 'cyber attack', 'data breach', 
    'privacy', 'encryption', 'network security', 'information security', 'cyber defense', 
    'security technology', 'cyber threats'
  ],
  'Business Tech': ['enterprise technology', 'business software', 'cloud computing', 
    'digital transformation', 'saas', 'enterprise solutions', 'business intelligence', 
    'data analytics', 'productivity tools', 'business automation'
  ],

  // Culture & Transportation
  'Arts & Culture': ['art', 'culture', 'museum', 'gallery', 'exhibition', 'theater', 
    'dance', 'music', 'literature', 'poetry', 'sculpture', 'painting', 'heritage', 'festival'
  ],
  'Automobiles & Mobility': ['automotive', 'cars', 'electric vehicles', 'ev', 
    'autonomous driving', 'mobility', 'transportation', 'vehicles', 'auto industry', 
    'motorcycles', 'bikes', 'automobile', 'tesla', 'charging'
  ],

  // Career
  'Classifieds/Jobs': ['jobs', 'career', 'employment', 'hiring', 'recruitment', 'vacancy', 
    'job listing', 'classifieds', 'job market', 'position', 'opportunity'
  ],

  // Entertainment
  'Horoscopes & Astrology': ['horoscope', 'astrology', 'zodiac', 'star sign', 'planetary', 
    'constellation', 'fortune', 'prediction', 'cosmic', 'astrological', 'natal chart'
  ]
} as const;

export const PREDEFINED_INTERESTS = new Set(Object.keys(INTEREST_KEYWORDS));
