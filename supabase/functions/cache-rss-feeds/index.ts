import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { fetchRSSFeeds } from '../_shared/rss-fetcher.ts'

console.log('Cache RSS Feeds function started')

const CATEGORIES = ['Technology', 'Finance', 'Sports', 'Politics', 'Health', 'Entertainment', 'Science', 'World News']

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch feeds for all categories
    const allFeeds = await Promise.all(
      CATEGORIES.map(async (category) => {
        const feeds = await fetchRSSFeeds(category)
        return feeds.map(feed => ({
          ...feed,
          category
        }))
      })
    )

    // Flatten all feeds
    const flatFeeds = allFeeds.flat()

    console.log('Preparing to cache feeds:', flatFeeds.length);
    
    // Delete old feeds for these categories
    const { error: deleteError } = await supabaseClient
      .from('cached_feeds')
      .delete()
      .in('category', CATEGORIES);
      
    if (deleteError) {
      console.error('Error deleting old feeds:', deleteError);
      throw deleteError;
    }
    
    // Insert new feeds into cache table
    const { error } = await supabaseClient
      .from('cached_feeds')
      .upsert(
        flatFeeds.map(feed => ({
          category: feed.category,
          title: feed.title,
          description: feed.description,
          link: feed.link,
          source: feed.source,
          ai_score: feed.ai_score || 75,
          published_at: feed.publishedAt || new Date().toISOString(),
          created_at: new Date().toISOString()
        })),
        { onConflict: 'link' }
      )

    if (error) throw error

    // Clean old cached feeds
    await supabaseClient.rpc('clean_old_cached_feeds')

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cached ${flatFeeds.length} feeds`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
