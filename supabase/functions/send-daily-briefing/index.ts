import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
      title: "Microsoft brings OpenAI's smallest open model to Windows users",
      description: "Microsoft is bringing OpenAI's smaller, open-source GPT model to Windows 11 users. This is important for technology users interested in AI accessibility.",
      link: "https://example.com/microsoft-openai",
      source: "TECHCRUNCH",
      category: "TECHNOLOGY",
      published_at: new Date().toISOString(),
      ai_summary: "Microsoft is bringing OpenAI's smaller, open-source GPT model to Windows 11 users. This is important for technology users interested in AI accessibility and the development of open-source AI models.",
      ai_score: 9
    },
    {
      title: "Cohere's new AI agent platform, North, promises to keep enterprise data secure",
      description: "Cohere's new AI platform, North, prioritizes data security by allowing private deployment. This is important for technology users concerned about data privacy.",
      link: "https://example.com/cohere-north",
      source: "TECHCRUNCH",
      category: "TECHNOLOGY",
      published_at: new Date().toISOString(),
      ai_summary: "Cohere's new AI platform, North, prioritizes data security by allowing private deployment. This is important for technology users concerned about data privacy and the security of AI applications in enterprise settings.",
      ai_score: 8
    },
    {
      title: "Global Markets Rally as Economic Indicators Improve",
      description: "Stock markets worldwide see significant gains following positive economic data releases and improved investor sentiment.",
      link: "https://example.com/market-rally",
      source: "REUTERS",
      category: "FINANCE",
      published_at: new Date().toISOString(),
      ai_summary: "Major stock indices posted strong gains today as investors responded positively to encouraging economic indicators. The rally suggests growing confidence in global economic recovery prospects and improved corporate earnings outlook.",
      ai_score: 7
    }
  ];

  const articlesToShow = isTest && articles.length === 0 ? testArticles : articles;

  const articleElements = articlesToShow.map(article => `
    <div style="margin-bottom: 24px; padding: 0; background-color: #ffffff;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937; line-height: 1.4;">
        ${article.title}
      </h3>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
        ${article.source} • ${article.category}
      </div>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
        ${article.ai_summary || article.description}
      </p>
      <a href="${article.link}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 4px; display: inline-block; transition: all 0.2s;" target="_blank">
        Read More →
      </a>
    </div>
  `).join('');

  const testBadge = isTest ? `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e; padding: 12px 16px; margin: 0 0 20px 0; font-size: 13px;">
      📧 This is a test email with sample content
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily News Briefing</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; margin: 0 !important; }
            .content { padding: 20px !important; }
            .header { padding: 30px 20px !important; }
          }
        </style>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div class="header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Daily News Briefing</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; font-weight: 400;">${today}</p>
            </div>
            
            ${testBadge}
            
            <!-- Content -->
            <div class="content" style="padding: 30px;">
                <div style="margin-bottom: 24px; padding: 12px; background-color: #f8fafc; border-radius: 6px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    📰 ${isTest ? 'Here\'s a sample of your personalized daily briefing:' : 'Here are today\'s top stories personalized for your interests:'}
                  </p>
                </div>
                
                ${articleElements}
                
                ${isTest ? `
                <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; text-align: center;">
                  <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                    💡 <strong>This is just a preview!</strong> Your actual daily briefing will contain real news articles tailored to your interests and delivered at 9:00 AM daily.
                  </p>
                </div>
                ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">
                    ${isTest ? `Test email sent to ${userEmail}` : `Daily briefing for ${userEmail}`}
                </p>
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
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

  let requestBody;
  try {
    const text = await req.text();
    console.log('Raw request body:', text);
    requestBody = JSON.parse(text);
  } catch (parseError) {
    console.error('Error parsing request body:', parseError);
    return new Response(JSON.stringify({
      error: 'Invalid JSON in request body',
      details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const gmailEmail = Deno.env.get('GMAIL_EMAIL');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailEmail || !gmailPassword) {
      throw new Error('Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, interests, userId }: BriefingRequest = requestBody;

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
    
    // Setup SMTP client for Gmail
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailEmail,
          password: gmailPassword,
        },
      },
    });

    try {
      console.log('Attempting to send email via Gmail SMTP...');
      console.log('SMTP Configuration:', {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        username: gmailEmail
      });

      // Send email using Gmail SMTP (denomailer expects `content` for body)
      await client.send({
        from: gmailEmail,
        to: email,
        subject: isTestEmail ? 'Your Daily News Briefing - Test Email' : `Your Daily News Briefing - ${today}`,
        content: emailHTML
      });

      await client.close();
      console.log('Email sent successfully via Gmail SMTP');
    } catch (emailError) {
      console.error('SMTP Error Details:', {
        error: emailError,
        stack: emailError instanceof Error ? emailError.stack : '',
        message: emailError instanceof Error ? emailError.message : 'Unknown SMTP error'
      });
      throw new Error(`SMTP Error: ${emailError instanceof Error ? emailError.message : 'Failed to send email'}`);
    }

    console.log('Email sent successfully via Gmail SMTP');

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
      articlesCount: finalArticles.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error in send-daily-briefing function:', {
      message: errorMessage,
      stack: errorStack,
      error: JSON.stringify(error)
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorStack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});