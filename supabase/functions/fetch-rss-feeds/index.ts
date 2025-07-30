import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RSS_FEEDS = {
  'BBC News': 'http://feeds.bbci.co.uk/news/rss.xml',
  'BBC Tech': 'http://feeds.bbci.co.uk/news/technology/rss.xml',
  'Guardian World': 'https://www.theguardian.com/world/rss',
  'Guardian Tech': 'https://www.theguardian.com/uk/technology/rss',
  'TechCrunch': 'https://techcrunch.com/feed/',
  'Reuters Tech': 'http://feeds.reuters.com/reuters/technologyNews'
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
    for (const item of itemMatches.slice(0, 5)) { // Limit to 5 articles per feed
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
  if (source.toLowerCase().includes('tech')) return 'Technology'
  if (source.toLowerCase().includes('world')) return 'World'
  return 'General'
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
            
            Analyze these news articles and score each from 1-100 based on relevance to the user's interests. Return only a JSON array with title and score for each article:

            ${articles.map((article, index) => `${index + 1}. Title: ${article.title}\nDescription: ${article.description}`).join('\n\n')}

            Return format: [{"title": "article title", "score": 85}, ...]`
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

    // Filter articles by user interests first
    const filteredArticles = allArticles.filter(article => {
      if (userInterests.includes('General')) return true;
      
      return userInterests.some(interest => 
        article.category.toLowerCase().includes(interest.toLowerCase()) ||
        article.title.toLowerCase().includes(interest.toLowerCase()) ||
        article.description.toLowerCase().includes(interest.toLowerCase())
      );
    });

    console.log(`Filtered ${filteredArticles.length} articles from ${allArticles.length} based on interests: ${userInterests.join(', ')}`);

    // Personalize with Gemini
    const personalizedArticles = await personalizeWithGemini(
      filteredArticles.length > 0 ? filteredArticles : allArticles, 
      userInterests
    )

    // Store curated articles for the user if authenticated
    if (user) {
      const articlesToStore = personalizedArticles.slice(0, 10).map(article => ({
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
        articles: personalizedArticles.slice(0, 10),
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