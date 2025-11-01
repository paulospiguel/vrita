-- Criar tabela para configurações de IA do usuário
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openrouter')),
  model TEXT NOT NULL,
  api_key TEXT, -- Chave de API opcional (pode usar a do servidor se não fornecido)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índice para buscar configuração por usuário
CREATE INDEX IF NOT EXISTS idx_ai_config_user_id ON ai_config(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_config_updated_at
  BEFORE UPDATE ON ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias configurações
CREATE POLICY "Users can view their own AI config"
  ON ai_config FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários só podem inserir suas próprias configurações
CREATE POLICY "Users can insert their own AI config"
  ON ai_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar suas próprias configurações
CREATE POLICY "Users can update their own AI config"
  ON ai_config FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem deletar suas próprias configurações
CREATE POLICY "Users can delete their own AI config"
  ON ai_config FOR DELETE
  USING (auth.uid() = user_id);

