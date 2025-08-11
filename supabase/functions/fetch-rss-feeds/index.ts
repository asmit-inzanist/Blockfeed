import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { getGeminiKey, PREDEFINED_INTERESTS, INTEREST_KEYWORDS } from './config.ts'
import { Article } from './types.ts'
import { filterArticlesForCustomInterest } from './directFilter.ts'
import { removeDuplicateArticles } from './utils.ts'
import { scoreArticles } from './gemini.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tunable limits (override via environment variables MAX_PER_FEED and MAX_RETURNED)
const MAX_PER_FEED = Number(Deno.env.get('MAX_PER_FEED') ?? '20')
const MAX_RETURNED = Number(Deno.env.get('MAX_RETURNED') ?? '30')

const RSS_FEEDS = {
  // Technology & General Tech
  'TechCrunch': 'https://techcrunch.com/feed/',
  'The Verge': 'https://www.theverge.com/rss/index.xml',
  'Wired': 'https://www.wired.com/feed/rss',
  'Ars Technica': 'https://arstechnica.com/feed/',
  'ZDNet': 'https://www.zdnet.com/news/rss.xml',
  'VentureBeat': 'https://venturebeat.com/feed/',
  'MIT Technology Review': 'https://www.technologyreview.com/feed/',
  'Digital Trends': 'https://www.digitaltrends.com/feed/',
  
  // AI & ML
  'AI News': 'https://artificialintelligence-news.com/feed/',
  'Google AI Blog': 'http://feeds.feedburner.com/blogspot/gJZg',
  'OpenAI Blog': 'https://openai.com/blog/rss/',
  'DeepMind Blog': 'https://deepmind.com/blog/feed/basic/',
  'Machine Learning Mastery': 'https://machinelearningmastery.com/feed/',
  
  // Finance & Business
  'Financial Times': 'https://www.ft.com/?format=rss',
  'Bloomberg': 'https://www.bloomberg.com/feeds/technology.rss',
  'Business Insider': 'https://www.businessinsider.com/rss',
  'CNBC Tech': 'https://www.cnbc.com/id/19854910/device/rss/rss.html',
  'Forbes Tech': 'https://www.forbes.com/technology/feed/',
  'MarketWatch': 'https://feeds.marketwatch.com/marketwatch/topstories/',
  
  // Startups
  'StartupWorld': 'https://startupworld.com/feed/',
  'EU-Startups': 'https://www.eu-startups.com/feed/',
  'YCombinator Blog': 'https://blog.ycombinator.com/feed/',
  'Indie Hackers': 'https://www.indiehackers.com/feed.xml',
  'Startup Daily': 'https://www.startupdaily.net/feed/',
  
  // Gaming
  'Polygon': 'https://www.polygon.com/rss/index.xml',
  'IGN': 'https://www.ign.com/rss/articles/feed',
  'GameSpot': 'https://www.gamespot.com/feeds/game-news',
  'Eurogamer': 'https://www.eurogamer.net/feed',
  'PC Gamer': 'https://www.pcgamer.com/rss/',
  
  // Cybersecurity
  'Krebs on Security': 'https://krebsonsecurity.com/feed/',
  'The Hacker News': 'https://feeds.feedburner.com/TheHackersNews',
  'Threatpost': 'https://threatpost.com/feed/',
  'Dark Reading': 'https://www.darkreading.com/rss.xml',
  'Security Week': 'https://feeds.feedburner.com/securityweek',
  
  // Science & Research
  'Science Daily': 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml',
  'Nature': 'https://www.nature.com/nature.rss',
  'New Scientist Tech': 'https://www.newscientist.com/subject/technology/feed/',
  'IEEE Spectrum': 'https://spectrum.ieee.org/feeds/feed.rss',
  'ACM TechNews': 'https://technews.acm.org/feed/',
  
  // Business Tech
  'CIO': 'https://www.cio.com/index.rss',
  'Information Week': 'https://www.informationweek.com/rss_simple.asp',
  'eWeek': 'https://www.eweek.com/feed/',
  'Computer World': 'https://www.computerworld.com/index.rss',
  'InfoWorld': 'https://www.infoworld.com/index.rss',
  
  // Health Tech
  'Digital Health': 'https://www.digitalhealth.net/feed/',
  'Health IT News': 'https://www.healthcareitnews.com/feed/',
  'MobiHealth News': 'https://www.mobihealthnews.com/feed/',
  'Medical Futurist': 'https://medicalfuturist.com/feed/',
  
  // Sports Tech
  'SportTechie': 'https://www.sporttechie.com/feed/',
  'Sports Technology Blog': 'https://www.sportstechnologyblog.com/feed/',
  'Stack Sports': 'https://www.stack.com/feed/'
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
  
  if (sourceLower.includes('ai') || sourceLower.includes('artificial intelligence') || 
      sourceLower.includes('machine learning') || sourceLower.includes('deepmind')) return 'AI & ML'
  
  if (sourceLower.includes('startup') || sourceLower.includes('ycombinator') || 
      sourceLower.includes('indie hackers')) return 'Startups'
  
  if (sourceLower.includes('game') || sourceLower.includes('ign') || 
      sourceLower.includes('polygon') || sourceLower.includes('esports')) return 'Gaming'
  
  if (sourceLower.includes('security') || sourceLower.includes('hack') || 
      sourceLower.includes('threat')) return 'Cybersecurity'
  
  if (sourceLower.includes('cio') || sourceLower.includes('enterprise') || 
      sourceLower.includes('infoworld') || sourceLower.includes('eweek')) return 'Business Tech'
  if (sourceLower.includes('entertainment') || sourceLower.includes('tmz') || 
      sourceLower.includes('variety')) return 'Entertainment'
  
  if (sourceLower.includes('ndtv sports') || sourceLower.includes('sky sports') || 
      sourceLower.includes('sports') && !sourceLower.includes('entertainment')) return 'Sports'
  
  if (sourceLower.includes('techcrunch') || sourceLower.includes('gadgets')) return 'Technology'
  
  if (sourceLower.includes('financial') || sourceLower.includes('benzinga') || 
      sourceLower.includes('marketbeat')) return 'Finance'
  
  if (sourceLower.includes('politics') || sourceLower.includes('theprint')) return 'Politics'
  
  if (sourceLower.includes('medical') || sourceLower.includes('health')) return 'Health'
  
  if (sourceLower.includes('science')) return 'Science'
  
  if (sourceLower.includes('world') || sourceLower.includes('bbc') || 
      sourceLower.includes('nbc')) return 'World News'
  
  return 'General'
}

