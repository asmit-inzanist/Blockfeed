import { Article } from './types';

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

  const prompt = `You are an AI article scorer. Score these articles based on user interests.

USER INTERESTS: ${interests.join(', ')}

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
