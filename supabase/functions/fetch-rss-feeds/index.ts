import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RSS_FEEDS = {
  // Technology
  'TechCrunch': 'https://techcrunch.com/feed/',
  'Gadgets 360': 'https://www.gadgets360.com/rss',
  
  // Finance
  'Financial Times': 'https://www.ft.com/?format=rss',
  'Benzinga': 'https://feeds.benzinga.com/benzinga',
  'MarketBeat': 'https://marketbeat.com/feed',
  
  // Sports
  'NDTV Sports': 'https://feeds.feedburner.com/ndtvsports-latest',
  'Times of India Sports': 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',
  
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
    for (const item of itemMatches.slice(0, 8)) { // Limit to 8 articles per feed
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
  if (sourceLower.includes('entertainment') || sourceLower.includes('tmz')) return 'Entertainment'
  // More specific sports matching
  if (sourceLower.includes('ndtv sports') || (sourceLower.includes('sports') && !sourceLower.includes('entertainment'))) return 'Sports'
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

function filterNewsByInterests(newsItems: Article[], userInterests: string[]): Article[] {
  if (!userInterests || userInterests.length === 0) {
    return newsItems
  }
  
  return newsItems.filter(item => {
    const title = item.title.toLowerCase()
    const description = item.description.toLowerCase()
    const content = title + " " + description
    
    return userInterests.some(interest => {
      const keywords = getKeywordsForCategory(interest)
      return keywords.some(keyword => content.includes(keyword.toLowerCase())) ||
             item.category.toLowerCase().includes(interest.toLowerCase())
    })
  })
}

async function personalizeWithGemini(articles: Article[], interests: string[]): Promise<Article[]> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  
  console.log('Gemini API key present:', !!geminiApiKey)
  console.log('User interests:', interests)
  console.log('Articles to process:', articles.length)
  
  if (!geminiApiKey) {
    console.log('No Gemini API key found, returning unpersonalized articles')
    return articles.map(article => ({ ...article }))
  }

  try {
    console.log('Making Gemini API request...')
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Based on user interests: ${interests.join(', ')}
            
            Analyze these news articles and score each from 1-100 based on relevance to the user's interests. Pay special attention to the article titles and descriptions. Higher scores (80-100) for highly relevant content, medium scores (40-79) for somewhat relevant content, and lower scores (1-39) for irrelevant content. Return only a JSON array with title and score for each article:

            ${articles.map((article, index) => `${index + 1}. Title: "${article.title}"\nDescription: "${article.description}"\nSource: ${article.source}\nCategory: ${article.category}`).join('\n\n')}

            Return format: [{"title": "exact article title", "score": 85}, ...]`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      })
    })

    console.log('Gemini API response status:', response.status)
    const data = await response.json()
    console.log('Gemini API response data:', JSON.stringify(data, null, 2))
    const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (geminiResponse) {
      try {
        const scores = JSON.parse(geminiResponse.replace(/```json|```/g, ''))
        
        return articles.map(article => {
          const scoreData = scores.find((s: any) => s.title === article.title)
          return {
            ...article,
            ai_score: scoreData ? Math.min(Math.max(scoreData.score, 1), 100) : 75
          }
        }).sort((a, b) => (b.ai_score || 75) - (a.ai_score || 75))
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError)
        return articles.map(article => ({ ...article, ai_score: 75 }))
      }
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

    const { categories } = await req.json()
    const selectedCategories = categories || ['Technology', 'General']

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

    // Get user preferences
    const { data: { user } } = await supabase.auth.getUser()
    let userInterests = ['Technology', 'AI']

    if (user) {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('interests, custom_interests')
        .eq('user_id', user.id)
        .maybeSingle()

      if (preferences) {
        userInterests = [...(preferences.interests || []), ...(preferences.custom_interests || [])]
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
      const articlesToStore = personalizedArticles.slice(0, 25).map(article => ({
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
        articles: personalizedArticles.slice(0, 25),
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