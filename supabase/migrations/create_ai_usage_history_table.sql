-- Criar tabela para histórico de uso de AI
CREATE TABLE IF NOT EXISTS ai_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openrouter')),
  model TEXT NOT NULL,
  tokens_used INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  endpoint TEXT NOT NULL, -- 'prd', 'designer', 'feature', 'extract-design'
  cost_usd DECIMAL(10, 6), -- Custo estimado em USD
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_ai_usage_history_user_id ON ai_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_history_created_at ON ai_usage_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_history_endpoint ON ai_usage_history(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_usage_history_provider ON ai_usage_history(provider);

-- RLS (Row Level Security)
ALTER TABLE ai_usage_history ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seu próprio histórico
CREATE POLICY "Users can view their own AI usage history"
  ON ai_usage_history FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários autenticados podem inserir seu próprio histórico
-- A inserção será feita pelo servidor usando o contexto do usuário autenticado
CREATE POLICY "Users can insert their own AI usage history"
  ON ai_usage_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

