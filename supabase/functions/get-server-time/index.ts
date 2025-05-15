
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache to reduce database load
let cachedTime = null;
let cacheTime = 0;
const CACHE_TTL = 3000; // Cache time in milliseconds (3 seconds)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const now = new Date();
  const currentTimestamp = now.getTime();
  
  // Use cached time if it's still valid
  if (cachedTime && (currentTimestamp - cacheTime < CACHE_TTL)) {
    return new Response(
      cachedTime,
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  }
  
  // Get fresh time
  const timeObj = {
    time: now.toISOString(),
    timestamp: now.getTime()
  };
  
  // Update cache
  cachedTime = JSON.stringify(timeObj);
  cacheTime = currentTimestamp;
  
  return new Response(
    cachedTime,
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    }
  );
});
