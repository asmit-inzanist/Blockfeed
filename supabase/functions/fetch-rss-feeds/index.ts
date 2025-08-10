import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tunable limits (override via environment variables MAX_PER_FEED and MAX_RETURNED)
const MAX_PER_FEED = Number(Deno.env.get('MAX_PER_FEED') ?? '20')
const MAX_RETURNED = Number(Deno.env.get('MAX_RETURNED') ?? '30')

const RSS_FEEDS = {
  // Technology
  'TechCrunch': 'https://techcrunch.com/feed/',
  'Gadgets 360': 'https://www.gadgets360.com/rss',
  'The Verge': 'https://www.theverge.com/rss/index.xml',
  'Engadget': 'https://www.engadget.com/rss.xml',
  'Wired': 'https://www.wired.com/feed/rss',
  'Ars Technica': 'https://arstechnica.com/feed/',
  'ZDNet': 'https://www.zdnet.com/news/rss.xml',
  'VentureBeat': 'https://venturebeat.com/feed/',
  'ComputerWeekly': 'https://www.computerweekly.com/rss',
  'MIT News Technology': 'https://news.mit.edu/rss',
  
  // Finance
  'Financial Times': 'https://www.ft.com/?format=rss',
  'Benzinga': 'https://feeds.benzinga.com/benzinga',
  'MarketBeat': 'https://marketbeat.com/feed',
  
  // Sports
  'NDTV Sports': 'https://feeds.feedburner.com/ndtvsports-latest',
  'Times of India Sports': 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',
  'Sky Sports': 'https://skysports.com/rss/12040',
  'FOX Sports': 'https://api.foxsports.com/v2/content/feed',
  'Sportskeeda': 'https://sportskeeda.com/feed',
  'Deadspin': 'https://deadspin.com/rss',
  'SportsWeez': 'https://sportsweez.com/feed',
  
  // Politics
  'ThePrint Politics': 'https://theprint.in/category/politics/feed/',
  'Times of India Politics': 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
  'Economic Times Politics': 'https://economictimes.indiatimes.com/rss/news/politics',
  'Fox News Politics': 'https://feeds.foxnews.com/foxnews/politics',
  'NDTV Politics': 'https://www.ndtv.com/topic/indian-politics/rss',
  
  // Health
  'Medical Xpress': 'https://medicalxpress.com/rss-feed',
  'MedlinePlus': 'https://medlineplus.gov/feeds/news_en.xml',
  
  // Entertainment
  'Entertainment Tonight': 'https://www.etonline.com/news/rss',
  'TMZ': 'https://www.tmz.com/rss.xml',
  'CBS News Entertainment': 'https://www.cbsnews.com/entertainment/rss',
  'Variety': 'https://variety.com/v/rss',
  
  // Science
  'Science Daily': 'https://www.sciencedaily.com/rss/top/science.xml',
  'New Scientist': 'https://www.newscientist.com/feed/home',
  'The Scientist': 'https://www.the-scientist.com/rss',
  'Science.org (feeds page)': 'https://www.science.org/content/page/email-alerts-and-rss-feeds',
  
  // World News
  'BBC World News': 'http://feeds.bbci.co.uk/news/world/rss.xml',
  'NBC News': 'https://feeds.nbcnews.com/nbcnews/public/news',
  'CBS World News': 'https://www.cbsnews.com/world/rss',
  'BBC (All RSS)': 'http://newsrss.bbc.co.uk/rss/',
  'CNN Top Stories': 'https://rss.cnn.com/rss/cnn_topstories.rss',
  'The New York Times (RSS index)': 'https://www.nytimes.com/rss',
  'Times of India (RSS index)': 'https://timesofindia.indiatimes.com/rss.cms',
  'NDTV (RSS index)': 'https://www.ndtv.com/rss'
}

interface Article {
  title: string
  description: string
  link: string
  source: string
  category: string
  publishedAt?: string
}

function parseRSSFeed(xmlText: string, source: string): Article[] {
  const articles: Article[] = []
  
  // Simple XML parsing for RSS feeds
  const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi)
  
  if (itemMatches) {
    for (const item of itemMatches.slice(0, MAX_PER_FEED)) { // Limit per feed
      const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const descriptionMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)
      const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
      const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)
      
      if (titleMatch && linkMatch) {
        const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
        const description = descriptionMatch ? 
          descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : ''
        const link = linkMatch[1].trim()
        const publishedAt = pubDateMatch ? pubDateMatch[1].trim() : undefined
        
        articles.push({
          title,
          description,
          link,
          source,
          category: getCategoryFromSource(source),
          publishedAt
        })
      }
    }
  }
  
  return articles
}

