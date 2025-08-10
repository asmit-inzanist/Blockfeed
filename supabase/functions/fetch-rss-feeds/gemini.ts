import { Article } from './types';
import { getGeminiKey } from './config';

interface RelatedWords {
  terms: string[];
  categories: string[];
  technologies?: string[];
  concepts?: string[];
}

interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}

export async function callGemini(
  apiKey: string,
  prompt: string,
  config: GeminiConfig = {}
) {
  const models = ['gemini-1.5-flash', 'gemini-pro'];
  let lastError;

  for (const model of models) {
    try {
      console.log(`Trying ${model}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: config.temperature ?? 0.1,
              maxOutputTokens: config.maxOutputTokens ?? 2048,
              topK: config.topK ?? 1,
              topP: config.topP ?? 0.1
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${model} error:`, response.status, errorText);
        lastError = new Error(`${model} returned ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        lastError = new Error(`${model} returned no text in response`);
        continue;
      }

      return text;
    } catch (error) {
      console.error(`${model} error:`, error);
      lastError = error;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

export async function findRelatedWords(
  interest: string,
  apiKey: string
): Promise<RelatedWords> {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const prompt = `You are a news classification expert. For the given custom interest or topic, generate relevant search terms and categories that would help find related news articles from RSS feeds.

INTEREST: ${interest}

TASK:
1. Analyze the interest and understand its domain
2. Generate specific terms that might appear in news articles about this topic
3. Map it to broader news categories
4. Include related technical terms if applicable

RESPONSE REQUIRED:
Return a JSON object with these fields (max 15 items per category, ordered by relevance):
{
  "terms": ["specific words likely to appear in relevant news articles"],
  "categories": ["matching news categories"],
  "technologies": ["related technical terms"],
  "concepts": ["broader topics and themes"]
}

Make terms specific enough to filter news but broad enough to catch relevant articles.
Ensure terms are commonly used in news articles.
Include variations and synonyms.

DO NOT include any other text, only the JSON object.`;

  try {
    console.log('Requesting related words from Gemini for:', interest);
    const response = await callGemini(apiKey, prompt, {
      temperature: 0.7, // Higher temperature for more diverse suggestions
      maxOutputTokens: 1024
    });

    // Clean and parse the response
    const cleanResponse = response
      .replace(/```json\s*|\s*```/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    const relatedWords = JSON.parse(cleanResponse);
    
    if (!relatedWords.terms || !Array.isArray(relatedWords.terms)) {
      throw new Error('Invalid response format from Gemini');
    }

    console.log('Found related words:', relatedWords);
    return relatedWords;
  } catch (error) {
    console.error('Error finding related words:', error);
    throw error;
  }
}

export async function scoreArticles(
  articles: Article[],
  interests: string[],
  apiKey: string
): Promise<Article[]> {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  if (articles.length === 0) {
    return articles;
  }

  // First, get related words for each interest
  const relatedWordsPromises = interests.map(interest => 
    findRelatedWords(interest, apiKey)
      .catch(error => {
        console.error(`Error getting related words for ${interest}:`, error);
        return null;
      })
  );

  const relatedWordsList = await Promise.all(relatedWordsPromises);
  
  // Combine all related terms
  const allTerms = new Set<string>();
  const allCategories = new Set<string>();
  const allTechnologies = new Set<string>();
  const allConcepts = new Set<string>();

  relatedWordsList.forEach(words => {
    if (words) {
      words.terms.forEach(term => allTerms.add(term.toLowerCase()));
      words.categories.forEach(cat => allCategories.add(cat.toLowerCase()));
      words.technologies?.forEach(tech => allTechnologies.add(tech.toLowerCase()));
      words.concepts?.forEach(concept => allConcepts.add(concept.toLowerCase()));
    }
  });

  const prompt = `You are an AI article scorer. Score these articles based on user interests and related terms.

USER INTERESTS: ${interests.join(', ')}

RELATED TERMS:
- Search Terms: ${Array.from(allTerms).join(', ')}
- Categories: ${Array.from(allCategories).join(', ')}
- Technologies: ${Array.from(allTechnologies).join(', ')}
- Concepts: ${Array.from(allConcepts).join(', ')}

SCORING RULES:
- Score 80-100: Article directly matches user interests
- Score 40-79: Article indirectly relates to interests
- Score 1-39: Article doesn't match interests
- Consider: title match, category relevance, content relevance

ARTICLES:
${articles.map((article, index) => 
`[Article ${index + 1}]
Title: "${article.title}"
Category: ${article.category}
Description: ${article.description}
Source: ${article.source}
`).join('\n\n')}

RESPONSE REQUIRED:
Return a JSON array containing scores for each article. Each object must have exact article title and score:
[
  {"title": "Exact Title Here", "score": 85}
]

DO NOT include any other text, only the JSON array.`;

  try {
    console.log('Sending article scoring request to Gemini...');
    const response = await callGemini(apiKey, prompt, {
      temperature: 0.1,
      maxOutputTokens: 2048
    });

    console.log('Raw Gemini response:', response);

    // Clean the response text
    const cleanResponse = response
      .replace(/```json\s*|\s*```/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    console.log('Cleaned response:', cleanResponse);

    const scores = JSON.parse(cleanResponse);
    
    if (!Array.isArray(scores)) {
      throw new Error('Gemini did not return an array of scores');
    }

    console.log('Parsed scores:', scores.slice(0, 3));

    // Apply scores to articles
    const scoredArticles = articles.map(article => {
      const score = scores.find(s => s.title === article.title);
      if (!score) {
        console.log(`No score found for article: ${article.title}`);
      }
      return {
        ...article,
        ai_score: score ? Math.min(Math.max(score.score, 1), 100) : 75
      };
    });

    // Log score distribution
    const distribution = scoredArticles.reduce((acc: Record<string, number>, article) => {
      const range = Math.floor(article.ai_score / 10) * 10;
      acc[`${range}-${range+9}`] = (acc[`${range}-${range+9}`] || 0) + 1;
      return acc;
    }, {});

    console.log('Score distribution:', distribution);

    return scoredArticles.sort((a, b) => (b.ai_score || 75) - (a.ai_score || 75));
  } catch (error) {
    console.error('Error scoring articles:', error);
    throw error;
  }
}
