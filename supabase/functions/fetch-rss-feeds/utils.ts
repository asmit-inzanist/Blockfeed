import { Article } from './types.ts'

export function removeDuplicateArticles(articles: Article[]): Article[] {
  const seen = new Map<string, Article>();
  
  for (const article of articles) {
    // Create a normalized version of the title for comparison
    const normalizedTitle = normalizeString(article.title);
    
    // If we haven't seen this title before, or if this article has a better source/higher score
    if (!seen.has(normalizedTitle) || 
        (article.ai_score || 0) > (seen.get(normalizedTitle)?.ai_score || 0)) {
      seen.set(normalizedTitle, article);
    }
  }
  
  return Array.from(seen.values());
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    // Remove special characters, keeping only letters, numbers and spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapCustomInterestToMainCategory(customInterest: string): string | null {
  const normalizedInterest = normalizeString(customInterest);
  
  // Define mappings of common terms to main categories
  const categoryMappings: Record<string, string[]> = {
    'Health': [
      'medical', 'doctor', 'hospital', 'medicine', 'clinic', 'patient', 'disease',
      'treatment', 'healthcare', 'therapy', 'wellness', 'physician', 'dental',
      'pharmaceutical', 'drugs', 'surgery', 'nursing', 'mental health'
    ],
    'Technology': [
      'tech', 'computer', 'software', 'digital', 'programming', 'code', 'web',
      'app', 'mobile', 'device', 'gadget', 'hardware', 'internet', 'online',
      'network', 'system', 'database', 'cloud'
    ],
    'Finance': [
      'money', 'banking', 'investment', 'stock', 'market', 'trading', 'financial',
      'economic', 'economy', 'business', 'fund', 'crypto', 'bitcoin', 'investor',
      'wealth', 'fintech', 'bank'
    ],
    'Gaming': [
      'game', 'gaming', 'playstation', 'xbox', 'nintendo', 'console', 'esports',
      'moba', 'rpg', 'shooter', 'steam', 'twitch', 'gamer', 'gameplay'
    ],
    'Sports': [
      'sport', 'football', 'soccer', 'basketball', 'tennis', 'cricket', 'athlete',
      'player', 'team', 'match', 'tournament', 'championship', 'league', 'racing',
      'olympic', 'fitness'
    ],
    'Entertainment': [
      'movie', 'film', 'tv', 'television', 'show', 'series', 'actor', 'actress',
      'celebrity', 'music', 'song', 'concert', 'streaming', 'hollywood', 'drama',
      'comedy', 'entertainment'
    ],
    'Science': [
      'science', 'research', 'study', 'experiment', 'lab', 'discovery', 'physics',
      'chemistry', 'biology', 'space', 'astronomy', 'environment', 'climate',
      'scientist', 'theory'
    ],
    'Politics': [
      'politic', 'government', 'election', 'vote', 'party', 'policy', 'law',
      'legislation', 'parliament', 'congress', 'senate', 'minister', 'president',
      'democracy', 'diplomatic'
    ],
    'World News': [
      'world', 'global', 'international', 'foreign', 'country', 'nation',
      'worldwide', 'overseas', 'abroad', 'diplomatic', 'embassy', 'border'
    ],
    'Cybersecurity': [
      'security', 'cyber', 'hack', 'breach', 'malware', 'virus', 'encryption',
      'firewall', 'password', 'privacy', 'protection', 'threat', 'ransomware'
    ],
    'AI & ML': [
      'ai', 'artificial intelligence', 'machine learning', 'neural', 'deep learning',
      'algorithm', 'robot', 'automation', 'nlp', 'computer vision', 'ml'
    ],
    'Startups': [
      'startup', 'entrepreneur', 'venture', 'founder', 'seed', 'incubator',
      'accelerator', 'unicorn', 'funding', 'innovation', 'disrupt'
    ],
    'Business Tech': [
      'enterprise', 'saas', 'cloud', 'business software', 'erp', 'crm',
      'productivity', 'workflow', 'automation', 'analytics', 'dashboard'
    ]
  };

  // Check each category's terms for a match
  for (const [category, terms] of Object.entries(categoryMappings)) {
    if (terms.some(term => 
      normalizedInterest.includes(term) || 
      term.includes(normalizedInterest)
    )) {
      return category;
    }
  }

  return null; // Return null if no mapping found
}

export function calculateArticleSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeString(title1);
  const norm2 = normalizeString(title2);
  
  // Use Levenshtein distance for similarity
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  
  // Convert distance to similarity score (0-1)
  return 1 - (distance / maxLength);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  // Initialize the matrix
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str1.length][str2.length];
}
