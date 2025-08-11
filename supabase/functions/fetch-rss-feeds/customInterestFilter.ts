import { Article } from './types';
import { callGemini } from './gemini';

interface ScoredArticle extends Article {
  relevanceScore: number;
}

// Helper function to expand keywords for common interests
function expandKeywords(interest: string): string[] {
  const commonExpansions: Record<string, string[]> = {
    'blockchain': ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'web3', 'cryptocurrency', 'distributed ledger', 'smart contract', 'blockchain'],
    'ai': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'ml', 'ai', 'llm', 'large language model', 'chatgpt', 'computer vision'],
    'cybersecurity': ['cyber security', 'cybersecurity', 'hack', 'breach', 'malware', 'ransomware', 'phishing', 'security vulnerability', 'cyber attack', 'data breach', 'zero day', 'infosec'],
    // Add more common interests here
  };

  // First try to get predefined expansions
  const lowerInterest = interest.toLowerCase();
  if (commonExpansions[lowerInterest]) {
    return commonExpansions[lowerInterest];
  }

  // If no predefined expansions, use some parts of the interest phrase
  const words = interest.toLowerCase().split(/\s+/);
  const expansions = new Set<string>();
  
  // Add the full interest phrase
  expansions.add(interest.toLowerCase());
  
  // Add individual words
  words.forEach(word => expansions.add(word));
  
  // Add combinations of adjacent words
  for (let i = 0; i < words.length - 1; i++) {
    expansions.add(words[i] + ' ' + words[i + 1]);
  }
  
  return Array.from(expansions);
}

// Helper function to check if an article matches any keywords
function articleContainsKeywords(article: Article, keywords: string[]): boolean {
  const content = (article.title + ' ' + article.description).toLowerCase();
  return keywords.some(keyword => content.includes(keyword.toLowerCase()));
}

// Helper function to batch score articles using Gemini
async function scoreArticlesBatch(
  articles: Article[],
  interest: string,
  apiKey: string
): Promise<number[]> {
  const prompt = `Rate each article's relevance to "${interest}" on a scale of 0-10.
Return ONLY a JSON array of scores, no other text.

Articles to rate:
${articles.map((article, i) => `${i + 1}. Title: "${article.title}"
   Description: ${article.description}`).join('\n\n')}

Example response format:
[8, 4, 9]`;

  try {
    const response = await callGemini(apiKey, prompt, {
      temperature: 0.1,
      maxOutputTokens: 256
    });

    // Extract the array from the response
    const match = response.match(/\[(.*?)\]/s);
    if (!match) {
      throw new Error('Invalid response format');
    }

    const scores = JSON.parse(match[0]);
    if (!Array.isArray(scores) || scores.length !== articles.length) {
      throw new Error('Invalid scores array');
    }

    return scores.map(score => Math.max(0, Math.min(10, Number(score))));
  } catch (error) {
    console.error('Error scoring batch:', error);
    // Return neutral scores on error
    return articles.map(() => 5);
  }
}

export async function filterRelevantArticles(
  articles: Article[],
  userInterest: string,
  geminiApiKey: string
): Promise<ScoredArticle[]> {
  // Step 1: Keyword-based filtering
  const keywords = expandKeywords(userInterest);
  console.log('Expanded keywords for', userInterest, ':', keywords);
  
  const keywordMatches = articles.filter(article => 
    articleContainsKeywords(article, keywords)
  );
  console.log('Articles matching keywords:', keywordMatches.length);

  if (keywordMatches.length === 0) {
    return [];
  }

  // Step 2: AI Scoring with batching
  const BATCH_SIZE = 8;
  const scoredArticles: ScoredArticle[] = [];
  
  for (let i = 0; i < keywordMatches.length; i += BATCH_SIZE) {
    const batch = keywordMatches.slice(i, i + BATCH_SIZE);
    try {
      const scores = await scoreArticlesBatch(batch, userInterest, geminiApiKey);
      
      batch.forEach((article, index) => {
        scoredArticles.push({
          ...article,
          relevanceScore: scores[index]
        });
      });
    } catch (error) {
      console.error('Error processing batch:', error);
      // On error, add articles with neutral scores
      batch.forEach(article => {
        scoredArticles.push({
          ...article,
          relevanceScore: 5
        });
      });
    }
  }

  // Filter and sort by score
  return scoredArticles
    .filter(article => article.relevanceScore >= 6)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
