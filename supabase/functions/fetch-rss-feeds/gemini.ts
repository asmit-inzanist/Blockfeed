import { Article } from './types.ts';
import { getGeminiKey } from './config.ts';

function sanitizeText(text: string): string {
  // Replace HTML entities with their actual characters
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callGemini(
  apiKey: string,
  prompt: string,
  config: GeminiConfig = {}
): Promise<string> {
  const models = ['gemini-1.5-flash', 'gemini-pro'];
  const MAX_RETRIES = 3;
  let lastError;

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`Trying ${model} (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        
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
        
        // Check if the error is due to overload
        if (response.status === 503) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`Model overloaded, waiting ${backoffTime}ms before retry...`);
          await sleep(backoffTime);
          continue;
        }
        
        lastError = new Error(`${model} returned ${response.status}: ${errorText}`);
        break; // Try next model for non-overload errors
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        lastError = new Error(`${model} returned no text in response`);
        if (attempt < MAX_RETRIES - 1) {
          await sleep(1000); // Wait 1s before retry
          continue;
        }
        break;
      }

      return text;
    } catch (error) {
      console.error(`${model} error:`, error);
      lastError = error;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(1000); // Wait 1s before retry
        continue;
      }
    }
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
  console.log('findRelatedWords called for interest:', interest);

  const prompt = `Generate comprehensive search terms for finding news articles about: "${interest}"

You must return a JSON object with these fields:
{
  "terms": [
    // 10-15 specific words or phrases that would appear in news article titles/content
    // Include common variations and related terms
    // Example: for "cybersecurity" include "cyber attack", "data breach", "hacking", etc.
  ],
  "categories": [
    // 3-5 broad news categories this topic falls under
    // Example: for "cybersecurity" include "Technology", "Security", "Crime"
  ],
  "technologies": [
    // 5-8 specific technical terms related to the topic
    // Example: for "cybersecurity" include "malware", "firewall", "encryption", etc.
  ],
  "concepts": [
    // 3-5 broader themes or concepts
    // Example: for "cybersecurity" include "digital security", "online privacy", etc.
  ]
}

Important:
- Include exact phrases journalists would use in headlines
- Include both technical and non-technical terms
- Include current trending terms in this field
- Make terms specific enough to be meaningful but not too narrow

Return ONLY the JSON object, no other text.`;

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

function getBasicScore(article: Article, interests: string[]): number {
  const content = (article.title + " " + (article.description || "")).toLowerCase();
  const category = (article.category || "").toLowerCase();
  
  let score = 0;
  const interestsLower = interests.map(i => i.toLowerCase());

  // Direct interest matches in title (highest weight)
  if (interestsLower.some(interest => article.title.toLowerCase().includes(interest))) {
    score += 50;
  }

  // Category matches
  if (interestsLower.some(interest => category.includes(interest))) {
    score += 20;
  }

  // Content matches
  const matchCount = interestsLower.filter(interest => content.includes(interest)).length;
  score += matchCount * 10;

  // Normalize to 0-100
  return Math.min(100, Math.max(0, score));
}

export async function scoreArticles(
  articles: Article[],
  interests: string[],
  apiKey: string
): Promise<Article[]> {
  if (!apiKey) {
    console.warn('No Gemini API key provided, falling back to basic scoring');
    return articles.map(article => ({
      ...article,
      ai_score: getBasicScore(article, interests)
    }));
  }

  if (articles.length === 0) {
    return articles;
  }

  // Process articles in smaller chunks to avoid token limits
  const CHUNK_SIZE = 10;
  const chunks: Article[][] = [];
  for (let i = 0; i < articles.length; i += CHUNK_SIZE) {
    chunks.push(articles.slice(i, i + CHUNK_SIZE));
  }

  // Score each chunk separately
  const allScores: Array<{ title: string; score: number }> = [];
  
  for (const chunk of chunks) {
    try {
      function sanitizeText(text: string): string {
    // Replace HTML entities with their actual characters
    return text
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, '...')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  const prompt = `You are an article scorer. Generate a JSON array of scores for articles based on relevance to: ${interests.join(', ')}.

Score 80-100 for direct matches, 40-79 for indirect matches, 1-39 for unrelated.

Articles:
${chunk.map((article, index) => 
`${index + 1}. "${sanitizeText(article.title)}" (${article.category})`).join('\n')}

Return only a JSON array like this, no other text:
[
  {"title": "Exact Article Title", "score": number}
]`;

      const response = await callGemini(apiKey, prompt, {
        temperature: 0.1,
        maxOutputTokens: 1024
      });

      // Extract JSON from response with safety checks
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response');
        throw new Error('Invalid response format');
      }

      let cleanResponse = jsonMatch[0]
        .replace(/```json\s*|\s*```/g, '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\n/g, ' ')
        .trim();

      // Ensure the JSON is properly terminated
      if (!cleanResponse.endsWith(']')) {
        cleanResponse = cleanResponse.substring(0, cleanResponse.lastIndexOf(']') + 1);
      }

      try {
        const chunkScores = JSON.parse(cleanResponse);
        if (Array.isArray(chunkScores)) {
          // Validate each score object
          const validScores = chunkScores.filter(score => 
            typeof score === 'object' && 
            score !== null && 
            typeof score.title === 'string' && 
            typeof score.score === 'number'
          );
          allScores.push(...validScores);
        }
      } catch (parseError) {
        console.error('Error parsing chunk scores:', parseError);
        // If parsing fails, assign default scores to this chunk
        chunk.forEach(article => {
          allScores.push({ title: article.title, score: 75 });
        });
      }
    } catch (error) {
      console.error('Error scoring chunk:', error);
      // If Gemini fails, use basic scoring as fallback
      chunk.forEach(article => {
        allScores.push({
          title: article.title,
          score: getBasicScore(article, interests)
        });
      });
    }
  }

  // Apply scores to articles
  const scoredArticles = articles.map(article => {
    const score = allScores.find(s => sanitizeText(s.title) === sanitizeText(article.title));
    return {
      ...article,
      ai_score: score ? Math.min(Math.max(score.score, 1), 100) : 75
    };
  });

  // Sort by score and return
  return scoredArticles.sort((a, b) => (b.ai_score || 75) - (a.ai_score || 75));
}
