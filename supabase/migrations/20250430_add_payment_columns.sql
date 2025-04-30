
-- Adicionar colunas para controle de assinaturas na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS pending_plan TEXT;
