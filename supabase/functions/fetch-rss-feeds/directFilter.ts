import { Article } from './types';

interface ScoredArticle extends Article {
  relevanceScore: number;
  matchReason?: string;
  debug?: {
    keywords: string[];
    interest: string;
    totalKeywords: number;
    keywordsUsed: string[];
  };
}

// Core keywords for common topics
const TOPIC_KEYWORDS = {
  business: [
    'business', 'company', 'startup', 'market', 'industry', 'CEO', 'corporate',
    'revenue', 'profit', 'growth', 'enterprise', 'merger', 'acquisition',
    'investment', 'investor', 'stock', 'shares', 'market', 'trade', 'economy',
    'economic', 'finance', 'financial', 'commerce', 'commercial', 'entrepreneur'
  ],
  technology: [
    'tech', 'technology', 'software', 'digital', 'AI', 'artificial intelligence',
    'startup', 'innovation', 'app', 'platform', 'cyber', 'security', 'data',
    'cloud', 'internet', 'web', 'mobile', 'device', 'computer', 'IT'
  ],
  cybersecurity: [
    'cyber', 'security', 'hack', 'breach', 'malware', 'ransomware', 'phishing',
    'vulnerability', 'attack', 'data breach', 'threat', 'privacy', 'encryption',
    'firewall', 'security breach', 'cybercrime', 'cyber attack', 'zero-day',
    'exploit', 'authentication', 'infosec'
  ],
  animation: [
    'animation', 'animated', 'animator', 'CGI', '3D', 'cartoon', 'pixar', 'disney',
    'visual effects', 'VFX', 'motion', 'render', 'studio', 'character', 'anime',
    'graphics', 'digital art', 'storyboard', 'film', 'entertainment'
  ],
  gaming: [
    'game', 'gaming', 'video game', 'esports', 'playstation', 'xbox', 'nintendo',
    'console', 'pc gaming', 'multiplayer', 'gameplay', 'developer', 'steam',
    'twitch', 'streamer', 'release', 'player', 'tournament', 'gamer'
  ],
  science: [
    'science', 'research', 'discovery', 'study', 'scientist', 'experiment',
    'innovation', 'breakthrough', 'laboratory', 'data', 'analysis', 'findings',
    'journal', 'publication', 'theory', 'evidence', 'methodology'
  ],
  art: [
    'art', 'artist', 'artwork', 'gallery', 'exhibition', 'creative', 'design',
    'painting', 'sculpture', 'digital art', 'installation', 'contemporary',
    'museum', 'collection', 'curator', 'visual', 'artistic', 'craft'
  ]
  // Add more topic keywords as needed
};

