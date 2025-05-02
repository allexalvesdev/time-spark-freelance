
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verificar o corpo da requisição
    const { plan } = await req.json();
    
    if (!plan || (plan !== 'basic' && plan !== 'pro' && plan !== 'enterprise')) {
      throw new Error("Plano inválido ou não especificado");
    }

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

    // Verificar se o usuário tem projetos demais para fazer downgrade
    if (plan === 'basic') {
      // Get user's current plan
      const { data: profileData, error: profileError } = await supabaseClient
        .from("profiles")
        .select("user_plan")
        .eq("id", user.id)
        .single();
      
      if (profileError) {
        throw new Error("Erro ao buscar perfil do usuário");
      }
      
      // If downgrading from pro or enterprise to basic, check project count
      if (profileData.user_plan === 'pro' || profileData.user_plan === 'enterprise') {
        // Count projects
        const { count, error: projectCountError } = await supabaseClient
          .from("projects")
          .select("id", { count: 'exact', head: true })
          .eq("user_id", user.id);
        
        if (projectCountError) {
          throw new Error("Erro ao contar projetos do usuário");
        }
        
        // If user has more than 5 projects, prevent downgrade
        if (count && count > 5) {
          throw new Error(`Não é possível fazer downgrade para o plano Básico. Você tem ${count} projetos, mas o plano Básico permite apenas 5. Remova alguns projetos antes de continuar.`);
        }
      }
    }

    // Preços baseados no plano selecionado
    const amount = plan === 'basic' ? 1990 : (plan === 'pro' ? 2990 : 5990);
    
    // Criar cliente Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verificar se já existe um cliente no Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    
    let stripeCustomerId;
    
    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    } else {
      // Criar novo cliente no Stripe
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      stripeCustomerId = newCustomer.id;
    }
    
    // Criar cliente Supabase admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Atualizar o perfil do usuário com pending_plan e stripe_customer_id
    await supabaseAdmin
      .from("profiles")
      .update({
        pending_plan: plan,
        stripe_customer_id: stripeCustomerId
      })
      .eq("id", user.id);
    
    // Criar a sessão do checkout
    const planName = plan === 'basic' ? "Básico" : plan === 'pro' ? "Profissional" : "Enterprise";
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Plano ${planName}`,
              description: `Assinatura mensal do plano ${planName}`
            },
            unit_amount: amount,
            recurring: {
              interval: "month"
            }
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin") || "http://localhost:3000"}/configuracoes?payment=success`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/configuracoes?payment=canceled&plan=${plan}`,
    });
    
    if (!session || !session.url) {
      throw new Error("Não foi possível criar a sessão de checkout");
    }
    
    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro na edge function create-checkout:", error);
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