function getCategoryFromSource(source: string): string {
  const sourceLower = source.toLowerCase()
  // Check entertainment first to avoid sports misclassification
  if (
    sourceLower.includes('entertainment') ||
    sourceLower.includes('tmz') ||
    sourceLower.includes('variety') ||
    (sourceLower.includes('cbs') && sourceLower.includes('entertainment'))
  ) return 'Entertainment'
  // More specific sports matching
  if (
    sourceLower.includes('ndtv sports') ||
    sourceLower.includes('sky sports') ||
    sourceLower.includes('sportskeeda') ||
    sourceLower.includes('sportsweez') ||
    sourceLower.includes('deadspin') ||
    sourceLower.includes('fox sports') ||
    (sourceLower.includes('sports') && !sourceLower.includes('entertainment'))
  ) return 'Sports'
  if (sourceLower.includes('techcrunch') || sourceLower.includes('gadgets')) return 'Technology'
  if (sourceLower.includes('financial') || sourceLower.includes('benzinga') || sourceLower.includes('marketbeat')) return 'Finance'
  if (sourceLower.includes('politics') || sourceLower.includes('theprint')) return 'Politics'
  if (sourceLower.includes('medical') || sourceLower.includes('medlineplus')) return 'Health'
  if (sourceLower.includes('science')) return 'Science'
  if (sourceLower.includes('world') || sourceLower.includes('bbc') || sourceLower.includes('nbc')) return 'World News'
  return 'General'
}

function getKeywordsForCategory(category: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'computer', 'digital', 'internet', 'startup', 'innovation', 'cybersecurity', 'app', 'platform', 'algorithm', 'data', 'cloud'],
    'finance': ['finance', 'business', 'economy', 'stock', 'market', 'investment', 'banking', 'cryptocurrency', 'bitcoin', 'trading', 'revenue', 'profit', 'economic', 'financial', 'money'],
    'sports': ['football', 'soccer', 'basketball', 'tennis', 'cricket', 'olympics', 'sports', 'match', 'tournament', 'player', 'team', 'league', 'championship', 'game', 'athletic'],
    'politics': ['politics', 'election', 'government', 'parliament', 'minister', 'policy', 'vote', 'campaign', 'political', 'congress', 'senate', 'democracy', 'law', 'legislation'],
    'health': ['health', 'medical', 'hospital', 'doctor', 'medicine', 'virus', 'disease', 'treatment', 'healthcare', 'patient', 'clinical', 'drug', 'vaccine', 'therapy'],
    'entertainment': ['entertainment', 'movie', 'film', 'music', 'celebrity', 'actor', 'actress', 'show', 'concert', 'hollywood', 'streaming', 'album', 'television', 'media'],
    'science': ['science', 'research', 'study', 'discovery', 'climate', 'space', 'nasa', 'experiment', 'scientific', 'biology', 'chemistry', 'physics', 'environment', 'nature'],
    'world': ['international', 'global', 'world', 'country', 'nation', 'foreign', 'embassy', 'diplomatic', 'war', 'conflict', 'peace', 'treaty', 'border', 'crisis']
  }
  return keywordMap[category.toLowerCase()] || []
}

import { removeDuplicateArticles } from './utils'

function filterNewsByInterests(newsItems: Article[], userInterests: string[]): Article[] {
  if (!userInterests || userInterests.length === 0) {
    return removeDuplicateArticles(newsItems)
  }
  
  // First remove duplicates
  const uniqueArticles = removeDuplicateArticles(newsItems)
  
  // Then filter by interests
  const interestsLower = userInterests.map(i => i.toLowerCase())
  return uniqueArticles.filter(item => interestsLower.includes((item.category || '').toLowerCase()))
}

import { scoreArticles } from './gemini'

async function personalizeWithGemini(articles: Article[], interests: string[]): Promise<Article[]> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  
  if (!geminiApiKey) {
    console.error('No Gemini API key found')
    return articles.map(article => ({ ...article, ai_score: 75 }))
  }

  try {
    return await scoreArticles(articles, interests, geminiApiKey)
  } catch (error) {
    console.error('Error personalizing articles:', error)
    return articles.map(article => ({ ...article, ai_score: 75 }))
  }
  
    if (!geminiApiKey) {
      console.error('Error: GEMINI_API_KEY environment variable is not set')
      return articles.map(article => ({ ...article }))
    }
    
    if (articles.length === 0) {
      console.log('Warning: No articles to process')
      return articles
    }
    
    if (interests.length === 0) {
      console.log('Warning: No user interests provided')
      return articles.map(article => ({ ...article }))
    }

    // Log the first few articles we're about to process
    console.log('Sample articles to be scored:', articles.slice(0, 3).map(a => ({
      title: a.title,
      category: a.category
    })))
    console.log('User interests for scoring:', interests)  try {
    console.log('Making Gemini API request...')
    
    // Try different models if one fails
    const models = ['gemini-1.5-flash', 'gemini-pro']
    let response
    let lastError
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model} for article scoring`)
        
        const prompt = {
          contents: [{
            parts: [{
              text: `You are an AI article scorer. Your task is to analyze news articles and assign relevance scores based on user interests.

USER INTERESTS: ${interests.join(', ')}

SCORING GUIDELINES:
- Score each article from 1 to 100
- 80-100: Highly relevant (directly matches user interests)
- 40-79: Somewhat relevant (indirectly related to interests)
- 1-39: Not relevant to interests
- Consider: title relevance, content match, category alignment