// Use Gemini to get a concise list of related terms
async function getGeminiSuggestions(interest: string, apiKey: string): Promise<string[]> {
  const prompt = {
    contents: [{
      parts: [{
        text: `Given the interest "${interest}", provide 5-8 closely related keywords for news filtering. Format: one word or short phrase per line, no numbers or bullets. Keep it concise and relevant.`
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 100,
      topK: 1,
      topP: 0.1
    }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return [];
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.split('\n').map(t => t.trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error('Error getting Gemini suggestions:', error);
    return [];
  }
}

async function findSimilarTopics(interest: string): Promise<string[]> {
  // Convert interest to lowercase for comparison
  const lowercaseInterest = interest.toLowerCase();
  
  // Map of related terms to main topics
  const topicMap: Record<string, string[]> = {
    business: ['business', 'company', 'corporate', 'enterprise', 'commerce', 'trade', 'industry'],
    finance: ['finance', 'financial', 'money', 'investment', 'banking', 'economy', 'market'],
    technology: ['tech', 'technology', 'digital', 'software', 'IT', 'computing'],
    cybersecurity: ['security', 'cyber', 'cybersecurity', 'infosec', 'protection'],
    animation: ['animation', 'animated', 'anime', 'cartoon', 'cgi', 'vfx', '3d'],
    gaming: ['game', 'gaming', 'games', 'esports', 'player', 'console'],
    science: ['science', 'research', 'study', 'discovery', 'scientific'],
    art: ['art', 'artist', 'creative', 'design', 'visual', 'artistic'],
    // Add more mappings as needed
  };

  // Find matching topics from predefined list
  const matchingTopics = Object.entries(topicMap)
    .filter(([_, terms]) => terms.some(term => 
      lowercaseInterest.includes(term) || term.includes(lowercaseInterest)
    ))
    .map(([topic]) => topic);

  return matchingTopics;
}

async function getExpandedKeywords(interest: string): Promise<string[]> {
  const keywords = new Set<string>();
  
  // Add the original interest
  keywords.add(interest.toLowerCase());
  
  // Find similar predefined topics
  const similarTopics = await findSimilarTopics(interest);
  
  // Add keywords from similar topics
  similarTopics.forEach(topic => {
    if (TOPIC_KEYWORDS[topic]) {
      TOPIC_KEYWORDS[topic].forEach(keyword => keywords.add(keyword.toLowerCase()));
    }
  });

  // Try to get AI suggestions if we don't have many keywords yet
  if (keywords.size < 10) {
    try {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (apiKey) {
        const aiSuggestions = await getGeminiSuggestions(interest, apiKey);
        aiSuggestions.forEach(keyword => keywords.add(keyword.toLowerCase()));
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    }
  }
  
  // Add common variations
  const words = interest.toLowerCase().split(/\s+/);
  words.forEach(word => {
    keywords.add(word);
    // Add common prefixes/suffixes
    keywords.add(word + 's');  // plural
    keywords.add(word + 'ing');  // gerund
    if (word.endsWith('y')) {
      keywords.add(word.slice(0, -1) + 'ies');  // y -> ies plural
    }
  });

  return Array.from(keywords);
}

function calculateArticleScore(
  article: Article,
  keywords: string[],
  interest: string
): { score: number; matchReason: string } {
  const title = article.title.toLowerCase();
  const description = article.description.toLowerCase();
  const category = article.category.toLowerCase();
  const interestLower = interest.toLowerCase();

  let score = 0;
  const matchReasons: string[] = [];

  // Direct interest match in title (highest priority)
  if (title.includes(interestLower)) {
    score += 50;
    matchReasons.push('Direct interest match in title');
  }

  // Direct interest match in description
  if (description.includes(interestLower)) {
    score += 30;
    matchReasons.push('Direct interest match in description');
  }

  // Category match
  if (category.includes(interestLower) || 
      keywords.some(k => category.includes(k.toLowerCase()))) {
    score += 20;
    matchReasons.push('Category match');
  }

  // Keyword matches in title
  const titleKeywordMatches = keywords.filter(keyword => 
    title.includes(keyword.toLowerCase())
  ).length;
  if (titleKeywordMatches > 0) {
    score += Math.min(titleKeywordMatches * 10, 30);
    matchReasons.push(`${titleKeywordMatches} keyword matches in title`);
  }

  // Keyword matches in description
  const descKeywordMatches = keywords.filter(keyword => 
    description.includes(keyword.toLowerCase())
  ).length;
  if (descKeywordMatches > 0) {
    score += Math.min(descKeywordMatches * 5, 20);
    matchReasons.push(`${descKeywordMatches} keyword matches in description`);
  }

  // Normalize score to 0-100 range
  const normalizedScore = Math.min(100, Math.max(0, score));

  return {
    score: normalizedScore,
    matchReason: matchReasons.join('; ')
  };
}

export async function filterArticlesForCustomInterest(
  articles: Article[],
  interest: string
): Promise<ScoredArticle[]> {
  console.log('Processing custom interest:', interest);
  
  // Get expanded keywords
  const keywords = await getExpandedKeywords(interest);
  console.log('Expanded keywords:', keywords);

  // Score and filter articles
  const scoredArticles = articles.map(article => {
    const { score, matchReason } = calculateArticleScore(article, keywords, interest);
    return {
      ...article,
      relevanceScore: score,
      matchReason
    };
  });

  // Filter articles with scores above threshold and sort by score
  const MIN_SCORE = 20; // Adjust this threshold as needed
  const filteredArticles = scoredArticles
    .filter(article => article.relevanceScore >= MIN_SCORE)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  console.log(`Found ${filteredArticles.length} relevant articles for "${interest}"`);
  if (filteredArticles.length > 0) {
    console.log('Sample matches:', filteredArticles.slice(0, 3).map(a => ({
      title: a.title,
      score: a.relevanceScore,
      reason: a.matchReason
    })));
  } else {
    console.log('No matches found. Keywords used:', keywords);
  }

  // Add debug information to each article
  const articlesWithDebug = filteredArticles.map(article => ({
    ...article,
    debug: {
      keywords,
      interest,
      totalKeywords: keywords.length,
      keywordsUsed: keywords.filter(k => 
        (article.title + article.description).toLowerCase().includes(k.toLowerCase())
      )
    }
  }));

  return articlesWithDebug;
}
