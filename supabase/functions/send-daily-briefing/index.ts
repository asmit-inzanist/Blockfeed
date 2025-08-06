import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
  title: string;
  description: string;
  link: string;
  source: string;
  category: string;
  published_at: string;
  ai_score?: number;
  ai_summary?: string;
}

interface BriefingRequest {
  email: string;
  interests: string[];
  userId?: string;
}

const RSS_FEEDS = {
  'TechCrunch': 'https://techcrunch.com/feed/',
  'BBC News': 'https://feeds.bbci.co.uk/news/rss.xml',
  'CNN': 'https://rss.cnn.com/rss/edition.rss',
  'Reuters': 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best',
  'The Guardian': 'https://www.theguardian.com/world/rss',
  'MarketBeat': 'https://www.marketbeat.com/rss/',
  'Benzinga': 'https://feeds.benzinga.com/benzinga',
  'NDTV Sports': 'https://feeds.feedburner.com/ndtvsports-latest',
  'TheSpaceDaily': 'https://www.spacedaily.com/spacedaily.xml',
  'Medlineplus': 'https://www.nlm.nih.gov/medlineplus/feeds/news.xml',
  'TMZ': 'https://www.tmz.com/rss.xml',
  'TheScience': 'https://www.thescience.org/feed/',
  'ThePrint': 'https://theprint.in/feed/'
};

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/<[^>]*>/g, '')
    .trim();
}

async function parseRSSFeed(xmlText: string, source: string): Promise<Article[]> {
  const articles: Article[] = [];
  
  try {
    // Simple regex-based XML parsing for RSS feeds
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const items = xmlText.match(itemRegex) || [];
    
    items.forEach((itemXml) => {
      try {
        const titleMatch = itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i);
        const descMatch = itemXml.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i);
        const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/i);
        const pubDateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
        
        const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
        const description = (descMatch?.[1] || descMatch?.[2] || '').trim();
        const link = (linkMatch?.[1] || '').trim();
        const pubDate = (pubDateMatch?.[1] || '').trim();
        
        if (title && link) {
          articles.push({
            title: cleanText(title),
            description: cleanText(description),
            link: link,
            source,
            category: getCategoryFromSource(source),
            published_at: pubDate || new Date().toISOString()
          });
        }
      } catch (itemError) {
        console.error(`Error parsing item from ${source}:`, itemError);
      }
    });
    
    console.log(`Successfully parsed ${articles.length} articles from ${source}`);
  } catch (error) {
    console.error(`Error parsing RSS for ${source}:`, error);
  }
  
  return articles;
}

function getCategoryFromSource(source: string): string {
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes('entertainment') || sourceLower.includes('tmz')) return 'Entertainment';
  if (sourceLower.includes('ndtv sports') || (sourceLower.includes('sports') && !sourceLower.includes('entertainment'))) return 'Sports';
  if (sourceLower.includes('techcrunch') || sourceLower.includes('gadgets')) return 'Technology';
  if (sourceLower.includes('financial') || sourceLower.includes('benzinga') || sourceLower.includes('marketbeat')) return 'Finance';
  if (sourceLower.includes('politics') || sourceLower.includes('theprint')) return 'Politics';
  if (sourceLower.includes('medical') || sourceLower.includes('medlineplus')) return 'Health';
  if (sourceLower.includes('science')) return 'Science';
  if (sourceLower.includes('world') || sourceLower.includes('bbc') || sourceLower.includes('cnn')) return 'World News';
  return 'General';
}