function getKeywordsForCategory(category: string): string[] {
  const keywordMap: Record<string, string[]> = {
      'Technology': ['tech', 'ai', 'artificial intelligence', 'software', 'computer', 'digital', 'internet', 'startup', 'innovation', 'cybersecurity', 'app', 'platform', 'algorithm', 'data', 'cloud'],
    'Finance': ['finance', 'business', 'economy', 'stock', 'market', 'investment', 'banking', 'cryptocurrency', 'bitcoin', 'trading', 'revenue', 'profit', 'economic', 'financial', 'money'],
    'Sports': ['football', 'soccer', 'basketball', 'tennis', 'cricket', 'olympics', 'sports', 'match', 'tournament', 'player', 'team', 'league', 'championship', 'game', 'athletic'],
    'Politics': ['politics', 'election', 'government', 'parliament', 'minister', 'policy', 'vote', 'campaign', 'political', 'congress', 'senate', 'democracy', 'law', 'legislation'],
    'Health': ['health', 'medical', 'hospital', 'doctor', 'medicine', 'virus', 'disease', 'treatment', 'healthcare', 'patient', 'clinical', 'drug', 'vaccine', 'therapy'],
    'Entertainment': ['entertainment', 'movie', 'film', 'music', 'celebrity', 'actor', 'actress', 'show', 'concert', 'hollywood', 'streaming', 'album', 'television', 'media'],
    'Science': ['science', 'research', 'study', 'discovery', 'climate', 'space', 'nasa', 'experiment', 'scientific', 'biology', 'chemistry', 'physics', 'environment', 'nature'],
    'World News': ['international', 'global', 'world', 'country', 'nation', 'foreign', 'embassy', 'diplomatic', 'war', 'conflict', 'peace', 'treaty', 'border', 'crisis'],
    
      'AI & ML': ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks', 'ai models', 'nlp', 'computer vision', 'ai research', 'robotics', 'automation', 'data science', 'algorithms', 'ai applications'],
    'Startups': ['startup', 'entrepreneur', 'venture capital', 'funding', 'seed round', 'innovation', 'tech startup', 'startup ecosystem', 'incubator', 'accelerator', 'business model', 'unicorn', 'startup founder'],
    'Gaming': ['gaming', 'video games', 'esports', 'game development', 'console gaming', 'pc gaming', 'mobile gaming', 'game industry', 'game technology', 'virtual reality', 'augmented reality', 'gaming hardware'],
    'Cybersecurity': ['cybersecurity', 'security', 'hacking', 'cyber attack', 'data breach', 'privacy', 'encryption', 'network security', 'information security', 'cyber defense', 'security technology', 'cyber threats'],
    'Business Tech': ['enterprise technology', 'business software', 'cloud computing', 'digital transformation', 'saas', 'enterprise solutions', 'business intelligence', 'data analytics', 'productivity tools', 'business automation']
  }
  return keywordMap[category.toLowerCase()] || []
}

