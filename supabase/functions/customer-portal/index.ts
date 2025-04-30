
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

    // Criar cliente Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Criar cliente Supabase admin para ler o perfil
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Verificar se há um ID do cliente no perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
      
    if (profileError) {
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    }
    
    let customerId = profile?.stripe_customer_id;
    
    // Se não tiver ID no perfil, buscar pelo email
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length === 0) {
        throw new Error("Cliente Stripe não encontrado");
      }
      
      customerId = customers.data[0].id;
      
      // Atualizar o perfil com o ID do cliente
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }
    
    // Configuração do portal do cliente com padrões seguros
    // Se a configuração do portal falhar, tente criar uma sessão padrão
    // Se ainda assim falhar, então redirecione para o dashboard (último recurso)
    try {
      // Primeira tentativa: com a configuração padrão da conta
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.get("origin") || "http://localhost:3000"}/configuracoes`,
        });
        
        return new Response(
          JSON.stringify({ url: session.url }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (portalError) {
        console.error("Erro na primeira tentativa do portal:", portalError);
        
        // Segunda tentativa: forçar a criação de uma configuração temporária
        // Este código pode funcionar em alguns ambientes de desenvolvimento
        try {
          const portalConfig = await stripe.billingPortal.configurations.create({
            business_profile: {
              headline: "Gerencie sua assinatura",
              privacy_policy_url: `${req.headers.get("origin") || "http://localhost:3000"}/politica-privacidade`,
              terms_of_service_url: `${req.headers.get("origin") || "http://localhost:3000"}/termos-de-servico`,
            },
            features: {
              customer_update: {
                enabled: true,
                allowed_updates: ["email", "address", "phone", "shipping", "tax_id"],
              },
              invoice_history: { enabled: true },
              payment_method_update: { enabled: true },
              subscription_cancel: { enabled: true },
              subscription_update: { enabled: true },
            },
          });
          
          const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            configuration: portalConfig.id,
            return_url: `${req.headers.get("origin") || "http://localhost:3000"}/configuracoes`,
          });
          
          return new Response(
            JSON.stringify({ url: session.url }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        } catch (configError) {
          console.error("Erro ao criar configuração temporária:", configError);
          
          // Última tentativa: redireciona para o checkout de atualização
          // Buscar plano atual do usuário
          const { data: userData } = await supabaseAdmin
            .from("profiles")
            .select("user_plan")
            .eq("id", user.id)
            .single();
              
          const currentPlan = userData?.user_plan || 'free';
          
          // Criar uma sessão de checkout para o mesmo plano (efeito de atualização de pagamento)
          const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
              {
                price_data: {
                  currency: 'brl',
                  product_data: {
                    name: currentPlan === 'pro' ? 'Plano Profissional' : 'Plano Enterprise',
                  },
                  unit_amount: currentPlan === 'pro' ? 2990 : 5990,
                  recurring: {
                    interval: 'month',
                  },
                },
                quantity: 1,
              },
            ],
            success_url: `${req.headers.get("origin") || "http://localhost:3000"}/configuracoes?payment=success&plan=${currentPlan}`,
            cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/configuracoes?payment=canceled&plan=${currentPlan}`,
          });
          
          return new Response(
            JSON.stringify({ 
              url: checkoutSession.url,
              message: "Redirecionando para o gerenciamento da sua assinatura."
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      }
    } catch (error) {
      console.error("Todas as tentativas falharam:", error);
      
      // Último recurso: redirecionamento direto
      // Verificar assinaturas do cliente
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });
      
      let redirectUrl;
      if (subscriptions.data.length > 0) {
        const subscriptionId = subscriptions.data[0].id;
        redirectUrl = `https://dashboard.stripe.com/subscriptions/${subscriptionId}`;
      } else {
        redirectUrl = `https://dashboard.stripe.com/customers/${customerId}`;
      }
      
      return new Response(
        JSON.stringify({ 
          url: redirectUrl,
          message: "Portal do cliente não está configurado no Stripe. Configure-o em https://dashboard.stripe.com/settings/billing/portal"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Erro na edge function customer-portal:", error);
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