ARTICLES TO SCORE:
${articles.map((article, index) => 
  `ARTICLE ${index + 1}
  TITLE: "${article.title}"
  CATEGORY: ${article.category}
  DESCRIPTION: "${article.description}"
  SOURCE: ${article.source}`
).join('\n\n')}

REQUIRED FORMAT:
Return only a JSON array with each object having 'title' and 'score' fields. The title must match exactly:
[
  {"title": "Exact Article Title", "score": 85},
  {"title": "Another Article Title", "score": 45}
]`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
              topK: 1,
              topP: 0.1
            }
          }
    
    console.log('Debug: Sending request to Gemini API...')
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt)
      }
    )

    console.log('Gemini API response status:', response.status)
    
    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Gemini API error details:', errorText)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Gemini API response data:', JSON.stringify(data, null, 2))
    
    const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!geminiResponse) {
      console.error('Error: No text response from Gemini')
      console.error('Full response:', JSON.stringify(data, null, 2))
      throw new Error('No text response from Gemini')
    }

    try {
      // Clean up the response and parse JSON
      const cleanResponse = geminiResponse
        .replace(/```json\s*|\s*```/g, '') // Remove JSON code blocks
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
        .trim()
      
      console.log('Cleaned Gemini response:', cleanResponse)
      
      const scores = JSON.parse(cleanResponse)
      
      if (!Array.isArray(scores)) {
        throw new Error('Gemini response is not an array')
      }
      
      console.log('Successfully parsed scores:', scores)
      
      const scoredArticles = articles.map(article => {
        const scoreData = scores.find((s: any) => s.title === article.title)
        if (!scoreData) {
          console.log(`No score found for article: "${article.title}"`)
        }
        return {
          ...article,
          ai_score: scoreData ? Math.min(Math.max(scoreData.score, 1), 100) : 75
        }
      })
      
      // Log distribution of scores
      const scoreDistribution = scoredArticles.reduce((acc: any, article) => {
        const range = Math.floor(article.ai_score / 10) * 10
        acc[`${range}-${range + 9}`] = (acc[`${range}-${range + 9}`] || 0) + 1
        return acc
      }, {})
      
      console.log('Score distribution:', scoreDistribution)
      
      return scoredArticles.sort((a, b) => (b.ai_score || 75) - (a.ai_score || 75))
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      console.error('Raw response:', geminiResponse)
      throw parseError
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error)
  }

  return articles.map(article => ({ ...article, ai_score: 75 }))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      supabase.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: ''
      })
    }

    const { categories } = await req.json().catch(() => ({ categories: undefined }))
    const requestedInterests: string[] | undefined = Array.isArray(categories) && categories.length
      ? categories
      : undefined

    // Fetch all RSS feeds
    const allArticles: Article[] = []
    
    for (const [source, url] of Object.entries(RSS_FEEDS)) {
      try {
        const response = await fetch(url)
        const xmlText = await response.text()
        const articles = parseRSSFeed(xmlText, source)
        allArticles.push(...articles)
      } catch (error) {
        console.error(`Error fetching ${source}:`, error)
      }
    }

    // Determine which interests to use for filtering
    // Priority: explicitly requested interests from client > stored user preferences > conservative default
    const { data: { user } } = await supabase.auth.getUser()
    let userInterests = requestedInterests && requestedInterests.length ? requestedInterests : ['World News']

    if (!requestedInterests && user) {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('interests, custom_interests')
        .eq('user_id', user.id)
        .maybeSingle()

      if (preferences) {
        const combined = [...(preferences.interests || []), ...(preferences.custom_interests || [])]
        if (combined.length > 0) userInterests = combined
      }
    }

    // Use advanced filtering with keywords
    const filteredArticles = filterNewsByInterests(allArticles, userInterests)

    console.log(`Filtered ${filteredArticles.length} articles from ${allArticles.length} based on interests: ${userInterests.join(', ')}`);
    
    // Debug information
    console.log('Debug Info:', {
      totalArticles: allArticles.length,
      filteredArticles: filteredArticles.length,
      userInterests,
      sampleFilteredTitles: filteredArticles.slice(0, 3).map(a => a.title)
    });

    // Personalize with Gemini
    const personalizedArticles = await personalizeWithGemini(
      filteredArticles.length > 0 ? filteredArticles : allArticles, 
      userInterests
    )

    // Store curated articles for the user if authenticated
    if (user) {
      const articlesToStore = personalizedArticles.slice(0, MAX_RETURNED).map(article => ({
        user_id: user.id,
        title: article.title,
        description: article.description,
        link: article.link,
        source: article.source,
        category: article.category,
        ai_score: article.ai_score || 75,
        published_at: article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString()
      }))

      await supabase
        .from('curated_articles')
        .upsert(articlesToStore, { onConflict: 'user_id,link' })
    }

    return new Response(
      JSON.stringify({ 
        articles: personalizedArticles.slice(0, MAX_RETURNED),
        interests: userInterests
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fetch-rss-feeds function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})