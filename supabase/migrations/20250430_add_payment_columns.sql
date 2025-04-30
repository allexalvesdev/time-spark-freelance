
-- Adicionar coluna para armazenamento do ID do cliente do Stripe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Adicionar coluna para o plano pendente (para rastrear durante o checkout)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_plan TEXT;
