
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratar preflight requests do CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase para autenticação
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Autenticar o usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Cabeçalho de autorização ausente");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      throw new Error("Usuário não autenticado");
    }
    
    const user = data.user;
    
    if (!user.email) {
      throw new Error("Email do usuário não disponível");
    }

    // Criar cliente Supabase admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Obter perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_plan, pending_plan")
      .eq("id", user.id)
      .maybeSingle();
      
    if (profileError) {
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    }

    // Se o perfil não existir, retornar plano gratuito
    if (!profile) {
      return new Response(
        JSON.stringify({ 
          user_plan: "free",
          status: "no_subscription",
          pending_plan: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verificar se há um usuário do Stripe associado
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    
    if (customers.data.length === 0) {
      // Não tem cliente Stripe
      return new Response(
        JSON.stringify({ 
          user_plan: profile.user_plan || "free",
          status: "no_subscription",
          pending_plan: profile.pending_plan || null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const customerId = customers.data[0].id;
    
    // Verificar assinaturas ativas no Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    if (subscriptions.data.length === 0) {
      // Não tem assinatura ativa no Stripe
      
      // Se estava tentando fazer upgrade, mas não completou o pagamento
      if (profile.pending_plan) {
        await supabaseAdmin.from("profiles").update({
          pending_plan: null
        }).eq("id", user.id);
      }
      
      return new Response(
        JSON.stringify({ 
          user_plan: profile.user_plan || "free",
          status: "no_subscription",
          pending_plan: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Tem assinatura ativa
    const subscription = subscriptions.data[0];
    
    // Verificar o preço para determinar qual plano
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;
    
    let activePlan;
    if (amount <= 2990) {
      activePlan = "pro";
    } else {
      activePlan = "enterprise";
    }
    
    // Se tiver assinatura ativa e um pending_plan, atualizar o plano do usuário
    if (profile.pending_plan) {
      await supabaseAdmin.from("profiles").update({
        user_plan: profile.pending_plan,
        pending_plan: null
      }).eq("id", user.id);
      
      return new Response(
        JSON.stringify({ 
          user_plan: profile.pending_plan,
          status: "active", 
          subscription: {
            id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Retornar os dados da assinatura
    return new Response(
      JSON.stringify({ 
        user_plan: profile.user_plan || "free",
        status: "active",
        subscription: {
          id: subscription.id,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
