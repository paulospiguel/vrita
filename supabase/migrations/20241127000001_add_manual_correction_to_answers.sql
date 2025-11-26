-- Adicionar campos para correção manual de respostas
ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS is_manually_corrected BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS correction_reason TEXT;

ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS corrected_by UUID REFERENCES auth.users(id);

ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS corrected_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para buscar respostas corrigidas manualmente
CREATE INDEX IF NOT EXISTS idx_quiz_answers_manually_corrected 
ON quiz_answers(is_manually_corrected) 
WHERE is_manually_corrected = TRUE;

