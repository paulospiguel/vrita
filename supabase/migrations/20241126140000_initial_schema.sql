-- =====================================================
-- vRita AI - Database Schema Consolidado
-- =====================================================

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar perfil automaticamente quando usuário faz signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para sincronizar usuários existentes com perfis
CREATE OR REPLACE FUNCTION public.sync_existing_users_to_profiles()
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
    u.raw_user_meta_data->>'avatar_url',
    COALESCE(p.role, 'user')
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar código de compartilhamento único
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas quando uma resposta é submetida
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO quiz_question_stats (question_id, total_answers)
  VALUES (NEW.question_id, 1)
  ON CONFLICT (question_id) DO UPDATE
  SET 
    option_0_count = CASE WHEN NEW.selected_option = 0 THEN quiz_question_stats.option_0_count + 1 ELSE quiz_question_stats.option_0_count END,
    option_1_count = CASE WHEN NEW.selected_option = 1 THEN quiz_question_stats.option_1_count + 1 ELSE quiz_question_stats.option_1_count END,
    option_2_count = CASE WHEN NEW.selected_option = 2 THEN quiz_question_stats.option_2_count + 1 ELSE quiz_question_stats.option_2_count END,
    option_3_count = CASE WHEN NEW.selected_option = 3 THEN quiz_question_stats.option_3_count + 1 ELSE quiz_question_stats.option_3_count END,
    total_answers = quiz_question_stats.total_answers + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar score do participante
CREATE OR REPLACE FUNCTION update_participant_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quiz_participants
  SET 
    total_score = total_score + NEW.points_earned,
    questions_answered = questions_answered + 1,
    correct_answers = CASE WHEN NEW.is_correct THEN correct_answers + 1 ELSE correct_answers END,
    skips_used = CASE WHEN NEW.is_skipped THEN skips_used + 1 ELSE skips_used END,
    current_question_index = current_question_index + 1
  WHERE id = NEW.participant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar código de compartilhamento automaticamente
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
    NEW.share_code := generate_share_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELAS DE PERFIS E ROLES
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sincronizar usuários existentes com perfis
SELECT public.sync_existing_users_to_profiles();

-- =====================================================
-- TABELAS DE ASSINATURAS
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update their own subscriptions"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, is_active) VALUES
('Starter', 'Plano básico para uso ocasional', 9.99, 99.99, '["Geração de PRD", "Descrição de Features", "System Designer", "Até 50 gerações/mês"]'::jsonb, true),
('Professional', 'Plano completo para equipes', 29.99, 299.99, '["Geração de PRD", "Descrição de Features", "System Designer", "Gerações ilimitadas", "Suporte prioritário", "Exportação avançada"]'::jsonb, true),
('Enterprise', 'Solução corporativa com recursos avançados', 99.99, 999.99, '["Todos os recursos do Professional", "API personalizada", "Suporte dedicado", "Treinamento da equipe", "Customizações"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABELAS DE PROJETOS
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  project_data JSONB NOT NULL,
  prd_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELAS DE CONFIGURAÇÃO DE IA
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openrouter')),
  model TEXT NOT NULL,
  api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_config_user_id ON ai_config(user_id);

DROP TRIGGER IF EXISTS update_ai_config_updated_at ON ai_config;
CREATE TRIGGER update_ai_config_updated_at
  BEFORE UPDATE ON ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI config" ON ai_config;
CREATE POLICY "Users can view their own AI config"
  ON ai_config FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI config" ON ai_config;
CREATE POLICY "Users can insert their own AI config"
  ON ai_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own AI config" ON ai_config;
CREATE POLICY "Users can update their own AI config"
  ON ai_config FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own AI config" ON ai_config;
CREATE POLICY "Users can delete their own AI config"
  ON ai_config FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABELAS DE HISTÓRICO DE USO DE IA
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openrouter')),
  model TEXT NOT NULL,
  tokens_used INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  endpoint TEXT NOT NULL,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_history_user_id ON ai_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_history_created_at ON ai_usage_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_history_endpoint ON ai_usage_history(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_usage_history_provider ON ai_usage_history(provider);

ALTER TABLE ai_usage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI usage history" ON ai_usage_history;
CREATE POLICY "Users can view their own AI usage history"
  ON ai_usage_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI usage history" ON ai_usage_history;
CREATE POLICY "Users can insert their own AI usage history"
  ON ai_usage_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TABELAS DE MODELOS PERSONALIZADOS
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_custom_ai_models_user_id ON custom_ai_models(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_models_provider ON custom_ai_models(provider);

DROP TRIGGER IF EXISTS update_custom_ai_models_updated_at ON custom_ai_models;
CREATE TRIGGER update_custom_ai_models_updated_at
  BEFORE UPDATE ON custom_ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE custom_ai_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own custom models" ON custom_ai_models;
CREATE POLICY "Users can view their own custom models"
  ON custom_ai_models FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own custom models" ON custom_ai_models;
CREATE POLICY "Users can insert their own custom models"
  ON custom_ai_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own custom models" ON custom_ai_models;
CREATE POLICY "Users can update their own custom models"
  ON custom_ai_models FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own custom models" ON custom_ai_models;
CREATE POLICY "Users can delete their own custom models"
  ON custom_ai_models FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABELAS DE QUIZ (Requirements Wisdom Quiz)
-- =====================================================

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  share_code TEXT UNIQUE NOT NULL,
  documents_content TEXT NOT NULL,
  questions_count INTEGER NOT NULL DEFAULT 10,
  time_per_question INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option INTEGER NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
  explanation TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  points INTEGER NOT NULL DEFAULT 100,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_score INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  skips_used INTEGER NOT NULL DEFAULT 0 CHECK (skips_used <= 3),
  cards_used INTEGER NOT NULL DEFAULT 0 CHECK (cards_used <= 1),
  audience_used INTEGER NOT NULL DEFAULT 0 CHECK (audience_used <= 1),
  current_question_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'completed', 'abandoned')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(quiz_id, user_id)
);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES quiz_participants(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option INTEGER CHECK (selected_option >= 0 AND selected_option <= 3),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  is_skipped BOOLEAN NOT NULL DEFAULT FALSE,
  time_taken INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  lifeline_used TEXT CHECK (lifeline_used IN ('skip', 'cards', 'audience')),
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_id, question_id)
);

