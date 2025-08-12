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

// Helper function to check if an article matches any keywords with title weighting
function articleContainsKeywords(article: Article, keywords: string[]): { matches: boolean; titleMatch: boolean } {
  const title = article.title.toLowerCase();
  const description = article.description.toLowerCase();
  
  // Check title matches first (more important)
  const titleMatch = keywords.some(keyword => 
    title.includes(keyword.toLowerCase())
  );

  // Check full content matches
  const contentMatch = keywords.some(keyword => 
    description.includes(keyword.toLowerCase())
  );

  return {
    matches: titleMatch || contentMatch,
    titleMatch: titleMatch
  };
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
  
  // Filter articles with metadata about match quality
  const keywordMatches = articles.map(article => {
    const matchResult = articleContainsKeywords(article, keywords);
    return {
      article,
      matches: matchResult.matches,
      titleMatch: matchResult.titleMatch
    };
  }).filter(result => result.matches);

  console.log('Articles matching keywords:', keywordMatches.length);
  console.log('Title matches:', keywordMatches.filter(m => m.titleMatch).length);

  if (keywordMatches.length === 0) {
    return [];
  }

  // Step 2: AI Scoring with batching
  const BATCH_SIZE = 8;
  const scoredArticles: ScoredArticle[] = [];
  
  for (let i = 0; i < keywordMatches.length; i += BATCH_SIZE) {
    const batchItems = keywordMatches.slice(i, i + BATCH_SIZE);
    const batchArticles = batchItems.map(item => item.article);
    
    try {
      const scores = await scoreArticlesBatch(batchArticles, userInterest, geminiApiKey);
      
      batchItems.forEach((item, index) => {
        // Boost score for title matches
        let finalScore = scores[index];
        if (item.titleMatch) {
          finalScore = Math.min(10, finalScore + 2); // Boost score by 2 for title matches
        }
        
        scoredArticles.push({
          ...item.article,
          relevanceScore: finalScore
        });
      });
    } catch (error) {
      console.error('Error processing batch:', error);
      // On error, add articles with neutral scores
      batchItems.forEach(item => {
        scoredArticles.push({
          ...item.article,
          relevanceScore: item.titleMatch ? 7 : 5 // Higher default score for title matches
        });
      });
    }
  }

  // Filter and sort by score
  return scoredArticles
    .filter(article => article.relevanceScore >= 6)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
