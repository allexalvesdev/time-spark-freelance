
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Return the current server time in UTC
  const now = new Date();
  
  return new Response(
    JSON.stringify({
      time: now.toISOString(),
      timestamp: now.getTime()
    }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    }
  );
});
