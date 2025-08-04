import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily briefing scheduler...');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get all active briefing preferences that haven't been sent today
    const { data: preferences, error } = await supabase
      .from('briefing_preferences')
      .select('*')
      .eq('is_active', true)
      .or(`last_sent_date.is.null,last_sent_date.neq.${today}`);

    if (error) {
      throw error;
    }

    console.log(`Found ${preferences?.length || 0} users to send briefings to`);

    if (!preferences || preferences.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No users need briefings today',
        count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send briefings to each user
    const results = [];
    for (const preference of preferences) {
      try {
        console.log(`Sending briefing to ${preference.email}...`);
        
        // Call the send-daily-briefing function
        const briefingResponse = await supabase.functions.invoke('send-daily-briefing', {
          body: {
            email: preference.email,
            interests: preference.interests,
            userId: preference.user_id
          }
        });

        if (briefingResponse.error) {
          throw briefingResponse.error;
        }

        results.push({
          email: preference.email,
          success: true,
          data: briefingResponse.data
        });
      } catch (error) {
        console.error(`Error sending briefing to ${preference.email}:`, error);
        results.push({
          email: preference.email,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Briefing schedule complete: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({ 
      message: 'Daily briefing schedule completed',
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in schedule-daily-briefings function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});