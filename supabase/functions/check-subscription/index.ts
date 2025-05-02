
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase para autenticação
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseClient = createClient(supabaseUrl ?? "", supabaseKey ?? "");
    
    // Autenticar o usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Cabeçalho de autorização ausente");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      throw new Error("Usuário não autenticado");
    }
    
    const user = userData.user;
    
    // Verificar perfil do usuário no banco de dados
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("user_plan, stripe_customer_id, pending_plan, is_trial, trial_end_date, is_blocked")
      .eq("id", user.id)
      .single();
    
    if (profileError) {
      throw new Error("Erro ao buscar perfil do usuário");
    }
    
    // Se o usuário estiver no período de teste, verificar se expirou
    let isTrialActive = false;
    let shouldBlockAccount = false;
    
    if (profileData.is_trial && profileData.trial_end_date) {
      const trialEndDate = new Date(profileData.trial_end_date);
      const now = new Date();
      isTrialActive = trialEndDate > now;
      
      // Se o período de teste expirou e não há uma assinatura ativa, bloquear a conta
      if (!isTrialActive) {
        // Verificar se precisa bloquear a conta
        shouldBlockAccount = true;
      }
    }
    
    // Se não tiver customer_id, retorna status sem assinatura
    if (!profileData.stripe_customer_id) {
      // Atualizar status de bloqueio se necessário
      if (shouldBlockAccount) {
        await supabaseClient
          .from("profiles")
          .update({ is_blocked: true })
          .eq("id", user.id);
      }
      
      return new Response(
        JSON.stringify({
          user_plan: profileData.user_plan,
          status: isTrialActive ? 'trial' : 'no_subscription',
          pending_plan: profileData.pending_plan,
          is_trial: isTrialActive,
          trial_end_date: profileData.trial_end_date,
          is_blocked: shouldBlockAccount || profileData.is_blocked
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Se tem customer_id, verificar assinatura no Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Buscar assinaturas do cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: profileData.stripe_customer_id,
      status: 'active',
      limit: 1,
    });
    
    // Se não tiver assinatura ativa, verificar se precisa bloquear a conta
    if (subscriptions.data.length === 0) {
      // Se não tiver assinatura ativa e o período de teste expirou, bloquear a conta
      if (shouldBlockAccount) {
        await supabaseClient
          .from("profiles")
          .update({ is_blocked: true })
          .eq("id", user.id);
      }
      
      return new Response(
        JSON.stringify({
          user_plan: profileData.user_plan,
          status: isTrialActive ? 'trial' : 'no_subscription',
          pending_plan: profileData.pending_plan,
          is_trial: isTrialActive,
          trial_end_date: profileData.trial_end_date,
          is_blocked: shouldBlockAccount || profileData.is_blocked
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Se tiver assinatura ativa, desbloquear a conta
    if (profileData.is_blocked) {
      await supabaseClient
        .from("profiles")
        .update({ is_blocked: false })
        .eq("id", user.id);
    }
    
    // Retornar dados da assinatura
    const subscription = subscriptions.data[0];
    
    return new Response(
      JSON.stringify({
        user_plan: profileData.user_plan,
        status: 'active',
        pending_plan: profileData.pending_plan,
        is_trial: false,
        trial_end_date: null,
        is_blocked: false,
        subscription: {
          id: subscription.id,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro na edge function check-subscription:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
