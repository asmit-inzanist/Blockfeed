import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { getGeminiKey, PREDEFINED_INTERESTS, INTEREST_KEYWORDS } from './config'
import { Article } from './types'
import { filterArticlesForCustomInterest, getExp    // Get custom interests and their keywords
    const customInterests = userInterests.filter(i => !PREDEFINED_INTERESTS.has(i));
    let filteringKeywords = [];

    if (customInterests.length > 0) {
      try {
        // Get keywords for each custom interest
        const keywordPromises = customInterests.map(interest => getExpandedKeywords(interest));
        const keywordResults = await Promise.all(keywordPromises);
        
        // Combine keywords from all interests
        filteringKeywords = keywordResults.flatMap(result => result.keywords);
        
        // Log for debugging
        console.log('Filtering keywords:', {
          interests: customInterests,
          keywords: filteringKeywords
        });
      } catch (error) {
        console.error('Error getting keywords:', error);
      }
    }

    // Use direct filtering approachfrom './directFilter'
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
  // Technology & General Tech
  'TechCrunch': 'https://techcrunch.com/feed/',
  
  // Business
  'Harvard Business Review': 'https://hbr.org/feed',
  'Fast Company': 'https://www.fastcompany.com/feed',
  'Inc.com': 'https://www.inc.com/rss/',
  'Business News Daily': 'https://www.businessnewsdaily.com/feed',
  
  // Travel
  'Lonely Planet': 'https://www.lonelyplanet.com/blog/feed/',
  'Travel + Leisure': 'https://www.travelandleisure.com/feed',
  'Condé Nast Traveler': 'https://www.cntraveler.com/feed',
  'The Points Guy': 'https://thepointsguy.com/feed/',
  
  // Food & Dining
  'Food & Wine': 'https://www.foodandwine.com/feed',
  'Bon Appétit': 'https://www.bonappetit.com/feed',
  'Eater': 'https://www.eater.com/rss/index.xml',
  'Serious Eats': 'https://www.seriouseats.com/feed',
  
  // Automotive
  'Motor Trend': 'https://www.motortrend.com/feed',
  'Autoblog': 'https://www.autoblog.com/rss.xml',
  'Car and Driver': 'https://www.caranddriver.com/rss/all.xml/',
  'Jalopnik': 'https://jalopnik.com/rss',
  
  // Real Estate
  'Realtor.com News': 'https://www.realtor.com/news/feed/',
  'Inman News': 'https://www.inman.com/feed/',
  'HousingWire': 'https://www.housingwire.com/feed',
  'The Real Deal': 'https://therealdeal.com/feed/',
  
  // Energy
  'OilPrice.com': 'https://oilprice.com/rss/main',
  'Renewable Energy World': 'https://www.renewableenergyworld.com/feed/',
  'Energy News Network': 'https://energynews.us/feed/',
  'Utility Dive': 'https://www.utilitydive.com/feeds/news/',
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
  
  // Business
  if (sourceLower.includes('business') || sourceLower.includes('inc.com') || 
      sourceLower.includes('fastcompany') || sourceLower.includes('hbr.org')) 
    return 'Business'
  
  // Travel
  if (sourceLower.includes('travel') || sourceLower.includes('lonelyplanet') || 
      sourceLower.includes('cntraveler')) 
    return 'Travel'
  
  // Food & Dining
  if (sourceLower.includes('food') || sourceLower.includes('recipe') || 
      sourceLower.includes('dining') || sourceLower.includes('eater') ||
      sourceLower.includes('bonappetit')) 
    return 'Food & Dining'
  
  // Automotive
  if (sourceLower.includes('auto') || sourceLower.includes('car') || 
      sourceLower.includes('motor') || sourceLower.includes('jalopnik')) 
    return 'Automotive'
  
  // Real Estate
  if (sourceLower.includes('realtor') || sourceLower.includes('housing') || 
      sourceLower.includes('realestate') || sourceLower.includes('therealdeal')) 
    return 'Real Estate'
  
  // Energy
  if (sourceLower.includes('energy') || sourceLower.includes('oilprice') || 
      sourceLower.includes('utility') || sourceLower.includes('renewable')) 
    return 'Energy'

  // Gaming
  if (sourceLower.includes('gaming') || sourceLower.includes('game') || 
      sourceLower.includes('polygon') || sourceLower.includes('ign') ||
      sourceLower.includes('eurogamer') || sourceLower.includes('pc gamer')) 
    return 'Gaming'
    
  // Cybersecurity
  if (sourceLower.includes('security') || sourceLower.includes('krebs') || 
      sourceLower.includes('hack') || sourceLower.includes('threat')) 
    return 'Cybersecurity'

  // Business Tech
  if (sourceLower.includes('cio') || sourceLower.includes('informationweek') || 
      sourceLower.includes('eweek') || sourceLower.includes('computerworld') ||
      sourceLower.includes('infoworld')) 
    return 'Business Tech'

  // Health Tech
  if (sourceLower.includes('digitalhealth') || sourceLower.includes('healthit') || 
      sourceLower.includes('mobihealth') || sourceLower.includes('medical futurist')) 
    return 'Health Tech'

  // Sports Tech
  if (sourceLower.includes('sporttechie') || sourceLower.includes('sports technology') || 
      sourceLower.includes('stack sports')) 
    return 'Sports Tech'
  
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
    'world': ['international', 'global', 'world', 'country', 'nation', 'foreign', 'embassy', 'diplomatic', 'war', 'conflict', 'peace', 'treaty', 'border', 'crisis'],
    'business': ['business', 'entrepreneur', 'startup', 'company', 'corporate', 'industry', 'management', 'leadership', 'enterprise', 'commerce', 'strategy', 'innovation', 'workplace', 'executive'],
    'travel': ['travel', 'tourism', 'destination', 'vacation', 'hotel', 'resort', 'flight', 'adventure', 'tourist', 'holiday', 'journey', 'explore', 'trip', 'cruise', 'hospitality'],
    'food & dining': ['food', 'restaurant', 'dining', 'cuisine', 'recipe', 'chef', 'cooking', 'culinary', 'meal', 'gastronomy', 'menu', 'dishes', 'flavors', 'kitchen', 'eat'],
    'automotive': ['car', 'vehicle', 'automotive', 'motor', 'drive', 'racing', 'electric vehicle', 'ev', 'automobile', 'transportation', 'engine', 'auto industry', 'manufacturer'],
    'real estate': ['real estate', 'property', 'housing', 'mortgage', 'realty', 'apartment', 'home', 'commercial', 'residential', 'construction', 'development', 'lease', 'rent'],
    'energy': ['energy', 'power', 'electricity', 'renewable', 'solar', 'wind', 'oil', 'gas', 'nuclear', 'utility', 'grid', 'sustainability', 'carbon', 'climate']
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
    // Match case-insensitively with the INTEREST_KEYWORDS keys
    const matchingKey = Object.keys(INTEREST_KEYWORDS).find(
      k => k.toLowerCase() === interest.toLowerCase()
    );
    const keywords = matchingKey ? INTEREST_KEYWORDS[matchingKey] : [];
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

    // Get expanded keywords for custom interests
    const customInterests = userInterests.filter(i => !PREDEFINED_INTERESTS.includes(i));
    let debugKeywords = null;
    let debugKeywordSource = null;

    if (customInterests.length > 0) {
      try {
        const { keywords, source } = await getExpandedKeywords(customInterests[0]);
        debugKeywords = keywords;
        debugKeywordSource = source;
      } catch (error) {
        console.error('Error getting debug keywords:', error);
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

    const debugInfo = filteredArticles.length > 0 ? (filteredArticles[0] as any).debug || null : null;

    // Get filtering keywords from filtered articles
    const keywords = filteredArticles
      .filter(article => (article as any).debug?.keywords)
      .map(article => (article as any).debug.keywords)
      .flat();

    // Get keyword sources if available
    const keywordSources = filteredArticles
      .filter(article => (article as any).debug?.keywordSource)
      .map(article => (article as any).debug.keywordSource);

    // Log debug info
    console.log('Debug info:', {
      filteredCount: filteredArticles.length,
      hasKeywords: keywords.length > 0,
      keywordCount: keywords.length,
      sampleKeywords: keywords.slice(0, 10)
    });

    // Get keywords used for filtering
    const filteringKeywords = userInterests.flatMap(interest => {
      const matchingKey = Object.keys(INTEREST_KEYWORDS).find(
        k => k.toLowerCase() === interest.toLowerCase()
      );
      return matchingKey ? INTEREST_KEYWORDS[matchingKey] : [];
    });

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