function filterNewsByInterests(articles: Article[], interests: string[]): Article[] {
  return articles.filter(article => {
    const categoryMatch = interests.includes(article.category);
    
    const keywordMatch = interests.some(interest => {
      const keywords = getKeywordsForCategory(interest);
      const searchText = `${article.title} ${article.description}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
    
    return categoryMatch || keywordMatch;
  });
}

function getKeywordsForCategory(category: string): string[] {
  const keywordMap: { [key: string]: string[] } = {
    'Technology': ['tech', 'ai', 'artificial intelligence', 'software', 'computer', 'digital', 'tech', 'startup', 'innovation'],
    'Finance': ['finance', 'stock', 'market', 'economy', 'investment', 'banking', 'crypto', 'bitcoin', 'trading', 'money'],
    'Sports': ['sports', 'football', 'basketball', 'soccer', 'tennis', 'baseball', 'cricket', 'olympics', 'championship'],
    'Politics': ['politics', 'government', 'election', 'policy', 'congress', 'parliament', 'vote', 'political'],
    'Health': ['health', 'medical', 'medicine', 'disease', 'treatment', 'healthcare', 'doctor', 'patient', 'wellness'],
    'Entertainment': ['entertainment', 'movie', 'film', 'celebrity', 'music', 'hollywood', 'tv', 'show', 'actor'],
    'Science': ['science', 'research', 'study', 'discovery', 'experiment', 'scientist', 'space', 'climate'],
    'World News': ['world', 'international', 'global', 'country', 'nation', 'war', 'conflict', 'diplomacy']
  };
  
  return keywordMap[category] || [];
}

async function summarizeAndRankArticles(articles: Article[], interests: string[]): Promise<Article[]> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!geminiApiKey) {
    console.log('No Gemini API key found, returning articles without AI processing');
    return articles.slice(0, 8);
  }

  try {
    const articlesText = articles.map((article, index) => 
      `${index + 1}. Title: "${article.title}"\nDescription: "${article.description}"\nSource: ${article.source}\nCategory: ${article.category}`
    ).join('\n\n');

    const prompt = `You are a news editor creating a daily briefing. Based on these user interests: ${interests.join(', ')}

Please analyze these articles and:
1. Generate a 2-3 sentence summary for each article that highlights why it's relevant to the user
2. Rate each article's importance on a scale of 1-10 based on the user's interests

Return a JSON array with this format:
[
  {
    "index": 1,
    "summary": "2-3 sentence summary",
    "importance": 8
  }
]

Articles:
${articlesText}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiResponse) {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const aiAnalysis = JSON.parse(jsonMatch[0]);
        
        // Apply AI analysis to articles
        const enrichedArticles = articles.map((article, index) => {
          const analysis = aiAnalysis.find((a: any) => a.index === index + 1);
          if (analysis) {
            return {
              ...article,
              ai_summary: analysis.summary,
              ai_score: analysis.importance
            };
          }
          return { ...article, ai_score: 5 };
        });

        // Sort by importance and return top 8
        return enrichedArticles
          .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
          .slice(0, 8);
      }
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
  }

  // Fallback: return first 8 articles
  return articles.slice(0, 8);
}

function generateEmailHTML(articles: Article[], userEmail: string, isTest: boolean = false): string {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Generate test articles if this is a test email and no articles provided
  const testArticles: Article[] = [
    {
      title: "Breaking: Major AI Breakthrough Announced",
      description: "Researchers unveil new artificial intelligence system that can understand context better than ever before.",
      link: "https://example.com/ai-breakthrough",
      source: "TechCrunch",
      category: "Technology",
      published_at: new Date().toISOString(),
      ai_summary: "Scientists have developed a revolutionary AI system that demonstrates unprecedented contextual understanding, potentially transforming how machines interpret human language. This breakthrough could have significant implications for natural language processing applications.",
      ai_score: 9
    },
    {
      title: "Global Markets Rally as Economic Indicators Improve",
      description: "Stock markets worldwide see significant gains following positive economic data releases.",
      link: "https://example.com/market-rally",
      source: "Reuters",
      category: "Finance",
      published_at: new Date().toISOString(),
      ai_summary: "Major stock indices posted strong gains today as investors responded positively to encouraging economic indicators. The rally suggests growing confidence in global economic recovery prospects.",
      ai_score: 8
    },
    {
      title: "Revolutionary Climate Technology Shows Promise",
      description: "New carbon capture technology could significantly impact global warming efforts.",
      link: "https://example.com/climate-tech",
      source: "BBC News",
      category: "Science",
      published_at: new Date().toISOString(),
      ai_summary: "Engineers have developed an innovative carbon capture system that operates at unprecedented efficiency levels. This technology could play a crucial role in achieving global climate targets by 2030.",
      ai_score: 7
    },
    {
      title: "Space Mission Discovers Unexpected Findings",
      description: "Latest space exploration mission reveals surprising data about distant planets.",
      link: "https://example.com/space-discovery",
      source: "NASA",
      category: "Science",
      published_at: new Date().toISOString(),
      ai_summary: "Recent space mission data has unveiled unexpected characteristics of exoplanets in nearby star systems. These findings could reshape our understanding of planetary formation and the potential for extraterrestrial life.",
      ai_score: 6
    }
  ];

  const articlesToShow = isTest && articles.length === 0 ? testArticles : articles;

  const articleElements = articlesToShow.map(article => `
    <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e1e5e9; border-radius: 8px; background-color: #ffffff;">
      <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #1a1a1a; line-height: 1.3;">
        <a href="${article.link}" style="color: #1a1a1a; text-decoration: none;" target="_blank">${article.title}</a>
      </h3>
      <div style="font-size: 12px; color: #666; margin-bottom: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
        ${article.source} • ${article.category}
      </div>
      <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: #4a4a4a;">
        ${article.ai_summary || article.description}
      </p>
      <a href="${article.link}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block; padding: 8px 16px; border: 1px solid #2563eb; border-radius: 4px; transition: all 0.2s;" target="_blank">
        Read More →
      </a>
    </div>
  `).join('');

  const testBadge = isTest ? `
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 10px 20px; margin: 20px; border-radius: 6px; text-align: center; font-size: 14px; font-weight: 500;">
      📧 This is a test email with sample content
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily News Briefing - Test Email</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
            .header { padding: 20px !important; }
          }
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
            ${testBadge}
            
            <!-- Header -->
            <div class="header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Daily News Briefing</h1>
                <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95; font-weight: 300;">${today}</p>
            </div>
            
            <!-- Content -->
            <div class="content" style="padding: 40px;">
                <p style="margin: 0 0 30px 0; font-size: 16px; color: #4a4a4a; text-align: center;">
                    ${isTest ? '📰 Here\'s a sample of your personalized daily briefing:' : 'Good morning! Here are the top stories personalized for your interests:'}
                </p>
                
                ${articleElements}
                
                ${isTest ? `
                <div style="margin-top: 40px; padding: 20px; background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: #0369a1;">
                    ✨ This is just a preview! Your actual daily briefing will contain real news articles tailored to your interests.
                  </p>
                </div>
                ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e1e5e9; border-radius: 0 0 8px 8px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                    ${isTest ? `Test email sent to ${userEmail}` : `This briefing was generated for ${userEmail}`}
                </p>
                <p style="margin: 0; font-size: 12px; color: #999; font-weight: 500;">
                    Powered by BlockFeed Daily Briefing
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { email, interests, userId }: BriefingRequest = await req.json();

    console.log(`Generating briefing for ${email} with interests:`, interests);

    // Fetch articles from RSS feeds
    const allArticles: Article[] = [];
    
    for (const [source, url] of Object.entries(RSS_FEEDS)) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const xmlText = await response.text();
          const articles = await parseRSSFeed(xmlText, source);
          allArticles.push(...articles);
        }
      } catch (error) {
        console.error(`Error fetching ${source}:`, error);
      }
    }

    console.log(`Fetched ${allArticles.length} total articles`);

    // Filter by interests
    const filteredArticles = filterNewsByInterests(allArticles, interests);
    console.log(`Filtered to ${filteredArticles.length} relevant articles`);

    // Filter to articles from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentArticles = filteredArticles.filter(article => {
      const articleDate = new Date(article.published_at);
      return articleDate >= yesterday;
    });

    console.log(`Found ${recentArticles.length} articles from last 24 hours`);

    // Use all filtered articles if not enough recent ones, or fallback to all articles
    let articlesToProcess = recentArticles.length >= 8 ? recentArticles : filteredArticles;
    
    // If still no articles, use all articles regardless of interests as fallback
    if (articlesToProcess.length === 0) {
      console.log('No filtered articles found, using all articles as fallback');
      articlesToProcess = allArticles.slice(0, 20); // Take top 20 articles
    }

    // Summarize and rank with AI
    const finalArticles = await summarizeAndRankArticles(articlesToProcess, interests);
    console.log(`Final selection: ${finalArticles.length} articles`);

    if (finalArticles.length === 0) {
      throw new Error('No articles found for briefing - please try again later');
    }

    // Generate email
    const today = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    // Determine if this is a test email (no userId provided)
    const isTestEmail = !userId;
    const emailHTML = generateEmailHTML(finalArticles, email, isTestEmail);
    
    const emailResult = await resend.emails.send({
      from: 'BlockFeed Daily Briefing <noreply@resend.dev>',
      to: [email],
      subject: isTestEmail ? 'Your Daily News Briefing - Test Email' : `Your Daily News Briefing - ${today}`,
      html: emailHTML,
    });

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error);
      throw new Error(`Email sending failed: ${emailResult.error.message}`);
    }

    console.log('Email sent successfully:', emailResult);

    // Update last sent date if userId provided
    if (userId) {
      const { error: updateError } = await supabase
        .from('briefing_preferences')
        .update({ last_sent_date: new Date().toISOString().split('T')[0] })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating last sent date:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResult.data?.id,
      articlesCount: finalArticles.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-daily-briefing function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});