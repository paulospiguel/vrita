-- Criar bucket para armazenar documentos de quiz
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quiz-documents',
  'quiz-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Política: Usuários autenticados podem fazer upload de arquivos
DROP POLICY IF EXISTS "Authenticated users can upload quiz documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload quiz documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quiz-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem ler seus próprios arquivos
DROP POLICY IF EXISTS "Users can read their own quiz documents" ON storage.objects;
CREATE POLICY "Users can read their own quiz documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'quiz-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem deletar seus próprios arquivos
DROP POLICY IF EXISTS "Users can delete their own quiz documents" ON storage.objects;
CREATE POLICY "Users can delete their own quiz documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'quiz-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Admins e managers podem ler qualquer arquivo
DROP POLICY IF EXISTS "Admins and managers can read all quiz documents" ON storage.objects;
CREATE POLICY "Admins and managers can read all quiz documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'quiz-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