CREATE TABLE IF NOT EXISTS quiz_question_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_0_count INTEGER NOT NULL DEFAULT 0,
  option_1_count INTEGER NOT NULL DEFAULT 0,
  option_2_count INTEGER NOT NULL DEFAULT 0,
  option_3_count INTEGER NOT NULL DEFAULT 0,
  total_answers INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id)
);

-- Índices para quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_share_code ON quizzes(share_code);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_participants_quiz_id ON quiz_participants(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_participants_user_id ON quiz_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_participants_score ON quiz_participants(quiz_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_participant_id ON quiz_answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);

-- RLS para quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_question_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para quizzes
DROP POLICY IF EXISTS "Users can view their own quizzes" ON quizzes;
CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view active quizzes" ON quizzes;
CREATE POLICY "Users can view active quizzes"
  ON quizzes FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Users can create quizzes" ON quizzes;
CREATE POLICY "Users can create quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quizzes" ON quizzes;
CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quizzes" ON quizzes;
CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para perguntas
DROP POLICY IF EXISTS "Anyone can view questions of active quizzes" ON quiz_questions;
CREATE POLICY "Anyone can view questions of active quizzes"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND (quizzes.status = 'active' OR quizzes.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Quiz owners can insert questions" ON quiz_questions;
CREATE POLICY "Quiz owners can insert questions"
  ON quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Quiz owners can update questions" ON quiz_questions;
CREATE POLICY "Quiz owners can update questions"
  ON quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Quiz owners can delete questions" ON quiz_questions;
CREATE POLICY "Quiz owners can delete questions"
  ON quiz_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

-- Políticas para participantes
DROP POLICY IF EXISTS "Users can view participants of quizzes they own or participate" ON quiz_participants;
CREATE POLICY "Users can view participants of quizzes they own or participate"
  ON quiz_participants FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_participants.quiz_id 
      AND quizzes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join active quizzes" ON quiz_participants;
CREATE POLICY "Users can join active quizzes"
  ON quiz_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_participants.quiz_id 
      AND quizzes.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can update their own participation" ON quiz_participants;
CREATE POLICY "Users can update their own participation"
  ON quiz_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para respostas
DROP POLICY IF EXISTS "Users can view their own answers" ON quiz_answers;
CREATE POLICY "Users can view their own answers"
  ON quiz_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_participants 
      WHERE quiz_participants.id = quiz_answers.participant_id 
      AND quiz_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Quiz owners can view all answers" ON quiz_answers;
CREATE POLICY "Quiz owners can view all answers"
  ON quiz_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_participants
      JOIN quizzes ON quizzes.id = quiz_participants.quiz_id
      WHERE quiz_participants.id = quiz_answers.participant_id 
      AND quizzes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can submit their own answers" ON quiz_answers;
CREATE POLICY "Users can submit their own answers"
  ON quiz_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_participants 
      WHERE quiz_participants.id = quiz_answers.participant_id 
      AND quiz_participants.user_id = auth.uid()
    )
  );

-- Políticas para estatísticas
DROP POLICY IF EXISTS "Anyone can view question stats" ON quiz_question_stats;
CREATE POLICY "Anyone can view question stats"
  ON quiz_question_stats FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "System can update stats" ON quiz_question_stats;
CREATE POLICY "System can update stats"
  ON quiz_question_stats FOR ALL
  USING (true);

-- Triggers para quizzes
DROP TRIGGER IF EXISTS trigger_set_share_code ON quizzes;
CREATE TRIGGER trigger_set_share_code
  BEFORE INSERT ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION set_share_code();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_question_stats ON quiz_answers;
CREATE TRIGGER trigger_update_question_stats
  AFTER INSERT ON quiz_answers
  FOR EACH ROW
  WHEN (NEW.selected_option IS NOT NULL AND NOT NEW.is_skipped)
  EXECUTE FUNCTION update_question_stats();

DROP TRIGGER IF EXISTS trigger_update_participant_score ON quiz_answers;
CREATE TRIGGER trigger_update_participant_score
  AFTER INSERT ON quiz_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_score();
