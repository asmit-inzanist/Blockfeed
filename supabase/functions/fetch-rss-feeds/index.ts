import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { getGeminiKey, PREDEFINED_INTERESTS } from './config'
import { Article } from './types'
import { filterArticlesForCustomInterest } from './directFilter'
import { removeDuplicateArticles } from './utils'
import { scoreArticles } from './gemini'

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
  
  // Comprehensive General News Sources
  'Reuters Top News': 'https://www.reutersagency.com/feed/',
  'Associated Press': 'https://feeds.feedburner.com/associatedpress/news',
  'The Guardian': 'https://www.theguardian.com/world/rss',
  'Huffington Post': 'https://www.huffpost.com/section/front-page/feed',
  'BBC News Home': 'http://feeds.bbci.co.uk/news/rss.xml',
  'NPR News': 'https://feeds.npr.org/1001/rss.xml',
  'Washington Post': 'https://feeds.washingtonpost.com/rss/world',
  'Al Jazeera': 'https://www.aljazeera.com/xml/rss/all.xml',
  
  // World News
  'BBC World News': 'http://feeds.bbci.co.uk/news/world/rss.xml',
  'NBC News': 'https://feeds.nbcnews.com/nbcnews/public/news',
  'CBS World News': 'https://www.cbsnews.com/world/rss',
  'BBC (All RSS)': 'http://newsrss.bbc.co.uk/rss/',
  'CNN Top Stories': 'https://rss.cnn.com/rss/cnn_topstories.rss',
  'Reuters World News': 'https://www.reuters.com/world/rss',
  'The New York Times (RSS index)': 'https://www.nytimes.com/rss',
  'Times of India (RSS index)': 'https://timesofindia.indiatimes.com/rss.cms',
  'NDTV (RSS index)': 'https://www.ndtv.com/rss'
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

async function filterNewsByInterests(newsItems: Article[], userInterests: string[]): Promise<Article[]> {
  if (!userInterests || userInterests.length === 0) {
    return removeDuplicateArticles(newsItems);
  }

  // First remove duplicates
  const uniqueArticles = removeDuplicateArticles(newsItems);
  
  // Separate predefined and custom interests
  const predefinedInterests = userInterests.filter(i => PREDEFINED_INTERESTS.has(i));
  const customInterests = userInterests.filter(i => !PREDEFINED_INTERESTS.has(i));
  
  // Handle predefined interests with the existing approach
  const searchTerms = new Set<string>();
  const newsCategories = new Set<string>();
  
  predefinedInterests.forEach(interest => {
    searchTerms.add(interest.toLowerCase());
    newsCategories.add(interest.toLowerCase());
  });

  // Filter articles for predefined interests
  const predefinedMatches = uniqueArticles.filter(item => {
    const content = (item.title + " " + item.description).toLowerCase();
    const category = (item.category || '').toLowerCase();
    
    const categoryMatch = Array.from(newsCategories).some(cat => 
      category.includes(cat) || cat.includes(category)
    );
    const contentMatch = Array.from(searchTerms).some(term => 
      content.includes(term)
    );

    return categoryMatch || contentMatch;
  });

  // Handle custom interests with the direct filtering approach
  let customMatches: Article[] = [];
  for (const interest of customInterests) {
    const relevantArticles = await filterArticlesForCustomInterest(uniqueArticles, interest);
    customMatches = [...customMatches, ...relevantArticles];
  }

  // Combine and deduplicate results
  return removeDuplicateArticles([...predefinedMatches, ...customMatches]);
}

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

    // Use direct filtering approach
    const filteredArticles = await filterNewsByInterests(allArticles, userInterests);

    console.log(`Filtered ${filteredArticles.length} articles from ${allArticles.length} based on interests: ${userInterests.join(', ')}`);

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
