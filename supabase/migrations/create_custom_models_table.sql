-- Criar tabela para modelos personalizados do usuário
CREATE TABLE IF NOT EXISTS custom_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openrouter')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_custom_ai_models_user_id ON custom_ai_models(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_models_provider ON custom_ai_models(provider);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_custom_ai_models_updated_at
  BEFORE UPDATE ON custom_ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE custom_ai_models ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own custom models"
  ON custom_ai_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom models"
  ON custom_ai_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom models"
  ON custom_ai_models FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom models"
  ON custom_ai_models FOR DELETE
  USING (auth.uid() = user_id);

