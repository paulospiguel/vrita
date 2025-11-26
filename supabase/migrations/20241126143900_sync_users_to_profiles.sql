-- Migration para sincronizar usuários existentes com perfis
-- Esta migration pode ser executada separadamente se necessário

-- Sincronizar todos os usuários existentes que não têm perfil
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.raw_user_meta_data->>'avatar_url',
  'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

-- Atualizar perfis existentes com dados atualizados do auth.users
UPDATE public.profiles p
SET
  email = u.email,
  full_name = COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', p.full_name),
  avatar_url = COALESCE(u.raw_user_meta_data->>'avatar_url', p.avatar_url)
FROM auth.users u
WHERE p.id = u.id
  AND (
    p.email IS DISTINCT FROM u.email
    OR p.full_name IS DISTINCT FROM COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
    OR p.avatar_url IS DISTINCT FROM u.raw_user_meta_data->>'avatar_url'
  );

