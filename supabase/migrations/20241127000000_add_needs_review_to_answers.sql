-- Adicionar campo needs_review na tabela quiz_answers
ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE;

-- Adicionar campo reviewed_at para marcar quando foi revisado
ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo reviewed_by para marcar quem revisou
ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Adicionar campo review_notes para notas do administrador
ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Criar índice para buscar respostas que precisam revisão
CREATE INDEX IF NOT EXISTS idx_quiz_answers_needs_review 
ON quiz_answers(needs_review) 
WHERE needs_review = TRUE;

