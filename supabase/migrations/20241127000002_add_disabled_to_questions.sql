-- Adicionar campo is_disabled na tabela quiz_questions
ALTER TABLE quiz_questions 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Criar índice para buscar perguntas desabilitadas
CREATE INDEX IF NOT EXISTS idx_quiz_questions_disabled 
ON quiz_questions(is_disabled) 
WHERE is_disabled = TRUE;

-- Criar índice para buscar perguntas ativas por quiz
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active 
ON quiz_questions(quiz_id, is_disabled) 
WHERE is_disabled = FALSE;

