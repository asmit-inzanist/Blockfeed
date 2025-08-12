export function getGeminiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return key;
}

export const PREDEFINED_INTERESTS = [
  'Technology',
  'Finance', 
  'Sports',
  'Politics',
  'Health',
  'Entertainment',
  'Science',
  'World News',
  'Business',
  'Travel',
  'Food & Dining',
  'Automotive',
  'Real Estate',
  'Energy',
  'Gaming',
  'Cybersecurity',
  'Business Tech',
  'Health Tech',
  'Sports Tech'
] as const;

export const INTEREST_KEYWORDS: Record<string, string[]> = {
  'Technology': ['tech', 'technology', 'software', 'digital', 'ai', 'artificial intelligence', 'startup', 'innovation', 'app', 'platform', 'cyber', 'security', 'data', 'cloud', 'internet'],
  'Finance': ['finance', 'business', 'economy', 'stock', 'market', 'investment', 'banking', 'cryptocurrency', 'bitcoin', 'trading', 'revenue', 'profit', 'economic', 'financial', 'money'],
  'Sports': ['football', 'soccer', 'basketball', 'tennis', 'cricket', 'olympics', 'sports', 'match', 'tournament', 'player', 'team', 'league', 'championship', 'game', 'athletic'],
  'Politics': ['politics', 'election', 'government', 'parliament', 'minister', 'policy', 'vote', 'campaign', 'political', 'congress', 'senate', 'democracy', 'law', 'legislation'],
  'Health': ['health', 'medical', 'hospital', 'doctor', 'medicine', 'virus', 'disease', 'treatment', 'healthcare', 'patient', 'clinical', 'drug', 'vaccine', 'therapy'],
  'Entertainment': ['entertainment', 'movie', 'film', 'music', 'celebrity', 'actor', 'actress', 'show', 'concert', 'hollywood', 'streaming', 'album', 'television', 'media'],
  'Science': ['science', 'research', 'study', 'discovery', 'climate', 'space', 'nasa', 'experiment', 'scientific', 'biology', 'chemistry', 'physics', 'environment', 'nature'],
  'World News': ['international', 'global', 'world', 'country', 'nation', 'foreign', 'embassy', 'diplomatic', 'war', 'conflict', 'peace', 'treaty', 'border', 'crisis'],
  'Business': ['business', 'entrepreneur', 'startup', 'company', 'corporate', 'industry', 'management', 'leadership', 'enterprise', 'commerce', 'strategy', 'innovation', 'workplace', 'executive'],
  'Travel': ['travel', 'tourism', 'destination', 'vacation', 'hotel', 'resort', 'flight', 'adventure', 'tourist', 'holiday', 'journey', 'explore', 'trip', 'cruise', 'hospitality'],
  'Food & Dining': ['food', 'restaurant', 'dining', 'cuisine', 'recipe', 'chef', 'cooking', 'culinary', 'meal', 'gastronomy', 'menu', 'dishes', 'flavors', 'kitchen', 'eat'],
  'Automotive': ['car', 'vehicle', 'automotive', 'motor', 'drive', 'racing', 'electric vehicle', 'ev', 'automobile', 'transportation', 'engine', 'auto industry', 'manufacturer'],
  'Real Estate': ['real estate', 'property', 'housing', 'mortgage', 'realty', 'apartment', 'home', 'commercial', 'residential', 'construction', 'development', 'lease', 'rent'],
  'Energy': ['energy', 'power', 'electricity', 'renewable', 'solar', 'wind', 'oil', 'gas', 'nuclear', 'utility', 'grid', 'sustainability', 'carbon', 'climate'],
  'Gaming': ['gaming', 'game', 'playstation', 'xbox', 'nintendo', 'esports', 'gamer', 'console', 'pc gaming', 'video games', 'steam', 'multiplayer', 'rpg', 'gameplay', 'gaming industry'],
  'Cybersecurity': ['cybersecurity', 'security', 'hack', 'breach', 'malware', 'ransomware', 'cyber attack', 'infosec', 'data security', 'encryption', 'vulnerability', 'threat', 'privacy', 'cyber defense'],
  'Business Tech': ['enterprise tech', 'it infrastructure', 'cloud computing', 'digital transformation', 'enterprise software', 'it management', 'data center', 'networking', 'virtualization', 'saas'],
  'Health Tech': ['healthtech', 'digital health', 'telemedicine', 'health informatics', 'medical technology', 'biotech', 'health data', 'wearables', 'medical devices', 'health apps'],
  'Sports Tech': ['sports technology', 'sports analytics', 'sports science', 'performance tech', 'sports equipment', 'sports data', 'fitness tech', 'athlete tracking', 'sports innovation']
};