function filterNewsByInterests(newsItems: Article[], userInterests: string[]): Article[] {
  if (!userInterests || userInterests.length === 0) {
    return removeDuplicateArticles(newsItems);
  }

  // First remove duplicates
  const uniqueArticles = removeDuplicateArticles(newsItems);
  
  // Get all relevant keywords for the selected interests
  const keywordSets = userInterests.map(interest => {
    const keywords = INTEREST_KEYWORDS[interest as keyof typeof INTEREST_KEYWORDS] || [];
    return new Set(keywords.map(k => k.toLowerCase()));
  });

  // Filter articles based on keyword matches
  const filteredArticles = uniqueArticles.filter(article => {
    const content = (article.title + " " + article.description).toLowerCase();
    
    // Check if the article matches keywords from any selected interest
    return keywordSets.some(keywords => 
      Array.from(keywords).some(keyword => content.includes(keyword))
    );
  });

  // Add debug information
  const allKeywords = Array.from(new Set(
    userInterests.flatMap(interest => 
      INTEREST_KEYWORDS[interest as keyof typeof INTEREST_KEYWORDS] || []
    )
  ));

  console.log('Filtering info:', {
    interests: userInterests,
    keywordCount: allKeywords.length,
    matchedArticles: filteredArticles.length,
    totalArticles: uniqueArticles.length
  });

  return filteredArticles;
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

    // Debug info for predefined interests
    const debugKeywords = userInterests.flatMap(interest => 
      INTEREST_KEYWORDS[interest as keyof typeof INTEREST_KEYWORDS] || []
    );

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

    const debugInfo = filteredArticles.length > 0 ? (filteredArticles[0] as any).debug || null : null;

    // Get filtering keywords from filtered articles
    const keywords = userInterests.flatMap(interest => 
      INTEREST_KEYWORDS[interest as keyof typeof INTEREST_KEYWORDS] || []
    );

    // Log debug info
    console.log('Debug info:', {
      filteredCount: filteredArticles.length,
      hasKeywords: keywords.length > 0,
      keywordCount: keywords.length,
      sampleKeywords: keywords.slice(0, 10)
    });

    // Get keywords used for filtering
    const filteringKeywords = userInterests.flatMap(interest => 
      INTEREST_KEYWORDS[interest as keyof typeof INTEREST_KEYWORDS] || []
    );

    return new Response(
      JSON.stringify({ 
        articles: personalizedArticles.slice(0, MAX_RETURNED),
        interests: userInterests,
        debug: {
          totalFetched: allArticles.length,
          afterFiltering: filteredArticles.length,
          interestCount: userInterests.length,
          matchRate: filteredArticles.length > 0 
            ? Math.round((filteredArticles.length / allArticles.length) * 100)
            : 0,
          filteringKeywords: Array.from(new Set(filteringKeywords))
        }
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
