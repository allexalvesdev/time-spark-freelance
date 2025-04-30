
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("Usuário não autenticado ou email não disponível");
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
      .select("stripe_customer_id, user_plan, pending_plan")
      .eq("id", user.id)
      .single();
      
    if (profileError) {
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    }
    
    // Se não tiver stripe_customer_id, não há assinatura
    if (!profile.stripe_customer_id) {
      return new Response(
        JSON.stringify({ 
          user_plan: profile.user_plan || "free",
          status: "no_subscription",
          pending_plan: profile.pending_plan || null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verificar assinaturas ativas no Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
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
