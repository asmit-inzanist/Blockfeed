import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { message, articles } = await req.json()

    const articlesContext = articles.map((article: any, index: number) => 
      `${index + 1}. **${article.title}** (${article.category}, AI Score: ${article.ai_score || 75}%)\n   ${article.description}`
    ).join('\n\n')

    // Check if this is a summarize request
    const isSummarizeRequest = message.toLowerCase().includes('summarize my feed') || message.toLowerCase().includes('summarize the feed')

    // Try different models if one fails
    let response;
    let lastError;
    
    const models = ['gemini-1.5-flash', 'gemini-pro'];
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: isSummarizeRequest ? 
                  `You are an AI news assistant. Based on the user's personalized news articles below, create a numbered summary of the key news points. Format your response as a numbered list (1., 2., 3., etc.) with each point being a concise summary of the most important or interesting news from their feed.

PERSONALIZED NEWS ARTICLES:
${articlesContext}

Please provide a numbered summary (1., 2., 3., etc.) of the most important news points from these articles. Each point should be one clear, concise sentence summarizing a key news story.` :
                  `You are an AI news assistant. Based on the user's personalized news articles below, provide helpful, concise, and insightful responses to their questions. Use bullet points when summarizing multiple articles or providing key insights.

PERSONALIZED NEWS ARTICLES:
${articlesContext}

USER QUESTION: ${message}

Please provide a helpful response based on the news articles above. If the user asks for a summary, provide it in bullet points. If they ask about specific topics, reference the relevant articles.`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
            }
          })
        });
        
        if (response.ok) {
          console.log(`Successfully used model: ${model}`);
          break;
        } else {
          const errorData = await response.json();
          lastError = errorData;
          console.log(`Model ${model} failed:`, errorData);
        }
      } catch (error) {
        lastError = error;
        console.log(`Model ${model} error:`, error.message);
      }
    }

    if (!response || !response.ok) {
      console.error('All models failed. Last error:', lastError);
      return new Response(
        JSON.stringify({ 
          response: `Here's a summary of your personalized news feed:\n\n${articles.map((article: any, index: number) => 
            `• **${article.title}** (${article.category}): ${article.description.substring(0, 100)}...`
          ).join('\n\n')}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResponse) {
      // Fallback response
      return new Response(
        JSON.stringify({ 
          response: `Here's a summary of your personalized news feed:\n\n${articles.map((article: any, index: number) => 
            `• **${article.title}** (${article.category}): ${article.description.substring(0, 100)}...`
          ).join('\n\n')}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-news-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})